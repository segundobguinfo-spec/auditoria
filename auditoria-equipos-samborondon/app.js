const STORAGE_KEY = "samborondon_auditoria_equipos_v1";
const NOTES_KEY = "samborondon_auditoria_notas_v1";
const GALLERY_KEY = "samborondon_auditoria_galeria_v1";
const THEME_KEY = "samborondon_auditoria_theme_v1";
const BACKUP_KEY = "samborondon_auditoria_backup_v1";

const optimizationCatalog = [
  "Limpieza de archivos temporales",
  "Limpieza basica del sistema",
  "Revision de programas de inicio",
  "Desinstalacion de programas innecesarios",
  "Desfragmentacion de disco, si es HDD",
  "Optimizacion de disco, si es SSD",
  "Actualizacion de controladores",
  "Actualizacion del sistema operativo",
  "Revision de antivirus",
  "Limpieza fisica externa",
  "Revision de cables y conexiones",
  "Recomendacion de ampliacion de RAM",
  "Recomendacion de cambio a SSD",
  "Respaldo de informacion importante"
];

let state = loadState();
let gallery = loadJson(GALLERY_KEY, []);
let notes = loadJson(NOTES_KEY, {});
let charts = {};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  seedIfEmpty();
  renderActionInputs();
  bindEvents();
  clearEquipmentForm();
  hydrateNotes();
  syncAll();
  registerServiceWorker();
  refreshIcons();
});

window.addEventListener("load", () => {
  refreshIcons();
  renderCharts();
  renderOperationsPanel();
});

function bindEvents() {
  document.body.addEventListener("click", handleBodyClick);
  $("#equipmentForm").addEventListener("submit", saveEquipment);
  $("#diagnosisForm").addEventListener("submit", saveDiagnosis);
  $("#optimizationForm").addEventListener("submit", saveOptimization);
  $("#diagnosisEquipment").addEventListener("change", loadDiagnosisForm);
  $("#optimizationEquipment").addEventListener("change", loadOptimizationForm);
  $("#reportEquipment").addEventListener("change", renderReport);
  $("#searchInput").addEventListener("input", renderTable);
  $("#stateFilter").addEventListener("change", renderTable);
  $("#importJson").addEventListener("change", importJson);
  $("#galleryInput").addEventListener("change", addGalleryImages);
  $("#diagnosisForm").addEventListener("input", updateInitialPreview);
  $("#optimizationForm").addEventListener("input", updateOptimizationPreview);
  window.addEventListener("online", renderOperationsPanel);
  window.addEventListener("offline", renderOperationsPanel);
  $$(".autosave-note").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      notes[textarea.dataset.key] = textarea.value;
      saveJson(NOTES_KEY, notes);
    });
  });
}

function handleBodyClick(event) {
  const button = event.target.closest("[data-action], [data-scroll], [data-row-action]");
  if (!button) return;

  if (button.dataset.scroll) {
    $(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    $("#mainNav")?.classList.remove("open");
  }

  const action = button.dataset.action;
  if (action === "toggle-theme") toggleTheme();
  if (action === "toggle-nav") $("#mainNav").classList.toggle("open");
  if (action === "clear-form") clearEquipmentForm();
  if (action === "export-json") exportJson();
  if (action === "export-csv") exportCsv();
  if (action === "export-project") exportProjectPackage();
  if (action === "export-backup") exportBackup();
  if (action === "restore-backup") confirmRestoreBackup();
  if (action === "run-health-check") runHealthCheck();
  if (action === "seed-demo") confirmSeedDemo();
  if (action === "clear-all") confirmClearAll();
  if (action === "download-pdf") exportPdf();
  if (action === "download-project-pdf") exportProjectReport();
  if (action === "generate-notes") generateAcademicNotes();
  if (action === "copy-summary") copyExecutiveSummary();
  if (action === "close-modal") closeModal();

  const rowAction = button.dataset.rowAction;
  const id = button.dataset.id;
  if (rowAction === "view") openDetail(id);
  if (rowAction === "edit") editEquipment(id);
  if (rowAction === "delete") confirmDelete(id);
  if (rowAction === "report") {
    $("#reportEquipment").value = id;
    renderReport();
    $("#reportes").scrollIntoView({ behavior: "smooth" });
  }
  if (rowAction === "delete-image") deleteGalleryImage(id);
}

function loadState() {
  return loadJson(STORAGE_KEY, { equipments: [] });
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createSnapshot(reason = "manual") {
  return {
    app: "Auditoria y Optimizacion de Rendimiento de Equipos",
    version: 3,
    reason,
    exportedAt: new Date().toISOString(),
    state,
    notes,
    gallery
  };
}

function saveAutoBackup(reason) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(createSnapshot(reason)));
    renderOperationsPanel();
    return true;
  } catch {
    toast("No se pudo guardar respaldo automatico. Libera espacio del navegador.", "error");
    return false;
  }
}

function seedIfEmpty() {
  if (state.equipments.length) return;
  state.equipments = createDemoEquipments();
  saveState();
}

function createDemoEquipments() {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      id: crypto.randomUUID(),
      code: "EQ-001",
      name: "Equipo 001",
      location: "Laboratorio 1",
      brand: "Dell",
      model: "OptiPlex",
      cpu: "Intel Core i3",
      ram: 4,
      diskType: "HDD",
      diskCapacity: 500,
      os: "Windows 10",
      physicalState: "Regular",
      powerState: "Enciende",
      owner: "Estudiante auditor",
      reviewDate: today,
      initialNotes: "Equipo con lentitud visible al iniciar sesion y disco mecanico saturado.",
      diagnosis: {
        bootTime: 120,
        slowness: "Alta",
        cpuUsage: 78,
        ramUsage: 84,
        freeSpace: 18,
        unneededPrograms: 12,
        driversOutdated: "Si",
        tempFiles: "Alto",
        diskHealth: "Regular",
        antivirus: "Desactualizado",
        updates: "Pendientes",
        initialLevel: "Bajo",
        programsDetected: "Barras de herramientas, utilidades duplicadas, aplicaciones al inicio.",
        initialScore: 42
      },
      optimization: {
        actions: makeSeedActions(["Limpieza de archivos temporales", "Revision de programas de inicio", "Desfragmentacion de disco, si es HDD"]),
        bootAfter: 75,
        freeAfter: 36,
        finalStateManual: "Automatico",
        technicalRecommendation: "Mantener limpieza mensual y planificar migracion a SSD.",
        finalScore: 68
      }
    },
    {
      id: crypto.randomUUID(),
      code: "EQ-002",
      name: "Equipo 002",
      location: "Laboratorio 1",
      brand: "HP",
      model: "ProDesk",
      cpu: "Intel Core i5",
      ram: 8,
      diskType: "SSD",
      diskCapacity: 240,
      os: "Windows 10",
      physicalState: "Bueno",
      powerState: "Enciende",
      owner: "Estudiante auditor",
      reviewDate: today,
      initialNotes: "Equipo funcional con mantenimiento preventivo pendiente.",
      diagnosis: {
        bootTime: 42,
        slowness: "Baja",
        cpuUsage: 38,
        ramUsage: 55,
        freeSpace: 46,
        unneededPrograms: 4,
        driversOutdated: "Si",
        tempFiles: "Medio",
        diskHealth: "Bueno",
        antivirus: "Activo",
        updates: "Pendientes",
        initialLevel: "Alto",
        programsDetected: "Actualizadores duplicados.",
        initialScore: 72
      },
      optimization: {
        actions: makeSeedActions(["Actualizacion de controladores", "Limpieza basica del sistema"]),
        bootAfter: 29,
        freeAfter: 58,
        finalStateManual: "Automatico",
        technicalRecommendation: "Equipo apto para actividades de laboratorio.",
        finalScore: 88
      }
    },
    {
      id: crypto.randomUUID(),
      code: "EQ-003",
      name: "Equipo 003",
      location: "Laboratorio 2",
      brand: "Lenovo",
      model: "ThinkCentre",
      cpu: "Intel Pentium",
      ram: 2,
      diskType: "HDD",
      diskCapacity: 320,
      os: "Windows 7",
      physicalState: "Malo",
      powerState: "Intermitente",
      owner: "Estudiante auditor",
      reviewDate: today,
      initialNotes: "Arranque inestable, poca memoria y sistema operativo sin soporte.",
      diagnosis: {
        bootTime: 210,
        slowness: "Alta",
        cpuUsage: 91,
        ramUsage: 95,
        freeSpace: 9,
        unneededPrograms: 18,
        driversOutdated: "Si",
        tempFiles: "Alto",
        diskHealth: "Critico",
        antivirus: "No instalado",
        updates: "Sin soporte",
        initialLevel: "Bajo",
        programsDetected: "Software antiguo y servicios innecesarios.",
        initialScore: 25
      },
      optimization: {
        actions: makeSeedActions(["Recomendacion de ampliacion de RAM", "Recomendacion de cambio a SSD", "Respaldo de informacion importante"]),
        bootAfter: 175,
        freeAfter: 20,
        finalStateManual: "Automatico",
        technicalRecommendation: "Cambio a SSD, ampliacion de RAM y actualizacion del sistema operativo.",
        finalScore: 39
      }
    }
  ];
}

