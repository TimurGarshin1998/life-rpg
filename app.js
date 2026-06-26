const STORAGE_KEY = "lifeRpgSaveV3";
const OLD_STORAGE_KEYS = ["lifeRpgSaveV1", "lifeRpgSaveV2"];
const GIST_SETTINGS_KEY = "lifeRpgGistSettingsV1";
const GIST_API = "https://api.github.com/gists";
const DEFAULT_GIST_FILE = "life-rpg-save.json";

const STAT_DEFS = {
  health: { name: "Здоровье", icon: "❤️" },
  strength: { name: "Сила", icon: "💪" },
  endurance: { name: "Выносливость", icon: "🏊" },
  mobility: { name: "Подвижность", icon: "🤸" },
  intellect: { name: "Интеллект", icon: "🧠" },
  recovery: { name: "Восстановление", icon: "😴" }
};

const ENTRY_DEFS = {
  swimming: {
    name: "Плавание",
    unit: "km",
    type: "skill",
    stats: { endurance: 0.75, health: 0.25 },
    formula: "Навык. XP = км × 12.",
    xp: value => value * 12
  },
  pushups: {
    name: "Отжимания",
    unit: "reps",
    type: "skill",
    stats: { strength: 0.6, endurance: 0.25, health: 0.15 },
    formula: "Навык + метрика. XP = повторы / 4.",
    xp: value => value / 4
  },
  pullups: {
    name: "Подтягивания",
    unit: "reps",
    type: "skill",
    stats: { strength: 0.7, endurance: 0.15, health: 0.15 },
    formula: "Навык + метрика. XP = повторы × 2.",
    xp: value => value * 2
  },
  bench: {
    name: "Жим / силовая",
    unit: "kg",
    type: "skill",
    stats: { strength: 0.8, health: 0.2 },
    formula: "Навык. XP = кг / 5. Для MVP считаем рабочий вес или условный объём.",
    xp: value => value / 5
  },
  mobility: {
    name: "Мобильность / ТБС",
    unit: "minutes",
    type: "skill",
    stats: { mobility: 0.75, recovery: 0.25 },
    formula: "Навык. XP = минуты × 1.5.",
    xp: value => value * 1.5
  },
  sleep: {
    name: "Сон",
    unit: "hours",
    type: "skill",
    stats: { recovery: 0.7, health: 0.3 },
    formula: "Навык восстановления. XP = часы × 3, бонус +10 XP за 8–9.5 часов.",
    xp: value => value * 3 + (value >= 8 && value <= 9.5 ? 10 : 0)
  },
  protein: {
    name: "Белок",
    unit: "g",
    type: "skill",
    stats: { health: 0.35, recovery: 0.35, strength: 0.3 },
    formula: "Навык питания. XP = граммы / 8, бонус +10 XP за 130+ г.",
    xp: value => value / 8 + (value >= 130 ? 10 : 0)
  },
  steps: {
    name: "Шаги",
    unit: "steps",
    type: "metric",
    formula: "Метрика. Прямой XP не даёт, но закрывает дейлики и цели."
  },
  walkingDistance: {
    name: "Дистанция ходьбы",
    unit: "km",
    type: "metric",
    formula: "Метрика. Не даёт прямой XP, чтобы не дублировать шаги и активные ккал."
  },
  activeCalories: {
    name: "Активные ккал",
    unit: "kcal",
    type: "metric",
    formula: "Метрика. Не даёт прямой XP, используется для целей активности."
  },
  weight: {
    name: "Вес",
    unit: "kg",
    type: "metric",
    formula: "Метрика наблюдения. Пока не влияет на XP."
  }
};

const SKILL_IDS = Object.keys(ENTRY_DEFS).filter(id => ENTRY_DEFS[id].type === "skill");
const METRIC_IDS = Object.keys(ENTRY_DEFS).filter(id => ENTRY_DEFS[id].type === "metric");

