import { useState, useMemo, useEffect } from "react";

// ─── Constantes ───────────────────────────────────────────────────────────────

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

const CATEGORIES = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation", "Autre"];

const DEFAULT_RECIPES = [
  { id: "r1",  name: "Granola maison",     detail: "Petit-déj",         category: "Petit-déjeuner", duration: "",     ingredients: "Flocons d'avoine, miel, noix, fruits secs" },
  { id: "r2",  name: "Toast avocat",       detail: "Petit-déj",         category: "Petit-déjeuner", duration: "10 min", ingredients: "Pain, avocat, citron, sel" },
  { id: "r3",  name: "Porridge",           detail: "Petit-déj",         category: "Petit-déjeuner", duration: "10 min", ingredients: "Flocons d'avoine, lait, banane, miel" },
  { id: "r4",  name: "Salade niçoise",     detail: "Déjeuner",          category: "Déjeuner",       duration: "15 min", ingredients: "Salade, thon, œufs, tomates, olives, anchois" },
  { id: "r5",  name: "Quiche aux légumes", detail: "Déjeuner · 45 min", category: "Déjeuner",       duration: "45 min", ingredients: "Pâte brisée, œufs, crème, courgettes, poivrons" },
  { id: "r6",  name: "Bowl riz & thon",    detail: "Déjeuner · 15 min", category: "Déjeuner",       duration: "15 min", ingredients: "Riz, thon, avocat, concombre, sauce soja" },
  { id: "r7",  name: "Soupe & tartines",   detail: "Déjeuner",          category: "Déjeuner",       duration: "20 min", ingredients: "Légumes de saison, pain de campagne" },
  { id: "r8",  name: "Poulet rôti",        detail: "Dîner · 1h",        category: "Dîner",          duration: "1h",     ingredients: "Poulet entier, herbes, ail, citron, huile d'olive" },
  { id: "r9",  name: "Pasta arrabiata",    detail: "Dîner · 30 min",    category: "Dîner",          duration: "30 min", ingredients: "Pâtes, tomates, piment, ail, huile d'olive" },
  { id: "r10", name: "Tarte flambée",      detail: "Dîner · 40 min",    category: "Dîner",          duration: "40 min", ingredients: "Pâte fine, crème fraîche, lardons, oignons" },
  { id: "r11", name: "Poisson vapeur",     detail: "Dîner · 25 min",    category: "Dîner",          duration: "25 min", ingredients: "Filet de poisson, légumes vapeur, citron" },
  { id: "r12", name: "Raclette",           detail: "Dîner",             category: "Dîner",          duration: "",       ingredients: "Fromage à raclette, pommes de terre, charcuterie" },
];

