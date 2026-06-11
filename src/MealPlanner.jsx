import { useState, useMemo, useEffect } from "react";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const ROWS = [
  { id: "pdj-c",  label: "Petit-déjeuner", labelShort: "P-déj", who: "C",     tag: "chloe",  color: "chloe" },
  { id: "pdj-d",  label: "Petit-déjeuner", labelShort: "P-déj", who: "D",     tag: "denis",  color: "denis" },
  { id: "dej-c",  label: "Déjeuner",       labelShort: "Déj",   who: "C",     tag: "chloe",  color: "chloe" },
  { id: "dej-d",  label: "Déjeuner",       labelShort: "Déj",   who: "D",     tag: "denis",  color: "denis" },
  { id: "quatre", label: "Collation 4h",   labelShort: "4h",    who: "D",     tag: "denis",  color: "denis" },
  { id: "diner",  label: "Dîner",          labelShort: "Dîner", who: "C + D", tag: "shared", color: "shared" },
];

const INITIAL_RECIPES = [
  { id: "r1",  name: "Granola maison",     detail: "Petit-déj" },
  { id: "r2",  name: "Toast avocat",       detail: "Petit-déj" },
  { id: "r3",  name: "Porridge",           detail: "Petit-déj" },
  { id: "r4",  name: "Salade niçoise",     detail: "Déjeuner" },
  { id: "r5",  name: "Quiche aux légumes", detail: "Déjeuner · 45 min" },
  { id: "r6",  name: "Bowl riz & thon",    detail: "Déjeuner · 15 min" },
  { id: "r7",  name: "Soupe & tartines",   detail: "Déjeuner" },
  { id: "r8",  name: "Poulet rôti",        detail: "Dîner · 1h" },
  { id: "r9",  name: "Pasta arrabiata",    detail: "Dîner · 30 min" },
  { id: "r10", name: "Tarte flambée",      detail: "Dîner · 40 min" },
  { id: "r11", name: "Poisson vapeur",     detail: "Dîner · 25 min" },
  { id: "r12", name: "Raclette",           detail: "Dîner" },
];

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadMeals() {
  try {
    const saved = localStorage.getItem("meal-planner-meals");
    return saved ? JSON.parse(saved) : INITIAL_MEALS_DEFAULT;
  } catch { return INITIAL_MEALS_DEFAULT; }
}

function saveMeals(meals) {
  try { localStorage.setItem("meal-planner-meals", JSON.stringify(meals)); } catch {}
}

const INITIAL_MEALS_DEFAULT = {
  "pdj-c-0": { type: "recipe", recipeId: "r1" },
  "pdj-c-2": { type: "recipe", recipeId: "r2" },
  "pdj-d-1": { type: "recipe", recipeId: "r3" },
  "dej-c-0": { type: "recipe", recipeId: "r4" },
  "dej-c-2": { type: "recipe", recipeId: "r5" },
  "dej-d-0": { type: "recipe", recipeId: "r6" },
  "diner-0": { type: "recipe", recipeId: "r8" },
  "diner-1": { type: "recipe", recipeId: "r9" },
  "diner-2": { type: "recipe", recipeId: "r10" },
  "diner-4": { type: "recipe", recipeId: "r11" },
  "diner-6": { type: "recipe", recipeId: "r12" },
  "quatre-1": { type: "free", name: "Fruits & amandes", detail: "" },
  "quatre-3": { type: "free", name: "Fromage & pain",   detail: "" },
  "dej-c-4":  { type: "free", name: "Soupe & tartines", detail: "" },
};

const TAG_STYLES = {
  chloe:  { background: "#EAF3DE", color: "#27500A" },
  denis:  { background: "#E6F1FB", color: "#0C447C" },
  shared: { background: "#FAEEDA", color: "#633806" },
};
const CARD_STYLES = {
  chloe:  { background: "#EAF3DE", color: "#27500A" },
  denis:  { background: "#E6F1FB", color: "#0C447C" },
  shared: { background: "#FAEEDA", color: "#633806" },
};