const DAILY_QUESTS = [
  { id: "steps10k", name: "10 000 шагов", metricId: "steps", target: 10000, reward: 20, stats: { health: 0.5, endurance: 0.5 }, description: "Базовая дневная активность" },
  { id: "active500", name: "500 активных ккал", metricId: "activeCalories", target: 500, reward: 25, stats: { endurance: 0.6, health: 0.4 }, description: "Закрыть дневную активность по часам" },
  { id: "protein130", name: "130 г белка", metricId: "protein", target: 130, reward: 25, stats: { strength: 0.4, recovery: 0.4, health: 0.2 }, description: "Защита мышц и восстановление" },
  { id: "sleep8", name: "8 часов сна", metricId: "sleep", target: 8, reward: 20, stats: { recovery: 0.7, health: 0.3 }, description: "Сон как главный бафф восстановления" },
  { id: "mobility10", name: "10 минут мобильности", metricId: "mobility", target: 10, reward: 15, stats: { mobility: 0.8, recovery: 0.2 }, description: "ТБС, грушевидная, спина, суставы" }
];

const ACHIEVEMENTS = [
  { id: "swim_1km", name: "Первый километр", desc: "Проплыть 1 км за тренировку", entryId: "swimming", threshold: 1, reward: 50 },
  { id: "swim_3km", name: "Морской волк I", desc: "Проплыть 3 км за тренировку", entryId: "swimming", threshold: 3, reward: 150 },
  { id: "swim_5km", name: "Морской волк II", desc: "Проплыть 5 км за тренировку", entryId: "swimming", threshold: 5, reward: 300 },
  { id: "pushups_100", name: "Сотня", desc: "100 отжиманий за тренировку", entryId: "pushups", threshold: 100, reward: 150 },
  { id: "pullups_20", name: "Турниковый мастер", desc: "20 подтягиваний за тренировку", entryId: "pullups", threshold: 20, reward: 250 },
  { id: "protein_160", name: "Белковая броня", desc: "160 г белка за день", entryId: "protein", threshold: 160, reward: 100 },
  { id: "sleep_10", name: "Глубокое восстановление", desc: "10 часов сна", entryId: "sleep", threshold: 10, reward: 100 }
];

let calendarView = (() => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
})();

let save = loadSave();
let gistSettings = loadGistSettings();

function requiredXp(level) {
  return Math.round(100 * Math.pow(level, 1.8));
}

function levelFromXp(xp) {
  let level = 1;
  while (xp >= requiredXp(level + 1)) level++;
  return level;
}

function blankSave() {
  const skills = {};
  SKILL_IDS.forEach(id => {
    skills[id] = { xp: 0, level: 1, best: 0, total: 0 };
  });

  return {
    version: 3,
    character: { name: "Tim", xp: 0, level: 1 },
    stats: Object.fromEntries(Object.keys(STAT_DEFS).map(id => [id, 1])),
    statXp: Object.fromEntries(Object.keys(STAT_DEFS).map(id => [id, 0])),
    skills,
    achievements: {},
    daily: {},
    customQuests: [],
    history: []
  };
}

function loadSave() {
  const raw = localStorage.getItem(STORAGE_KEY) || OLD_STORAGE_KEYS.map(k => localStorage.getItem(k)).find(Boolean);
  if (!raw) return blankSave();
  try {
    return migrateSave(JSON.parse(raw));
  } catch {
    return blankSave();
  }
}

function migrateSave(data) {
  const fresh = blankSave();
  const mergedSkills = { ...fresh.skills };
  Object.entries(data.skills || {}).forEach(([id, value]) => {
    if (mergedSkills[id]) mergedSkills[id] = { ...mergedSkills[id], ...value };
  });

  const history = (data.history || []).map(h => {
    const entryId = h.entryId || h.skillId || h.metricId;
    return { ...h, entryId, unit: h.unit || ENTRY_DEFS[entryId]?.unit || h.unit };
  });

  return {
    ...fresh,
    ...data,
    version: 3,
    character: { ...fresh.character, ...(data.character || {}) },
    stats: { ...fresh.stats, ...(data.stats || {}) },
    statXp: { ...fresh.statXp, ...(data.statXp || {}) },
    skills: mergedSkills,
    achievements: { ...fresh.achievements, ...(data.achievements || {}) },
    daily: { ...fresh.daily, ...(data.daily || {}) },
    customQuests: data.customQuests || [],
    history
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save, null, 2));
}