function makeSeedActions(doneNames) {
  return optimizationCatalog.map((name) => ({
    name,
    checked: doneNames.includes(name),
    status: doneNames.includes(name) ? "Realizado" : "Pendiente",
    note: doneNames.includes(name) ? "Actividad registrada como evidencia del proceso." : ""
  }));
}

function syncAll() {
  syncSelects();
  renderKpis();
  renderInsights();
  renderTechnicalAssistant();
  renderOperationsPanel();
  renderTable();
  renderCharts();
  renderReport();
  renderGallery();
  loadDiagnosisForm();
  loadOptimizationForm();
}

function syncSelects() {
  const options = state.equipments
    .map((item) => `<option value="${item.id}">${escapeHtml(item.code)} - ${escapeHtml(item.name)}</option>`)
    .join("");
  ["diagnosisEquipment", "optimizationEquipment", "reportEquipment"].forEach((id) => {
    const select = $(`#${id}`);
    const previous = select.value;
    select.innerHTML = options || "<option value=''>Sin equipos registrados</option>";
    if (state.equipments.some((item) => item.id === previous)) select.value = previous;
  });
}

function saveEquipment(event) {
  event.preventDefault();
  const data = readEquipmentForm();
  if (!data) return;

  const duplicate = state.equipments.find((item) => item.code.toLowerCase() === data.code.toLowerCase() && item.id !== data.id);
  if (duplicate) {
    toast("El codigo del equipo ya existe. Usa un codigo unico.", "error");
    return;
  }
  const duplicateName = state.equipments.find((item) => item.name.toLowerCase() === data.name.toLowerCase() && item.location.toLowerCase() === data.location.toLowerCase() && item.id !== data.id);
  if (duplicateName) {
    toast("Ya existe un equipo con ese nombre en la misma ubicacion.", "error");
    return;
  }

  const existing = state.equipments.find((item) => item.id === data.id);
  if (existing) {
    Object.assign(existing, data, { diagnosis: existing.diagnosis, optimization: existing.optimization });
    toast("Equipo actualizado correctamente.");
  } else {
    state.equipments.unshift(data);
    toast("Equipo registrado y guardado en LocalStorage.");
  }

  saveState();
  clearEquipmentForm();
  syncAll();
}

function readEquipmentForm() {
  const id = $("#editingId").value || crypto.randomUUID();
  const data = {
    id,
    code: $("#code").value.trim(),
    name: $("#name").value.trim(),
    location: $("#location").value.trim(),
    brand: $("#brand").value.trim(),
    model: $("#model").value.trim(),
    cpu: $("#cpu").value.trim(),
    ram: Number($("#ram").value),
    diskType: $("#diskType").value,
    diskCapacity: Number($("#diskCapacity").value),
    os: $("#os").value.trim(),
    physicalState: $("#physicalState").value,
    powerState: $("#powerState").value,
    owner: $("#owner").value.trim(),
    reviewDate: $("#reviewDate").value,
    initialNotes: $("#initialNotes").value.trim()
  };

  if (!data.code || !data.name || !data.location || !data.cpu || !data.ram || !data.diskCapacity || !data.os || !data.owner || !data.reviewDate) {
    toast("Completa los campos obligatorios antes de guardar.", "error");
    return null;
  }
  if (data.ram <= 0 || data.diskCapacity <= 0 || data.ram > 256 || data.diskCapacity > 20000) {
    toast("La RAM y la capacidad del disco deben ser valores numericos validos.", "error");
    return null;
  }
  if (Number.isNaN(Date.parse(data.reviewDate))) {
    toast("La fecha de revision no es valida.", "error");
    return null;
  }
  if (new Date(data.reviewDate) > new Date()) {
    toast("La fecha de revision no puede ser futura.", "error");
    return null;
  }
  return data;
}

function clearEquipmentForm() {
  $("#equipmentForm").reset();
  $("#editingId").value = "";
  $("#reviewDate").value = new Date().toISOString().slice(0, 10);
}

function editEquipment(id) {
  const item = findEquipment(id);
  if (!item) return;
  Object.entries(item).forEach(([key, value]) => {
    const input = $(`#${key}`);
    if (input && typeof value !== "object") input.value = value;
  });
  $("#editingId").value = item.id;
  $("#registro").scrollIntoView({ behavior: "smooth" });
  toast("Registro cargado para edicion.");
}

function confirmDelete(id) {
  const item = findEquipment(id);
  if (!item) return;
  showConfirm(`Eliminar ${item.code} del inventario?`, () => {
    state.equipments = state.equipments.filter((equipment) => equipment.id !== id);
    saveState();
    syncAll();
    toast("Equipo eliminado del inventario.");
  });
}

function saveDiagnosis(event) {
  event.preventDefault();
  const equipment = findEquipment($("#diagnosisEquipment").value);
  if (!equipment) {
    toast("Selecciona un equipo valido para diagnosticar.", "error");
    return;
  }
  const diagnosis = readDiagnosisForm();
  if (!diagnosis) return;
  diagnosis.initialScore = calculateInitialScore(equipment, diagnosis);
  equipment.diagnosis = diagnosis;
  if (equipment.optimization) equipment.optimization.finalScore = calculateFinalScore(equipment);
  saveState();
  syncAll();
  $("#diagnosisEquipment").value = equipment.id;
  toast(`Diagnostico guardado. Rendimiento inicial: ${diagnosis.initialScore}%.`);
}

function readDiagnosisForm() {
  const diagnosis = {
    bootTime: Number($("#bootTime").value),
    slowness: $("#slowness").value,
    cpuUsage: Number($("#cpuUsage").value || 0),
    ramUsage: Number($("#ramUsage").value || 0),
    freeSpace: Number($("#freeSpace").value),
    unneededPrograms: Number($("#unneededPrograms").value || 0),
    driversOutdated: $("#driversOutdated").value,
    tempFiles: $("#tempFiles").value,
    diskHealth: $("#diskHealth").value,
    antivirus: $("#antivirus").value,
    updates: $("#updates").value,
    initialLevel: $("#initialLevel").value,
    programsDetected: $("#programsDetected").value.trim()
  };
  if (!diagnosis.bootTime || Number.isNaN(diagnosis.freeSpace)) {
    toast("Ingresa tiempo de encendido y espacio libre para calcular el diagnostico.", "error");
    return null;
  }
  if (diagnosis.bootTime < 1 || diagnosis.bootTime > 3600) {
    toast("El tiempo de encendido debe estar entre 1 y 3600 segundos.", "error");
    return null;
  }
  if (diagnosis.freeSpace < 0 || diagnosis.freeSpace > 100 || diagnosis.cpuUsage < 0 || diagnosis.cpuUsage > 100 || diagnosis.ramUsage < 0 || diagnosis.ramUsage > 100) {
    toast("Los porcentajes deben estar entre 0 y 100.", "error");
    return null;
  }
  return diagnosis;
}

function loadDiagnosisForm() {
  const equipment = findEquipment($("#diagnosisEquipment").value) || state.equipments[0];
  if (!equipment) return;
  $("#diagnosisEquipment").value = equipment.id;
  $("#diagnosisForm").reset();
  const diagnosis = equipment.diagnosis || {};
  [
    "bootTime", "slowness", "cpuUsage", "ramUsage", "freeSpace", "unneededPrograms", "driversOutdated",
    "tempFiles", "diskHealth", "antivirus", "updates", "initialLevel", "programsDetected"
  ].forEach((key) => {
    const input = $(`#${key}`);
    if (input && diagnosis[key] !== undefined) input.value = diagnosis[key];
  });
  updateInitialPreview();
}

function updateInitialPreview() {
  const equipment = findEquipment($("#diagnosisEquipment").value);
  const diagnosis = readDiagnosisFormSilent();
  const score = equipment && diagnosis ? calculateInitialScore(equipment, diagnosis) : 0;
  $("#initialScoreText").textContent = `${score}%`;
  $("#initialScoreRing").style.setProperty("--score", score);
}

function readDiagnosisFormSilent() {
  const bootTime = Number($("#bootTime").value);
  const freeSpace = Number($("#freeSpace").value);
  if (!bootTime || Number.isNaN(freeSpace)) return null;
  return {
    bootTime,
    slowness: $("#slowness").value,
    cpuUsage: Number($("#cpuUsage").value || 0),
    ramUsage: Number($("#ramUsage").value || 0),
    freeSpace,
    unneededPrograms: Number($("#unneededPrograms").value || 0),
    driversOutdated: $("#driversOutdated").value,
    tempFiles: $("#tempFiles").value,
    diskHealth: $("#diskHealth").value,
    antivirus: $("#antivirus").value,
    updates: $("#updates").value,
    initialLevel: $("#initialLevel").value,
    programsDetected: $("#programsDetected").value.trim()
  };
}

function renderActionInputs() {
  $("#optimizationActions").innerHTML = optimizationCatalog.map((name, index) => `
    <div class="action-card" data-action-index="${index}">
      <input type="checkbox" id="action-${index}">
      <label for="action-${index}">${escapeHtml(name)}</label>
      <select id="action-status-${index}">
        <option>Pendiente</option>
        <option>En proceso</option>
        <option>Realizado</option>
        <option>No aplica</option>
      </select>
      <input type="text" id="action-note-${index}" placeholder="Observacion o evidencia registrada">
    </div>
  `).join("");
}