function getWeekDates(offset) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmt(d) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function isToday(d) {
  return d.toDateString() === new Date().toDateString();
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

// ─── WhoTag ───────────────────────────────────────────────────────────────────

function WhoTag({ tag, who }) {
  return (
    <span style={{
      ...TAG_STYLES[tag],
      fontSize: 10, fontWeight: 500,
      letterSpacing: "0.04em", textTransform: "uppercase",
      padding: "1px 6px", borderRadius: 20, display: "inline-block",
    }}>
      {who}
    </span>
  );
}

// ─── MealCard ─────────────────────────────────────────────────────────────────

function MealCard({ meal, color, onClick, compact = false }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...CARD_STYLES[color],
        borderRadius: 6,
        padding: compact ? "3px 5px" : "5px 7px",
        fontSize: compact ? 11 : 12,
        lineHeight: 1.3,
        height: "100%",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ fontWeight: 500, paddingRight: compact ? 0 : 14, whiteSpace: compact ? "nowrap" : "normal", overflow: "hidden", textOverflow: "ellipsis" }}>
        {meal.name}
      </div>
      {!compact && meal.detail && (
        <div style={{ fontSize: 11, opacity: 0.75 }}>{meal.detail}</div>
      )}
      {!compact && (
        <span style={{ position: "absolute", top: 3, right: 4, fontSize: 11, opacity: 0.5 }}>✎</span>
      )}
    </div>
  );
}

function AddButton({ label, onClick, compact = false }) {
  return (
    <button
      aria-label={`Ajouter ${label}`}
      onClick={onClick}
      style={{
        width: "100%", minHeight: compact ? 28 : 46, height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#ccc", fontSize: compact ? 14 : 18,
        background: "none", border: "none", cursor: "pointer", borderRadius: 6,
      }}
    >
      +
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function MealModal({ slot, recipes, onSave, onDelete, onClose }) {
  const existing = slot.meal;
  const [tab, setTab] = useState(existing?.type === "free" ? "free" : "recipe");
  const [selectedRecipeId, setSelectedRecipeId] = useState(existing?.type === "recipe" ? existing.recipeId : null);
  const [freeName, setFreeName] = useState(existing?.type === "free" ? existing.name : "");
  const [freeDetail, setFreeDetail] = useState(existing?.type === "free" ? existing.detail : "");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [recipes, search]
  );

  function handleSave() {
    if (tab === "recipe") {
      if (!selectedRecipeId) return;
      onSave({ type: "recipe", recipeId: selectedRecipeId });
    } else {
      if (!freeName.trim()) return;
      onSave({ type: "free", name: freeName.trim(), detail: freeDetail.trim() });
    }
  }

  const inputStyle = {
    width: "100%", padding: "8px 10px",
    border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8, fontSize: 13,
    background: "white", color: "#111", outline: "none", boxSizing: "border-box",
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "flex-end",
        zIndex: 100,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: "16px 16px 0 0",
        width: "100%", maxWidth: 480, margin: "0 auto",
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{existing ? "Modifier le repas" : "Ajouter un repas"}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{slot.rowLabel} · {slot.dayLabel} · {slot.who}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#aaa" }}>×</button>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 6 }}>Type</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["recipe", "free"].map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  fontSize: 12, padding: "6px 14px", borderRadius: 8,
                  border: "0.5px solid", borderColor: tab === t ? "transparent" : "rgba(0,0,0,0.15)",
                  background: tab === t ? "#111" : "none",
                  color: tab === t ? "#fff" : "#666", cursor: "pointer",
                }}>
                  {t === "recipe" ? "Depuis une recette" : "Repas libre"}
                </button>
              ))}
            </div>
          </div>

          {tab === "recipe" && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 6 }}>Rechercher une recette</div>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom de la recette…" style={inputStyle} />
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3, maxHeight: 180, overflowY: "auto" }}>
                {filtered.length === 0 && <div style={{ fontSize: 12, color: "#aaa", padding: "8px 10px" }}>Aucune recette trouvée</div>}
                {filtered.map((r) => (
                  <div key={r.id} onClick={() => setSelectedRecipeId(r.id)} style={{
                    padding: "8px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    border: "0.5px solid",
                    borderColor: selectedRecipeId === r.id ? "rgba(0,0,0,0.3)" : "transparent",
                    background: selectedRecipeId === r.id ? "rgba(0,0,0,0.04)" : "none",
                  }}>
                    <span>{r.name}</span>
                    <span style={{ fontSize: 11, color: "#aaa" }}>{r.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "free" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 6 }}>Nom du repas</div>
                <input type="text" value={freeName} onChange={(e) => setFreeName(e.target.value)} placeholder="ex. Sandwich maison" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 6 }}>Note (optionnel)</div>
                <input type="text" value={freeDetail} onChange={(e) => setFreeDetail(e.target.value)} placeholder="ex. 30 min, sans gluten…" style={inputStyle} />
              </div>
            </div>
          )}
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 20px 24px", borderTop: "0.5px solid rgba(0,0,0,0.08)",
        }}>
          {existing ? (
            <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#A32D2D" }}>
              🗑 Supprimer
            </button>
          ) : <span />}
          <button onClick={handleSave} style={{
            background: "#111", color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 24px", fontSize: 13, cursor: "pointer",
          }}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vue semaine condensée (mobile) ──────────────────────────────────────────

