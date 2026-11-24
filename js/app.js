/**
 * Controlador principal de la interfaz de ECO_rubric.
 * Gestiona evaluación rápida (0, 3, 5, 7, 10), seguimiento de 3 días,
 * vista lista / modo presentación, autoguardado, copia JSON y exportación a Canvas LMS.
 */
(function (global) {
  "use strict";

  var Eco = global.EcoRubric;
  if (!Eco || !Eco.STUDENTS || !Eco.Grading || !Eco.Storage) {
    return;
  }

  var STUDENTS = Eco.STUDENTS;
  var META = Eco.COURSE_META;
  var Grading = Eco.Grading;
  var Storage = Eco.Storage;

  var ui = {
    dayFilter: "all",       // 'all' | '1' | '2' | '3' | '0'
    statusFilter: "all",    // 'all' | 'pending' | 'partial' | 'complete'
    searchQuery: "",
    viewMode: "list",       // 'list' | 'focus'
    focusStudentId: STUDENTS.length > 0 ? STUDENTS[0].id : null,
    pendingRestore: null
  };

  var state = null;
  var saveIndicatorTimer = null;
  var resetArmed = false;
  var resetArmTimer = null;

  /* ========================================================================
     Utilidades
     ======================================================================== */

  function $(id) {
    return document.getElementById(id);
  }

  function normalizeText(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(str) {
    return String(str === null || str === undefined ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTime(isoString) {
    if (!isoString) return "";
    var d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function formatDateTime(isoString) {
    if (!isoString) return "Sin fecha";
    var d = new Date(isoString);
    if (isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getScoreBandClass(avg) {
    if (avg === null) return "";
    if (avg >= 7) return "is-high";
    if (avg >= 5) return "is-mid";
    return "is-low";
  }

  function showToast(message) {
    var region = $("toast-region");
    if (!region) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    region.appendChild(el);

    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });

    setTimeout(function () {
      el.classList.remove("is-visible");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 220);
    }, 2600);
  }

  function updateSaveIndicator(result, initial) {
    var box = $("save-indicator");
    var text = $("save-status-text");
    if (!box || !text) return;

    box.classList.remove("is-saving", "is-error");
    if (result && !result.ok) {
      box.classList.add("is-error");
      text.textContent = "Error al guardar";
      showToast(result.error || "Error guardando localmente.");
      return;
    }

    var ts = (result && result.updatedAt) || state.updatedAt;
    if (ts) {
      text.textContent = "Guardado · " + formatTime(ts);
    } else {
      text.textContent = "Guardado automático activo";
    }

    if (!initial) {
      box.classList.add("is-saving");
      clearTimeout(saveIndicatorTimer);
      saveIndicatorTimer = setTimeout(function () {
        box.classList.remove("is-saving");
      }, 450);
    }
  }

  function persist() {
    var res = Storage.saveState(state, META);
    updateSaveIndicator(res, false);
  }

  /* ========================================================================
     Filtrado
     ======================================================================== */

  function getFilteredStudents() {
    var q = normalizeText(ui.searchQuery.trim());
    return STUDENTS.filter(function (st) {
      var ev = state.evaluations[st.id];
      if (ui.dayFilter !== "all") {
        var expectedDay = Number(ui.dayFilter);
        if ((ev ? ev.day : 0) !== expectedDay) return false;
      }
      if (ui.statusFilter !== "all") {
        if (Grading.getStudentStatus(ev) !== ui.statusFilter) return false;
      }
      if (q) {
        var hay = normalizeText(st.displayName + " " + st.canvasStudent + " " + st.id + " " + st.sisLoginId);
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  /* ========================================================================
     Renderizado de Resumen, Temas y Filtros
     ======================================================================== */

  function renderStats() {
    var stats = Grading.computeSummaryStats(STUDENTS, state);

    $("stat-complete").innerHTML = stats.complete + " <small>/ " + stats.total + "</small>";
    $("stat-partial").textContent = String(stats.partial);
    $("stat-pending").textContent = String(stats.pending);
    $("stat-average").textContent =
      stats.groupAverage !== null ? Grading.formatScore(stats.groupAverage) : "—";

    var pctComplete = stats.total > 0 ? (stats.complete / stats.total) * 100 : 0;
    var pctPartial = stats.total > 0 ? (stats.partial / stats.total) * 100 : 0;
    $("progress-complete").style.width = pctComplete.toFixed(2) + "%";
    $("progress-partial").style.width = pctPartial.toFixed(2) + "%";

    $("count-day-all").textContent = String(stats.total);
    $("count-day-1").textContent = String(stats.dayCounts[1]);
    $("count-day-2").textContent = String(stats.dayCounts[2]);
    $("count-day-3").textContent = String(stats.dayCounts[3]);
    $("count-day-0").textContent = String(stats.dayCounts[0]);
  }

  function renderTopicHeaders() {
    for (var i = 0; i < 4; i++) {
      var title = state.topics[i] || "Tema " + (i + 1);
      var col = $("col-topic-" + i);
      if (col) {
        col.textContent = title;
        col.title = title;
      }
      var input = $("topic-input-" + i);
      if (input && document.activeElement !== input) {
        input.value = title;
      }
    }
  }

  function renderScoreButtonsHtml(studentId, topicIndex, currentScore) {
    var html = '<div class="score-group" role="group" aria-label="Calificación ' + escapeHtml(state.topics[topicIndex]) + '">';
    for (var i = 0; i < META.scoreOptions.length; i++) {
      var score = META.scoreOptions[i];
      var selected = currentScore === score;
      html +=
        '<button type="button" class="score-btn' +
        (selected ? " is-selected" : "") +
        '" data-action="score" data-student-id="' +
        escapeHtml(studentId) +
        '" data-topic="' +
        topicIndex +
        '" data-score="' +
        score +
        '" aria-pressed="' +
        (selected ? "true" : "false") +
        '">' +
        score +
        "</button>";
    }
    html += "</div>";
    return html;
  }

  function getStatusMeta(ev) {
    var graded = Grading.countGradedTopics(ev);
    var status = Grading.getStudentStatus(ev);
    if (status === "complete") {
      return { cls: "is-complete", label: "Evaluado" };
    }
    if (status === "partial") {
      return { cls: "is-partial", label: graded + "/4 temas" };
    }
    return { cls: "is-pending", label: "Pendiente" };
  }

  function renderListView(filtered) {
    var container = $("student-list");
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML =
        '<div class="empty-state">' +
        "<h3>No hay alumnos con este filtro</h3>" +
        "<p>Prueba a cambiar el día, el estado o limpia el texto de búsqueda.</p>" +
        '<button type="button" class="btn btn-secondary btn-sm" id="btn-clear-filters">Mostrar todos los alumnos</button>' +
        "</div>";
      var clearBtn = $("btn-clear-filters");
      if (clearBtn) {
        clearBtn.addEventListener("click", resetFilters);
      }
      return;
    }

    // Mapa para mostrar número de orden en la lista oficial (1..39)
    var indexById = {};
    for (var idx = 0; idx < STUDENTS.length; idx++) {
      indexById[STUDENTS[idx].id] = idx + 1;
    }

    var chunks = [];
    for (var i = 0; i < filtered.length; i++) {
      var st = filtered[i];
      var ev = state.evaluations[st.id];
      var statusMeta = getStatusMeta(ev);
      var avgComplete = Grading.computeAverage(ev, false);
      var avgPartial = Grading.computeAverage(ev, true);
      var gradedCount = Grading.countGradedTopics(ev);

      var finalText = avgComplete !== null ? Grading.formatScore(avgComplete) : "—";
      var finalSub =
        avgComplete !== null
          ? "sobre 10"
          : gradedCount > 0
          ? "parc. " + Grading.formatScore(avgPartial)
          : "sin notas";

      var day = ev.day || 0;
      var dayOptions =
        '<option value="0"' + (day === 0 ? " selected" : "") + ">Sin día</option>" +
        '<option value="1"' + (day === 1 ? " selected" : "") + ">Día 1</option>" +
        '<option value="2"' + (day === 2 ? " selected" : "") + ">Día 2</option>" +
        '<option value="3"' + (day === 3 ? " selected" : "") + ">Día 3</option>";

      var topicsHtml = "";
      for (var t = 0; t < 4; t++) {
        topicsHtml +=
          '<div class="topic-cell">' +
          '<span class="topic-mobile-label">' +
          escapeHtml(state.topics[t]) +
          "</span>" +
          renderScoreButtonsHtml(st.id, t, ev.scores[t]) +
          "</div>";
      }

      chunks.push(
        '<article class="student-row" data-student-row="' +
          escapeHtml(st.id) +
          '">' +
          '<div class="student-info">' +
          '<div class="student-name-line">' +
          '<span class="student-num">' +
          String(indexById[st.id]).padStart(2, "0") +
          "</span>" +
          '<span class="student-name" title="' +
          escapeHtml(st.displayName) +
          '">' +
          escapeHtml(st.displayName) +
          "</span>" +
          "</div>" +
          '<div class="student-meta-line">' +
          '<span class="status-pill ' +
          statusMeta.cls +
          '">' +
          statusMeta.label +
          "</span>" +
          '<select class="day-select' +
          (day > 0 ? " has-day" : "") +
          '" data-action="day" data-student-id="' +
          escapeHtml(st.id) +
          '" aria-label="Día de presentación de ' +
          escapeHtml(st.displayName) +
          '">' +
          dayOptions +
          "</select>" +
          '<button type="button" class="focus-trigger" data-action="open-focus" data-student-id="' +
          escapeHtml(st.id) +
          '">Presentar &rarr;</button>' +
          "</div>" +
          "</div>" +
          topicsHtml +
          '<div class="final-cell">' +
          '<span class="final-score-badge ' +
          getScoreBandClass(avgComplete) +
          '">' +
          finalText +
          "</span>" +
          '<span class="final-sub">' +
          finalSub +
          "</span>" +
          "</div>" +
          "</article>"
      );
    }

    container.innerHTML = chunks.join("");
  }

  function renderFocusView(filtered) {
    var slot = $("focus-card-slot");
    var select = $("focus-student-select");
    var prevBtn = $("btn-focus-prev");
    var nextBtn = $("btn-focus-next");
    if (!slot || !select) return;

    if (filtered.length === 0) {
      select.innerHTML = "<option>Sin alumnos en el filtro</option>";
      select.disabled = true;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      slot.innerHTML =
        '<div class="focus-card empty-state">' +
        "<h3>No hay alumnos en el filtro actual</h3>" +
        "<p>Ajusta los filtros de día o estado para continuar evaluando.</p>" +
        '<button type="button" class="btn btn-secondary btn-sm" id="btn-clear-filters-focus">Mostrar todos</button>' +
        "</div>";
      var btn = $("btn-clear-filters-focus");
      if (btn) btn.addEventListener("click", resetFilters);
      return;
    }

    select.disabled = false;

    // Asegurar que focusStudentId está en la lista filtrada
    var currentIdx = -1;
    for (var i = 0; i < filtered.length; i++) {
      if (filtered[i].id === ui.focusStudentId) {
        currentIdx = i;
        break;
      }
    }
    if (currentIdx === -1) {
      currentIdx = 0;
      ui.focusStudentId = filtered[0].id;
    }

    // Rellenar selector rápido
    var opts = [];
    for (var j = 0; j < filtered.length; j++) {
      var s = filtered[j];
      var sEv = state.evaluations[s.id];
      var stStatus = Grading.getStudentStatus(sEv);
      var marker = stStatus === "complete" ? "✓ " : stStatus === "partial" ? "◐ " : "○ ";
      opts.push(
        '<option value="' +
          escapeHtml(s.id) +
          '"' +
          (j === currentIdx ? " selected" : "") +
          ">" +
          marker +
          (j + 1) +
          ". " +
          escapeHtml(s.displayName) +
          "</option>"
      );
    }
    select.innerHTML = opts.join("");

    prevBtn.disabled = currentIdx <= 0;
    nextBtn.disabled = currentIdx >= filtered.length - 1;

    var student = filtered[currentIdx];
    var ev = state.evaluations[student.id];
    var statusMeta = getStatusMeta(ev);
    var avgComplete = Grading.computeAverage(ev, false);
    var avgPartial = Grading.computeAverage(ev, true);
    var gradedCount = Grading.countGradedTopics(ev);

    var dayButtonsHtml = "";
    var dayList = [
      { v: 0, label: "Sin día" },
      { v: 1, label: "Día 1" },
      { v: 2, label: "Día 2" },
      { v: 3, label: "Día 3" }
    ];
    for (var d = 0; d < dayList.length; d++) {
      var active = ev.day === dayList[d].v;
      dayButtonsHtml +=
        '<button type="button" class="focus-day-btn' +
        (active ? " is-active" : "") +
        '" data-action="focus-day" data-student-id="' +
        escapeHtml(student.id) +
        '" data-day-val="' +
        dayList[d].v +
        '">' +
        dayList[d].label +
        "</button>";
    }

    var topicsRowsHtml = "";
    for (var t = 0; t < 4; t++) {
      topicsRowsHtml +=
        '<div class="focus-topic-row">' +
        '<div class="focus-topic-title">' +
        '<span class="topic-index">T' +
        (t + 1) +
        "</span>" +
        "<span>" +
        escapeHtml(state.topics[t]) +
        "</span>" +
        "</div>" +
        '<div class="focus-score-group" role="group" aria-label="' +
        escapeHtml(state.topics[t]) +
        '">';

      for (var k = 0; k < META.scoreOptions.length; k++) {
        var score = META.scoreOptions[k];
        var selected = ev.scores[t] === score;
        topicsRowsHtml +=
          '<button type="button" class="score-btn' +
          (selected ? " is-selected" : "") +
          '" data-action="score" data-student-id="' +
          escapeHtml(student.id) +
          '" data-topic="' +
          t +
          '" data-score="' +
          score +
          '" aria-pressed="' +
          (selected ? "true" : "false") +
          '">' +
          score +
          "</button>";
      }
      topicsRowsHtml += "</div></div>";
    }

    var finalDisplay = avgComplete !== null ? Grading.formatScore(avgComplete) : "—";
    var subDisplay =
      avgComplete !== null
        ? "Nota final sobre 10"
        : gradedCount > 0
        ? "Media provisional: " + Grading.formatScore(avgPartial) + " (" + gradedCount + "/4)"
        : "Selecciona 4 temas";

    slot.innerHTML =
      '<article class="focus-card">' +
      '<div class="focus-card-header">' +
      "<div>" +
      '<h2 class="focus-student-name">' +
      escapeHtml(student.displayName) +
      "</h2>" +
      '<div class="focus-student-id">Canvas ID: ' +
      escapeHtml(student.id) +
      ' · <span class="status-pill ' +
      statusMeta.cls +
      '">' +
      statusMeta.label +
      "</span></div>" +
      '<div class="focus-day-pills" role="group" aria-label="Día de presentación">' +
      dayButtonsHtml +
      "</div>" +
      "</div>" +
      '<div class="focus-final-box">' +
      '<div class="focus-final-label">Nota Final</div>' +
      '<div class="focus-final-value">' +
      finalDisplay +
      "</div>" +
      '<div class="final-sub">' +
      subDisplay +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="focus-topics">' +
      topicsRowsHtml +
      "</div>" +
      '<div class="focus-hint">' +
      "<span>Alumno " +
      (currentIdx + 1) +
      " de " +
      filtered.length +
      " en el filtro actual</span>" +
      "<span>Pulsa una nota de nuevo para desmarcarla · Atajos: ← / →</span>" +
      "</div>" +
      "</article>";
  }

  function renderAll() {
    renderStats();
    renderTopicHeaders();

    var filtered = getFilteredStudents();
    $("filter-results-label").textContent =
      "Mostrando " + filtered.length + " de " + STUDENTS.length + " alumnos";

    var listSection = $("list-view-container");
    var focusSection = $("focus-view-container");

    if (ui.viewMode === "focus") {
      listSection.hidden = true;
      focusSection.hidden = false;
      renderFocusView(filtered);
    } else {
      listSection.hidden = false;
      focusSection.hidden = true;
      renderListView(filtered);
    }
  }

  /* ========================================================================
     Acciones de Evaluación
     ======================================================================== */

  function handleScoreClick(studentId, topicIndex, scoreValue) {
    var ev = state.evaluations[studentId];
    if (!ev) return;

    // Permitir desmarcar si se vuelve a pulsar la misma puntuación
    ev.scores[topicIndex] = ev.scores[topicIndex] === scoreValue ? null : scoreValue;
    ev.updatedAt = new Date().toISOString();
    persist();
    renderAll();
  }

  function handleDayChange(studentId, dayValue) {
    var ev = state.evaluations[studentId];
    if (!ev) return;
    ev.day = Number(dayValue) || 0;
    ev.updatedAt = new Date().toISOString();
    persist();
    renderAll();
  }

  function resetFilters() {
    ui.dayFilter = "all";
    ui.statusFilter = "all";
    ui.searchQuery = "";
    $("search-input").value = "";
    $("search-clear").hidden = true;
    syncFilterButtons();
    renderAll();
  }

  function syncFilterButtons() {
    var dayBtns = document.querySelectorAll("#day-tabs .day-tab");
    for (var i = 0; i < dayBtns.length; i++) {
      var active = dayBtns[i].getAttribute("data-day") === ui.dayFilter;
      dayBtns[i].classList.toggle("is-active", active);
      dayBtns[i].setAttribute("aria-selected", active ? "true" : "false");
    }

    var statusBtns = document.querySelectorAll("#status-filter .seg-btn");
    for (var j = 0; j < statusBtns.length; j++) {
      statusBtns[j].classList.toggle(
        "is-active",
        statusBtns[j].getAttribute("data-status") === ui.statusFilter
      );
    }

    var viewBtns = document.querySelectorAll("#view-toggle .seg-btn");
    for (var k = 0; k < viewBtns.length; k++) {
      viewBtns[k].classList.toggle(
        "is-active",
        viewBtns[k].getAttribute("data-view") === ui.viewMode
      );
    }
  }

  /* ========================================================================
     Modales (Exportar Canvas y Copia de Seguridad)
     ======================================================================== */

  function openModal(id) {
    var el = $(id);
    if (!el) return;
    el.hidden = false;
    requestAnimationFrame(function () {
      el.classList.add("is-open");
    });
  }

  function closeModal(id) {
    var el = $(id);
    if (!el) return;
    el.classList.remove("is-open");
    setTimeout(function () {
      el.hidden = true;
    }, 180);
  }

  function refreshExportModal() {
    var assignmentInput = $("export-assignment-name");
    var includePartialCb = $("export-include-partial");
    var partialRow = $("export-partial-row");
    var callout = $("export-summary-callout");
    var preview = $("export-csv-preview");

    var assignmentName = assignmentInput.value.trim() || META.defaultAssignmentName;
    var includePartial = includePartialCb.checked;
    var stats = Grading.computeSummaryStats(STUDENTS, state);

    partialRow.hidden = stats.partial === 0;
    if (stats.partial === 0) {
      includePartialCb.checked = false;
      includePartial = false;
    }

    callout.className = "callout";
    if (stats.complete === 0 && (!includePartial || stats.partial === 0)) {
      callout.classList.add("is-warn");
      callout.innerHTML =
        "<strong>Todavía no hay alumnos completamente evaluados (4/4 temas).</strong> El CSV se generará con las celdas de nota en blanco.";
    } else if (stats.partial > 0 && !includePartial) {
      callout.classList.add("is-warn");
      callout.innerHTML =
        "<strong>" +
        stats.complete +
        " alumnos evaluados (4/4)</strong> se incluirán con su media sobre 10. Hay <strong>" +
        stats.partial +
        " alumno(s) en progreso</strong> y <strong>" +
        stats.pending +
        " pendientes</strong> que quedarán en blanco en Canvas.";
    } else {
      callout.classList.add("is-success");
      var exportedCount = includePartial ? stats.complete + stats.partial : stats.complete;
      callout.innerHTML =
        "Listo para Canvas: se exportarán <strong>" +
        exportedCount +
        " calificaciones</strong> (sobre 10.00) y <strong>" +
        (stats.total - exportedCount) +
        "</strong> celdas en blanco.";
    }

    var csvText = Grading.buildCanvasCsv(STUDENTS, state, {
      assignmentName: assignmentName,
      includePartial: includePartial
    });
    var lines = csvText.trimEnd().split("\n");
    var previewLines = lines.slice(0, 7);
    if (lines.length > 7) {
      previewLines.push("... (" + (lines.length - 7) + " filas más)");
    }
    preview.textContent = previewLines.join("\n");
  }

  function resetBackupRestoreArea() {
    ui.pendingRestore = null;
    var area = $("restore-preview-area");
    if (area) {
      area.hidden = true;
      area.innerHTML = "";
    }
    var fileInput = $("input-restore-json");
    if (fileInput) fileInput.value = "";
  }

  /* ========================================================================
     Eventos
     ======================================================================== */

  function bindEvents() {
    // Edición de nombres de los 4 temas
    var topicInputs = document.querySelectorAll(".topic-input");
    for (var i = 0; i < topicInputs.length; i++) {
      topicInputs[i].addEventListener("input", function (e) {
        var idx = Number(e.target.getAttribute("data-topic-index"));
        var val = e.target.value.trim();
        state.topics[idx] = val || "Tema " + (idx + 1);
        persist();
        renderTopicHeaders();
        // Actualizar etiquetas móviles y vista foco sin perder el foco del input
        if (ui.viewMode === "focus") {
          renderFocusView(getFilteredStudents());
        } else {
          var mobileLabels = document.querySelectorAll(".student-row .topic-cell:nth-child(" + (idx + 2) + ") .topic-mobile-label");
          for (var m = 0; m < mobileLabels.length; m++) {
            mobileLabels[m].textContent = state.topics[idx];
          }
        }
      });
    }

    // Pestañas de día
    $("day-tabs").addEventListener("click", function (e) {
      var btn = e.target.closest(".day-tab");
      if (!btn) return;
      ui.dayFilter = btn.getAttribute("data-day");
      syncFilterButtons();
      renderAll();
    });

    // Filtro de estado
    $("status-filter").addEventListener("click", function (e) {
      var btn = e.target.closest(".seg-btn");
      if (!btn) return;
      ui.statusFilter = btn.getAttribute("data-status");
      syncFilterButtons();
      renderAll();
    });

    // Selector de vista (Lista / Modo Presentación)
    $("view-toggle").addEventListener("click", function (e) {
      var btn = e.target.closest(".seg-btn");
      if (!btn) return;
      ui.viewMode = btn.getAttribute("data-view");
      syncFilterButtons();
      renderAll();
    });

    // Buscador
    var searchInput = $("search-input");
    var searchClear = $("search-clear");
    searchInput.addEventListener("input", function () {
      ui.searchQuery = searchInput.value;
      searchClear.hidden = ui.searchQuery.length === 0;
      renderAll();
    });
    searchClear.addEventListener("click", function () {
      ui.searchQuery = "";
      searchInput.value = "";
      searchClear.hidden = true;
      searchInput.focus();
      renderAll();
    });

    // Delegación de clics en la vista lista
    $("student-list").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      var studentId = btn.getAttribute("data-student-id");

      if (action === "score") {
        handleScoreClick(
          studentId,
          Number(btn.getAttribute("data-topic")),
          Number(btn.getAttribute("data-score"))
        );
      } else if (action === "open-focus") {
        ui.focusStudentId = studentId;
        ui.viewMode = "focus";
        syncFilterButtons();
        renderAll();
      }
    });

    $("student-list").addEventListener("change", function (e) {
      var sel = e.target.closest('[data-action="day"]');
      if (!sel) return;
      handleDayChange(sel.getAttribute("data-student-id"), sel.value);
    });

    // Delegación en vista foco
    $("focus-card-slot").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      var studentId = btn.getAttribute("data-student-id");
      if (action === "score") {
        handleScoreClick(
          studentId,
          Number(btn.getAttribute("data-topic")),
          Number(btn.getAttribute("data-score"))
        );
      } else if (action === "focus-day") {
        handleDayChange(studentId, btn.getAttribute("data-day-val"));
      }
    });

    $("focus-student-select").addEventListener("change", function (e) {
      ui.focusStudentId = e.target.value;
      renderFocusView(getFilteredStudents());
    });

    $("btn-focus-prev").addEventListener("click", function () {
      stepFocus(-1);
    });

    $("btn-focus-next").addEventListener("click", function () {
      stepFocus(1);
    });

    // Atajos de teclado en modo presentación y cierre de modales con Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeModal("modal-export");
        closeModal("modal-backup");
        return;
      }

      var tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!$("modal-export").hidden || !$("modal-backup").hidden) return;

      if (ui.viewMode === "focus") {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          stepFocus(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          stepFocus(1);
        }
      }
    });

    // Botones de apertura/cierre de modales
    $("btn-open-export").addEventListener("click", function () {
      $("export-assignment-name").value = state.assignmentName || META.defaultAssignmentName;
      refreshExportModal();
      openModal("modal-export");
    });

    $("btn-open-backup").addEventListener("click", function () {
      resetBackupRestoreArea();
      resetArmed = false;
      $("btn-reset-all").textContent = "Borrar todas las notas";
      openModal("modal-backup");
    });

    var closeBtns = document.querySelectorAll("[data-close-modal]");
    for (var c = 0; c < closeBtns.length; c++) {
      closeBtns[c].addEventListener("click", function (e) {
        closeModal(e.currentTarget.getAttribute("data-close-modal"));
      });
    }

    var backdrops = document.querySelectorAll(".modal-backdrop");
    for (var b = 0; b < backdrops.length; b++) {
      backdrops[b].addEventListener("click", function (e) {
        if (e.target === e.currentTarget) {
          closeModal(e.currentTarget.id);
        }
      });
    }

    // Modal Exportar Canvas
    $("export-assignment-name").addEventListener("input", function (e) {
      state.assignmentName = e.target.value.trim() || META.defaultAssignmentName;
      persist();
      refreshExportModal();
    });

    $("export-include-partial").addEventListener("change", refreshExportModal);

    $("btn-download-canvas-csv").addEventListener("click", function () {
      var assignmentName = $("export-assignment-name").value.trim() || META.defaultAssignmentName;
      var includePartial = $("export-include-partial").checked;
      var csv = Grading.buildCanvasCsv(STUDENTS, state, {
        assignmentName: assignmentName,
        includePartial: includePartial
      });
      var filename = "canvas-economy-notas-" + Grading.formatDateStamp() + ".csv";
      Grading.triggerFileDownload(filename, csv, "text/csv;charset=utf-8");
      showToast("CSV listo para subir a Canvas: " + filename);
    });

    $("btn-download-detailed-csv").addEventListener("click", function () {
      var csv = Grading.buildDetailedCsv(STUDENTS, state);
      var filename = "desglose-economy-temas-" + Grading.formatDateStamp() + ".csv";
      Grading.triggerFileDownload(filename, csv, "text/csv;charset=utf-8");
      showToast("Desglose descargado: " + filename);
    });

    // Modal Copia de Seguridad JSON
    $("btn-download-json").addEventListener("click", function () {
      var json = Storage.serializeBackup(state, META);
      var filename = "eco-rubric-backup-" + Grading.formatDateStamp() + ".json";
      Grading.triggerFileDownload(filename, json, "application/json;charset=utf-8");
      showToast("Copia de seguridad guardada: " + filename);
    });

    $("btn-pick-json").addEventListener("click", function () {
      $("input-restore-json").click();
    });

    $("input-restore-json").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var result = Storage.parseBackupJson(String(reader.result || ""), STUDENTS, META);
        var area = $("restore-preview-area");
        area.hidden = false;

        if (!result.valid) {
          ui.pendingRestore = null;
          area.innerHTML = '<div class="callout is-danger">' + escapeHtml(result.error) + "</div>";
          return;
        }

        ui.pendingRestore = result.state;
        var st = result.stats;
        area.innerHTML =
          '<div class="callout is-warn">' +
          "<strong>Copia válida detectada</strong> (" +
          escapeHtml(formatDateTime(result.exportedAt)) +
          ")<br/>" +
          "Evaluados: <strong>" +
          st.complete +
          "</strong> · En progreso: <strong>" +
          st.partial +
          "</strong> · Pendientes: <strong>" +
          st.pending +
          "</strong><br/>" +
          "Temas: " +
          escapeHtml(result.state.topics.join(" · ")) +
          '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
          '<button type="button" class="btn btn-primary btn-sm" id="btn-confirm-restore">Confirmar restauración</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-restore">Cancelar</button>' +
          "</div></div>";

        $("btn-confirm-restore").addEventListener("click", function () {
          if (!ui.pendingRestore) return;
          state = ui.pendingRestore;
          persist();
          renderAll();
          resetBackupRestoreArea();
          closeModal("modal-backup");
          showToast("Copia de seguridad restaurada correctamente.");
        });

        $("btn-cancel-restore").addEventListener("click", resetBackupRestoreArea);
      };
      reader.readAsText(file, "utf-8");
    });

    // Reinicio seguro en dos clics
    $("btn-reset-all").addEventListener("click", function () {
      var btn = $("btn-reset-all");
      if (!resetArmed) {
        resetArmed = true;
        btn.textContent = "Pulsa de nuevo para confirmar borrado";
        clearTimeout(resetArmTimer);
        resetArmTimer = setTimeout(function () {
          resetArmed = false;
          btn.textContent = "Borrar todas las notas";
        }, 4500);
        return;
      }

      clearTimeout(resetArmTimer);
      resetArmed = false;
      btn.textContent = "Borrar todas las notas";
      Storage.clearStorage(META);
      state = Storage.createDefaultState(STUDENTS, META);
      persist();
      renderAll();
      closeModal("modal-backup");
      showToast("Todas las evaluaciones se han reiniciado.");
    });
  }

  function stepFocus(delta) {
    var filtered = getFilteredStudents();
    if (filtered.length === 0) return;
    var idx = 0;
    for (var i = 0; i < filtered.length; i++) {
      if (filtered[i].id === ui.focusStudentId) {
        idx = i;
        break;
      }
    }
    var nextIdx = idx + delta;
    if (nextIdx >= 0 && nextIdx < filtered.length) {
      ui.focusStudentId = filtered[nextIdx].id;
      renderFocusView(filtered);
    }
  }

  /* ========================================================================
     Inicialización
     ======================================================================== */

  function init() {
    var loaded = Storage.loadState(STUDENTS, META);
    state = loaded.state;
    updateSaveIndicator({ ok: !loaded.error, updatedAt: state.updatedAt, error: loaded.error }, true);
    bindEvents();
    syncFilterButtons();
    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