function saveOptimization(event) {
  event.preventDefault();
  const equipment = findEquipment($("#optimizationEquipment").value);
  if (!equipment) {
    toast("Selecciona un equipo valido para optimizar.", "error");
    return;
  }
  if (!equipment.diagnosis) {
    toast("No se puede calcular mejora sin diagnostico inicial.", "error");
    return;
  }
  const optimization = readOptimizationForm();
  if (!optimization) return;
  optimization.finalScore = calculateFinalScore(equipment, optimization);
  equipment.optimization = optimization;
  saveState();
  syncAll();
  $("#optimizationEquipment").value = equipment.id;
  toast(`Optimizacion guardada. Rendimiento final: ${optimization.finalScore}%.`);
}

function readOptimizationForm() {
  const optimization = {
    actions: optimizationCatalog.map((name, index) => ({
      name,
      checked: $(`#action-${index}`).checked,
      status: $(`#action-status-${index}`).value,
      note: $(`#action-note-${index}`).value.trim()
    })),
    bootAfter: Number($("#bootAfter").value || 0),
    freeAfter: Number($("#freeAfter").value || 0),
    finalStateManual: $("#finalStateManual").value,
    technicalRecommendation: $("#technicalRecommendation").value.trim()
  };
  if (optimization.bootAfter < 0 || optimization.bootAfter > 3600 || optimization.freeAfter < 0 || optimization.freeAfter > 100) {
    toast("Los valores posteriores deben ser realistas: encendido 1-3600 seg y espacio 0-100%.", "error");
    return null;
  }
  return optimization;
}

function loadOptimizationForm() {
  const equipment = findEquipment($("#optimizationEquipment").value) || state.equipments[0];
  if (!equipment) return;
  $("#optimizationEquipment").value = equipment.id;
  const optimization = equipment.optimization || { actions: makeSeedActions([]) };
  optimizationCatalog.forEach((name, index) => {
    const action = optimization.actions?.find((item) => item.name === name) || {};
    $(`#action-${index}`).checked = Boolean(action.checked);
    $(`#action-status-${index}`).value = action.status || "Pendiente";
    $(`#action-note-${index}`).value = action.note || "";
  });
  $("#bootAfter").value = optimization.bootAfter || "";
  $("#freeAfter").value = optimization.freeAfter || "";
  $("#finalStateManual").value = optimization.finalStateManual || "Automatico";
  $("#technicalRecommendation").value = optimization.technicalRecommendation || "";
  updateOptimizationPreview();
}

function updateOptimizationPreview() {
  const equipment = findEquipment($("#optimizationEquipment").value);
  const before = equipment?.diagnosis?.initialScore || 0;
  const optimization = equipment ? readOptimizationForm() : null;
  const after = equipment && optimization ? calculateFinalScore(equipment, optimization) : 0;
  const improvement = before ? Math.max(0, Math.round(((after - before) / before) * 100)) : 0;
  $("#beforeScore").textContent = `${before}%`;
  $("#afterScore").textContent = `${after}%`;
  $("#improvementScore").textContent = `${improvement}%`;
  $("#beforeMeter").value = before;
  $("#afterMeter").value = after;
  $("#improvementMeter").value = Math.min(100, improvement);
  $("#finalLevelLabel").textContent = getLevel(after);
  $("#finalStatusLabel").textContent = getResolvedFinalStatus(equipment, after);
}

function calculateInitialScore(equipment, diagnosis) {
  let score = 60;
  score += Math.min(20, Number(equipment.ram) * 2.2);
  score += { HDD: -4, SSD: 10, NVMe: 14 }[equipment.diskType] || 0;
  score += clamp((diagnosis.freeSpace - 20) / 3, -10, 14);
  score -= clamp((diagnosis.bootTime - 45) / 8, 0, 16);
  score -= clamp(diagnosis.unneededPrograms * 1, 0, 12);
  score -= diagnosis.slowness === "Alta" ? 9 : diagnosis.slowness === "Media" ? 4 : 0;
  score -= diagnosis.driversOutdated === "Si" ? 5 : 0;
  score -= diagnosis.tempFiles === "Alto" ? 5 : diagnosis.tempFiles === "Medio" ? 2 : 0;
  score -= diagnosis.diskHealth === "Critico" ? 14 : diagnosis.diskHealth === "Regular" ? 6 : 0;
  score -= diagnosis.antivirus === "No instalado" ? 7 : diagnosis.antivirus === "Desactualizado" ? 4 : 0;
  score -= diagnosis.updates === "Sin soporte" ? 10 : diagnosis.updates === "Pendientes" ? 4 : 0;
  score -= equipment.physicalState === "Malo" ? 8 : equipment.physicalState === "Regular" ? 3 : 0;
  score -= equipment.powerState === "No enciende" ? 35 : equipment.powerState === "Intermitente" ? 14 : 0;
  const floor = equipment.powerState === "No enciende" ? 0 : equipment.powerState === "Intermitente" ? 12 : 18;
  return clamp(Math.round(score), floor, 100);
}

function calculateFinalScore(equipment, optimizationOverride) {
  const diagnosis = equipment.diagnosis;
  if (!diagnosis) return 0;
  const optimization = optimizationOverride || equipment.optimization || {};
  let score = diagnosis.initialScore || calculateInitialScore(equipment, diagnosis);
  const completed = (optimization.actions || []).filter((item) => item.checked || item.status === "Realizado");
  score += completed.length * 3.4;
  if (completed.some((item) => item.name.includes("controladores"))) score += 4;
  if (completed.some((item) => item.name.includes("SSD")) && equipment.diskType === "HDD") score += 5;
  if (completed.some((item) => item.name.includes("RAM")) && Number(equipment.ram) < 4) score += 4;
  if (optimization.bootAfter && diagnosis.bootTime) score += clamp((diagnosis.bootTime - optimization.bootAfter) / 5, -6, 14);
  if (optimization.freeAfter) score += clamp((optimization.freeAfter - diagnosis.freeSpace) / 2.5, -4, 12);
  if (equipment.powerState === "No enciende") score = Math.min(score, 30);
  return clamp(Math.round(score), 0, 100);
}

function renderKpis() {
  const stats = getStats();
  const quality = getDataQuality(stats);
  $("#heroTotal").textContent = stats.total;
  $("#heroFinal").textContent = `${stats.avgFinal}%`;
  $("#heroImprove").textContent = `${stats.generalImprovement}%`;
  $("#heroQuality").textContent = `${quality.score}%`;
  const cards = [
    ["Total de equipos", stats.total, "monitor"],
    ["Equipos optimizados", stats.optimized, "wrench"],
    ["Equipos pendientes", stats.pending, "clock-3"],
    ["Equipos en mal estado", stats.bad, "triangle-alert"],
    ["Promedio inicial", `${stats.avgInitial}%`, "activity"],
    ["Promedio final", `${stats.avgFinal}%`, "gauge"],
    ["Mejora general", `${stats.generalImprovement}%`, "trending-up"],
    ["HDD / SSD", `${stats.hdd} / ${stats.ssd}`, "hard-drive"],
    ["Calidad de datos", `${quality.score}%`, "shield-check"]
  ];
  $("#kpiGrid").innerHTML = cards.map(([label, value, icon]) => `
    <article class="kpi-card">
      <span><i data-lucide="${icon}"></i> ${label}</span>
      <strong>${value}</strong>
      <small>${getKpiHint(label, stats)}</small>
    </article>
  `).join("");
  refreshIcons();
}

function getKpiHint(label, stats) {
  const hints = {
    "Total de equipos": "Inventario guardado localmente",
    "Equipos optimizados": "Con acciones registradas",
    "Equipos pendientes": "Sin cierre de optimizacion",
    "Equipos en mal estado": "Prioridad de mantenimiento",
    "Promedio inicial": "Antes de aplicar acciones",
    "Promedio final": "Despues del proceso",
    "Mejora general": "Incremento promedio estimado",
    "HDD / SSD": `${stats.ramUpgrade} requieren RAM, ${stats.ssdUpgrade} migracion a SSD`,
    "Calidad de datos": getDataQuality(stats).label
  };
  return hints[label] || "";
}

function getStats() {
  const total = state.equipments.length;
  const initialScores = state.equipments.map((item) => item.diagnosis?.initialScore || 0);
  const finalScores = state.equipments.map((item) => item.optimization?.finalScore || item.diagnosis?.initialScore || 0);
  const avgInitial = average(initialScores);
  const avgFinal = average(finalScores);
  const diagnosed = state.equipments.filter((item) => item.diagnosis).length;
  const optimized = state.equipments.filter((item) => (item.optimization?.actions || []).some((action) => action.checked || action.status === "Realizado")).length;
  return {
    total,
    diagnosed,
    optimized,
    pending: state.equipments.filter((item) => !item.optimization).length,
    bad: state.equipments.filter((item) => item.physicalState === "Malo").length,
    avgInitial,
    avgFinal,
    generalImprovement: avgInitial ? Math.max(0, Math.round(((avgFinal - avgInitial) / avgInitial) * 100)) : 0,
    hdd: state.equipments.filter((item) => item.diskType === "HDD").length,
    ssd: state.equipments.filter((item) => item.diskType === "SSD" || item.diskType === "NVMe").length,
    ramUpgrade: state.equipments.filter((item) => Number(item.ram) < 4).length,
    ssdUpgrade: state.equipments.filter((item) => item.diskType === "HDD").length,
    evidence: gallery.length
  };
}

