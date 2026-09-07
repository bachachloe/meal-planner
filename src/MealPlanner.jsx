import { useState, useMemo, useEffect, useRef } from "react";

// ─── Constantes ───────────────────────────────────────────────────────────────

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const CATEGORIES = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation", "Autre"];

const ROWS = [
  { id: "pdj-c",  label: "Petit-déjeuner", labelShort: "P-déj", who: "C",     tag: "chloe",  color: "chloe" },
  { id: "pdj-d",  label: "Petit-déjeuner", labelShort: "P-déj", who: "D",     tag: "denis",  color: "denis" },
  { id: "dej-c",  label: "Déjeuner",       labelShort: "Déj",   who: "C",     tag: "chloe",  color: "chloe" },
  { id: "dej-d",  label: "Déjeuner",       labelShort: "Déj",   who: "D",     tag: "denis",  color: "denis" },
  { id: "quatre", label: "Collation 4h",   labelShort: "4h",    who: "D",     tag: "denis",  color: "denis" },
  { id: "diner",  label: "Dîner",          labelShort: "Dîner", who: "C + D", tag: "shared", color: "shared" },
];

const DEFAULT_RECIPES = [
  { id: "r1",  name: "Granola maison",     category: "Petit-déjeuner", duration: "",       ingredients: "Flocons d'avoine, miel, noix, fruits secs", notes: "" },
  { id: "r2",  name: "Toast avocat",       category: "Petit-déjeuner", duration: "10 min", ingredients: "Pain, avocat, citron, sel", notes: "" },
  { id: "r3",  name: "Porridge",           category: "Petit-déjeuner", duration: "10 min", ingredients: "Flocons d'avoine, lait, banane, miel", notes: "" },
  { id: "r4",  name: "Salade niçoise",     category: "Déjeuner",       duration: "15 min", ingredients: "Salade, thon, œufs, tomates, olives", notes: "" },
  { id: "r5",  name: "Quiche aux légumes", category: "Déjeuner",       duration: "45 min", ingredients: "Pâte brisée, œufs, crème, courgettes, poivrons", notes: "" },
  { id: "r6",  name: "Bowl riz & thon",    category: "Déjeuner",       duration: "15 min", ingredients: "Riz, thon, avocat, concombre, sauce soja", notes: "" },
  { id: "r7",  name: "Soupe & tartines",   category: "Déjeuner",       duration: "20 min", ingredients: "Légumes de saison, pain de campagne", notes: "" },
  { id: "r8",  name: "Poulet rôti",        category: "Dîner",          duration: "1h",     ingredients: "Poulet entier, herbes, ail, citron, huile d'olive", notes: "" },
  { id: "r9",  name: "Pasta arrabiata",    category: "Dîner",          duration: "30 min", ingredients: "Pâtes, tomates, piment, ail, huile d'olive", notes: "" },
  { id: "r10", name: "Tarte flambée",      category: "Dîner",          duration: "40 min", ingredients: "Pâte fine, crème fraîche, lardons, oignons", notes: "" },
  { id: "r11", name: "Poisson vapeur",     category: "Dîner",          duration: "25 min", ingredients: "Filet de poisson, légumes vapeur, citron", notes: "" },
  { id: "r12", name: "Raclette",           category: "Dîner",          duration: "",       ingredients: "Fromage à raclette, pommes de terre, charcuterie", notes: "" },
];

const DEFAULT_MEALS_WEEK = {
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
  "quatre-3": { type: "free", name: "Fromage & pain", detail: "" },
  "dej-c-4":  { type: "free", name: "Soupe & tartines", detail: "" },
};

// ─── localStorage ─────────────────────────────────────────────────────────────

