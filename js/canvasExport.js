/**
 * Módulo de cálculo de notas y generación de archivos CSV para Canvas LMS
 * y desglose detallado para el docente.
 */
(function (global) {
  "use strict";

  global.EcoRubric = global.EcoRubric || {};

  var VALID_SCORES = [0, 3, 5, 7, 10];
  var TOPIC_COUNT = 4;

  function isValidScore(val) {
    return typeof val === "number" && VALID_SCORES.indexOf(val) !== -1;
  }

  /**
   * Devuelve el número de temas puntuados (0..4) para una evaluación.
   */
  function countGradedTopics(evalEntry) {
    if (!evalEntry || !Array.isArray(evalEntry.scores)) return 0;
    var count = 0;
    for (var i = 0; i < TOPIC_COUNT; i++) {
      if (isValidScore(evalEntry.scores[i])) {
        count++;
      }
    }
    return count;
  }

  /**
   * Estado de evaluación de un alumno: 'pending' | 'partial' | 'complete'.
   */
  function getStudentStatus(evalEntry) {
    var graded = countGradedTopics(evalEntry);
    if (graded === 0) return "pending";
    if (graded === TOPIC_COUNT) return "complete";
    return "partial";
  }

  /**
   * Calcula la media de los 4 temas (escala 0-10).
   * Por defecto devuelve `null` si no están los 4 temas evaluados.
   * Si `allowPartial` es true, calcula la media de los temas evaluados hasta ahora.
   */
  function computeAverage(evalEntry, allowPartial) {
    if (!evalEntry || !Array.isArray(evalEntry.scores)) return null;
    var sum = 0;
    var count = 0;
    for (var i = 0; i < TOPIC_COUNT; i++) {
      if (isValidScore(evalEntry.scores[i])) {
        sum += evalEntry.scores[i];
        count++;
      }
    }
    if (count === 0) return null;
    if (!allowPartial && count < TOPIC_COUNT) return null;
    return sum / count;
  }

  /**
   * Formatea una nota con 2 decimales y punto decimal (formato Canvas).
   */
  function formatScore(score) {
    if (typeof score !== "number" || isNaN(score)) return "";
    return score.toFixed(2);
  }

  /**
   * Escapado RFC 4180 para celdas CSV.
   */
  function csvEscape(value) {
    var str = value === null || value === undefined ? "" : String(value);
    if (/[",\r\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Genera el contenido CSV exacto para importar notas en Canvas LMS.
   *
   * - Columnas: Student,ID,SIS Login ID,Section,<assignmentName>
   * - Fila 2: `    Points Possible,,,,10.00` (coincide con la exportación de Canvas)
   * - Sin BOM UTF-8 para máxima compatibilidad con el importador de Canvas.
   * - Los alumnos no evaluados quedan en blanco para no sobrescribir con 0.
   */
  function buildCanvasCsv(students, state, options) {
    var opts = options || {};
    var includePartial = Boolean(opts.includePartial);
    var assignmentName =
      (opts.assignmentName !== undefined
        ? opts.assignmentName
        : state && state.assignmentName) || "Final Class Presentation";
    assignmentName = String(assignmentName).trim() || "Final Class Presentation";

    var lines = [];
    lines.push(
      ["Student", "ID", "SIS Login ID", "Section", assignmentName]
        .map(csvEscape)
        .join(",")
    );
    lines.push(
      ["    Points Possible", "", "", "", "10.00"].map(csvEscape).join(",")
    );

    var evaluations = (state && state.evaluations) || {};

    for (var i = 0; i < students.length; i++) {
      var st = students[i];
      var ev = evaluations[st.id];
      var avg = computeAverage(ev, includePartial);
      var gradeStr = avg !== null ? formatScore(avg) : "";

      lines.push(
        [st.canvasStudent, st.id, st.sisLoginId, st.section, gradeStr]
          .map(csvEscape)
          .join(",")
      );
    }

    return lines.join("\n") + "\n";
  }

  /**
   * Genera un CSV con el desglose completo por alumno y tema (con BOM UTF-8 para Excel).
   */
  function buildDetailedCsv(students, state) {
    var topics =
      (state && Array.isArray(state.topics) && state.topics.length === 4
        ? state.topics
        : ["Tema 1", "Tema 2", "Tema 3", "Tema 4"]);

    var dayLabels = {
      0: "Sin asignar",
      1: "Día 1",
      2: "Día 2",
      3: "Día 3"
    };

    var statusLabels = {
      pending: "Pendiente",
      partial: "En progreso",
      complete: "Evaluado"
    };

    var header = [
      "Alumno",
      "Canvas ID",
      "SIS Login ID",
      "Sección",
      "Día",
      topics[0],
      topics[1],
      topics[2],
      topics[3],
      "Estado",
      "Nota Final (0-10)"
    ];

    var lines = [header.map(csvEscape).join(",")];
    var evaluations = (state && state.evaluations) || {};

    for (var i = 0; i < students.length; i++) {
      var st = students[i];
      var ev = evaluations[st.id] || { scores: [null, null, null, null], day: 0 };
      var status = getStudentStatus(ev);
      var avg = computeAverage(ev, false);
      var scores = Array.isArray(ev.scores) ? ev.scores : [null, null, null, null];

      var row = [
        st.displayName,
        st.id,
        st.sisLoginId,
        st.section,
        dayLabels[ev.day] || "Sin asignar",
        isValidScore(scores[0]) ? scores[0] : "",
        isValidScore(scores[1]) ? scores[1] : "",
        isValidScore(scores[2]) ? scores[2] : "",
        isValidScore(scores[3]) ? scores[3] : "",
        statusLabels[status],
        avg !== null ? formatScore(avg) : ""
      ];

      lines.push(row.map(csvEscape).join(","));
    }

    return "\uFEFF" + lines.join("\n") + "\n";
  }

  /**
   * Calcula estadísticas globales del grupo.
   */
  function computeSummaryStats(students, state) {
    var evaluations = (state && state.evaluations) || {};
    var complete = 0;
    var partial = 0;
    var pending = 0;
    var sumAvg = 0;
    var dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };

    for (var i = 0; i < students.length; i++) {
      var ev = evaluations[students[i].id] || { scores: [null, null, null, null], day: 0 };
      var status = getStudentStatus(ev);
      if (status === "complete") {
        complete++;
        sumAvg += computeAverage(ev, false);
      } else if (status === "partial") {
        partial++;
      } else {
        pending++;
      }
      var d = ev.day === 1 || ev.day === 2 || ev.day === 3 ? ev.day : 0;
      dayCounts[d]++;
    }

    return {
      total: students.length,
      complete: complete,
      partial: partial,
      pending: pending,
      groupAverage: complete > 0 ? sumAvg / complete : null,
      dayCounts: dayCounts
    };
  }

  /**
   * Descarga un archivo de texto en el navegador.
   */
  function triggerFileDownload(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function formatDateStamp(date) {
    var d = date || new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  global.EcoRubric.Grading = {
    VALID_SCORES: VALID_SCORES,
    TOPIC_COUNT: TOPIC_COUNT,
    isValidScore: isValidScore,
    countGradedTopics: countGradedTopics,
    getStudentStatus: getStudentStatus,
    computeAverage: computeAverage,
    formatScore: formatScore,
    csvEscape: csvEscape,
    buildCanvasCsv: buildCanvasCsv,
    buildDetailedCsv: buildDetailedCsv,
    computeSummaryStats: computeSummaryStats,
    triggerFileDownload: triggerFileDownload,
    formatDateStamp: formatDateStamp
  };
})(typeof window !== "undefined" ? window : globalThis);