function getDataQuality(stats = getStats()) {
  if (!stats.total) {
    return { score: 0, label: "Sin muestra registrada", summary: "Registra equipos reales del laboratorio para iniciar la medicion del proyecto." };
  }
  const diagnosisRatio = stats.diagnosed / stats.total;
  const optimizationRatio = stats.optimized / stats.total;
  const evidenceRatio = Math.min(1, stats.evidence / Math.max(1, stats.total));
  const notesRatio = ["conclusions", "recommendations", "proposals", "reflection"].filter((key) => (notes[key] || "").trim()).length / 4;
  const score = Math.round((diagnosisRatio * 0.34 + optimizationRatio * 0.34 + evidenceRatio * 0.16 + notesRatio * 0.16) * 100);
  const label = score >= 85 ? "Lista para exposicion" : score >= 62 ? "Solida, falta evidencia" : "En construccion";
  const summary = `${stats.diagnosed}/${stats.total} equipos diagnosticados, ${stats.optimized}/${stats.total} optimizados y ${stats.evidence} evidencias visuales guardadas.`;
  return { score, label, summary };
}

function renderInsights() {
  const meter = $("#qualityMeter");
  if (!meter) return;
  const stats = getStats();
  const quality = getDataQuality(stats);
  meter.style.setProperty("--quality", quality.score);
  $("#qualityText").textContent = `${quality.score}%`;
  $("#qualitySummary").textContent = `${quality.label}. ${quality.summary}`;
  renderPriorityList();
  renderHypothesis(stats, quality);
}

function renderTechnicalAssistant() {
  const target = $("#technicalAssistant");
  if (!target) return;
  const stats = getStats();
  const quality = getDataQuality(stats);
  const critical = [...state.equipments]
    .map((item) => ({ item, profile: getRiskProfile(item) }))
    .sort((a, b) => b.profile.score - a.profile.score)
    .slice(0, 3);
  const dependencyWarning = getMissingDependencies().length
    ? "Hay librerias externas no disponibles; la app activa motores locales de respaldo donde es posible."
    : "Las librerias visuales principales estan disponibles para graficos, iconos y PDF avanzado.";

  target.innerHTML = `
    <div class="assistant-summary">
      <strong>${quality.label}</strong>
      <span>${stats.total} equipos, ${stats.diagnosed} diagnosticos, ${stats.optimized} optimizaciones, ${stats.evidence} evidencias.</span>
    </div>
    <div class="assistant-list">
      ${critical.length ? critical.map(({ item, profile }) => `
        <div>
          <strong>${escapeHtml(item.code)} - ${profile.label}</strong>
          <span>${escapeHtml(profile.reason)}</span>
        </div>
      `).join("") : "<div><strong>Sin equipos registrados</strong><span>Registra inventario real para activar recomendaciones.</span></div>"}
    </div>
    <p>${dependencyWarning}</p>
  `;
}

function getRiskProfile(item) {
  const finalScore = item.optimization?.finalScore || item.diagnosis?.initialScore || 0;
  let score = 100 - finalScore;
  const reasons = [];
  if (!item.diagnosis) {
    score += 28;
    reasons.push("sin diagnostico");
  }
  if (!item.optimization) {
    score += 18;
    reasons.push("sin optimizacion");
  }
  if (item.powerState !== "Enciende") {
    score += 20;
    reasons.push(`encendido ${item.powerState.toLowerCase()}`);
  }
  if (item.diskType === "HDD") {
    score += 10;
    reasons.push("disco HDD");
  }
  if (Number(item.ram) < 4) {
    score += 12;
    reasons.push("RAM menor a 4 GB");
  }
  if (item.physicalState === "Malo") {
    score += 12;
    reasons.push("estado fisico malo");
  }
  const label = score >= 95 ? "Critico" : score >= 72 ? "Alta prioridad" : score >= 46 ? "Seguimiento" : "Estable";
  return {
    score: clamp(score, 0, 100),
    label,
    reason: reasons.length ? `Atender por ${reasons.join(", ")}.` : getAutomaticRecommendation(item)
  };
}

function renderPriorityList() {
  const target = $("#priorityList");
  if (!target) return;
  const prioritized = [...state.equipments]
    .map((item) => {
      const before = item.diagnosis?.initialScore || 0;
      const after = item.optimization?.finalScore || before;
      let risk = 100 - after;
      if (item.powerState !== "Enciende") risk += 18;
      if (item.diskType === "HDD") risk += 8;
      if (Number(item.ram) < 4) risk += 10;
      return { item, before, after, risk };
    })
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 4);

  target.innerHTML = prioritized.length ? prioritized.map(({ item, after, risk }, index) => `
    <div class="priority-item">
      <strong>${index + 1}. ${escapeHtml(item.code)}</strong>
      <span>${escapeHtml(getAutomaticRecommendation(item))}</span>
      <small>Riesgo ${Math.min(100, Math.round(risk))}% | rendimiento ${after}%</small>
    </div>
  `).join("") : `<div class="empty">Aun no hay equipos para priorizar.</div>`;
}

function renderHypothesis(stats, quality) {
  const target = $("#hypothesisBox");
  if (!target) return;
  const hypothesis = "Si se realiza diagnostico tecnico y mantenimiento preventivo, el rendimiento de los equipos antiguos del laboratorio mejora de forma medible.";
  const result = stats.avgInitial
    ? `Resultado actual: el promedio paso de ${stats.avgInitial}% a ${stats.avgFinal}%, con una mejora general estimada de ${stats.generalImprovement}%.`
    : "Resultado actual: pendiente de registrar diagnosticos reales.";
  target.innerHTML = `
    <p><strong>Hipotesis:</strong> ${hypothesis}</p>
    <p><strong>Medicion:</strong> ${result}</p>
    <p><strong>Confiabilidad:</strong> ${quality.label} (${quality.score}%).</p>
  `;
}

function renderOperationsPanel() {
  const runtimeStatus = $("#runtimeStatus");
  if (!runtimeStatus) return;
  const missing = getMissingDependencies();
  const storageOk = canUseStorage();
  const servedByHttp = location.protocol === "http:" || location.protocol === "https:";
  const pwaReady = servedByHttp && "serviceWorker" in navigator;
  const backup = loadJson(BACKUP_KEY, null);
  const issues = [];
  if (!servedByHttp) issues.push("abre la app por localhost o HTTPS para activar PWA/offline");
  if (!storageOk) issues.push("almacenamiento local no disponible");
  if (missing.length) issues.push(`dependencias externas pendientes: ${missing.join(", ")}`);
  runtimeStatus.textContent = issues.length ? "Requiere atencion" : "Operativa";
  runtimeStatus.className = `status-pill ${issues.length ? "warning" : "ready"}`;
  $("#runtimeSummary").textContent = issues.length
    ? `Correcciones sugeridas: ${issues.join("; ")}.`
    : "La app esta servida correctamente, conserva datos localmente y tiene el nucleo funcional activo.";
  $("#backupStatus").textContent = backup?.exportedAt ? `Ultimo respaldo: ${new Date(backup.exportedAt).toLocaleString("es-EC")}` : "Sin respaldo local";
  $("#backupSummary").textContent = backup?.reason ? `Motivo: ${backup.reason}. Equipos protegidos: ${backup.state?.equipments?.length || 0}.` : "Crea una copia antes de importar, limpiar o exponer el proyecto.";
  $("#dependencyList").innerHTML = [
    ["Modo HTTP/PWA", pwaReady ? "Listo" : "Pendiente"],
    ["Almacenamiento", storageOk ? "Listo" : "Bloqueado"],
    ["Graficos", window.Chart ? "Avanzado" : "Respaldo local"],
    ["PDF", window.html2canvas && window.jspdf?.jsPDF ? "Avanzado" : "Motor local"],
    ["Iconos", window.lucide ? "Listo" : "Texto accesible"]
  ].map(([label, value]) => `<li><strong>${label}</strong><span>${value}</span></li>`).join("");
}