function WeekViewCondensed({ dates, meals, recipes, getMealDisplay, openModal, mobileView, setMobileView, dayOffset, setDayOffset }) {
  // 3-day view: show dayOffset, dayOffset+1, dayOffset+2
  const visibleIndexes = mobileView === "3days"
    ? [dayOffset, dayOffset + 1, dayOffset + 2].filter(i => i < 7)
    : Array.from({ length: 7 }, (_, i) => i);

  return (
    <div>
      {/* Vue switcher */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["week", "3days"].map((v) => (
          <button key={v} onClick={() => { setMobileView(v); setDayOffset(0); }} style={{
            fontSize: 12, padding: "5px 12px", borderRadius: 20,
            border: "0.5px solid",
            borderColor: mobileView === v ? "transparent" : "rgba(0,0,0,0.15)",
            background: mobileView === v ? "#111" : "none",
            color: mobileView === v ? "#fff" : "#666",
            cursor: "pointer",
          }}>
            {v === "week" ? "Semaine" : "3 jours"}
          </button>
        ))}
      </div>

      {/* Navigation 3 jours */}
      {mobileView === "3days" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <button onClick={() => setDayOffset(d => Math.max(0, d - 1))} disabled={dayOffset === 0}
            style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", opacity: dayOffset === 0 ? 0.3 : 1 }}>
            ‹
          </button>
          <span style={{ fontSize: 13, color: "#888" }}>
            {DAYS_FULL[visibleIndexes[0]]} – {DAYS_FULL[visibleIndexes[visibleIndexes.length - 1]]}
          </span>
          <button onClick={() => setDayOffset(d => Math.min(4, d + 1))} disabled={dayOffset >= 4}
            style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", opacity: dayOffset >= 4 ? 0.3 : 1 }}>
            ›
          </button>
        </div>
      )}

      {/* Grille */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `72px repeat(${visibleIndexes.length}, minmax(0, 1fr))`,
        gap: 0,
      }}>
        {/* Headers */}
        <div />
        {visibleIndexes.map((i) => (
          <div key={i} style={{ textAlign: "center", paddingBottom: 8 }}>
            <span style={{
              display: "block", fontSize: mobileView === "3days" ? 16 : 14, fontWeight: 500,
              ...(isToday(dates[i]) ? {
                background: "#111", color: "#fff",
                borderRadius: "50%", width: 26, height: 26,
                lineHeight: "26px", margin: "0 auto 2px",
              } : { color: "#111", marginBottom: 2 }),
            }}>
              {dates[i].getDate()}
            </span>
            <span style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {mobileView === "3days" ? DAYS_FULL[i].slice(0, 3) : DAYS[i]}
            </span>
          </div>
        ))}

        {/* Rows */}
        {ROWS.map((row) => (
          <>
            <div key={`lbl-${row.id}`} style={{
              borderTop: "0.5px solid rgba(0,0,0,0.08)",
              padding: "6px 4px 6px 0",
              display: "flex", flexDirection: "column", gap: 2,
            }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#111" }}>{row.labelShort}</span>
              <WhoTag tag={row.tag} who={row.who} />
            </div>

            {visibleIndexes.map((i) => {
              const key = `${row.id}-${i}`;
              const meal = getMealDisplay(key, recipes);
              const compact = mobileView === "week";
              return (
                <div key={key} style={{
                  borderTop: "0.5px solid rgba(0,0,0,0.08)",
                  borderLeft: "0.5px solid rgba(0,0,0,0.08)",
                  borderRight: i === visibleIndexes[visibleIndexes.length - 1] ? "0.5px solid rgba(0,0,0,0.08)" : "none",
                  padding: 3,
                  minHeight: compact ? 32 : 52,
                }}>
                  {meal ? (
                    <MealCard meal={meal} color={row.color} onClick={() => openModal(row, i)} compact={compact} />
                  ) : (
                    <AddButton label={`${row.label} ${DAYS[i]}`} onClick={() => openModal(row, i)} compact={compact} />
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MealPlanner() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [meals, setMeals] = useState(() => loadMeals());
  const [recipes] = useState(INITIAL_RECIPES);
  const [modalSlot, setModalSlot] = useState(null);
  const [mobileView, setMobileView] = useState("week");
  const [dayOffset, setDayOffset] = useState(0);
  const isMobile = useIsMobile();

  const dates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  function getMealDisplay(key) {
    const m = meals[key];
    if (!m) return null;
    if (m.type === "free") return { name: m.name, detail: m.detail };
    const r = recipes.find((r) => r.id === m.recipeId);
    return r ? { name: r.name, detail: r.detail } : null;
  }

  function openModal(row, dayIndex) {
    const key = `${row.id}-${dayIndex}`;
    const d = dates[dayIndex];
    setModalSlot({
      key,
      rowLabel: row.label,
      who: row.who,
      dayLabel: `${DAYS[dayIndex]} ${d.getDate()}`,
      meal: meals[key] || null,
      color: row.color,
    });
  }

  function handleSave(mealData) {
    setMeals((prev) => { const next = { ...prev, [modalSlot.key]: mealData }; saveMeals(next); return next; });
    setModalSlot(null);
  }

  function handleDelete() {
    setMeals((prev) => { const next = { ...prev }; delete next[modalSlot.key]; saveMeals(next); return next; });
    setModalSlot(null);
  }

  const padding = isMobile ? "16px 12px" : "24px 32px";

  return (
    <div style={{ padding, fontFamily: "system-ui, sans-serif", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setWeekOffset((w) => w - 1)}
            style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>
            ‹
          </button>
          <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 500 }}>
            {fmt(dates[0])} – {fmt(dates[6])}
          </span>
          <button onClick={() => setWeekOffset((w) => w + 1)}
            style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>
            ›
          </button>
        </div>
        <button onClick={() => setWeekOffset(0)}
          style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
          Aujourd'hui
        </button>
      </div>

      {/* Grid */}
      {isMobile ? (
        <WeekViewCondensed
          dates={dates}
          meals={meals}
          recipes={recipes}
          getMealDisplay={getMealDisplay}
          openModal={openModal}
          mobileView={mobileView}
          setMobileView={setMobileView}
          dayOffset={dayOffset}
          setDayOffset={setDayOffset}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "110px repeat(7, minmax(0, 1fr))", gap: 0 }}>
          <div />
          {dates.map((d, i) => (
            <div key={i} style={{ textAlign: "center", paddingBottom: 10 }}>
              <span style={{
                display: "block", fontSize: 18, fontWeight: 500,
                ...(isToday(d) ? {
                  background: "#111", color: "#fff",
                  borderRadius: "50%", width: 28, height: 28,
                  lineHeight: "28px", margin: "0 auto 2px",
                } : { color: "#111", marginBottom: 2 }),
              }}>
                {d.getDate()}
              </span>
              <span style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {DAYS[i]}
              </span>
            </div>
          ))}
          {ROWS.map((row) => (
            <>
              <div key={`label-${row.id}`} style={{
                borderTop: "0.5px solid rgba(0,0,0,0.08)",
                padding: "8px 6px 8px 0",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#111" }}>{row.label}</span>
                <WhoTag tag={row.tag} who={row.who} />
              </div>
              {dates.map((_, i) => {
                const key = `${row.id}-${i}`;
                const meal = getMealDisplay(key);
                return (
                  <div key={key} style={{
                    borderTop: "0.5px solid rgba(0,0,0,0.08)",
                    borderLeft: "0.5px solid rgba(0,0,0,0.08)",
                    borderRight: i === 6 ? "0.5px solid rgba(0,0,0,0.08)" : "none",
                    padding: 5, minHeight: 58,
                  }}>
                    {meal ? (
                      <MealCard meal={meal} color={row.color} onClick={() => openModal(row, i)} />
                    ) : (
                      <AddButton label={`${row.label} ${DAYS[i]}`} onClick={() => openModal(row, i)} />
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 20, paddingTop: 16, borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
        {[{ label: "Chloé", color: "#639922" }, { label: "Denis", color: "#378ADD" }, { label: "Partagé", color: "#BA7517" }].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
            {label}
          </div>
        ))}
      </div>

      {modalSlot && (
        <MealModal
          slot={modalSlot}
          recipes={recipes}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModalSlot(null)}
        />
      )}
    </div>
  );
}