function loadGistSettings() {
  try {
    return { fileName: DEFAULT_GIST_FILE, rememberToken: false, ...JSON.parse(localStorage.getItem(GIST_SETTINGS_KEY) || "{}") };
  } catch {
    return { fileName: DEFAULT_GIST_FILE, rememberToken: false };
  }
}

function persistGistSettings() {
  const settings = {
    gistId: document.getElementById("gistIdInput")?.value.trim() || "",
    fileName: document.getElementById("gistFileInput")?.value.trim() || DEFAULT_GIST_FILE,
    rememberToken: !!document.getElementById("rememberTokenInput")?.checked
  };
  if (settings.rememberToken) settings.token = document.getElementById("gistTokenInput")?.value.trim() || "";
  gistSettings = settings;
  localStorage.setItem(GIST_SETTINGS_KEY, JSON.stringify(settings));
}

function pad2(value) { return String(value).padStart(2, "0"); }
function formatLocalDate(date) { return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`; }
function today() { return formatLocalDate(new Date()); }

function unitLabel(unit) {
  const labels = { km: "км", reps: "повторы", kg: "кг", hours: "часы", g: "граммы", kcal: "ккал", minutes: "минуты", steps: "шаги" };
  return labels[unit] || unit;
}

function getEntryDef(entryId) { return ENTRY_DEFS[entryId]; }
function isSkill(entryId) { return getEntryDef(entryId)?.type === "skill"; }
function isMetric(entryId) { return getEntryDef(entryId)?.type === "metric"; }

function addCharacterXp(xp, statWeights = {}, statMultiplier = 1) {
  if (!xp || xp <= 0) return;
  save.character.xp += xp;
  save.character.level = levelFromXp(save.character.xp);
  Object.entries(statWeights || {}).forEach(([stat, weight]) => {
    save.statXp[stat] += xp * weight * statMultiplier;
    save.stats[stat] = levelFromXp(save.statXp[stat]);
  });
}

function addXpToSkill(entryId, xp, value) {
  if (!isSkill(entryId)) return;
  const skill = save.skills[entryId];
  const def = getEntryDef(entryId);
  skill.xp += xp;
  skill.total += value;
  skill.best = Math.max(skill.best || 0, value);
  skill.level = levelFromXp(skill.xp);
  addCharacterXp(xp, def.stats, 1);
}

function awardAchievement(ach) {
  if (save.achievements[ach.id]) return;
  save.achievements[ach.id] = { unlockedAt: new Date().toISOString(), reward: ach.reward };
  const def = getEntryDef(ach.entryId);
  addCharacterXp(ach.reward, def?.stats || {}, 0.35);
  addHistory({ date: today(), type: "achievement", name: ach.name, xp: ach.reward, note: "Достижение открыто" });
}

function checkAchievements(entryId) {
  if (!isSkill(entryId)) return;
  const skill = save.skills[entryId];
  ACHIEVEMENTS.filter(a => a.entryId === entryId).forEach(a => {
    if ((skill.best || 0) >= a.threshold) awardAchievement(a);
  });
}

function addHistory(entry) {
  save.history.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    createdAt: new Date().toISOString(),
    ...entry
  });
  save.history = save.history.slice(0, 300);
}

function dayEntries(date) {
  return save.history.filter(h => h.date === date && ["entry", "activity"].includes(h.type));
}

function dailyTotals(date) {
  const totals = {};
  dayEntries(date).forEach(h => {
    const id = h.entryId || h.skillId || h.metricId;
    if (!id) return;
    totals[id] = (totals[id] || 0) + Number(h.value || 0);
  });
  return totals;
}

function dayBaseXpForEntry(date, entryId) {
  return dayEntries(date)
    .filter(h => (h.entryId || h.skillId || h.metricId) === entryId)
    .reduce((sum, h) => sum + Number(h.baseXp ?? h.xp ?? 0), 0);
}

function completeStandardDaily(date, quest, total) {
  save.daily[date] ||= {};
  if (save.daily[date][quest.id]) return;
  save.daily[date][quest.id] = { done: true, reward: quest.reward, completedAt: new Date().toISOString(), total };
  addCharacterXp(quest.reward, quest.stats, 1);
  addHistory({ date, type: "daily", name: quest.name, xp: quest.reward, note: `Автозакрыто: ${total} / ${quest.target} ${unitLabel(ENTRY_DEFS[quest.metricId].unit)}` });
}

function completeCustomDaily(date, quest, total) {
  save.daily[date] ||= {};
  if (save.daily[date][quest.id]) return;
  const baseXp = dayBaseXpForEntry(date, quest.metricId);
  const bonus = Math.max(1, Math.round(baseXp * (quest.bonusPercent / 100)));
  const def = getEntryDef(quest.metricId);
  save.daily[date][quest.id] = { done: true, reward: bonus, completedAt: new Date().toISOString(), total };
  addCharacterXp(bonus, def?.stats || {}, 0.6);
  addHistory({ date, type: "customDaily", name: quest.name, xp: bonus, note: `Бонус ${quest.bonusPercent}%: ${total} / ${quest.target} ${unitLabel(def.unit)}` });
}

function evaluateDailies(date) {
  const totals = dailyTotals(date);
  DAILY_QUESTS.forEach(q => {
    const total = totals[q.metricId] || 0;
    if (total >= q.target) completeStandardDaily(date, q, total);
  });
  save.customQuests.filter(q => q.active !== false).forEach(q => {
    const total = totals[q.metricId] || 0;
    if (total >= q.target) completeCustomDaily(date, q, total);
  });
}

function activityCountByDate(date) {
  const historyCount = save.history.filter(h => h.date === date).length;
  const dailyCount = save.daily[date] ? Object.keys(save.daily[date]).length : 0;
  return historyCount + dailyCount;
}

function enforceTodayOnly() {
  const input = document.getElementById("activityDate");
  if (!input) return;
  const current = today();
  input.min = current;
  input.max = current;
  if (input.value !== current) input.value = current;
}

function render() {
  enforceTodayOnly();
  renderCloudSettings();
  renderCalendar();
  document.getElementById("characterName").value = save.character.name;
  document.getElementById("charLevel").textContent = save.character.level;

  const currentLevelXp = requiredXp(save.character.level);
  const nextLevelXp = requiredXp(save.character.level + 1);
  const intoLevel = save.character.xp - currentLevelXp;
  const need = nextLevelXp - currentLevelXp;
  const pct = Math.max(0, Math.min(100, (intoLevel / need) * 100));

  document.getElementById("charXpText").textContent = `${Math.round(save.character.xp)} XP · до уровня ${save.character.level + 1}: ${Math.max(0, Math.round(nextLevelXp - save.character.xp))} XP`;
  document.getElementById("charXpBar").style.width = `${pct}%`;

  renderStats();
  renderSkills();
  renderMetrics();
  renderDailyQuests();
  renderAchievements();
  renderHistory();
}

function renderStats() {
  const root = document.getElementById("statsGrid");
  root.innerHTML = "";
  Object.entries(STAT_DEFS).forEach(([id, def]) => {
    const level = save.stats[id] || 1;
    const xp = save.statXp[id] || 0;
    const next = requiredXp(level + 1);
    const current = requiredXp(level);
    const remaining = Math.max(0, Math.round(next - xp));
    const pct = Math.max(0, Math.min(100, ((xp - current) / (next - current)) * 100));
    root.insertAdjacentHTML("beforeend", `
      <div class="stat-card" title="До уровня ${level + 1}: ${remaining} XP">
        <div>${def.icon} ${def.name}</div>
        <strong>${level}</strong>
        <small>${Math.round(xp)} XP · осталось: ${remaining}</small>
        <div class="bar"><div style="width:${pct}%"></div></div>
      </div>
    `);
  });
}

function renderSkills() {
  const root = document.getElementById("skillsList");
  root.innerHTML = "";
  SKILL_IDS.forEach(id => {
    const def = getEntryDef(id);
    const skill = save.skills[id] || { xp: 0, level: 1, best: 0, total: 0 };
    const next = requiredXp(skill.level + 1);
    const current = requiredXp(skill.level);
    const pct = Math.max(0, Math.min(100, ((skill.xp - current) / (next - current)) * 100));
    const stats = Object.keys(def.stats || {}).map(s => STAT_DEFS[s].name).join(", ");
    root.insertAdjacentHTML("beforeend", `
      <div class="skill-card">
        <div class="skill-head">
          <div><h3>${def.name}</h3><small>Влияет: ${stats || "—"}</small></div>
          <span class="badge">LVL ${skill.level}</span>
        </div>
        <div class="bar"><div style="width:${pct}%"></div></div>
        <small>XP: ${Math.round(skill.xp)} · лучший результат: ${skill.best || 0} ${unitLabel(def.unit)} · всего: ${Math.round(skill.total || 0)}</small>
      </div>
    `);
  });
}

function renderMetrics() {
  const root = document.getElementById("metricsList");
  const date = today();
  const totals = dailyTotals(date);
  root.innerHTML = "";
  Object.entries(ENTRY_DEFS).forEach(([id, def]) => {
    const total = totals[id] || 0;
    root.insertAdjacentHTML("beforeend", `
      <div class="metric-card ${def.type === "skill" ? "metric-from-skill" : ""}">
        <strong>${def.name}</strong>
        <span>${Math.round(total * 100) / 100} ${unitLabel(def.unit)}</span>
        <small>${def.type === "skill" ? "Навык + метрика" : "Метрика без прямого XP"}</small>
      </div>
    `);
  });
}

function renderCalendar() {
  const root = document.getElementById("calendarGrid");
  if (!root) return;
  const todayValue = today();
  const selectedDate = document.getElementById("activityDate")?.value || todayValue;
  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const { year, month } = calendarView;
  document.getElementById("calendarMonthLabel").textContent = `${monthNames[month]} ${year}`;
  document.getElementById("calendarSummary").textContent = `${monthNames[month]} ${year}`;

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  let daysHtml = weekDays.map(day => `<span class="calendar-weekday">${day}</span>`).join("");
  for (let i = 0; i < offset; i++) daysHtml += `<span class="calendar-day empty"></span>`;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateValue = formatLocalDate(new Date(year, month, day));
    const count = activityCountByDate(dateValue);
    const isToday = dateValue === todayValue;
    const isSelected = dateValue === selectedDate;
    const disabled = !isToday;
    daysHtml += `
      <button class="calendar-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${count ? "has-data" : ""}" data-date="${dateValue}" title="${dateValue}: ${count ? count + " записей" : "нет записей"}" ${disabled ? "disabled" : ""}>
        ${day}${count ? `<small>${count}</small>` : ""}
      </button>
    `;
  }
  root.innerHTML = `<div class="month-card"><div class="month-days">${daysHtml}</div></div>`;
  root.querySelectorAll("button.calendar-day:not(:disabled)").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("activityDate").value = btn.dataset.date;
      render();
      document.getElementById("addActivityPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function questProgressHtml(metricId, target, total) {
  const unit = unitLabel(getEntryDef(metricId).unit);
  const pct = Math.max(0, Math.min(100, (total / target) * 100));
  return `<small>${Math.round(total * 100) / 100} / ${target} ${unit}</small><div class="bar"><div style="width:${pct}%"></div></div>`;
}

function renderDailyQuests() {
  const root = document.getElementById("dailyQuests");
  const date = today();
  const totals = dailyTotals(date);
  root.innerHTML = "";

  DAILY_QUESTS.forEach(q => {
    const total = totals[q.metricId] || 0;
    const done = !!save.daily[date]?.[q.id];
    root.insertAdjacentHTML("beforeend", `
      <div class="quest-card">
        <div class="quest-head">
          <div><strong>${q.name}</strong><p>${q.description}</p>${questProgressHtml(q.metricId, q.target, total)}</div>
          <span class="badge ${done ? "done" : ""}">${done ? "Готово" : "+" + q.reward + " XP"}</span>
        </div>
      </div>
    `);
  });

  save.customQuests.forEach(q => {
    const total = totals[q.metricId] || 0;
    const done = !!save.daily[date]?.[q.id];
    const def = getEntryDef(q.metricId);
    root.insertAdjacentHTML("beforeend", `
      <div class="quest-card custom">
        <div class="quest-head">
          <div><strong>${q.name}</strong><p>Кастомная цель: ${def.name}</p>${questProgressHtml(q.metricId, q.target, total)}</div>
          <span class="badge ${done ? "done" : ""}">${done ? "Готово" : "+" + q.bonusPercent + "% XP"}</span>
        </div>
      </div>
    `);
  });
}

function renderAchievements() {
  const root = document.getElementById("achievementsList");
  root.innerHTML = "";
  ACHIEVEMENTS.forEach(a => {
    const unlocked = !!save.achievements[a.id];
    root.insertAdjacentHTML("beforeend", `
      <div class="achievement-card">
        <div class="achievement-head">
          <div><strong>${a.name}</strong><p>${a.desc}</p></div>
          <span class="badge ${unlocked ? "done" : "locked"}">${unlocked ? "Открыто" : "Закрыто"}</span>
        </div>
        <small>Награда: ${a.reward} XP</small>
      </div>
    `);
  });
}

function renderHistory() {
  const root = document.getElementById("historyList");
  root.innerHTML = "";
  if (!save.history.length) {
    root.innerHTML = `<p class="hint">История пока пустая.</p>`;
    return;
  }
  save.history.forEach(h => {
    const valueText = h.value ? `${h.value} ${unitLabel(h.unit || getEntryDef(h.entryId)?.unit || "")}` : "";
    const xp = Number(h.xp || 0);
    root.insertAdjacentHTML("beforeend", `
      <div class="history-item">
        <strong>${h.date || "—"}</strong>
        <div>${h.name}<br><em>${valueText} ${h.note || ""}</em></div>
        <span class="badge ${xp > 0 ? "" : "locked"}">${xp > 0 ? "+" + Math.round(xp) + " XP" : "метрика"}</span>
      </div>
    `);
  });
}

function populateEntrySelects() {
  const entrySelect = document.getElementById("entrySelect");
  const questSelect = document.getElementById("customQuestMetric");
  entrySelect.innerHTML = "";
  questSelect.innerHTML = "";

  const groups = [
    ["Навыки — дают XP", SKILL_IDS],
    ["Метрики — без прямого XP", METRIC_IDS]
  ];
  groups.forEach(([label, ids]) => {
    const group = document.createElement("optgroup");
    group.label = label;
    ids.forEach(id => group.insertAdjacentHTML("beforeend", `<option value="${id}">${ENTRY_DEFS[id].name}</option>`));
    entrySelect.appendChild(group);
  });
  Object.entries(ENTRY_DEFS).forEach(([id, def]) => questSelect.insertAdjacentHTML("beforeend", `<option value="${id}">${def.name}</option>`));
}

function syncEntryUnit() {
  const entryId = document.getElementById("entrySelect").value;
  const def = getEntryDef(entryId);
  document.getElementById("entryUnit").value = unitLabel(def.unit);
  document.getElementById("formulaHint").textContent = def.formula;
}

function syncCustomQuestUnit() {
  const entryId = document.getElementById("customQuestMetric").value;
  const def = getEntryDef(entryId);
  document.getElementById("customQuestUnit").value = unitLabel(def.unit);
}

function addEntry() {
  const date = document.getElementById("activityDate").value || today();
  const entryId = document.getElementById("entrySelect").value;
  const value = Number(document.getElementById("entryValue").value);
  const note = document.getElementById("entryNote").value.trim();
  const def = getEntryDef(entryId);
  if (date !== today()) return alert("Редактировать можно только текущую системную дату.");
  if (!value || value <= 0) return alert("Введи значение больше 0.");

  const baseXp = isSkill(entryId) ? Math.max(1, def.xp(value)) : 0;
  if (baseXp > 0) {
    addXpToSkill(entryId, baseXp, value);
    checkAchievements(entryId);
  }

  addHistory({ date, type: "entry", entryId, name: def.name, value, unit: def.unit, xp: baseXp, baseXp, note });
  evaluateDailies(date);

  document.getElementById("entryValue").value = "";
  document.getElementById("entryNote").value = "";
  persist();
  render();
}

function createCustomQuest() {
  const name = document.getElementById("customQuestName").value.trim();
  const metricId = document.getElementById("customQuestMetric").value;
  const target = Number(document.getElementById("customQuestTarget").value);
  const bonusPercent = Math.max(1, Math.min(25, Number(document.getElementById("customQuestBonus").value || 10)));
  if (!name) return alert("Введи название кастомного дейлика.");
  if (!target || target <= 0) return alert("Введи цель больше 0.");

  save.customQuests.push({
    id: `custom_${Date.now()}`,
    name,
    metricId,
    target,
    bonusPercent,
    active: true,
    createdAt: new Date().toISOString()
  });
  evaluateDailies(today());
  persist();
  render();
  document.getElementById("customQuestName").value = "";
  document.getElementById("customQuestTarget").value = "";
}

function exportJson() {
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `life-rpg-save-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      save = migrateSave(JSON.parse(reader.result));
      persist();
      render();
      alert("Сохранение импортировано.");
    } catch {
      alert("Не удалось прочитать JSON.");
    }
  };
  reader.readAsText(file);
}