function canUseStorage() {
  try {
    const key = "__auditoria_storage_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function getMissingDependencies() {
  const missing = [];
  if (!window.Chart) missing.push("Chart.js");
  if (!window.html2canvas) missing.push("html2canvas");
  if (!window.jspdf?.jsPDF) missing.push("jsPDF");
  if (!window.lucide) missing.push("Lucide");
  return missing;
}

function runHealthCheck() {
  renderOperationsPanel();
  const stats = getStats();
  const quality = getDataQuality(stats);
  const missing = getMissingDependencies();
  const messages = [
    `Inventario: ${stats.total} equipos`,
    `Diagnosticos: ${stats.diagnosed}`,
    `Optimizaciones: ${stats.optimized}`,
    `Calidad metodologica: ${quality.score}%`
  ];
  if (location.protocol === "file:") messages.push("PWA/offline requiere localhost o HTTPS");
  if (missing.length) messages.push(`Modo respaldo para: ${missing.join(", ")}`);
  toast(`Verificacion completada. ${messages.join(" | ")}`, missing.length || location.protocol === "file:" ? "warning" : "success");
}

function renderTable() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const filter = $("#stateFilter").value;
  const rows = state.equipments.filter((item) => {
    const haystack = [item.code, item.name, item.cpu, item.ram, item.diskType, item.os, item.owner, item.location].join(" ").toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesFilter = filter === "Todos" || item.physicalState === filter;
    return matchesSearch && matchesFilter;
  });

  $("#equipmentTable").innerHTML = rows.length ? rows.map((item) => {
    const initial = item.diagnosis?.initialScore ?? "--";
    const final = item.optimization?.finalScore ?? "--";
    const finalStatus = item.optimization ? getResolvedFinalStatus(item, item.optimization.finalScore) : "Pendiente";
    return `
      <tr>
        <td><strong>${escapeHtml(item.code)}</strong></td>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.cpu)}</td>
        <td>${item.ram} GB</td>
        <td>${escapeHtml(item.diskType)} ${item.diskCapacity} GB</td>
        <td>${escapeHtml(item.os)}</td>
        <td>${badge(item.physicalState)}</td>
        <td>${badge(finalStatus)}</td>
        <td>${initial}${initial !== "--" ? "%" : ""}</td>
        <td>${final}${final !== "--" ? "%" : ""}</td>
        <td>${escapeHtml(item.owner)}</td>
        <td>
          <div class="row-actions">
            <button class="mini-btn" title="Ver detalle" data-row-action="view" data-id="${item.id}"><i data-lucide="eye"></i></button>
            <button class="mini-btn" title="Editar" data-row-action="edit" data-id="${item.id}"><i data-lucide="pencil"></i></button>
            <button class="mini-btn" title="Reporte" data-row-action="report" data-id="${item.id}"><i data-lucide="file-text"></i></button>
            <button class="mini-btn" title="Eliminar" data-row-action="delete" data-id="${item.id}"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="12" class="empty">No hay equipos que coincidan con la busqueda.</td></tr>`;
  refreshIcons();
}

function renderCharts() {
  const labels = state.equipments.map((item) => item.code);
  drawChart("performanceChart", "bar", labels, [
    { label: "Antes", data: state.equipments.map((item) => item.diagnosis?.initialScore || 0), color: "#d4a63f" },
    { label: "Despues", data: state.equipments.map((item) => item.optimization?.finalScore || item.diagnosis?.initialScore || 0), color: "#496d55" }
  ]);

  const diskLabels = ["HDD", "SSD", "NVMe"];
  drawChart("diskChart", "doughnut", diskLabels, [{
    label: "Discos",
    data: diskLabels.map((type) => state.equipments.filter((item) => item.diskType === type).length),
    color: ["#d4a63f", "#496d55", "#5a9e96"]
  }]);

  const statusLabels = ["Optimo", "Aceptable", "Requiere mantenimiento", "Requiere reemplazo"];
  drawChart("statusChart", "doughnut", statusLabels, [{
    label: "Estados",
    data: statusLabels.map((status) => state.equipments.filter((item) => getResolvedFinalStatus(item, item.optimization?.finalScore || item.diagnosis?.initialScore || 0) === status).length),
    color: ["#496d55", "#5a9e96", "#d4a63f", "#d93f44"]
  }]);
}

function drawChart(canvasId, type, labels, series) {
  const canvas = $(`#${canvasId}`);
  if (!canvas) return;
  if (window.Chart) {
    charts[canvasId]?.destroy();
    const chartColors = series.map((item, index) => ({
      ...item,
      renderedColor: Array.isArray(item.color)
        ? item.color.map((color, colorIndex) => makeChartGradient(canvas, color, colorIndex, type))
        : makeChartGradient(canvas, item.color, index, type)
    }));
    charts[canvasId] = new Chart(canvas, {
      type,
      data: {
        labels,
        datasets: chartColors.map((item) => ({
          label: item.label,
          data: item.data,
          backgroundColor: item.renderedColor,
          borderColor: type === "bar" ? "rgba(255, 250, 240, 0.72)" : "rgba(255, 250, 240, 0.82)",
          borderRadius: type === "bar" ? 8 : 0,
          borderWidth: type === "bar" ? 1 : 3,
          hoverOffset: type === "doughnut" ? 12 : 0,
          borderSkipped: false
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1050, easing: "easeOutQuart" },
        plugins: {
          legend: {
            labels: {
              boxWidth: 12,
              color: getComputedStyle(document.body).getPropertyValue("--text").trim(),
              font: { family: "Aptos Display, Segoe UI, sans-serif", weight: "700" }
            }
          },
          tooltip: {
            backgroundColor: "rgba(23, 33, 22, 0.92)",
            borderColor: "rgba(212, 166, 63, 0.45)",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8
          }
        },
        cutout: type === "doughnut" ? "62%" : undefined,
        scales: type === "bar" ? {
          x: {
            grid: { display: false },
            ticks: { color: getComputedStyle(document.body).getPropertyValue("--muted").trim(), font: { weight: "700" } }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: "rgba(49, 71, 57, 0.12)" },
            ticks: { color: getComputedStyle(document.body).getPropertyValue("--muted").trim(), font: { weight: "700" } }
          }
        } : {}
      }
    });
  } else {
    drawCanvasFallback(canvas, labels, series, type);
  }
}

function makeChartGradient(canvas, color, index, type) {
  const ctx = canvas.getContext("2d");
  const height = canvas.clientHeight || 270;
  const gradient = type === "bar"
    ? ctx.createLinearGradient(0, 0, 0, height)
    : ctx.createLinearGradient(0, 0, canvas.clientWidth || 320, height);
  gradient.addColorStop(0, lightenHex(color, 34));
  gradient.addColorStop(0.48, color);
  gradient.addColorStop(1, darkenHex(color, 22 + index * 4));
  return gradient;
}

function drawCanvasFallback(canvas, labels, series, type = "bar") {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(320, rect.width * devicePixelRatio);
  canvas.height = 270 * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, rect.width, 270);
  if (type === "doughnut") {
    drawDoughnutFallback(ctx, rect, labels, series[0]);
    return;
  }
  ctx.font = "700 12px Aptos Display, Segoe UI, sans-serif";
  const max = 100;
  const gap = 18;
  const barWidth = Math.max(12, (rect.width - 64 - labels.length * gap) / Math.max(1, labels.length * series.length));
  ctx.strokeStyle = "rgba(49, 71, 57, 0.12)";
  ctx.lineWidth = 1;
  for (let y = 42; y <= 222; y += 45) {
    ctx.beginPath();
    ctx.moveTo(28, y);
    ctx.lineTo(rect.width - 18, y);
    ctx.stroke();
  }
  labels.forEach((label, i) => {
    series.forEach((item, s) => {
      const value = item.data[i] || 0;
      const x = 34 + i * (barWidth * series.length + gap) + s * barWidth;
      const h = (value / max) * 190;
      const color = Array.isArray(item.color) ? item.color[i] : item.color;
      const gradient = ctx.createLinearGradient(0, 222 - h, 0, 222);
      gradient.addColorStop(0, lightenHex(color, 30));
      gradient.addColorStop(0.5, color);
      gradient.addColorStop(1, darkenHex(color, 24));
      ctx.shadowColor = "rgba(49, 71, 57, 0.22)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = gradient;
      roundRect(ctx, x, 222 - h, barWidth - 2, h, 7);
      ctx.fill();
      ctx.shadowColor = "transparent";
    });
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted");
    ctx.fillText(label, 30 + i * (barWidth * series.length + gap), 246);
  });
}

function drawDoughnutFallback(ctx, rect, labels, item) {
  const total = item.data.reduce((sum, value) => sum + value, 0) || 1;
  const centerX = rect.width / 2;
  const centerY = 132;
  const radius = Math.min(rect.width, 250) * 0.28;
  let start = -Math.PI / 2;
  item.data.forEach((value, index) => {
    const end = start + (value / total) * Math.PI * 2;
    const color = Array.isArray(item.color) ? item.color[index] : item.color;
    const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.35, centerX, centerY, radius);
    gradient.addColorStop(0, lightenHex(color, 26));
    gradient.addColorStop(0.58, color);
    gradient.addColorStop(1, darkenHex(color, 24));
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start, end);
    ctx.arc(centerX, centerY, radius * 0.58, end, start, true);
    ctx.closePath();
    ctx.shadowColor = "rgba(49, 71, 57, 0.24)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = gradient;
    ctx.fill();
    start = end;
  });
  ctx.shadowColor = "transparent";
  ctx.font = "800 13px Aptos Display, Segoe UI, sans-serif";
  labels.forEach((label, index) => {
    const color = Array.isArray(item.color) ? item.color[index] : item.color;
    const x = 24 + (index % 2) * Math.max(130, rect.width / 2 - 18);
    const y = 228 + Math.floor(index / 2) * 22;
    ctx.fillStyle = color;
    roundRect(ctx, x, y - 10, 10, 10, 3);
    ctx.fill();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted");
    ctx.fillText(`${label}: ${item.data[index] || 0}`, x + 16, y);
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function lightenHex(hex, amount) {
  return shiftHex(hex, amount);
}

function darkenHex(hex, amount) {
  return shiftHex(hex, -amount);
}

function shiftHex(hex, amount) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean, 16);
  const r = clamp(((num >> 16) & 255) + amount, 0, 255);
  const g = clamp(((num >> 8) & 255) + amount, 0, 255);
  const b = clamp((num & 255) + amount, 0, 255);
  return `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
}

function renderReport() {
  const equipment = findEquipment($("#reportEquipment").value) || state.equipments[0];
  const card = $("#reportCard");
  if (!equipment) {
    card.innerHTML = `<div class="empty">Registra un equipo para generar su reporte tecnico.</div>`;
    return;
  }
  $("#reportEquipment").value = equipment.id;
  const diagnosis = equipment.diagnosis;
  const optimization = equipment.optimization;
  const before = diagnosis?.initialScore || 0;
  const after = optimization?.finalScore || before;
  const actions = (optimization?.actions || []).filter((item) => item.checked || item.status === "Realizado");
  card.innerHTML = `
    <div class="report-head">
      <img src="assets/logo-samborondon.jpeg" alt="Logo institucional">
      <div>
        <h3>Unidad Educativa Fiscal Samborondon</h3>
        <p>Auditoria y Optimizacion de Rendimiento de Equipos</p>
        <strong>Reporte tecnico individual - ${escapeHtml(equipment.code)}</strong>
      </div>
    </div>
    <div class="report-grid">
      ${reportBox("Datos del equipo", [
        ["Equipo", equipment.name],
        ["Ubicacion", equipment.location],
        ["CPU", equipment.cpu],
        ["RAM", `${equipment.ram} GB`],
        ["Disco", `${equipment.diskType} ${equipment.diskCapacity} GB`],
        ["Sistema", equipment.os]
      ])}
      ${reportBox("Diagnostico inicial", diagnosis ? [
        ["Rendimiento", `${before}%`],
        ["Tiempo de encendido", `${diagnosis.bootTime} segundos`],
        ["Espacio libre", `${diagnosis.freeSpace}%`],
        ["Estado del disco", diagnosis.diskHealth],
        ["Antivirus", diagnosis.antivirus],
        ["Actualizaciones", diagnosis.updates]
      ] : [["Pendiente", "No existe diagnostico registrado"]])}
      ${reportBox("Acciones realizadas", actions.length ? actions.map((item) => [item.name, item.note || item.status]) : [["Pendiente", "Sin acciones finalizadas"]])}
      ${reportBox("Comparacion antes/despues", [
        ["Rendimiento antes", `${before}%`],
        ["Rendimiento despues", `${after}%`],
        ["Mejora", `${before ? Math.max(0, Math.round(((after - before) / before) * 100)) : 0}%`],
        ["Nivel final", getLevel(after)],
        ["Estado final", getResolvedFinalStatus(equipment, after)],
        ["Fecha", new Date().toLocaleDateString("es-EC")]
      ])}
      <div class="report-box wide">
        <h3>Recomendacion tecnica final</h3>
        <p>${escapeHtml(optimization?.technicalRecommendation || getAutomaticRecommendation(equipment) || equipment.initialNotes || "Registrar recomendaciones despues del diagnostico.")}</p>
        <p><strong>Responsable:</strong> ${escapeHtml(equipment.owner)}</p>
      </div>
    </div>
  `;
}

function reportBox(title, rows) {
  return `
    <div class="report-box">
      <h3>${escapeHtml(title)}</h3>
      ${rows.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(String(value || ""))}</p>`).join("")}
    </div>
  `;
}

async function exportPdf() {
  const equipment = findEquipment($("#reportEquipment").value);
  if (!equipment) {
    toast("Selecciona un equipo para exportar el reporte.", "error");
    return;
  }
  if (!equipment.diagnosis) {
    toast("No se puede generar reporte si no existe diagnostico.", "error");
    return;
  }
  renderReport();
  const report = $("#reportCard");
  const fileName = `reporte-${equipment.code}.pdf`;
  try {
    if (!window.html2canvas || !window.jspdf?.jsPDF) throw new Error("Librerias PDF no disponibles");
    const canvas = await html2canvas(report, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const img = canvas.toDataURL("image/png");
    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 18;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let y = 9;
    if (imgHeight <= pageHeight - 18) {
      pdf.addImage(img, "PNG", 9, y, imgWidth, imgHeight);
    } else {
      let remaining = imgHeight;
      let sourceY = 0;
      const pageCanvas = document.createElement("canvas");
      const pageCtx = pageCanvas.getContext("2d");
      const ratio = canvas.width / imgWidth;
      const sliceHeight = (pageHeight - 18) * ratio;
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      while (remaining > 0) {
        pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", 9, 9, imgWidth, pageHeight - 18);
        remaining -= pageHeight - 18;
        sourceY += sliceHeight;
        if (remaining > 0) pdf.addPage();
      }
    }
    pdf.save(fileName);
    toast("Reporte PDF generado correctamente.");
  } catch (error) {
    exportOfflinePdf(equipment, fileName);
    toast("Reporte PDF generado con motor local de respaldo.");
  }
}

function exportProjectReport() {
  const stats = getStats();
  const quality = getDataQuality(stats);
  const lines = [
    "Unidad Educativa Fiscal Samborondon",
    "Auditoria y Optimizacion de Rendimiento de Equipos",
    "Informe general del proyecto",
    "",
    buildExecutiveSummary(),
    "",
    "Hipotesis",
    "Si se realiza diagnostico tecnico y mantenimiento preventivo, el rendimiento de los equipos antiguos del laboratorio mejora de forma medible.",
    "",
    "Indicadores",
    `Equipos registrados: ${stats.total}`,
    `Diagnosticos completos: ${stats.diagnosed}`,
    `Optimizaciones completas: ${stats.optimized}`,
    `Promedio inicial: ${stats.avgInitial}%`,
    `Promedio final: ${stats.avgFinal}%`,
    `Mejora general: ${stats.generalImprovement}%`,
    `Calidad metodologica: ${quality.score}% - ${quality.label}`,
    "",
    "Equipos prioritarios",
    ...[...state.equipments]
      .map((item) => ({ item, profile: getRiskProfile(item) }))
      .sort((a, b) => b.profile.score - a.profile.score)
      .slice(0, 8)
      .map(({ item, profile }) => `${item.code}: ${profile.label}. ${profile.reason}`),
    "",
    "Conclusiones",
    notes.conclusions || "Genera conclusiones desde resultados antes de imprimir el informe final.",
    "",
    "Recomendaciones",
    notes.recommendations || "Registra recomendaciones tecnicas por equipo y generales para el laboratorio."
  ].flatMap((line) => wrapPdfLine(line, 88));
  const content = [
    "BT",
    "/F1 10 Tf",
    "13 TL",
    "46 798 Td",
    ...lines.slice(0, 56).map((line) => `(${escapePdfText(line)}) Tj T*`),
    "ET"
  ].join("\n");
  downloadBlob(new Blob([buildSimplePdf(content)], { type: "application/pdf" }), `informe-general-auditoria-${new Date().toISOString().slice(0, 10)}.pdf`);
  toast("Informe general del proyecto generado.");
}

function exportOfflinePdf(equipment, fileName) {
  const diagnosis = equipment.diagnosis || {};
  const optimization = equipment.optimization || {};
  const before = diagnosis.initialScore || 0;
  const after = optimization.finalScore || before;
  const actions = (optimization.actions || [])
    .filter((item) => item.checked || item.status === "Realizado")
    .map((item) => item.name);
  const lines = [
    "Unidad Educativa Fiscal Samborondon",
    "Auditoria y Optimizacion de Rendimiento de Equipos",
    "Reporte tecnico individual",
    "",
    `Codigo: ${equipment.code}`,
    `Equipo: ${equipment.name}`,
    `Ubicacion: ${equipment.location}`,
    `CPU: ${equipment.cpu}`,
    `RAM: ${equipment.ram} GB`,
    `Disco: ${equipment.diskType} ${equipment.diskCapacity} GB`,
    `Sistema operativo: ${equipment.os}`,
    `Estado fisico inicial: ${equipment.physicalState}`,
    `Responsable: ${equipment.owner}`,
    `Fecha de revision: ${equipment.reviewDate}`,
    "",
    "Diagnostico inicial",
    `Rendimiento inicial: ${before}%`,
    `Tiempo de encendido: ${diagnosis.bootTime || 0} segundos`,
    `Espacio libre en disco: ${diagnosis.freeSpace || 0}%`,
    `Estado del disco: ${diagnosis.diskHealth || "Sin dato"}`,
    `Antivirus: ${diagnosis.antivirus || "Sin dato"}`,
    `Actualizaciones: ${diagnosis.updates || "Sin dato"}`,
    "",
    "Optimizacion aplicada",
    ...(actions.length ? actions : ["Sin acciones realizadas"]),
    "",
    "Comparacion",
    `Rendimiento despues: ${after}%`,
    `Mejora estimada: ${before ? Math.max(0, Math.round(((after - before) / before) * 100)) : 0}%`,
    `Nivel final: ${getLevel(after)}`,
    `Estado final: ${getResolvedFinalStatus(equipment, after)}`,
    "",
    "Recomendacion tecnica final",
    optimization.technicalRecommendation || getAutomaticRecommendation(equipment) || equipment.initialNotes || "Registrar recomendacion tecnica final."
  ].flatMap((line) => wrapPdfLine(line, 88));

  const content = [
    "BT",
    "/F1 11 Tf",
    "14 TL",
    "50 790 Td",
    ...lines.slice(0, 48).map((line) => `(${escapePdfText(line)}) Tj T*`),
    "ET"
  ].join("\n");
  const pdf = buildSimplePdf(content);
  const blob = new Blob([pdf], { type: "application/pdf" });
  downloadBlob(blob, fileName);
}

function wrapPdfLine(line, maxLength) {
  if (line.length <= maxLength) return [line];
  const words = line.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    if (`${current} ${word}`.trim().length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });
  if (current) lines.push(current);
  return lines;
}

function escapePdfText(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildSimplePdf(content) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openDetail(id) {
  const item = findEquipment(id);
  if (!item) return;
  const diagnosis = item.diagnosis;
  const optimization = item.optimization;
  $("#modalContent").innerHTML = `
    <h2>${escapeHtml(item.code)} - ${escapeHtml(item.name)}</h2>
    <p>${escapeHtml(item.initialNotes || "Sin observaciones iniciales.")}</p>
    <div class="report-grid">
      ${reportBox("Hardware", [["CPU", item.cpu], ["RAM", `${item.ram} GB`], ["Disco", `${item.diskType} ${item.diskCapacity} GB`], ["Sistema", item.os]])}
      ${reportBox("Estado", [["Fisico", item.physicalState], ["Encendido", item.powerState], ["Responsable", item.owner], ["Fecha", item.reviewDate]])}
      ${reportBox("Diagnostico", diagnosis ? [["Rendimiento inicial", `${diagnosis.initialScore}%`], ["Lentitud", diagnosis.slowness], ["Espacio libre", `${diagnosis.freeSpace}%`]] : [["Pendiente", "Sin diagnostico"]])}
      ${reportBox("Optimizacion", optimization ? [["Rendimiento final", `${optimization.finalScore}%`], ["Estado final", getResolvedFinalStatus(item, optimization.finalScore)], ["Recomendacion", optimization.technicalRecommendation || getAutomaticRecommendation(item)]] : [["Pendiente", "Sin optimizacion"]])}
    </div>
  `;
  $("#detailModal").classList.add("open");
  $("#detailModal").setAttribute("aria-hidden", "false");
  refreshIcons();
}

function showConfirm(message, onConfirm) {
  $("#modalContent").innerHTML = `
    <h2>Confirmacion requerida</h2>
    <p>${escapeHtml(message)}</p>
    <div class="form-actions">
      <button class="btn btn-danger" id="confirmYes" type="button"><i data-lucide="check"></i> Confirmar</button>
      <button class="btn btn-soft" type="button" data-action="close-modal"><i data-lucide="x"></i> Cancelar</button>
    </div>
  `;
  $("#detailModal").classList.add("open");
  $("#detailModal").setAttribute("aria-hidden", "false");
  $("#confirmYes").onclick = () => {
    closeModal();
    onConfirm();
  };
  refreshIcons();
}

function closeModal() {
  const modal = $("#detailModal");
  if (modal.contains(document.activeElement)) document.activeElement.blur();
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function exportJson() {
  const payload = createSnapshot("export-json");
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, "auditoria-equipos-samborondon.json");
  toast("Datos exportados en JSON.");
}

function exportCsv() {
  if (!state.equipments.length) {
    toast("No hay equipos para exportar en CSV.", "error");
    return;
  }
  const headers = [
    "Codigo", "Equipo", "Ubicacion", "Marca", "Modelo", "CPU", "RAM GB", "Tipo disco", "Capacidad GB",
    "Sistema operativo", "Estado fisico", "Estado encendido", "Responsable", "Fecha revision",
    "Rendimiento inicial", "Rendimiento final", "Estado final", "Recomendacion"
  ];
  const rows = state.equipments.map((item) => {
    const finalScore = item.optimization?.finalScore || item.diagnosis?.initialScore || 0;
    return [
      item.code,
      item.name,
      item.location,
      item.brand,
      item.model,
      item.cpu,
      item.ram,
      item.diskType,
      item.diskCapacity,
      item.os,
      item.physicalState,
      item.powerState,
      item.owner,
      item.reviewDate,
      item.diagnosis?.initialScore || "",
      item.optimization?.finalScore || "",
      getResolvedFinalStatus(item, finalScore),
      item.optimization?.technicalRecommendation || getAutomaticRecommendation(item) || item.initialNotes || ""
    ];
  });
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  downloadBlob(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }), "auditoria-equipos-samborondon.csv");
  toast("Inventario exportado en CSV.");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      const validation = validateImportPayload(payload);
      if (!validation.valid) throw new Error(validation.message);
      saveAutoBackup("antes-de-importar-json");
      state = payload.state || { equipments: payload.equipments };
      notes = payload.notes || notes;
      gallery = payload.gallery || gallery;
      saveState();
      saveJson(NOTES_KEY, notes);
      saveJson(GALLERY_KEY, gallery);
      hydrateNotes();
      syncAll();
      toast(`Datos importados correctamente. ${validation.count} equipos cargados.`);
    } catch (error) {
      toast(error.message || "El archivo JSON no tiene el formato esperado.", "error");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function validateImportPayload(payload) {
  const equipments = payload.state?.equipments || payload.equipments;
  if (!Array.isArray(equipments)) return { valid: false, message: "El JSON no contiene inventario de equipos." };
  if (equipments.length > 300) return { valid: false, message: "El archivo supera 300 equipos; divide la importacion." };
  const codes = new Set();
  for (const item of equipments) {
    if (!item.code || !item.name || !item.cpu) return { valid: false, message: "Cada equipo debe tener codigo, nombre y CPU." };
    const code = String(item.code).trim().toLowerCase();
    if (codes.has(code)) return { valid: false, message: `Codigo duplicado en importacion: ${item.code}` };
    codes.add(code);
  }
  if (Array.isArray(payload.gallery) && payload.gallery.length > 80) {
    return { valid: false, message: "La galeria importada excede 80 evidencias; reduce el archivo." };
  }
  return { valid: true, count: equipments.length };
}

function confirmClearAll() {
  showConfirm("Limpiar todos los equipos, evidencias y notas guardadas en este navegador?", () => {
    saveAutoBackup("antes-de-limpiar-todo");
    state = { equipments: [] };
    gallery = [];
    notes = {};
    saveState();
    saveJson(GALLERY_KEY, gallery);
    saveJson(NOTES_KEY, notes);
    hydrateNotes();
    syncAll();
    toast("Todos los datos fueron limpiados.");
  });
}

function confirmSeedDemo() {
  showConfirm("Restaurar los tres equipos de ejemplo? Se reemplazara el inventario actual, pero no se borraran las conclusiones ni la galeria.", () => {
    saveAutoBackup("antes-de-restaurar-demo");
    state.equipments = createDemoEquipments();
    saveState();
    syncAll();
    toast("Datos de ejemplo restaurados correctamente.");
  });
}

function exportBackup() {
  const snapshot = createSnapshot("backup-manual");
  saveJson(BACKUP_KEY, snapshot);
  downloadBlob(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }), `respaldo-auditoria-${new Date().toISOString().slice(0, 10)}.json`);
  renderOperationsPanel();
  toast("Copia de seguridad creada y descargada.");
}