function load(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekKey(offset) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  const jan4 = new Date(monday.getFullYear(), 0, 4);
  const week = Math.ceil(((monday - jan4) / 86400000 + jan4.getDay() + 1) / 7);
  return `${monday.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

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

function fmt(d) { return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }); }
function isToday(d) { return d.toDateString() === new Date().toDateString(); }
function uid() { return "r" + Date.now() + Math.random().toString(36).slice(2, 6); }

function useIsMobile() {
  const [v, setV] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setV(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return v;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const TAG_STYLES  = { chloe: { background: "#EAF3DE", color: "#27500A" }, denis: { background: "#E6F1FB", color: "#0C447C" }, shared: { background: "#FAEEDA", color: "#633806" } };
const CARD_STYLES = { chloe: { background: "#EAF3DE", color: "#27500A" }, denis: { background: "#E6F1FB", color: "#0C447C" }, shared: { background: "#FAEEDA", color: "#633806" } };
const CAT_BG      = { "Petit-déjeuner": "#EAF3DE", "Déjeuner": "#E6F1FB", "Dîner": "#FAEEDA", "Collation": "#F3EAF3", "Autre": "#F0F0F0" };
const CAT_FG      = { "Petit-déjeuner": "#27500A", "Déjeuner": "#0C447C", "Dîner": "#633806", "Collation": "#5A0A7C", "Autre": "#444" };

const inputStyle = {
  width: "100%", padding: "8px 10px",
  border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8,
  fontSize: 13, background: "white", color: "#111",
  outline: "none", boxSizing: "border-box",
};

// ─── Composants de base ───────────────────────────────────────────────────────

function WhoTag({ tag, who }) {
  return (
    <span style={{ ...TAG_STYLES[tag], fontSize: 10, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", padding: "1px 6px", borderRadius: 20, display: "inline-block" }}>
      {who}
    </span>
  );
}

function MealCard({ meal, color, onClick, compact = false }) {
  return (
    <div
      onClick={onClick}
      style={{ ...CARD_STYLES[color], borderRadius: 6, padding: compact ? "3px 5px" : "5px 7px", fontSize: compact ? 11 : 12, lineHeight: 1.3, height: "100%", cursor: "grab", position: "relative", overflow: "hidden", userSelect: "none" }}
    >
      <div style={{ fontWeight: 500, paddingRight: compact ? 0 : 14, whiteSpace: compact ? "nowrap" : "normal", overflow: "hidden", textOverflow: "ellipsis" }}>{meal.name}</div>
      {!compact && meal.detail && <div style={{ fontSize: 11, opacity: 0.75 }}>{meal.detail}</div>}
      {!compact && <span style={{ position: "absolute", top: 3, right: 4, fontSize: 11, opacity: 0.4 }}>✎</span>}
    </div>
  );
}

function AddButton({ label, onClick, compact = false }) {
  return (
    <button aria-label={`Ajouter ${label}`} onClick={onClick} style={{ width: "100%", minHeight: compact ? 28 : 46, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: compact ? 14 : 18, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}>
      +
    </button>
  );
}

// ─── Slot wrapper avec drag & drop desktop + touch mobile ─────────────────────

function Slot({ slotKey, meal, row, dayIndex, compact, onOpen, onMove, dragState, setDragState }) {
  const isDragging = dragState.from === slotKey;
  const isOver     = dragState.over === slotKey && dragState.from !== slotKey;
  const touchRef   = useRef(null);

  // Desktop
  function handleDragStart(e) {
    if (!meal) return;
    e.dataTransfer.effectAllowed = "move";
    setDragState(s => ({ ...s, from: slotKey }));
  }
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragState.over !== slotKey) setDragState(s => ({ ...s, over: slotKey }));
  }
  function handleDrop(e) {
    e.preventDefault();
    if (dragState.from && dragState.from !== slotKey) onMove(dragState.from, slotKey);
    setDragState({ from: null, over: null });
  }
  function handleDragEnd() { setDragState({ from: null, over: null }); }

  // Mobile touch
  function handleTouchStart(e) {
    if (!meal) return;
    touchRef.current = slotKey;
    setDragState(s => ({ ...s, from: slotKey }));
  }
  function handleTouchMove(e) {
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetKey = el?.closest("[data-slotkey]")?.getAttribute("data-slotkey");
    if (targetKey && targetKey !== dragState.over) setDragState(s => ({ ...s, over: targetKey }));
  }
  function handleTouchEnd(e) {
    const target = dragState.over;
    if (touchRef.current && target && touchRef.current !== target) onMove(touchRef.current, target);
    touchRef.current = null;
    setDragState({ from: null, over: null });
  }

  return (
    <div
      data-slotkey={slotKey}
      draggable={!!meal}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        borderTop: "0.5px solid rgba(0,0,0,0.08)",
        borderLeft: "0.5px solid rgba(0,0,0,0.08)",
        borderRight: dayIndex === 6 ? "0.5px solid rgba(0,0,0,0.08)" : "none",
        padding: compact ? 3 : 5,
        minHeight: compact ? 32 : 58,
        opacity: isDragging ? 0.35 : 1,
        background: isOver ? "rgba(0,0,0,0.05)" : "transparent",
        outline: isOver ? "1.5px dashed #bbb" : "none",
        borderRadius: isOver ? 6 : 0,
        transition: "background .1s, outline .1s",
      }}
    >
      {meal
        ? <MealCard meal={meal} color={row.color} compact={compact} onClick={() => { if (!dragState.from) onOpen(row, dayIndex); }} />
        : <AddButton label={`${row.label} ${DAYS[dayIndex]}`} onClick={() => onOpen(row, dayIndex)} compact={compact} />
      }
    </div>
  );
}

// ─── Modal ajout/modif repas ──────────────────────────────────────────────────

function MealModal({ slot, recipes, onSave, onDelete, onClose }) {
  const existing = slot.meal;
  const [tab, setTab] = useState(existing?.type === "free" ? "free" : "recipe");
  const [selectedRecipeId, setSelectedRecipeId] = useState(existing?.type === "recipe" ? existing.recipeId : null);
  const [freeName, setFreeName] = useState(existing?.type === "free" ? existing.name : "");
  const [freeDetail, setFreeDetail] = useState(existing?.type === "free" ? existing.detail : "");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");

  const filtered = useMemo(() =>
    recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) && (filterCat === "Toutes" || r.category === filterCat)),
    [recipes, search, filterCat]
  );

  function handleSave() {
    if (tab === "recipe") { if (!selectedRecipeId) return; onSave({ type: "recipe", recipeId: selectedRecipeId }); }
    else { if (!freeName.trim()) return; onSave({ type: "free", name: freeName.trim(), detail: freeDetail.trim() }); }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 520, margin: "0 auto", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{existing ? "Modifier le repas" : "Ajouter un repas"}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{slot.rowLabel} · {slot.dayLabel} · {slot.who}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#aaa" }}>×</button>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["recipe", "free"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, border: "0.5px solid", borderColor: tab === t ? "transparent" : "rgba(0,0,0,0.15)", background: tab === t ? "#111" : "none", color: tab === t ? "#fff" : "#666", cursor: "pointer" }}>
                {t === "recipe" ? "Depuis une recette" : "Repas libre"}
              </button>
            ))}
          </div>
          {tab === "recipe" && (
            <>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une recette…" style={inputStyle} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Toutes", ...CATEGORIES].map(c => (
                  <button key={c} onClick={() => setFilterCat(c)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "0.5px solid", borderColor: filterCat === c ? "transparent" : "rgba(0,0,0,0.12)", background: filterCat === c ? "#111" : "none", color: filterCat === c ? "#fff" : "#666", cursor: "pointer" }}>{c}</button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 220, overflowY: "auto" }}>
                {filtered.length === 0 && <div style={{ fontSize: 12, color: "#aaa", padding: "8px 10px" }}>Aucune recette trouvée</div>}
                {filtered.map(r => (
                  <div key={r.id} onClick={() => setSelectedRecipeId(r.id)} style={{ padding: "9px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", border: "0.5px solid", borderColor: selectedRecipeId === r.id ? "rgba(0,0,0,0.3)" : "transparent", background: selectedRecipeId === r.id ? "rgba(0,0,0,0.04)" : "none" }}>
                    <div><span style={{ fontWeight: 500 }}>{r.name}</span>{r.duration && <span style={{ fontSize: 11, color: "#aaa", marginLeft: 8 }}>⏱ {r.duration}</span>}</div>
                    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: CAT_BG[r.category] || "#f0f0f0", color: CAT_FG[r.category] || "#444" }}>{r.category}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "free" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div><div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 }}>Nom du repas</div><input type="text" value={freeName} onChange={e => setFreeName(e.target.value)} placeholder="ex. Sandwich maison" style={inputStyle} /></div>
              <div><div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 }}>Note (optionnel)</div><input type="text" value={freeDetail} onChange={e => setFreeDetail(e.target.value)} placeholder="ex. 30 min, sans gluten…" style={inputStyle} /></div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 24px", borderTop: "0.5px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
          {existing ? <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#A32D2D" }}>🗑 Supprimer</button> : <span />}
          <button onClick={handleSave} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "8px 24px", fontSize: 13, cursor: "pointer" }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal création/édition recette ──────────────────────────────────────────

function RecipeModal({ recipe, onSave, onDelete, onClose }) {
  const isEdit = !!recipe;
  const [name, setName]               = useState(recipe?.name || "");
  const [category, setCategory]       = useState(recipe?.category || "Dîner");
  const [duration, setDuration]       = useState(recipe?.duration || "");
  const [ingredients, setIngredients] = useState(recipe?.ingredients || "");
  const [notes, setNotes]             = useState(recipe?.notes || "");

  function handleSave() {
    if (!name.trim()) return;
    onSave({ id: recipe?.id || uid(), name: name.trim(), category, duration: duration.trim(), ingredients: ingredients.trim(), notes: notes.trim() });
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 520, margin: "0 auto", overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{isEdit ? "Modifier la recette" : "Nouvelle recette"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#aaa" }}>×</button>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", flex: 1 }}>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 }}>Nom *</div><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex. Poulet rôti aux herbes" style={inputStyle} /></div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 }}>Catégorie</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "0.5px solid", borderColor: category === c ? "transparent" : "rgba(0,0,0,0.12)", background: category === c ? CAT_BG[c] : "none", color: category === c ? CAT_FG[c] : "#666", fontWeight: category === c ? 500 : 400, cursor: "pointer" }}>{c}</button>
              ))}
            </div>
          </div>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 }}>Durée</div><input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="ex. 30 min, 1h…" style={inputStyle} /></div>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 }}>Ingrédients</div><textarea value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="ex. Poulet, ail, romarin, citron…" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} /></div>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 }}>Notes (optionnel)</div><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conseils, variantes, astuces…" rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 24px", borderTop: "0.5px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
          {isEdit ? <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#A32D2D" }}>🗑 Supprimer</button> : <span />}
          <button onClick={handleSave} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "8px 24px", fontSize: 13, cursor: "pointer" }}>{isEdit ? "Enregistrer" : "Créer la recette"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Page Recettes ────────────────────────────────────────────────────────────

function RecipesPage({ recipes, onCreateRecipe, onEditRecipe }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");

  const filtered = useMemo(() =>
    recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) && (filterCat === "Toutes" || r.category === filterCat)),
    [recipes, search, filterCat]
  );

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une recette…" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={onCreateRecipe} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>+ Nouvelle</button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {["Toutes", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "0.5px solid", borderColor: filterCat === c ? "transparent" : "rgba(0,0,0,0.12)", background: filterCat === c ? "#111" : "none", color: filterCat === c ? "#fff" : "#666", cursor: "pointer" }}>{c}</button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>{filtered.length} recette{filtered.length > 1 ? "s" : ""}</div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
          <div style={{ fontSize: 14 }}>Aucune recette trouvée</div>
          <button onClick={onCreateRecipe} style={{ marginTop: 12, background: "none", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Créer une recette</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(r => (
            <div key={r.id} onClick={() => onEditRecipe(r)} style={{ border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: "12px 16px", cursor: "pointer", background: "#fff" }}
              onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: r.ingredients ? 5 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</span>
                  {r.duration && <span style={{ fontSize: 12, color: "#aaa" }}>⏱ {r.duration}</span>}
                </div>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: CAT_BG[r.category] || "#f0f0f0", color: CAT_FG[r.category] || "#444", flexShrink: 0 }}>{r.category}</span>
              </div>
              {r.ingredients && <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{r.ingredients}</div>}
              {r.notes && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, fontStyle: "italic" }}>{r.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Grille commune (desktop + mobile) ───────────────────────────────────────

function PlanningGrid({ dates, visibleIndexes, getMealDisplay, openModal, compact, dragState, setDragState, onMove }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `${compact ? 72 : 110}px repeat(${visibleIndexes.length}, minmax(0, 1fr))`, gap: 0 }}>
      <div />
      {visibleIndexes.map(i => (
        <div key={i} style={{ textAlign: "center", paddingBottom: compact ? 8 : 10 }}>
          <span style={{ display: "block", fontSize: compact ? 14 : 18, fontWeight: 500, ...(isToday(dates[i]) ? { background: "#111", color: "#fff", borderRadius: "50%", width: compact ? 24 : 28, height: compact ? 24 : 28, lineHeight: compact ? "24px" : "28px", margin: "0 auto 2px" } : { color: "#111", marginBottom: 2 }) }}>
            {dates[i].getDate()}
          </span>
          <span style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.04em" }}>{DAYS[i]}</span>
        </div>
      ))}
      {ROWS.map(row => (
        <>
          <div key={`lbl-${row.id}`} style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", padding: compact ? "6px 4px 6px 0" : "8px 6px 8px 0", display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: compact ? 11 : 12, fontWeight: 500, color: "#111" }}>{compact ? row.labelShort : row.label}</span>
            <WhoTag tag={row.tag} who={row.who} />
          </div>
          {visibleIndexes.map(i => {
            const key = `${row.id}-${i}`;
            return (
              <Slot
                key={key}
                slotKey={key}
                meal={getMealDisplay(key)}
                row={row}
                dayIndex={i}
                compact={compact}
                onOpen={openModal}
                onMove={onMove}
                dragState={dragState}
                setDragState={setDragState}
              />
            );
          })}
        </>
      ))}
    </div>
  );
}

// ─── App principale ───────────────────────────────────────────────────────────

export default function MealPlanner() {
  const [page, setPage]               = useState("planning");
  const [weekOffset, setWeekOffset]   = useState(0);
  const [allMeals, setAllMeals]       = useState(() => load("mp-meals-v2", {}));
  const [recipes, setRecipes]         = useState(() => load("mp-recipes", DEFAULT_RECIPES));
  const [modalSlot, setModalSlot]     = useState(null);
  const [recipeModal, setRecipeModal] = useState(null);
  const [mobileView, setMobileView]   = useState("week");
  const [dayOffset, setDayOffset]     = useState(0);
  const [dragState, setDragState]     = useState({ from: null, over: null });
  const isMobile = useIsMobile();

  const dates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const meals = useMemo(() => {
    const wk = getWeekKey(weekOffset);
    if (allMeals[wk]) return allMeals[wk];
    if (weekOffset === 0 && Object.keys(allMeals).length === 0) return DEFAULT_MEALS_WEEK;
    return {};
  }, [allMeals, weekOffset]);

  function setMeals(updater) {
    const wk = getWeekKey(weekOffset);
    setAllMeals(prev => {
      const current = prev[wk] || (weekOffset === 0 && Object.keys(prev).length === 0 ? DEFAULT_MEALS_WEEK : {});
      const next = typeof updater === "function" ? updater(current) : updater;
      const updated = { ...prev, [wk]: next };
      save("mp-meals-v2", updated);
      return updated;
    });
  }

  function getMealDisplay(key) {
    const m = meals[key];
    if (!m) return null;
    if (m.type === "free") return { name: m.name, detail: m.detail };
    const r = recipes.find(r => r.id === m.recipeId);
    return r ? { name: r.name, detail: r.duration ? r.category + " · " + r.duration : r.category } : null;
  }

  function openModal(row, dayIndex) {
    const key = `${row.id}-${dayIndex}`;
    setModalSlot({ key, rowLabel: row.label, who: row.who, dayLabel: `${DAYS[dayIndex]} ${dates[dayIndex].getDate()}`, meal: meals[key] || null, color: row.color });
  }

  function handleSaveMeal(mealData) {
    setMeals(prev => ({ ...prev, [modalSlot.key]: mealData }));
    setModalSlot(null);
  }

  function handleDeleteMeal() {
    setMeals(prev => { const next = { ...prev }; delete next[modalSlot.key]; return next; });
    setModalSlot(null);
  }

  function handleMove(fromKey, toKey) {
    setMeals(prev => {
      const next = { ...prev };
      if (next[fromKey]) { next[toKey] = next[fromKey]; delete next[fromKey]; }
      else { delete next[toKey]; }
      return next;
    });
  }

  function handleSaveRecipe(recipeData) {
    setRecipes(prev => {
      const exists = prev.find(r => r.id === recipeData.id);
      const next = exists ? prev.map(r => r.id === recipeData.id ? recipeData : r) : [...prev, recipeData];
      save("mp-recipes", next);
      return next;
    });
    setRecipeModal(null);
  }

  function handleDeleteRecipe() {
    const id = recipeModal.id;
    setRecipes(prev => { const next = prev.filter(r => r.id !== id); save("mp-recipes", next); return next; });
    setAllMeals(prev => {
      const updated = {};
      Object.keys(prev).forEach(wk => {
        const wkMeals = { ...prev[wk] };
        Object.keys(wkMeals).forEach(k => { if (wkMeals[k]?.type === "recipe" && wkMeals[k].recipeId === id) delete wkMeals[k]; });
        updated[wk] = wkMeals;
      });
      save("mp-meals-v2", updated);
      return updated;
    });
    setRecipeModal(null);
  }

  const padding = isMobile ? "16px 12px 80px" : "24px 32px 40px";

  const visibleIndexes = isMobile && mobileView === "3days"
    ? [dayOffset, dayOffset + 1, dayOffset + 2].filter(i => i < 7)
    : Array.from({ length: 7 }, (_, i) => i);

  const NAV = [
    { id: "planning", label: "Planning", icon: active => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#111" : "#aaa"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )},
    { id: "recipes", label: "Recettes", icon: active => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#111" : "#aaa"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>
      </svg>
    )},
  ];

  return (
    <>
      {/* Nav mobile en bas */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "0.5px solid rgba(0,0,0,0.1)", display: "flex", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer" }}>
              {n.icon(page === n.id)}
              <span style={{ fontSize: 11, fontWeight: page === n.id ? 600 : 400, color: page === n.id ? "#111" : "#aaa" }}>{n.label}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ padding, fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto" }}>

        {/* Nav desktop en haut */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, borderBottom: "0.5px solid rgba(0,0,0,0.08)", paddingBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>🥗 Meal Planner</span>
            <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.05)", borderRadius: 10, padding: 3 }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 14px", borderRadius: 8, border: "none", background: page === n.id ? "#fff" : "none", color: page === n.id ? "#111" : "#888", fontWeight: page === n.id ? 500 : 400, cursor: "pointer", boxShadow: page === n.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                  {n.icon(page === n.id)}{n.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Planning ── */}
        {page === "planning" && (
          <>
            {/* Header semaine */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>‹</button>
                <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 500 }}>{fmt(dates[0])} – {fmt(dates[6])}</span>
                <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>›</button>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setWeekOffset(0)} style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Aujourd'hui</button>
                <button
                  onClick={() => window.location.reload()}
                  title="Rafraîchir"
                  style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ↺
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Supprimer tous les repas de cette semaine ?")) {
                      setMeals(() => ({}));
                    }
                  }}
                  title="Vider la semaine"
                  style={{ background: "none", border: "0.5px solid rgba(220,50,50,0.3)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", color: "#A32D2D" }}>
                  🗑
                </button>
              </div>
            </div>

            {/* Switcher vue mobile */}
            {isMobile && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {["week", "3days"].map(v => (
                  <button key={v} onClick={() => { setMobileView(v); setDayOffset(0); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "0.5px solid", borderColor: mobileView === v ? "transparent" : "rgba(0,0,0,0.15)", background: mobileView === v ? "#111" : "none", color: mobileView === v ? "#fff" : "#666", cursor: "pointer" }}>
                    {v === "week" ? "Semaine" : "3 jours"}
                  </button>
                ))}
              </div>
            )}

            {/* Navigation 3 jours */}
            {isMobile && mobileView === "3days" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <button onClick={() => setDayOffset(d => Math.max(0, d - 1))} disabled={dayOffset === 0} style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", opacity: dayOffset === 0 ? 0.3 : 1 }}>‹</button>
                <span style={{ fontSize: 13, color: "#888" }}>{DAYS_FULL[visibleIndexes[0]]} – {DAYS_FULL[visibleIndexes[visibleIndexes.length - 1]]}</span>
                <button onClick={() => setDayOffset(d => Math.min(4, d + 1))} disabled={dayOffset >= 4} style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", opacity: dayOffset >= 4 ? 0.3 : 1 }}>›</button>
              </div>
            )}

            {/* Grille */}
            <PlanningGrid
              dates={dates}
              visibleIndexes={visibleIndexes}
              getMealDisplay={getMealDisplay}
              openModal={openModal}
              compact={isMobile && mobileView === "week"}
              dragState={dragState}
              setDragState={setDragState}
              onMove={handleMove}
            />

            {/* Légende */}
            <div style={{ display: "flex", gap: 16, marginTop: 20, paddingTop: 16, borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
              {[{ label: "Chloé", color: "#639922" }, { label: "Denis", color: "#378ADD" }, { label: "Partagé", color: "#BA7517" }].map(({ label, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />{label}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Recettes ── */}
        {page === "recipes" && (
          <RecipesPage recipes={recipes} onCreateRecipe={() => setRecipeModal("new")} onEditRecipe={r => setRecipeModal(r)} />
        )}

        {/* Modales */}
        {modalSlot && <MealModal slot={modalSlot} recipes={recipes} onSave={handleSaveMeal} onDelete={handleDeleteMeal} onClose={() => setModalSlot(null)} />}
        {recipeModal && (
          <RecipeModal
            recipe={recipeModal === "new" ? null : recipeModal}
            onSave={handleSaveRecipe}
            onDelete={recipeModal !== "new" ? handleDeleteRecipe : undefined}
            onClose={() => setRecipeModal(null)}
          />
        )}
      </div>
    </>
  );
}