function renderCloudSettings() {
  const gistId = document.getElementById("gistIdInput");
  if (!gistId) return;
  gistId.value = gistSettings.gistId || "";
  document.getElementById("gistFileInput").value = gistSettings.fileName || DEFAULT_GIST_FILE;
  document.getElementById("rememberTokenInput").checked = !!gistSettings.rememberToken;
  if (gistSettings.rememberToken && gistSettings.token) document.getElementById("gistTokenInput").value = gistSettings.token;
}

function getCloudConfig() {
  persistGistSettings();
  const gistId = document.getElementById("gistIdInput").value.trim();
  const fileName = document.getElementById("gistFileInput").value.trim() || DEFAULT_GIST_FILE;
  const token = document.getElementById("gistTokenInput").value.trim();
  if (!token) throw new Error("Укажи GitHub token.");
  return { gistId, fileName, token };
}

function setCloudStatus(text, isError = false) {
  const el = document.getElementById("cloudStatus");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", isError);
}

async function githubFetch(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = payload?.message || response.statusText || "GitHub API error";
    throw new Error(`${response.status}: ${message}`);
  }
  return payload;
}

async function createGist() {
  try {
    const { fileName, token } = getCloudConfig();
    setCloudStatus("Создаю secret Gist...");
    const payload = await githubFetch(GIST_API, token, {
      method: "POST",
      body: JSON.stringify({
        description: "Life RPG save",
        public: false,
        files: { [fileName]: { content: JSON.stringify(save, null, 2) } }
      })
    });
    document.getElementById("gistIdInput").value = payload.id;
    persistGistSettings();
    setCloudStatus(`Gist создан: ${payload.id}. Сохранение загружено.`);
  } catch (error) {
    setCloudStatus(`Ошибка создания Gist: ${error.message}`, true);
  }
}