function confirmRestoreBackup() {
  const backup = loadJson(BACKUP_KEY, null);
  if (!backup?.state?.equipments) {
    toast("No existe respaldo local para restaurar.", "error");
    return;
  }
  showConfirm(`Restaurar respaldo local del ${new Date(backup.exportedAt).toLocaleString("es-EC")}?`, () => {
    state = backup.state;
    notes = backup.notes || {};
    gallery = backup.gallery || [];
    saveState();
    saveJson(NOTES_KEY, notes);
    saveJson(GALLERY_KEY, gallery);
    hydrateNotes();
    syncAll();
    toast("Respaldo local restaurado correctamente.");
  });
}

function exportProjectPackage() {
  const stats = getStats();
  const quality = getDataQuality(stats);
  const payload = {
    ...createSnapshot("paquete-completo"),
    executiveSummary: buildExecutiveSummary(),
    methodology: {
      hypothesis: "Si se realiza diagnostico tecnico y mantenimiento preventivo, el rendimiento de los equipos antiguos del laboratorio mejora de forma medible.",
      variables: ["Rendimiento inicial", "Rendimiento final", "Tipo de disco", "RAM", "Tiempo de encendido", "Evidencias"],
      quality
    },
    stats
  };
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `paquete-proyecto-auditoria-${new Date().toISOString().slice(0, 10)}.json`);
  toast("Paquete completo del proyecto exportado.");
}