const DEFAULT_MEALS = {
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

// ─── localStorage ─────────────────────────────────────────────────────────────

function load(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDates(offset) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}
function fmt(d) { return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }); }
function isToday(d) { return d.toDateString() === new Date().toDateString(); }
function useIsMobile() {
  const [v, setV] = useState(window.innerWidth < 640);
  useEffect(() => { const fn = () => setV(window.innerWidth < 640); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  return v;
}
function uid() { return "r" + Date.now() + Math.random().toString(36).slice(2, 6); }

// ─── Styles ───────────────────────────────────────────────────────────────────

const TAG_STYLES  = { chloe: { background: "#EAF3DE", color: "#27500A" }, denis: { background: "#E6F1FB", color: "#0C447C" }, shared: { background: "#FAEEDA", color: "#633806" } };
const CARD_STYLES = { chloe: { background: "#EAF3DE", color: "#27500A" }, denis: { background: "#E6F1FB", color: "#0C447C" }, shared: { background: "#FAEEDA", color: "#633806" } };
const CAT_COLORS  = { "Petit-déjeuner": "#EAF3DE", "Déjeuner": "#E6F1FB", "Dîner": "#FAEEDA", "Collation": "#F3EAF3", "Autre": "#F0F0F0" };
const CAT_TEXT    = { "Petit-déjeuner": "#27500A", "Déjeuner": "#0C447C", "Dîner": "#633806", "Collation": "#5A0A7C", "Autre": "#444" };

const inputStyle = { width: "100%", padding: "8px 10px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8, fontSize: 13, background: "white", color: "#111", outline: "none", boxSizing: "border-box" };

// ─── Composants de base ───────────────────────────────────────────────────────

function WhoTag({ tag, who }) {
  return <span style={{ ...TAG_STYLES[tag], fontSize: 10, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", padding: "1px 6px", borderRadius: 20, display: "inline-block" }}>{who}</span>;
}

function MealCard({ meal, color, onClick, compact = false }) {
  return (
    <div onClick={onClick} style={{ ...CARD_STYLES[color], borderRadius: 6, padding: compact ? "3px 5px" : "5px 7px", fontSize: compact ? 11 : 12, lineHeight: 1.3, height: "100%", cursor: "pointer", position: "relative", overflow: "hidden" }}>
      <div style={{ fontWeight: 500, paddingRight: compact ? 0 : 14, whiteSpace: compact ? "nowrap" : "normal", overflow: "hidden", textOverflow: "ellipsis" }}>{meal.name}</div>
      {!compact && meal.detail && <div style={{ fontSize: 11, opacity: 0.75 }}>{meal.detail}</div>}
      {!compact && <span style={{ position: "absolute", top: 3, right: 4, fontSize: 11, opacity: 0.5 }}>✎</span>}
    </div>
  );
}

function AddButton({ label, onClick, compact = false }) {
  return (
    <button aria-label={`Ajouter ${label}`} onClick={onClick} style={{ width: "100%", minHeight: compact ? 28 : 46, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: compact ? 14 : 18, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}>+</button>
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
    recipes.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterCat === "Toutes" || r.category === filterCat)
    ), [recipes, search, filterCat]);

  function handleSave() {
    if (tab === "recipe") { if (!selectedRecipeId) return; onSave({ type: "recipe", recipeId: selectedRecipeId }); }
    else { if (!freeName.trim()) return; onSave({ type: "free", name: freeName.trim(), detail: freeDetail.trim() }); }
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
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
                    <div>
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                      {r.duration && <span style={{ fontSize: 11, color: "#aaa", marginLeft: 8 }}>⏱ {r.duration}</span>}
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: CAT_COLORS[r.category] || "#f0f0f0", color: CAT_TEXT[r.category] || "#444" }}>{r.category}</span>
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
    onSave({
      id: recipe?.id || uid(),
      name: name.trim(),
      category,
      duration: duration.trim(),
      ingredients: ingredients.trim(),
      notes: notes.trim(),
      detail: category + (duration ? " · " + duration : ""),
    });
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
                <button key={c} onClick={() => setCategory(c)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "0.5px solid", borderColor: category === c ? "transparent" : "rgba(0,0,0,0.12)", background: category === c ? CAT_COLORS[c] : "none", color: category === c ? CAT_TEXT[c] : "#666", fontWeight: category === c ? 500 : 400, cursor: "pointer" }}>{c}</button>
              ))}
            </div>
          </div>

          <div><div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 }}>Durée</div><input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="ex. 30 min, 1h…" style={inputStyle} /></div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 }}>Ingrédients</div>
            <textarea value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="ex. Poulet, ail, romarin, citron, huile d'olive" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 }}>Notes (optionnel)</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conseils, variantes, astuces…" rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 24px", borderTop: "0.5px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
          {isEdit ? <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#A32D2D" }}>🗑 Supprimer</button> : <span />}
          <button onClick={handleSave} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "8px 24px", fontSize: 13, cursor: "pointer" }}>
            {isEdit ? "Enregistrer" : "Créer la recette"}
          </button>
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
    recipes.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterCat === "Toutes" || r.category === filterCat)
    ), [recipes, search, filterCat]);

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Barre de recherche + bouton */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une recette…" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={onCreateRecipe} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>+ Nouvelle</button>
      </div>

      {/* Filtres catégorie */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {["Toutes", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "0.5px solid", borderColor: filterCat === c ? "transparent" : "rgba(0,0,0,0.12)", background: filterCat === c ? "#111" : "none", color: filterCat === c ? "#fff" : "#666", cursor: "pointer" }}>{c}</button>
        ))}
      </div>

      {/* Compteur */}
      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>{filtered.length} recette{filtered.length > 1 ? "s" : ""}</div>

      {/* Liste */}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: r.ingredients ? 6 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</span>
                  {r.duration && <span style={{ fontSize: 12, color: "#aaa" }}>⏱ {r.duration}</span>}
                </div>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: CAT_COLORS[r.category] || "#f0f0f0", color: CAT_TEXT[r.category] || "#444", flexShrink: 0 }}>{r.category}</span>
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

