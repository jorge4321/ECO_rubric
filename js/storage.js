/**
 * Módulo de persistencia local (localStorage) y copias de seguridad JSON
 * para mantener las evaluaciones seguras durante los 3 días de presentaciones.
 */
(function (global) {
  "use strict";

  global.EcoRubric = global.EcoRubric || {};

  var VALID_SCORES = [0, 3, 5, 7, 10];
  var VALID_DAYS = [0, 1, 2, 3];

  function sanitizeScore(val) {
    if (typeof val === "number" && VALID_SCORES.indexOf(val) !== -1) {
      return val;
    }
    return null;
  }

  function sanitizeDay(val) {
    var n = Number(val);
    if (VALID_DAYS.indexOf(n) !== -1) return n;
    return 0;
  }

  function createDefaultState(students, meta) {
    var courseMeta = meta || global.EcoRubric.COURSE_META || {};
    var defaultTopics = Array.isArray(courseMeta.defaultTopics)
      ? courseMeta.defaultTopics.slice(0, 4)
      : ["Tema 1", "Tema 2", "Tema 3", "Tema 4"];

    var evaluations = {};
    for (var i = 0; i < students.length; i++) {
      evaluations[students[i].id] = {
        scores: [null, null, null, null],
        day: 0,
        updatedAt: null
      };
    }

    return {
      version: 1,
      section: courseMeta.section || "2627-88052-A INGLÉS",
      assignmentName: courseMeta.defaultAssignmentName || "Final Class Presentation",
      topics: defaultTopics,
      updatedAt: null,
      evaluations: evaluations
    };
  }

  /**
   * Normaliza un estado cargado desde localStorage o desde un respaldo JSON
   * asegurando que todos los alumnos actuales existan con tipos válidos.
   */
  function normalizeState(raw, students, meta) {
    var base = createDefaultState(students, meta);
    if (!raw || typeof raw !== "object") return base;

    if (typeof raw.assignmentName === "string" && raw.assignmentName.trim()) {
      base.assignmentName = raw.assignmentName.trim();
    }

    if (Array.isArray(raw.topics) && raw.topics.length === 4) {
      base.topics = raw.topics.map(function (t, idx) {
        return typeof t === "string" && t.trim() ? t.trim() : "Tema " + (idx + 1);
      });
    }

    if (typeof raw.updatedAt === "string") {
      base.updatedAt = raw.updatedAt;
    }

    var rawEvals = raw.evaluations && typeof raw.evaluations === "object" ? raw.evaluations : {};
    for (var i = 0; i < students.length; i++) {
      var id = students[i].id;
      var entry = rawEvals[id];
      if (entry && typeof entry === "object") {
        var scores = [null, null, null, null];
        if (Array.isArray(entry.scores)) {
          for (var j = 0; j < 4; j++) {
            scores[j] = sanitizeScore(entry.scores[j]);
          }
        }
        base.evaluations[id] = {
          scores: scores,
          day: sanitizeDay(entry.day),
          updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : null
        };
      }
    }

    return base;
  }

  function loadState(students, meta) {
    var key = (meta && meta.storageKey) || "eco_rubric_v1_2627_88052_A";
    try {
      var rawText = global.localStorage.getItem(key);
      if (!rawText) {
        return { state: createDefaultState(students, meta), loadedFromStorage: false, error: null };
      }
      var parsed = JSON.parse(rawText);
      return {
        state: normalizeState(parsed, students, meta),
        loadedFromStorage: true,
        error: null
      };
    } catch (err) {
      return {
        state: createDefaultState(students, meta),
        loadedFromStorage: false,
        error: "No se pudo leer el almacenamiento local del navegador."
      };
    }
  }

  function saveState(state, meta) {
    var key = (meta && meta.storageKey) || "eco_rubric_v1_2627_88052_A";
    state.updatedAt = new Date().toISOString();
    try {
      global.localStorage.setItem(key, JSON.stringify(state));
      return { ok: true, updatedAt: state.updatedAt, error: null };
    } catch (err) {
      return {
        ok: false,
        updatedAt: state.updatedAt,
        error: "El navegador no permitió guardar en almacenamiento local. Descarga una copia JSON."
      };
    }
  }

  function serializeBackup(state, meta) {
    var payload = {
      app: "ECO_rubric",
      version: 1,
      exportedAt: new Date().toISOString(),
      section: state.section || (meta && meta.section) || "2627-88052-A INGLÉS",
      assignmentName: state.assignmentName,
      topics: state.topics,
      updatedAt: state.updatedAt,
      evaluations: state.evaluations
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Valida y prepara un archivo de copia de seguridad JSON antes de restaurar.
   */
  function parseBackupJson(jsonText, students, meta) {
    var parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      return { valid: false, error: "El archivo no es un JSON válido." };
    }

    if (!parsed || typeof parsed !== "object" || !parsed.evaluations || typeof parsed.evaluations !== "object") {
      return {
        valid: false,
        error: "El archivo JSON no corresponde a una copia de seguridad de esta rúbrica."
      };
    }

    // Verificar que al menos un ID de alumno coincide con el curso actual
    var knownIds = {};
    for (var i = 0; i < students.length; i++) {
      knownIds[students[i].id] = true;
    }
    var keys = Object.keys(parsed.evaluations);
    var matchedCount = 0;
    for (var k = 0; k < keys.length; k++) {
      if (knownIds[keys[k]]) matchedCount++;
    }
    if (matchedCount === 0) {
      return {
        valid: false,
        error: "La copia de seguridad no contiene alumnos del grupo 2627-88052-A INGLÉS."
      };
    }

    var normalized = normalizeState(parsed, students, meta);
    var stats = global.EcoRubric.Grading
      ? global.EcoRubric.Grading.computeSummaryStats(students, normalized)
      : null;

    return {
      valid: true,
      state: normalized,
      exportedAt: parsed.exportedAt || parsed.updatedAt || null,
      stats: stats,
      error: null
    };
  }

  function clearStorage(meta) {
    var key = (meta && meta.storageKey) || "eco_rubric_v1_2627_88052_A";
    try {
      global.localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  global.EcoRubric.Storage = {
    createDefaultState: createDefaultState,
    normalizeState: normalizeState,
    loadState: loadState,
    saveState: saveState,
    serializeBackup: serializeBackup,
    parseBackupJson: parseBackupJson,
    clearStorage: clearStorage
  };
})(typeof window !== "undefined" ? window : globalThis);