function addGalleryImages(event) {
  const files = [...event.target.files || []].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  let loaded = 0;
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      gallery.unshift({ id: crypto.randomUUID(), name: file.name, src: reader.result, createdAt: new Date().toISOString() });
      loaded += 1;
      if (loaded === files.length) {
        saveJson(GALLERY_KEY, gallery);
        renderGallery();
        toast("Evidencias visuales agregadas a la galeria.");
      }
    };
    reader.readAsDataURL(file);
  });
  event.target.value = "";
}

function renderGallery() {
  $("#galleryGrid").innerHTML = gallery.length ? gallery.map((item) => `
    <article class="gallery-item">
      <img src="${item.src}" alt="${escapeHtml(item.name)}">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <button class="mini-btn" title="Eliminar evidencia" data-row-action="delete-image" data-id="${item.id}"><i data-lucide="trash-2"></i></button>
      </div>
    </article>
  `).join("") : `<div class="panel empty wide">Aun no hay evidencias. Carga fotos del equipo antes, durante o despues del mantenimiento.</div>`;
  refreshIcons();
}

function deleteGalleryImage(id) {
  gallery = gallery.filter((item) => item.id !== id);
  saveJson(GALLERY_KEY, gallery);
  renderGallery();
  toast("Evidencia eliminada.");
}