// ─── Vue semaine condensée mobile ─────────────────────────────────────────────

function WeekViewMobile({ dates, getMealDisplay, openModal, mobileView, setMobileView, dayOffset, setDayOffset }) {
  const visibleIndexes = mobileView === "3days"
    ? [dayOffset, dayOffset + 1, dayOffset + 2].filter(i => i < 7)
    : Array.from({ length: 7 }, (_, i) => i);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["week", "3days"].map(v => (
          <button key={v} onClick={() => { setMobileView(v); setDayOffset(0); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "0.5px solid", borderColor: mobileView === v ? "transparent" : "rgba(0,0,0,0.15)", background: mobileView === v ? "#111" : "none", color: mobileView === v ? "#fff" : "#666", cursor: "pointer" }}>
            {v === "week" ? "Semaine" : "3 jours"}
          </button>
        ))}
      </div>

      {mobileView === "3days" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <button onClick={() => setDayOffset(d => Math.max(0, d - 1))} disabled={dayOffset === 0} style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", opacity: dayOffset === 0 ? 0.3 : 1 }}>‹</button>
          <span style={{ fontSize: 13, color: "#888" }}>{DAYS_FULL[visibleIndexes[0]]} – {DAYS_FULL[visibleIndexes[visibleIndexes.length - 1]]}</span>
          <button onClick={() => setDayOffset(d => Math.min(4, d + 1))} disabled={dayOffset >= 4} style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", opacity: dayOffset >= 4 ? 0.3 : 1 }}>›</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: `72px repeat(${visibleIndexes.length}, minmax(0, 1fr))`, gap: 0 }}>
        <div />
        {visibleIndexes.map(i => (
          <div key={i} style={{ textAlign: "center", paddingBottom: 8 }}>
            <span style={{ display: "block", fontSize: mobileView === "3days" ? 16 : 14, fontWeight: 500, ...(isToday(dates[i]) ? { background: "#111", color: "#fff", borderRadius: "50%", width: 26, height: 26, lineHeight: "26px", margin: "0 auto 2px" } : { color: "#111", marginBottom: 2 }) }}>{dates[i].getDate()}</span>
            <span style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.04em" }}>{DAYS[i]}</span>
          </div>
        ))}

        {ROWS.map(row => (
          <>
            <div key={`lbl-${row.id}`} style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", padding: "6px 4px 6px 0", display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#111" }}>{row.labelShort}</span>
              <WhoTag tag={row.tag} who={row.who} />
            </div>
            {visibleIndexes.map(i => {
              const key = `${row.id}-${i}`;
              const meal = getMealDisplay(key);
              const compact = mobileView === "week";
              return (
                <div key={key} style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", borderLeft: "0.5px solid rgba(0,0,0,0.08)", borderRight: i === visibleIndexes[visibleIndexes.length - 1] ? "0.5px solid rgba(0,0,0,0.08)" : "none", padding: 3, minHeight: compact ? 32 : 52 }}>
                  {meal ? <MealCard meal={meal} color={row.color} onClick={() => openModal(row, i)} compact={compact} /> : <AddButton label={`${row.label} ${DAYS[i]}`} onClick={() => openModal(row, i)} compact={compact} />}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

// ─── App principale ───────────────────────────────────────────────────────────

export default function MealPlanner() {
  const [page, setPage]               = useState("planning"); // "planning" | "recipes"
  const [weekOffset, setWeekOffset]   = useState(0);
  const [meals, setMeals]             = useState(() => load("mp-meals", DEFAULT_MEALS));
  const [recipes, setRecipes]         = useState(() => load("mp-recipes", DEFAULT_RECIPES));
  const [modalSlot, setModalSlot]     = useState(null);
  const [recipeModal, setRecipeModal] = useState(null); // null | "new" | recipe object
  const [mobileView, setMobileView]   = useState("week");
  const [dayOffset, setDayOffset]     = useState(0);
  const isMobile = useIsMobile();

  const dates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  function getMealDisplay(key) {
    const m = meals[key];
    if (!m) return null;
    if (m.type === "free") return { name: m.name, detail: m.detail };
    const r = recipes.find(r => r.id === m.recipeId);
    return r ? { name: r.name, detail: r.detail } : null;
  }

  function openModal(row, dayIndex) {
    const key = `${row.id}-${dayIndex}`;
    setModalSlot({ key, rowLabel: row.label, who: row.who, dayLabel: `${DAYS[dayIndex]} ${dates[dayIndex].getDate()}`, meal: meals[key] || null, color: row.color });
  }

  function handleSaveMeal(mealData) {
    setMeals(prev => { const next = { ...prev, [modalSlot.key]: mealData }; save("mp-meals", next); return next; });
    setModalSlot(null);
  }

  function handleDeleteMeal() {
    setMeals(prev => { const next = { ...prev }; delete next[modalSlot.key]; save("mp-meals", next); return next; });
    setModalSlot(null);
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
    setMeals(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (next[k].type === "recipe" && next[k].recipeId === id) delete next[k]; });
      save("mp-meals", next);
      return next;
    });
    setRecipeModal(null);
  }

  const padding = isMobile ? "16px 12px 80px" : "24px 32px 40px";

  const NAV = [
    { id: "planning", label: "Planning", icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#111" : "#aaa"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )},
    { id: "recipes", label: "Recettes", icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#111" : "#aaa"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>
      </svg>
    )},
  ];

  return (
    <>
    {/* Barre mobile fixe en bas */}
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

    <div style={{ padding, fontFamily: "system-ui, sans-serif", position: "relative", maxWidth: 900, margin: "0 auto" }}>

      {/* Barre desktop en haut */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, borderBottom: "0.5px solid rgba(0,0,0,0.08)", paddingBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>🥗 Meal Planner</span>
          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.05)", borderRadius: 10, padding: 3 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 14px", borderRadius: 8, border: "none", background: page === n.id ? "#fff" : "none", color: page === n.id ? "#111" : "#888", fontWeight: page === n.id ? 500 : 400, cursor: "pointer", boxShadow: page === n.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                {n.icon(page === n.id)}
                {n.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Page Planning ── */}
      {page === "planning" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>‹</button>
              <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 500 }}>{fmt(dates[0])} – {fmt(dates[6])}</span>
              <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>›</button>
            </div>
            <button onClick={() => setWeekOffset(0)} style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Aujourd'hui</button>
          </div>

          {isMobile ? (
            <WeekViewMobile dates={dates} getMealDisplay={getMealDisplay} openModal={openModal} mobileView={mobileView} setMobileView={setMobileView} dayOffset={dayOffset} setDayOffset={setDayOffset} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "110px repeat(7, minmax(0, 1fr))", gap: 0 }}>
              <div />
              {dates.map((d, i) => (
                <div key={i} style={{ textAlign: "center", paddingBottom: 10 }}>
                  <span style={{ display: "block", fontSize: 18, fontWeight: 500, ...(isToday(d) ? { background: "#111", color: "#fff", borderRadius: "50%", width: 28, height: 28, lineHeight: "28px", margin: "0 auto 2px" } : { color: "#111", marginBottom: 2 }) }}>{d.getDate()}</span>
                  <span style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.04em" }}>{DAYS[i]}</span>
                </div>
              ))}
              {ROWS.map(row => (
                <>
                  <div key={`lbl-${row.id}`} style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 6px 8px 0", display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#111" }}>{row.label}</span>
                    <WhoTag tag={row.tag} who={row.who} />
                  </div>
                  {dates.map((_, i) => {
                    const key = `${row.id}-${i}`;
                    const meal = getMealDisplay(key);
                    return (
                      <div key={key} style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", borderLeft: "0.5px solid rgba(0,0,0,0.08)", borderRight: i === 6 ? "0.5px solid rgba(0,0,0,0.08)" : "none", padding: 5, minHeight: 58 }}>
                        {meal ? <MealCard meal={meal} color={row.color} onClick={() => openModal(row, i)} /> : <AddButton label={`${row.label} ${DAYS[i]}`} onClick={() => openModal(row, i)} />}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 16, marginTop: 20, paddingTop: 16, borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
            {[{ label: "Chloé", color: "#639922" }, { label: "Denis", color: "#378ADD" }, { label: "Partagé", color: "#BA7517" }].map(({ label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />{label}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Page Recettes ── */}
      {page === "recipes" && (
        <RecipesPage
          recipes={recipes}
          onCreateRecipe={() => setRecipeModal("new")}
          onEditRecipe={r => setRecipeModal(r)}
        />
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