async function saveToGist() {
  try {
    const { gistId, fileName, token } = getCloudConfig();
    if (!gistId) throw new Error("Укажи Gist ID или сначала создай Gist.");
    setCloudStatus("Сохраняю в Gist...");
    await githubFetch(`${GIST_API}/${gistId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ files: { [fileName]: { content: JSON.stringify(save, null, 2) } } })
    });
    setCloudStatus(`Сохранено в Gist: ${new Date().toLocaleString()}`);
  } catch (error) {
    setCloudStatus(`Ошибка сохранения: ${error.message}`, true);
  }
}

async function loadFromGist() {
  try {
    const { gistId, fileName, token } = getCloudConfig();
    if (!gistId) throw new Error("Укажи Gist ID.");
    if (!confirm("Загрузить данные из Gist? Локальное сохранение будет заменено.")) return;
    setCloudStatus("Загружаю из Gist...");
    const payload = await githubFetch(`${GIST_API}/${gistId}`, token);
    const file = payload.files?.[fileName] || Object.values(payload.files || {}).find(f => f.filename === fileName);
    if (!file?.content) throw new Error(`В Gist не найден файл ${fileName}.`);
    save = migrateSave(JSON.parse(file.content));
    persist();
    render();
    setCloudStatus(`Загружено из Gist: ${new Date().toLocaleString()}`);
  } catch (error) {
    setCloudStatus(`Ошибка загрузки: ${error.message}`, true);
  }
}

function attachCloudButtons() {
  document.getElementById("cloudLoadBtn").addEventListener("click", loadFromGist);
  document.getElementById("cloudSaveBtn").addEventListener("click", saveToGist);
  document.getElementById("cloudLoadBtn2").addEventListener("click", loadFromGist);
  document.getElementById("cloudSaveBtn2").addEventListener("click", saveToGist);
  document.getElementById("cloudCreateBtn").addEventListener("click", createGist);
  ["gistIdInput", "gistFileInput", "gistTokenInput", "rememberTokenInput"].forEach(id => {
    document.getElementById(id).addEventListener("change", persistGistSettings);
  });
}

function attachCalendarButtons() {
  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    calendarView.month -= 1;
    if (calendarView.month < 0) { calendarView.month = 11; calendarView.year -= 1; }
    renderCalendar();
  });
  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    calendarView.month += 1;
    if (calendarView.month > 11) { calendarView.month = 0; calendarView.year += 1; }
    renderCalendar();
  });
  document.getElementById("goTodayBtn").addEventListener("click", () => {
    const now = new Date();
    calendarView = { year: now.getFullYear(), month: now.getMonth() };
    renderCalendar();
  });
}


function initCompactHeader() {
  const compactAt = 90;
  const update = () => {
    document.body.classList.toggle("header-compact", window.scrollY > compactAt);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  initCompactHeader();
  populateEntrySelects();
  enforceTodayOnly();
  syncEntryUnit();
  syncCustomQuestUnit();
  render();

  document.getElementById("characterName").addEventListener("input", e => {
    save.character.name = e.target.value || "Tim";
    persist();
  });
  document.getElementById("entrySelect").addEventListener("change", syncEntryUnit);
  document.getElementById("customQuestMetric").addEventListener("change", syncCustomQuestUnit);
  document.getElementById("addEntryBtn").addEventListener("click", addEntry);
  document.getElementById("createCustomQuestBtn").addEventListener("click", createCustomQuest);
  document.getElementById("exportBtn").addEventListener("click", exportJson);
  document.getElementById("importInput").addEventListener("change", e => { if (e.target.files?.[0]) importJson(e.target.files[0]); });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Точно сбросить весь прогресс?")) return;
    save = blankSave();
    persist();
    render();
  });
  document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    if (!confirm("Очистить историю? XP и уровни сохранятся.")) return;
    save.history = [];
    persist();
    render();
  });
  document.getElementById("activityDate").addEventListener("change", () => { enforceTodayOnly(); render(); });
  attachCalendarButtons();
  attachCloudButtons();
});