function hydrateNotes() {
  $$(".autosave-note").forEach((textarea) => {
    textarea.value = notes[textarea.dataset.key] || "";
  });
}

function generateAcademicNotes() {
  const stats = getStats();
  const quality = getDataQuality(stats);
  const worst = [...state.equipments]
    .sort((a, b) => (a.optimization?.finalScore || a.diagnosis?.initialScore || 0) - (b.optimization?.finalScore || b.diagnosis?.initialScore || 0))[0];
  const best = [...state.equipments]
    .sort((a, b) => (b.optimization?.finalScore || b.diagnosis?.initialScore || 0) - (a.optimization?.finalScore || a.diagnosis?.initialScore || 0))[0];

  notes.conclusions = [
    `El proyecto permitio registrar ${stats.total} equipos informaticos del laboratorio de la Unidad Educativa Fiscal Samborondon y medir su estado tecnico mediante indicadores de hardware, software y rendimiento.`,
    stats.avgInitial ? `La comparacion antes/despues muestra un promedio inicial de ${stats.avgInitial}% y un promedio final de ${stats.avgFinal}%, equivalente a una mejora general estimada de ${stats.generalImprovement}%.` : "La medicion cuantitativa queda pendiente hasta completar diagnosticos iniciales en los equipos reales.",
    best ? `El equipo con mejor condicion actual es ${best.code}, lo que demuestra que el mantenimiento preventivo ayuda a conservar equipos funcionales para las practicas academicas.` : "La muestra inicial aun debe ser levantada con equipos reales del laboratorio.",
    `La calidad metodologica actual es ${quality.score}%: ${quality.summary}`
  ].join("\n\n");

  notes.recommendations = [
    stats.ssdUpgrade ? `Priorizar la migracion a SSD en ${stats.ssdUpgrade} equipo(s) con disco HDD para reducir tiempos de arranque y mejorar la respuesta del sistema.` : "Mantener el uso de unidades SSD/NVMe y monitorear su salud periodicamente.",
    stats.ramUpgrade ? `Ampliar la memoria RAM en ${stats.ramUpgrade} equipo(s) con menos de 4 GB para mejorar la ejecucion de aplicaciones educativas.` : "Conservar el estandar de RAM actual y revisar consumo de memoria durante clases practicas.",
    stats.bad ? `Atender ${stats.bad} equipo(s) en mal estado fisico antes de asignarlos a estudiantes.` : "Sostener una rutina mensual de limpieza fisica externa y revision de cables.",
    worst ? `El equipo de mayor prioridad es ${worst.code}: ${getAutomaticRecommendation(worst)}` : "Registrar diagnosticos reales para generar prioridades tecnicas por equipo."
  ].join("\n\n");

  notes.proposals = [
    "Crear una bitacora mensual de mantenimiento preventivo por equipo con responsable, fecha, acciones y evidencia fotografica.",
    "Clasificar los equipos por prioridad: uso inmediato, mantenimiento, actualizacion y reemplazo.",
    "Establecer una meta institucional de mejora minima del 20% en rendimiento estimado para los equipos intervenidos.",
    "Usar este sistema como evidencia digital del proyecto de ciencias y como inventario tecnico permanente del laboratorio."
  ].join("\n\n");

  notes.reflection = [
    "El proyecto fortalece competencias de investigacion aplicada, diagnostico tecnico, analisis de datos y toma de decisiones basada en evidencia.",
    "La experiencia demuestra que la tecnologia educativa no solo depende de equipos nuevos, sino tambien de un mantenimiento organizado, medible y responsable.",
    "Los estudiantes aprenden a convertir problemas reales del laboratorio en datos, graficos, conclusiones y propuestas de mejora."
  ].join("\n\n");

  saveJson(NOTES_KEY, notes);
  hydrateNotes();
  renderInsights();
  toast("Conclusiones academicas generadas desde los resultados actuales.");
  $("#conclusiones")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function copyExecutiveSummary() {
  const summary = buildExecutiveSummary();

  try {
    await navigator.clipboard.writeText(summary);
    toast("Resumen ejecutivo copiado al portapapeles.");
  } catch {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, "resumen-ejecutivo-auditoria.txt");
    toast("No se pudo copiar; se descargo un resumen en TXT.");
  }
}

function buildExecutiveSummary() {
  const stats = getStats();
  const quality = getDataQuality(stats);
  return [
    "Resumen ejecutivo - Proyecto de ciencias UEF Samborondon",
    `Equipos registrados: ${stats.total}`,
    `Diagnosticos completos: ${stats.diagnosed}`,
    `Equipos optimizados: ${stats.optimized}`,
    `Promedio inicial: ${stats.avgInitial}%`,
    `Promedio final: ${stats.avgFinal}%`,
    `Mejora general: ${stats.generalImprovement}%`,
    `Calidad metodologica: ${quality.score}% - ${quality.label}`,
    quality.summary
  ].join("\n");
}

function toggleTheme() {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme();
  renderCharts();
}

function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  document.body.classList.toggle("dark", saved ? saved === "dark" : prefersDark);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

function toast(message, type = "success") {
  const node = document.createElement("div");
  node.className = `toast ${type === "error" ? "error" : type === "warning" ? "warning" : ""}`;
  node.textContent = message;
  $("#toastStack").appendChild(node);
  setTimeout(() => node.remove(), 4200);
}

function findEquipment(id) {
  return state.equipments.find((item) => item.id === id);
}

function average(values) {
  const valid = values.filter((value) => Number(value) > 0);
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + Number(value), 0) / valid.length) : 0;
}

function getLevel(score) {
  if (score >= 82) return "Alto";
  if (score >= 58) return "Medio";
  if (score > 0) return "Bajo";
  return "Sin datos";
}

function getFinalStatus(score) {
  if (score >= 85) return "Optimo";
  if (score >= 68) return "Aceptable";
  if (score >= 42) return "Requiere mantenimiento";
  return "Requiere reemplazo";
}

function getResolvedFinalStatus(equipment, score) {
  const manual = equipment?.optimization?.finalStateManual;
  if (manual && manual !== "Automatico") return manual;
  return getFinalStatus(score);
}

function getAutomaticRecommendation(equipment) {
  if (!equipment) return "";
  const diagnosis = equipment.diagnosis || {};
  const finalScore = equipment.optimization?.finalScore || diagnosis.initialScore || 0;
  const recommendations = [];

  if (equipment.powerState === "No enciende" || equipment.powerState === "Intermitente") {
    recommendations.push("verificar fuente de poder, cables y placa antes de asignarlo a estudiantes");
  }
  if (Number(equipment.ram) < 4) recommendations.push("ampliar memoria RAM como prioridad");
  if (equipment.diskType === "HDD") recommendations.push("migrar a SSD para mejorar arranque y respuesta del sistema");
  if (diagnosis.diskHealth === "Critico") recommendations.push("respaldar informacion y reemplazar el disco");
  if (diagnosis.updates === "Sin soporte" || /windows 7|windows xp/i.test(equipment.os || "")) {
    recommendations.push("actualizar a un sistema operativo con soporte");
  }
  if (diagnosis.antivirus === "No instalado" || diagnosis.antivirus === "Desactualizado") {
    recommendations.push("activar o actualizar antivirus antes del uso regular");
  }
  if (finalScore >= 85 && !recommendations.length) {
    recommendations.push("mantener mantenimiento preventivo periodico y registro de evidencias");
  }

  if (!recommendations.length) return "Realizar mantenimiento preventivo mensual y monitorear rendimiento despues de cada practica.";
  return `Se recomienda ${recommendations.join("; ")}.`;
}

function badge(value) {
  const good = ["Bueno", "Optimo", "Aceptable"];
  const bad = ["Malo", "Requiere reemplazo"];
  const cls = good.includes(value) ? "good" : bad.includes(value) ? "bad" : value === "Pendiente" ? "info" : "warn";
  return `<span class="badge ${cls}">${escapeHtml(value)}</span>`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
    return;
  }
  $$("i[data-lucide]").forEach((icon) => {
    if (!icon.textContent.trim()) icon.textContent = ">";
    icon.setAttribute("aria-hidden", "true");
  });
}
