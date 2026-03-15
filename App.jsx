import React, { useState, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DOSES = ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"];

const TIPS = [
  "🍓 Break your fast with fruit — it digests in 40–90 min and clears the way for your next meal.",
  "💧 During your fast: water, black coffee, herbal tea are all fine.",
  "🍉 Melon always alone — combining it causes fermentation and bloating.",
  "🥩 Never mix protein and starch in the same meal — bloating guaranteed.",
  "🌿 Ginger tea during your fast can ease Mounjaro nausea.",
  "😴 Inject at night to sleep through peak side effects.",
  "🔄 Rotate injection sites — belly, thigh, upper arm.",
  "🌱 Leafy greens combine with everything — build every meal around them.",
  "📉 Stalls are normal. Your body is still changing when the scale isn't.",
  "🍷 Alcohol hits harder on Mounjaro — go slow or skip it.",
  "⏰ On Mounjaro, digestion takes 1.5–2× longer than usual — space meals accordingly.",
  "💊 Magnesium glycinate at night prevents Mounjaro constipation.",
  "🫙 Miso soup is probiotic and gentle — great for your gut on medication.",
];

const SYMPTOMS = ["Nausea", "Fatigue", "Headache", "Constipation", "Diarrhea", "Bloating", "Reflux", "Vomiting", "None"];

const MEAL_TYPES = [
  { id: "fruit",     label: "🍓 Fruit Break-Fast", desc: "12:00 opener", color: "#e05a4a" },
  { id: "raw",       label: "🥗 Raw Meal",          desc: "Salads, veggies, sprouts", color: "#3d6b5e" },
  { id: "cooked",    label: "🍲 Cooked Meal",        desc: "Evening — warm food", color: "#8b5e3c" },
  { id: "snack",     label: "🌰 Snack",              desc: "Nuts, seeds, small bites", color: "#6b7a3d" },
  { id: "realistic", label: "🍫 Real Life",          desc: "Bread, pasta, chocolate...", color: "#7a5c88" },
];

// Mounjaro digest times per meal type (in minutes)
const MEAL_DIGEST_MJ = {
  fruit:     65,
  raw:       120,
  cooked:    210,
  snack:     100,
  realistic: 270,  // processed foods — slowest on Mounjaro
};

// Parse "02:30 PM" or "14:30" into today's Date object
function parseTimeToDate(timeStr) {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!timeStr) return null;
  // Handle "HH:MM AM/PM"
  const ampm = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = parseInt(ampm[2]);
    if (ampm[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (ampm[3].toUpperCase() === "AM" && h === 12) h = 0;
    base.setHours(h, m, 0, 0);
    return base;
  }
  // Handle "HH:MM"
  const plain = timeStr.match(/(\d+):(\d+)/);
  if (plain) {
    base.setHours(parseInt(plain[1]), parseInt(plain[2]), 0, 0);
    return base;
  }
  return null;
}

function fmtTime(date) {
  if (!date) return "—";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ─── FOOD COMBINING KNOWLEDGE BASE ───────────────────────────────────────────

const GROUPS = {
  sweetFruit:   { label: "Sweet Fruit",   emoji: "🍌", color: "#d4a020", digestMins: 60,  mjMins: 90 },
  acidFruit:    { label: "Acid Fruit",    emoji: "🍓", color: "#e05a4a", digestMins: 40,  mjMins: 65 },
  subAcidFruit: { label: "Sub-acid Fruit",emoji: "🍎", color: "#c0392b", digestMins: 40,  mjMins: 65 },
  melon:        { label: "Melon",         emoji: "🍉", color: "#27ae60", digestMins: 25,  mjMins: 40 },
  leafyVeg:     { label: "Non-starchy Veg",emoji: "🥗", color: "#3d6b5e", digestMins: 45, mjMins: 75 },
  starchyVeg:   { label: "Starchy Veg",   emoji: "🥕", color: "#d4703a", digestMins: 90,  mjMins: 145 },
  grain:        { label: "Grain / Legume",emoji: "🌾", color: "#b8860b", digestMins: 120, mjMins: 185 },
  protein:      { label: "Protein",       emoji: "🥩", color: "#8b4513", digestMins: 180, mjMins: 275 },
  fat:          { label: "Healthy Fat",   emoji: "🥑", color: "#5d8a3c", digestMins: 120, mjMins: 180 },
};

// Compatibility matrix — result is a string: starts with ✅⚠️❌
const COMPAT = {
  sweetFruit:   { sweetFruit:"✅ Same group", acidFruit:"⚠️ Sweet+acid ferment", subAcidFruit:"✅ OK together", melon:"❌ Melon alone always", leafyVeg:"❌ Fruit+veg ferment", starchyVeg:"❌ Fruit+starch ferment", grain:"❌ No fruit with grain", protein:"❌ Fruit+protein ferment", fat:"❌ Fruit+fat slow digest" },
  acidFruit:    { sweetFruit:"⚠️ Sweet+acid ferment", acidFruit:"✅ Same group", subAcidFruit:"✅ Good pair", melon:"❌ Melon alone always", leafyVeg:"❌ Fruit+veg ferment", starchyVeg:"❌", grain:"❌", protein:"❌", fat:"❌" },
  subAcidFruit: { sweetFruit:"✅ OK together", acidFruit:"✅ Good pair", subAcidFruit:"✅ Same group", melon:"❌ Melon alone always", leafyVeg:"❌ Fruit+veg", starchyVeg:"❌", grain:"❌", protein:"❌", fat:"❌" },
  melon:        { sweetFruit:"❌ Melon alone always", acidFruit:"❌ Melon alone always", subAcidFruit:"❌ Melon alone always", melon:"✅ Same melon OK", leafyVeg:"❌ Melon alone", starchyVeg:"❌ Melon alone", grain:"❌ Melon alone", protein:"❌ Melon alone", fat:"❌ Melon alone" },
  leafyVeg:     { sweetFruit:"❌ Fruit+veg ferment", acidFruit:"❌ Fruit+veg", subAcidFruit:"❌ Fruit+veg", melon:"❌ Melon alone", leafyVeg:"✅ Perfect", starchyVeg:"✅ Good combo", grain:"✅ Good with grains", protein:"✅ Best protein combo", fat:"✅ Good combo" },
  starchyVeg:   { sweetFruit:"❌", acidFruit:"❌", subAcidFruit:"❌", melon:"❌", leafyVeg:"✅ Good combo", starchyVeg:"✅ Fine", grain:"⚠️ Double starch — heavy", protein:"❌ Starch+protein = bloat", fat:"✅ OK together" },
  grain:        { sweetFruit:"❌", acidFruit:"❌", subAcidFruit:"❌", melon:"❌", leafyVeg:"✅ Good pair", starchyVeg:"⚠️ Double starch", grain:"✅ Fine", protein:"❌ Starch+protein = bloat", fat:"⚠️ Slows digestion" },
  protein:      { sweetFruit:"❌ Fruit+protein ferment", acidFruit:"❌", subAcidFruit:"❌", melon:"❌", leafyVeg:"✅ Best combo", starchyVeg:"❌ Starch+protein = bloat", grain:"❌ Starch+protein = bloat", protein:"⚠️ One protein per meal", fat:"⚠️ Slows protein digestion" },
  fat:          { sweetFruit:"❌", acidFruit:"❌", subAcidFruit:"❌", melon:"❌", leafyVeg:"✅ Good combo", starchyVeg:"✅ OK", grain:"⚠️ Slows digestion", protein:"⚠️ Slows digestion", fat:"✅ Fine" },
};

// ─── RECIPES ─────────────────────────────────────────────────────────────────

const RECIPES = [
  {
    id:1, meal:"fruit", windowTime:"12:00", title:"Tropical Sunrise Bowl",
    emoji:"🌅", tags:["break-fast","sweet fruit","easy"],
    digestMins:60, mjDigestMins:90,
    combining:"✅ All sweet fruit — one group, zero conflict.",
    combiningDetail:"Banana + mango + dates are all sweet fruit. They digest together as one group cleanly in ~60 min, or ~90 min on Mounjaro.",
    ingredients:[
      {name:"Ripe banana",amount:"1 medium",group:"sweetFruit"},
      {name:"Mango",amount:"½ cup chunks",group:"sweetFruit"},
      {name:"Medjool dates",amount:"2, pitted",group:"sweetFruit"},
    ],
    steps:["Slice banana into a bowl.","Add mango chunks.","Chop dates and scatter over.","Eat slowly — chew well."],
    tip:"🌿 If nausea is bad, just eat half a banana. It's the gentlest food you can open your window with.",
    waitNote:"Wait 90 min (Mounjaro) before your next meal.",
  },
  {
    id:2, meal:"fruit", windowTime:"12:00", title:"Berry & Kiwi Plate",
    emoji:"🍓", tags:["break-fast","acid fruit","anti-inflammatory"],
    digestMins:40, mjDigestMins:65,
    combining:"✅ All acid fruit — perfect same-group combination.",
    combiningDetail:"Strawberries, blueberries, and kiwi are all acid fruit. They share the same digestive chemistry — clean combo.",
    ingredients:[
      {name:"Strawberries",amount:"1 cup",group:"acidFruit"},
      {name:"Blueberries",amount:"½ cup",group:"acidFruit"},
      {name:"Kiwi",amount:"1, sliced",group:"acidFruit"},
    ],
    steps:["Wash fruit.","Halve strawberries, slice kiwi.","Combine in bowl.","Eat mindfully."],
    tip:"🍓 Berries are especially good on Mounjaro — high antioxidants, low sugar, easy on the stomach.",
    waitNote:"Wait 65 min before next meal.",
  },
  {
    id:3, meal:"fruit", windowTime:"12:00", title:"Watermelon Only",
    emoji:"🍉", tags:["break-fast","melon","hydrating","nausea-friendly"],
    digestMins:25, mjDigestMins:40,
    combining:"✅ Melon alone — the golden rule. Fastest-digesting food.",
    combiningDetail:"Melon must always be eaten alone. It digests in 25 min normally, ~40 min on Mounjaro. Combining it with anything causes fermentation and bloating.",
    ingredients:[
      {name:"Watermelon",amount:"2–3 large slices",group:"melon"},
    ],
    steps:["Eat chilled.","Eat slowly.","That's the whole recipe."],
    tip:"💧 Watermelon is 92% water — counts toward your daily hydration goal.",
    waitNote:"Wait only 40–45 min. Melon is the quickest clearer.",
  },
  {
    id:4, meal:"fruit", windowTime:"12:00", title:"Apple & Pear Plate",
    emoji:"🍎", tags:["break-fast","sub-acid fruit","gentle"],
    digestMins:40, mjDigestMins:65,
    combining:"✅ Sub-acid + sub-acid — perfect pairing.",
    combiningDetail:"Apple and pear are both sub-acid fruits. They can also pair with acid OR sweet fruit — but not both in the same sitting.",
    ingredients:[
      {name:"Apple",amount:"1 medium, thinly sliced",group:"subAcidFruit"},
      {name:"Pear",amount:"1 medium, thinly sliced",group:"subAcidFruit"},
    ],
    steps:["Slice both fruits thinly (easier on stomach).","Optionally add a squeeze of lemon.","Eat slowly."],
    tip:"🍎 Apples contain malic acid which supports liver function — a nice bonus on medication.",
    waitNote:"Wait 65 min before next meal.",
  },
  {
    id:5, meal:"raw", windowTime:"14:00–16:00", title:"Big Green Bowl",
    emoji:"🥗", tags:["raw","veg+fat","easy","no-conflict"],
    digestMins:90, mjDigestMins:135,
    combining:"✅ Non-starchy veg + fat — ideal, zero conflicts.",
    combiningDetail:"Leafy greens combine with everything. Avocado and olive oil are fat — they pair perfectly with veg. Note: tomatoes are technically acid fruit but work fine in small amounts in a salad context.",
    ingredients:[
      {name:"Mixed greens (spinach, rocket, lettuce)",amount:"3 handfuls",group:"leafyVeg"},
      {name:"Cucumber",amount:"½, sliced",group:"leafyVeg"},
      {name:"Cherry tomatoes",amount:"handful",group:"acidFruit"},
      {name:"Avocado",amount:"½",group:"fat"},
      {name:"Olive oil",amount:"1 tbsp",group:"fat"},
      {name:"Lemon juice",amount:"1 squeeze",group:"acidFruit"},
    ],
    steps:["Tear greens into a large bowl.","Add cucumber and tomatoes.","Slice avocado on top.","Drizzle olive oil and lemon.","Season with sea salt.","Chew every bite thoroughly."],
    tip:"🥗 This is your foundation meal. Build every week around this.",
    waitNote:"Wait 2–2.5h before heavier food on Mounjaro.",
  },
  {
    id:6, meal:"raw", windowTime:"14:00–16:00", title:"Zucchini Noodles & Walnut Pesto",
    emoji:"🌿", tags:["raw","protein+veg","filling"],
    digestMins:120, mjDigestMins:180,
    combining:"✅ Protein (walnuts) + non-starchy veg + fat — correct protein meal, no starch.",
    combiningDetail:"Walnuts are protein + fat. Zucchini is non-starchy veg. These combine correctly. The key: no starch present. Don't add chickpeas or rice to this.",
    ingredients:[
      {name:"Zucchini",amount:"2 medium",group:"leafyVeg"},
      {name:"Fresh basil",amount:"1 cup packed",group:"leafyVeg"},
      {name:"Walnuts (soaked 4h)",amount:"¼ cup",group:"protein"},
      {name:"Olive oil",amount:"3 tbsp",group:"fat"},
      {name:"Garlic",amount:"1 clove",group:"leafyVeg"},
      {name:"Lemon juice",amount:"1 tbsp",group:"acidFruit"},
    ],
    steps:["Spiralize or peel zucchini into noodles.","Blend basil, walnuts, olive oil, garlic, and lemon into smooth pesto.","Toss noodles in pesto.","Top with a few extra walnut pieces.","Eat immediately."],
    tip:"🌿 Soaking walnuts removes tannins — much gentler on the stomach.",
    waitNote:"Wait 3h before next meal (protein combo).",
  },
  {
    id:7, meal:"raw", windowTime:"14:00–16:00", title:"Carrot Sticks & Tahini Dip",
    emoji:"🥕", tags:["raw","starch+veg+fat","easy"],
    digestMins:90, mjDigestMins:140,
    combining:"✅ Starchy veg + leafy veg + fat — clean combo.",
    combiningDetail:"Carrot is starchy veg, celery is non-starchy. Tahini is fat (not protein in this quantity). No protein conflict. This is a starch+fat meal — correct.",
    ingredients:[
      {name:"Carrots",amount:"2 medium, sticks",group:"starchyVeg"},
      {name:"Celery",amount:"3 stalks",group:"leafyVeg"},
      {name:"Tahini",amount:"2 tbsp",group:"fat"},
      {name:"Lemon juice",amount:"1 tsp",group:"acidFruit"},
      {name:"Water",amount:"1 tbsp",group:"leafyVeg"},
    ],
    steps:["Cut carrots and celery into sticks.","Mix tahini with lemon juice and water to thin.","Dip and eat slowly."],
    tip:"🌻 Tahini is rich in calcium and magnesium — both important while on Mounjaro.",
    waitNote:"Wait 2–2.5h.",
  },
  {
    id:8, meal:"cooked", windowTime:"18:00–20:00", title:"Red Lentil Dal & Greens",
    emoji:"🫘", tags:["cooked","grain+veg","warming","plant-based"],
    digestMins:150, mjDigestMins:240,
    combining:"✅ Grain/legume + non-starchy veg + fat — correct. No protein alongside.",
    combiningDetail:"Lentils are grain/legume — they contain starch and must not be combined with animal protein. Here they're paired with veg only, which is correct.",
    ingredients:[
      {name:"Red lentils",amount:"½ cup dry",group:"grain"},
      {name:"Spinach",amount:"2 handfuls",group:"leafyVeg"},
      {name:"Zucchini",amount:"1, diced",group:"leafyVeg"},
      {name:"Turmeric",amount:"1 tsp",group:"leafyVeg"},
      {name:"Cumin",amount:"1 tsp",group:"leafyVeg"},
      {name:"Olive oil",amount:"1 tbsp",group:"fat"},
    ],
    steps:["Rinse lentils and simmer in 2 cups water ~20 min until soft.","Sauté zucchini in olive oil with turmeric and cumin.","Add spinach, wilt briefly.","Combine with lentils.","Eat before 20:00."],
    tip:"🟡 Turmeric is anti-inflammatory and supports bile production — excellent on Mounjaro.",
    waitNote:"Likely your last meal. Eat slowly and close the window cleanly.",
  },
  {
    id:9, meal:"cooked", windowTime:"18:00–20:00", title:"Baked Sweet Potato & Kale",
    emoji:"🍠", tags:["cooked","starch+veg","easy","nausea-friendly"],
    digestMins:120, mjDigestMins:180,
    combining:"✅ Starchy veg + leafy veg + fat — perfect close-of-window meal.",
    combiningDetail:"Sweet potato is starchy veg. Kale is non-starchy. No protein added — this is a clean starch+veg meal.",
    ingredients:[
      {name:"Sweet potato",amount:"1 medium",group:"starchyVeg"},
      {name:"Kale",amount:"2 cups",group:"leafyVeg"},
      {name:"Garlic",amount:"2 cloves",group:"leafyVeg"},
      {name:"Olive oil",amount:"1 tbsp",group:"fat"},
    ],
    steps:["Bake sweet potato at 200°C / 400°F for 45 min.","Sauté kale in olive oil with garlic until tender.","Split potato, pile kale inside.","Season with sea salt."],
    tip:"🍠 Sweet potato is one of the gentlest starchy foods — high potassium, soothing on the gut.",
    waitNote:"Good final meal before 20:00 fast.",
  },
  {
    id:10, meal:"cooked", windowTime:"18:00–20:00", title:"Protein Bowl (No Starch)",
    emoji:"🥩", tags:["cooked","protein+veg","high-protein"],
    digestMins:180, mjDigestMins:270,
    combining:"✅ Protein + non-starchy veg + fat — the correct protein meal. No starch.",
    combiningDetail:"Chicken or tofu is protein. Broccoli and asparagus are non-starchy veg. Critical rule: no potato, rice, or bread alongside protein. Save starch for a separate meal.",
    ingredients:[
      {name:"Chicken breast or firm tofu",amount:"120g",group:"protein"},
      {name:"Broccoli",amount:"1 cup florets",group:"leafyVeg"},
      {name:"Asparagus",amount:"handful",group:"leafyVeg"},
      {name:"Olive oil",amount:"1 tbsp",group:"fat"},
      {name:"Rosemary / thyme",amount:"to taste",group:"leafyVeg"},
    ],
    steps:["Grill or bake protein with herbs and olive oil (180°C, 20 min).","Steam broccoli and asparagus until just tender.","Plate protein alongside veg.","No starchy sauce or side."],
    tip:"⚠️ If you want rice or sweet potato, eat that as a different meal earlier in your window — not here.",
    waitNote:"Protein takes 3–4.5h on Mounjaro — ideal as your final meal of the window.",
  },
  {
    id:11, meal:"cooked", windowTime:"18:00–20:00", title:"Miso Soup & Wakame",
    emoji:"🫙", tags:["cooked","light","nausea-friendly","probiotic"],
    digestMins:75, mjDigestMins:115,
    combining:"✅ Light protein (miso, tofu) + sea veg — well-tolerated on Mounjaro.",
    combiningDetail:"Miso is fermented — already partially broken down, easy to digest. Small tofu amount is fine as a single protein. Wakame and spring onion are non-starchy veg.",
    ingredients:[
      {name:"White miso paste",amount:"1 tbsp",group:"protein"},
      {name:"Silken tofu",amount:"¼ block, cubed",group:"protein"},
      {name:"Wakame seaweed (dried)",amount:"1 tsp",group:"leafyVeg"},
      {name:"Spring onion",amount:"1 stalk, sliced",group:"leafyVeg"},
      {name:"Warm water (not boiling)",amount:"300ml",group:"leafyVeg"},
    ],
    steps:["Soak wakame in warm water 5 min.","Dissolve miso in a small cup of warm (not boiling) water.","Combine miso, wakame, and tofu in bowl.","Top with spring onion.","Never boil miso — it kills the probiotics."],
    tip:"🫙 Probiotic-rich miso supports the gut microbiome that Mounjaro can disrupt.",
    waitNote:"Very light — 1.5–2h to clear.",
  },
  {
    id:12, meal:"snack", windowTime:"between meals", title:"Soaked Almonds",
    emoji:"🌰", tags:["snack","protein","easy"],
    digestMins:120, mjDigestMins:180,
    combining:"✅ Protein alone — perfect standalone snack.",
    combiningDetail:"Almonds are protein + fat. Eaten alone with no starch or fruit, they digest cleanly.",
    ingredients:[
      {name:"Raw almonds (soaked overnight in water)",amount:"12–15",group:"protein"},
    ],
    steps:["Soak almonds in water overnight.","Drain, peel if desired.","Chew each almond very thoroughly."],
    tip:"💡 Soaking removes phytic acid and enzyme inhibitors — far easier to digest, especially on Mounjaro.",
    waitNote:"Wait 2–3h before next meal.",
  },
  {
    id:13, meal:"snack", windowTime:"anytime in window", title:"Celery & Cucumber Sticks",
    emoji:"🥒", tags:["snack","veg-only","hydrating"],
    digestMins:30, mjDigestMins:50,
    combining:"✅ Non-starchy veg only — no combining conflicts ever.",
    combiningDetail:"Pure leafy/non-starchy veg. The ultimate neutral food — you can eat this between any meals with no conflict.",
    ingredients:[
      {name:"Celery",amount:"3–4 stalks",group:"leafyVeg"},
      {name:"Cucumber",amount:"½, sliced",group:"leafyVeg"},
      {name:"Lemon juice",amount:"squeeze",group:"acidFruit"},
    ],
    steps:["Cut into sticks.","Squeeze lemon.","Eat."],
    tip:"🥒 Cucumber is 96% water. This snack actively helps your hydration goal.",
    waitNote:"Lightest possible — 30–50 min to clear.",
  },

  // ── MORE FRUIT BREAK-FASTS ──
  {
    id:14, meal:"fruit", windowTime:"12:00", title:"Mango & Papaya Bowl",
    emoji:"🥭", tags:["break-fast","sweet fruit","enzyme-rich"],
    digestMins:55, mjDigestMins:85,
    combining:"✅ Sweet fruit + sweet fruit — same group, perfect.",
    combiningDetail:"Mango and papaya are both sweet tropical fruits. Papaya contains papain, a powerful digestive enzyme — excellent for opening the window on Mounjaro.",
    ingredients:[
      {name:"Mango",amount:"1 medium, cubed",group:"sweetFruit"},
      {name:"Papaya",amount:"½ cup, cubed",group:"sweetFruit"},
      {name:"Lime juice",amount:"1 squeeze",group:"acidFruit"},
    ],
    steps:["Cube mango and papaya.","Combine in a bowl.","Squeeze lime over the top.","Eat immediately — papaya oxidises quickly."],
    tip:"🥭 Papain in papaya actively helps break down food — one of the best things to open your window with on Mounjaro.",
    waitNote:"Wait 85 min before next meal.",
  },
  {
    id:15, meal:"fruit", windowTime:"12:00", title:"Frozen Berry Smoothie",
    emoji:"🫐", tags:["break-fast","acid fruit","easy","blended"],
    digestMins:35, mjDigestMins:55,
    combining:"✅ All acid fruit — blended for easier digestion.",
    combiningDetail:"Blending breaks cell walls making acid fruits even faster to digest. No dairy, no banana, no protein powder — pure acid fruit only.",
    ingredients:[
      {name:"Frozen mixed berries",amount:"1 cup",group:"acidFruit"},
      {name:"Fresh lemon juice",amount:"1 tbsp",group:"acidFruit"},
      {name:"Water or coconut water",amount:"150ml",group:"leafyVeg"},
    ],
    steps:["Blend all ingredients until smooth.","Drink slowly — don't gulp.","If too thick, add more water."],
    tip:"🫐 Blended fruit digests faster than whole fruit — good on nausea days when chewing feels like too much.",
    waitNote:"Wait 55 min before next meal. Faster than whole fruit.",
  },
  {
    id:16, meal:"fruit", windowTime:"12:00", title:"Peach & Grape Plate",
    emoji:"🍇", tags:["break-fast","sub-acid fruit","gentle","seasonal"],
    digestMins:40, mjDigestMins:65,
    combining:"✅ Sub-acid + sub-acid — gentle, compatible pair.",
    combiningDetail:"Peaches and grapes are both sub-acid fruits. High water content, easy sugars, very gentle on the stomach.",
    ingredients:[
      {name:"Ripe peach",amount:"2, sliced",group:"subAcidFruit"},
      {name:"Green or red grapes",amount:"1 cup",group:"subAcidFruit"},
    ],
    steps:["Slice peaches.","Wash grapes.","Arrange in a bowl and eat slowly."],
    tip:"🍇 Grapes are one of the most cleansing fruits — high in resveratrol and very easy to digest.",
    waitNote:"Wait 65 min before next meal.",
  },
  {
    id:17, meal:"fruit", windowTime:"12:00", title:"Citrus Plate",
    emoji:"🍊", tags:["break-fast","acid fruit","vitamin C","immune"],
    digestMins:35, mjDigestMins:60,
    combining:"✅ All acid fruit — vibrant, enzyme-activating opener.",
    combiningDetail:"Orange, grapefruit, and clementine are all acid citrus fruits. Vitamin C supports iron absorption and immune function — especially useful on Mounjaro when appetite is reduced.",
    ingredients:[
      {name:"Orange",amount:"1 large, segmented",group:"acidFruit"},
      {name:"Pink grapefruit",amount:"½, segmented",group:"acidFruit"},
      {name:"Clementine",amount:"2",group:"acidFruit"},
    ],
    steps:["Peel and segment all fruit.","Arrange on a plate.","Eat segment by segment, slowly."],
    tip:"🍊 Grapefruit can interact with some medications — check with your prescriber if on other meds besides Mounjaro.",
    waitNote:"Wait 60 min before next meal.",
  },

  // ── MORE RAW MEALS ──
  {
    id:18, meal:"raw", windowTime:"14:00–16:00", title:"Rainbow Slaw",
    emoji:"🌈", tags:["raw","veg+fat","colourful","anti-inflammatory"],
    digestMins:80, mjDigestMins:125,
    combining:"✅ Non-starchy veg + fat — zero conflicts, maximum nutrients.",
    combiningDetail:"All veg here are non-starchy. Apple cider vinegar dressing is acidic and aids digestion. Olive oil is fat — pairs perfectly with veg.",
    ingredients:[
      {name:"Red cabbage",amount:"1 cup, shredded",group:"leafyVeg"},
      {name:"Carrot",amount:"1 medium, grated",group:"starchyVeg"},
      {name:"Fennel",amount:"½ bulb, shaved thin",group:"leafyVeg"},
      {name:"Fresh parsley",amount:"handful",group:"leafyVeg"},
      {name:"Olive oil",amount:"2 tbsp",group:"fat"},
      {name:"Apple cider vinegar",amount:"1 tbsp",group:"acidFruit"},
    ],
    steps:["Shred cabbage finely.","Grate carrot.","Shave fennel paper-thin with a knife or mandoline.","Toss with olive oil and ACV.","Add parsley and a pinch of salt.","Let sit 5 min before eating — it softens slightly."],
    tip:"🌈 Red cabbage is one of the highest antioxidant vegetables — supports gut lining health.",
    waitNote:"Wait 2–2.5h before next meal.",
  },
  {
    id:19, meal:"raw", windowTime:"14:00–16:00", title:"Avocado & Tomato Stack",
    emoji:"🥑", tags:["raw","veg+fat","quick","satisfying"],
    digestMins:75, mjDigestMins:120,
    combining:"✅ Fat (avocado) + non-starchy veg — ideal pairing.",
    combiningDetail:"Avocado is fat. Tomato is technically acid fruit but functions as a vegetable in this context and combines well with fat. Leafy herbs are non-starchy veg throughout.",
    ingredients:[
      {name:"Avocado",amount:"1 ripe",group:"fat"},
      {name:"Tomatoes",amount:"2 medium, sliced",group:"acidFruit"},
      {name:"Fresh basil",amount:"handful",group:"leafyVeg"},
      {name:"Lemon juice",amount:"1 tsp",group:"acidFruit"},
      {name:"Olive oil",amount:"1 tsp",group:"fat"},
      {name:"Sea salt & black pepper",amount:"to taste",group:"leafyVeg"},
    ],
    steps:["Slice tomatoes and arrange on a plate.","Slice avocado and layer on top.","Scatter torn basil leaves.","Drizzle lemon and olive oil.","Season well."],
    tip:"🥑 Avocado's fat slows the absorption of nutrients from tomato — the lycopene in tomato is fat-soluble, so this combo is actually nutritionally smart.",
    waitNote:"Wait 2h before next meal.",
  },
  {
    id:20, meal:"raw", windowTime:"14:00–16:00", title:"Cucumber Gazpacho",
    emoji:"🥣", tags:["raw","veg","hydrating","blended","nausea-friendly"],
    digestMins:60, mjDigestMins:95,
    combining:"✅ Non-starchy veg only — the lightest raw meal possible.",
    combiningDetail:"All ingredients are non-starchy vegetables or acid fruit (tomato). No fat, no protein, no starch. Very easy on a Mounjaro stomach.",
    ingredients:[
      {name:"Cucumber",amount:"1 large",group:"leafyVeg"},
      {name:"Tomato",amount:"2 medium",group:"acidFruit"},
      {name:"Red bell pepper",amount:"½",group:"leafyVeg"},
      {name:"Garlic",amount:"½ clove",group:"leafyVeg"},
      {name:"Lemon juice",amount:"2 tbsp",group:"acidFruit"},
      {name:"Fresh mint",amount:"handful",group:"leafyVeg"},
    ],
    steps:["Roughly chop all veg.","Blend until smooth.","Season with salt.","Serve chilled — ideally refrigerate 30 min first.","Garnish with mint."],
    tip:"💧 This is almost entirely water — ideal on high-nausea days or when appetite is very low.",
    waitNote:"Very light — 95 min to clear.",
  },
  {
    id:21, meal:"raw", windowTime:"14:00–16:00", title:"Hemp Seed Protein Salad",
    emoji:"🌿", tags:["raw","protein+veg","high-protein","plant-based"],
    digestMins:110, mjDigestMins:165,
    combining:"✅ Protein (hemp seeds) + non-starchy veg — correct protein meal, no starch.",
    combiningDetail:"Hemp seeds are a complete protein — all essential amino acids. They're also fat, so they slow digestion slightly. No starch present — this is a clean protein+veg meal.",
    ingredients:[
      {name:"Mixed greens",amount:"3 handfuls",group:"leafyVeg"},
      {name:"Hemp seeds",amount:"3 tbsp",group:"protein"},
      {name:"Cucumber",amount:"½, diced",group:"leafyVeg"},
      {name:"Radishes",amount:"4, sliced",group:"leafyVeg"},
      {name:"Lemon juice",amount:"2 tbsp",group:"acidFruit"},
      {name:"Olive oil",amount:"1 tbsp",group:"fat"},
    ],
    steps:["Build a base of greens.","Add cucumber and radishes.","Scatter hemp seeds generously.","Dress with lemon and olive oil.","Toss and eat immediately."],
    tip:"🌿 Hemp seeds give ~10g protein per 3 tbsp — one of the easiest ways to hit your protein goal on a raw day.",
    waitNote:"Wait 2.5–3h before next meal (protein present).",
  },

  // ── MORE COOKED MEALS ──
  {
    id:22, meal:"cooked", windowTime:"18:00–20:00", title:"Roasted Cauliflower & Tahini",
    emoji:"🥦", tags:["cooked","starch+fat","plant-based","satisfying"],
    digestMins:110, mjDigestMins:170,
    combining:"✅ Starchy veg + fat — correct pairing, no protein conflict.",
    combiningDetail:"Cauliflower sits between starchy and non-starchy — it's low starch but more complex than leafy veg. Tahini is fat. No protein added here — clean combo.",
    ingredients:[
      {name:"Cauliflower",amount:"1 small head, florets",group:"starchyVeg"},
      {name:"Tahini",amount:"2 tbsp",group:"fat"},
      {name:"Lemon juice",amount:"1 tbsp",group:"acidFruit"},
      {name:"Cumin",amount:"1 tsp",group:"leafyVeg"},
      {name:"Smoked paprika",amount:"1 tsp",group:"leafyVeg"},
      {name:"Olive oil",amount:"1 tbsp",group:"fat"},
    ],
    steps:["Toss cauliflower florets in olive oil, cumin, and paprika.","Roast at 220°C / 425°F for 25–30 min until golden.","Mix tahini with lemon juice and a splash of water to make sauce.","Drizzle over roasted cauliflower.","Serve immediately."],
    tip:"🥦 Cauliflower is one of the most gut-friendly brassicas — easy to digest when roasted vs. raw.",
    waitNote:"Wait 2.5–3h before fasting window.",
  },
  {
    id:23, meal:"cooked", windowTime:"18:00–20:00", title:"Steamed Fish & Greens",
    emoji:"🐟", tags:["cooked","protein+veg","high-protein","light"],
    digestMins:150, mjDigestMins:230,
    combining:"✅ Lean protein + non-starchy veg — ideal protein meal.",
    combiningDetail:"Fish is lean protein — easier to digest than red meat. Steaming keeps it gentle. Bok choy and broccolini are non-starchy veg. No starch present — correct protein meal.",
    ingredients:[
      {name:"White fish fillet (cod, sea bass, tilapia)",amount:"130g",group:"protein"},
      {name:"Bok choy",amount:"2 heads, halved",group:"leafyVeg"},
      {name:"Broccolini",amount:"handful",group:"leafyVeg"},
      {name:"Ginger",amount:"3 slices",group:"leafyVeg"},
      {name:"Tamari (gluten-free soy sauce)",amount:"1 tbsp",group:"leafyVeg"},
      {name:"Sesame oil",amount:"1 tsp",group:"fat"},
    ],
    steps:["Place fish on steamer rack with ginger slices on top.","Add bok choy and broccolini to steamer.","Steam everything together 8–10 min until fish flakes.","Drizzle tamari and sesame oil.","Eat while hot."],
    tip:"🐟 White fish is among the easiest proteins to digest — good for early dose weeks when Mounjaro side effects are strongest.",
    waitNote:"Wait 3–3.5h. Good as a final pre-fast meal.",
  },
  {
    id:24, meal:"cooked", windowTime:"18:00–20:00", title:"Brown Rice & Roasted Veg",
    emoji:"🍚", tags:["cooked","grain+veg","plant-based","filling"],
    digestMins:140, mjDigestMins:210,
    combining:"✅ Grain + non-starchy veg + fat — correct starch meal.",
    combiningDetail:"Brown rice is grain/starch. Roasted vegetables are non-starchy. Olive oil is fat. No protein added — this is a clean starch+veg meal. Do not add chicken, fish, or legumes to this dish.",
    ingredients:[
      {name:"Brown rice",amount:"½ cup dry",group:"grain"},
      {name:"Courgette/zucchini",amount:"1, chunked",group:"leafyVeg"},
      {name:"Red onion",amount:"½, wedges",group:"leafyVeg"},
      {name:"Cherry tomatoes",amount:"handful",group:"acidFruit"},
      {name:"Olive oil",amount:"1 tbsp",group:"fat"},
      {name:"Herbs (oregano, basil)",amount:"to taste",group:"leafyVeg"},
    ],
    steps:["Cook brown rice (simmer 35–40 min).","Toss veg in olive oil and herbs.","Roast at 200°C / 400°F for 20–25 min.","Combine rice and veg in a bowl.","No protein sauce or side — keep it clean."],
    tip:"🍚 Brown rice is slower to digest than white — the fibre content helps with Mounjaro-related constipation.",
    waitNote:"Wait 3–3.5h. Hearty enough to be a satisfying final meal.",
  },
  {
    id:25, meal:"cooked", windowTime:"18:00–20:00", title:"Pumpkin Soup",
    emoji:"🎃", tags:["cooked","starch+veg","nausea-friendly","warming","easy"],
    digestMins:100, mjDigestMins:155,
    combining:"✅ Starchy veg + non-starchy veg + fat — gentle, warming close.",
    combiningDetail:"Pumpkin is starchy veg. Onion and garlic are non-starchy. Coconut milk is fat. No protein — clean starch+fat meal. Blending makes it very easy on a sensitive stomach.",
    ingredients:[
      {name:"Pumpkin or butternut squash",amount:"400g, cubed",group:"starchyVeg"},
      {name:"Onion",amount:"1 medium",group:"leafyVeg"},
      {name:"Garlic",amount:"2 cloves",group:"leafyVeg"},
      {name:"Coconut milk",amount:"100ml",group:"fat"},
      {name:"Vegetable stock",amount:"400ml",group:"leafyVeg"},
      {name:"Ginger",amount:"1 tsp, grated",group:"leafyVeg"},
    ],
    steps:["Sauté onion and garlic in a little oil until soft.","Add pumpkin, ginger, and stock.","Simmer 20 min until pumpkin is tender.","Blend until smooth.","Stir in coconut milk.","Season with salt."],
    tip:"🫚 This soup is one of the best meals on Mounjaro nausea days — liquid, warm, gentle, and nourishing.",
    waitNote:"Wait 2.5h before fasting window.",
  },

  // ── MORE SNACKS ──
  {
    id:26, meal:"snack", windowTime:"between meals", title:"Medjool Dates (2 max)",
    emoji:"🫘", tags:["snack","sweet fruit","quick energy"],
    digestMins:50, mjDigestMins:80,
    combining:"✅ Sweet fruit alone — eat by themselves, never with nuts.",
    combiningDetail:"Dates are sweet fruit. Never combine them with nuts or seeds (a common mistake) — fruit + protein = fermentation. Eat alone as a standalone snack.",
    ingredients:[
      {name:"Medjool dates",amount:"2",group:"sweetFruit"},
    ],
    steps:["Remove pit.","Eat slowly.","Chew very well — they're dense."],
    tip:"⚠️ Max 2 — very high sugar. Great for a quick energy lift but easy to overdo, especially combined with Mounjaro's appetite suppression masking fullness signals.",
    waitNote:"Wait 80 min before next meal.",
  },
  {
    id:27, meal:"snack", windowTime:"between meals", title:"Nori Sheets & Avocado",
    emoji:"🍙", tags:["snack","fat+veg","mineral-rich","quick"],
    digestMins:60, mjDigestMins:95,
    combining:"✅ Fat (avocado) + non-starchy veg (nori) — clean combo.",
    combiningDetail:"Nori is seaweed — non-starchy, mineral-rich. Avocado is fat. Together they form a perfect fat+veg combination with no conflicts.",
    ingredients:[
      {name:"Nori sheets (raw, unseasoned)",amount:"4–5 sheets",group:"leafyVeg"},
      {name:"Avocado",amount:"¼, sliced",group:"fat"},
      {name:"Lemon juice",amount:"squeeze",group:"acidFruit"},
    ],
    steps:["Lay nori flat.","Place a slice of avocado on each.","Squeeze lemon.","Roll or fold and eat."],
    tip:"🌊 Nori is exceptionally high in iodine, B12, and minerals — nutrients that can become depleted when eating less overall on Mounjaro.",
    waitNote:"Wait ~1.5h before next meal.",
  },
  {
    id:28, meal:"snack", windowTime:"between meals", title:"Herbal Tea & Ginger",
    emoji:"🍵", tags:["snack","nausea-friendly","zero calories","anytime"],
    digestMins:20, mjDigestMins:20,
    combining:"✅ Not food — no combining rules apply.",
    combiningDetail:"Herbal teas and ginger have no macronutrients to digest. They can be consumed at any point in your window without affecting digestion timing.",
    ingredients:[
      {name:"Fresh ginger root",amount:"3–4 slices",group:"leafyVeg"},
      {name:"Hot water",amount:"300ml",group:"leafyVeg"},
      {name:"Peppermint or chamomile tea bag",amount:"1",group:"leafyVeg"},
      {name:"Lemon slice",amount:"optional",group:"acidFruit"},
    ],
    steps:["Steep ginger in hot water 5 min.","Add tea bag for another 2 min.","Add lemon if desired.","Sip slowly."],
    tip:"🌿 Ginger is clinically shown to reduce nausea — this is your best friend on injection days and the 48h after.",
    waitNote:"No wait needed — doesn't affect digestion timing.",
  },

  // ── REAL LIFE (no judgment) ──
  {
    id:29, meal:"realistic", windowTime:"anytime in window", title:"Bread (white or wholegrain)",
    emoji:"🍞", tags:["realistic","starch","processed"],
    digestMins:180, mjDigestMins:270,
    combining:"⚠️ Starch — do not eat with protein. Fine with veg or fat.",
    combiningDetail:"Bread is refined starch. On food combining principles, pair it only with non-starchy veg or fat (butter, avocado). Never with meat, fish, eggs or legumes. On Mounjaro, refined starch sits in a slowed stomach for a long time — expect fullness and possible reflux.",
    ingredients:[
      {name:"Bread (any kind)",amount:"1–2 slices",group:"grain"},
    ],
    steps:["Eat slowly — chew very thoroughly.","Avoid eating close to your 20:00 window close.","If topping: avocado or olive oil are best pairings.","Avoid butter + jam + cheese combinations."],
    tip:"💡 If you're going to eat bread, sourdough is the most digestible — the fermentation pre-breaks the gluten and lowers the glycaemic impact.",
    waitNote:"White bread: ~3.5h on Mounjaro. Wholegrain/sourdough: ~4h. Plan your next meal accordingly.",
  },
  {
    id:30, meal:"realistic", windowTime:"anytime in window", title:"Pasta",
    emoji:"🍝", tags:["realistic","starch","processed"],
    digestMins:200, mjDigestMins:300,
    combining:"⚠️ Starch — veg-based sauce only. No meat sauce.",
    combiningDetail:"Pasta is dense refined starch. Tomato-based veg sauce is fine — tomatoes are acid fruit and work in small amounts with starch. A bolognese or carbonara (protein + starch) violates food combining and will sit very heavily on Mounjaro.",
    ingredients:[
      {name:"Pasta (any shape)",amount:"80g dry",group:"grain"},
    ],
    steps:["Cook al dente — softer pasta digests faster but spikes blood sugar more.","Pair with tomato-veg sauce only (no meat).","Eat a small portion — appetite suppression can make it easy to overeat pasta accidentally then feel awful.","Eat slowly."],
    tip:"⚠️ Pasta + Mounjaro is a common nausea trigger — the dense starch in a slowed stomach ferments. If you eat it, keep portions small and stay upright after.",
    waitNote:"~5h to fully digest on Mounjaro. Your heaviest digestion item. Don't eat within 4h of your 20:00 window close.",
  },
  {
    id:31, meal:"realistic", windowTime:"anytime in window", title:"Rice (white or brown)",
    emoji:"🍚", tags:["realistic","starch","processed"],
    digestMins:150, mjDigestMins:230,
    combining:"⚠️ Starch — veg only alongside. No protein.",
    combiningDetail:"Rice is a cleaner starch than bread or pasta — less processed, easier to digest. White rice digests faster but brown rice has more fibre. Neither should be combined with protein (chicken, fish, eggs).",
    ingredients:[
      {name:"Rice (white or brown)",amount:"½ cup cooked",group:"grain"},
    ],
    steps:["Cook well — slightly overcooked rice is easier on a Mounjaro stomach.","Pair with steamed veg or a light tomato sauce.","No meat, fish, or eggs alongside.","Eat a small portion."],
    tip:"🍚 Rice is the most neutral of the grains — if you're going to eat a starch, this is probably the least disruptive on Mounjaro.",
    waitNote:"White rice: ~3h on Mounjaro. Brown rice: ~4h.",
  },
  {
    id:32, meal:"realistic", windowTime:"anytime in window", title:"Chips / Crisps",
    emoji:"🥔", tags:["realistic","starch","processed","fried"],
    digestMins:210, mjDigestMins:330,
    combining:"❌ Starch + fat + salt — poor combination, very slow digestion.",
    combiningDetail:"Chips combine starch (potato) with fat (oil) and often additives. The fat coating slows starch digestion significantly. On Mounjaro this sits in your stomach for a very long time and commonly triggers nausea and reflux. One of the worst foods to eat on this medication.",
    ingredients:[
      {name:"Chips / crisps",amount:"small handful",group:"starchyVeg"},
    ],
    steps:["If you eat them, eat very slowly.","Drink water between handfuls.","Stop well before you normally would — appetite signals are delayed on Mounjaro.","Avoid on injection day or the 48h after."],
    tip:"⚠️ Chips are one of the most commonly reported Mounjaro nausea triggers. The fat+starch+salt combo in a slowed stomach is rough. If you must, plain salted over flavoured — flavourings are harder to digest.",
    waitNote:"~5.5h on Mounjaro. Seriously — plan your window around this.",
  },
  {
    id:33, meal:"realistic", windowTime:"anytime in window", title:"Chocolate",
    emoji:"🍫", tags:["realistic","sugar+fat","processed"],
    digestMins:120, mjDigestMins:190,
    combining:"⚠️ Sugar + fat — eat alone, not after a heavy meal.",
    combiningDetail:"Chocolate is fat + sugar. On food combining principles, eat it alone as a standalone item, not as dessert after a meal (where it sits on top of undigested food and ferments). Dark chocolate (70%+) digests faster and has less sugar than milk chocolate.",
    ingredients:[
      {name:"Chocolate",amount:"1–2 squares",group:"fat"},
    ],
    steps:["Eat alone — not after a meal.","Let it melt in your mouth slowly.","1–2 squares is usually enough on Mounjaro — appetite suppression makes large amounts nauseating.","Dark chocolate 70%+ is the better choice."],
    tip:"🍫 Good news: dark chocolate 70%+ has magnesium which helps with Mounjaro constipation, and the fat content means it digests relatively cleanly when eaten alone.",
    waitNote:"Dark chocolate alone: ~2h on Mounjaro. Milk chocolate: ~3h. After a meal: add 2h to whatever that meal's time was.",
  },
  {
    id:34, meal:"realistic", windowTime:"anytime in window", title:"Candy / Sweets",
    emoji:"🍬", tags:["realistic","sugar","processed"],
    digestMins:60, mjDigestMins:100,
    combining:"❌ Pure refined sugar — spikes blood sugar, conflicts with almost everything.",
    combiningDetail:"Pure sugar digests fast on its own, but on Mounjaro blood sugar regulation is already altered. Candy eaten after a meal sits on top of slower-digesting food and ferments rapidly — causing bloating and nausea. Mounjaro also blunts sugar cravings for most people, so cravings that break through are often habitual rather than physiological.",
    ingredients:[
      {name:"Candy / sweets",amount:"small amount",group:"sweetFruit"},
    ],
    steps:["If you eat them, eat on an empty stomach — never after a meal.","Drink water after.","Note how you feel 30–60 min later — most people find sweets cause nausea on Mounjaro."],
    tip:"💡 Mounjaro significantly reduces sugar cravings for most people within the first few weeks. If you still crave sweets, 2 Medjool dates are a much better alternative — same sweetness hit, real food, better digestion.",
    waitNote:"Fast alone (~1.5h) but expect a blood sugar spike and crash. After a meal: potentially very uncomfortable.",
  },
  {
    id:35, meal:"realistic", windowTime:"anytime in window", title:"Pizza",
    emoji:"🍕", tags:["realistic","starch+fat+protein","processed","worst-combo"],
    digestMins:240, mjDigestMins:390,
    combining:"❌ Starch + protein + fat — the triple combining violation.",
    combiningDetail:"Pizza is arguably the worst food combining combination possible: refined bread (starch) + cheese (protein + fat) + often meat (protein) + tomato sauce. Every combining rule is broken simultaneously. On Mounjaro, this is a near-guaranteed nausea and reflux event.",
    ingredients:[
      {name:"Pizza (any kind)",amount:"1–2 slices max",group:"grain"},
    ],
    steps:["If you eat it, eat very slowly.","1–2 slices maximum — your stomach capacity is reduced.","Stay upright for at least 2h after.","Avoid on or near injection day.","Drink water, not fizzy drinks alongside."],
    tip:"🚨 Pizza is one of the top reported foods that cause severe nausea on Mounjaro. The starch+protein+fat combination in a slowed stomach is rough. If you're at a social event and can't avoid it — 1 slice, eat slowly, and have ginger tea ready.",
    waitNote:"~6.5h to fully clear on Mounjaro. Your longest digestion item by far.",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useLocalData(key, initial) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; } catch { return initial; }
  });
  const save = (v) => { setVal(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };
  return [val, save];
}

const today = () => new Date().toISOString().split("T")[0];

function fmtMins(m) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function compatColor(str) {
  if (!str) return "#aaa";
  if (str.startsWith("✅")) return "#3d6b5e";
  if (str.startsWith("⚠️")) return "#b8860b";
  if (str.startsWith("❌")) return "#c0392b";
  return "#aaa";
}

// ─── FASTING CLOCK ────────────────────────────────────────────────────────────

function FastingClock({ eatStart=12, eatEnd=20 }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const h = now.getHours() + now.getMinutes() / 60;
  const winLen = eatEnd > eatStart ? eatEnd - eatStart : 24 - eatStart + eatEnd;
  const fastLen = 24 - winLen;
  const inWindow = eatEnd > eatStart ? (h >= eatStart && h < eatEnd) : (h >= eatStart || h < eatEnd);
  const fastingHours = !inWindow ? (h >= eatEnd ? h - eatEnd : 24 - eatEnd + h) : 0;
  const untilOpen = h < eatStart ? eatStart - h : 24 - h + eatStart;
  const untilClose = h < eatEnd ? eatEnd - h : 24 - h + eatEnd;
  const windowPct = inWindow ? (eatEnd > eatStart ? ((h - eatStart) / winLen) * 100 : ((h >= eatStart ? h - eatStart : 24 - eatStart + h) / winLen) * 100) : 0;
  const fmt = (hrs) => { const hh = Math.floor(Math.abs(hrs)), mm = Math.round((Math.abs(hrs)-hh)*60); return mm ? `${hh}h ${mm}m` : `${hh}h`; };
  const fmtHour = (h) => { const hh = Math.floor(h) % 24; return `${hh.toString().padStart(2,"0")}:00`; };
  const midPoint = fmtHour(eatStart + winLen/2);
  return (
    <div style={{background:"rgba(255,255,255,.1)",borderRadius:12,padding:14,marginTop:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500}}>{inWindow?"🟢 Eating Window Open":"🔵 Fasting"}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,marginTop:3}}>
            {inWindow ? `Closes in ${fmt(untilClose)}` : `Opens in ${fmt(untilOpen)}`}
          </div>
          {!inWindow && fastingHours > 0.1 && <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,opacity:.7,marginTop:2}}>Fasted {fmt(fastingHours)} so far</div>}
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:600}}>{fmtHour(eatStart)} – {fmtHour(eatEnd)}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,opacity:.65,marginTop:2}}>{winLen}h eating · {fastLen}h fast</div>
        </div>
      </div>
      <div style={{marginTop:12}}>
        <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,.55)",marginBottom:5}}>
          <span>{fmtHour(eatStart)}</span><span>{midPoint}</span><span>{fmtHour(eatEnd)}</span>
        </div>
        <div style={{height:7,background:"rgba(255,255,255,.15)",borderRadius:99,overflow:"hidden"}}>
          {inWindow && <div style={{height:"100%",width:`${Math.min(100,windowPct)}%`,background:"rgba(255,255,255,.7)",borderRadius:99,transition:"width 1s"}}/>}
        </div>
        {inWindow && <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,.55)",marginTop:4}}>{Math.round(Math.min(100,windowPct))}% through eating window</div>}
      </div>
    </div>
  );
}

// ─── RECIPE CARD ─────────────────────────────────────────────────────────────

function RecipeCard({ r, onClose }) {
  const [tab, setTab] = useState("recipe");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:100,overflowY:"auto",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px 0 40px"}}>
      <div style={{background:"#f7f5f0",width:"100%",maxWidth:420,borderRadius:18,overflow:"hidden",margin:"0 12px"}}>
        {/* Header */}
        <div style={{background:r.meal==="fruit"?"linear-gradient(135deg,#8b3a2a,#c0392b)":r.meal==="raw"?"linear-gradient(135deg,#2a4a40,#3d6b5e)":r.meal==="cooked"?"linear-gradient(135deg,#5c3118,#8b5e3c)":"linear-gradient(135deg,#4a4a20,#6b7a3d)",color:"white",padding:"20px 18px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:32,marginBottom:6}}>{r.emoji}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,lineHeight:1.2}}>{r.title}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,opacity:.75,marginTop:4}}>⏰ {r.windowTime}</div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.2)",border:"none",color:"white",width:32,height:32,borderRadius:50,fontSize:18,cursor:"pointer",flexShrink:0}}>×</button>
          </div>
          {/* Digest times */}
          <div style={{display:"flex",gap:10,marginTop:14}}>
            {[["Normal digestion", fmtMins(r.digestMins), "rgba(255,255,255,.15)"],["On Mounjaro", fmtMins(r.mjDigestMins), "rgba(255,255,255,.25)"]].map(([l,v,bg])=>(
              <div key={l} style={{flex:1,background:bg,borderRadius:9,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600}}>{v}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,opacity:.8,marginTop:1}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{display:"flex",background:"white",borderBottom:"1px solid #e8e4de"}}>
          {[["recipe","Recipe"],["combining","Combining"],["ingredients","Ingredients"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"11px 0",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,border:"none",background:"none",cursor:"pointer",color:tab===k?"#3d6b5e":"#999",borderBottom:`2px solid ${tab===k?"#3d6b5e":"transparent"}`,transition:"all .2s"}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:"16px 16px 24px"}}>

          {/* RECIPE TAB */}
          {tab==="recipe" && <>
            <div style={{background:"white",borderRadius:12,padding:15,marginBottom:12}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,color:"#2a4a40",marginBottom:10}}>Steps</div>
              {r.steps.map((s,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                  <div style={{width:22,height:22,borderRadius:50,background:"#3d6b5e",color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#333",lineHeight:1.5}}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{background:"#e8f0ec",borderLeft:"3px solid #3d6b5e",borderRadius:"0 10px 10px 0",padding:"11px 13px",marginBottom:12}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#2a4a40",lineHeight:1.5}}>{r.tip}</div>
            </div>
            <div style={{background:"white",borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:"#3d6b5e",marginBottom:2}}>⏱ After eating</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#555"}}>{r.waitNote}</div>
            </div>
          </>}

          {/* COMBINING TAB */}
          {tab==="combining" && <>
            <div style={{background:"white",borderRadius:12,padding:15,marginBottom:12}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,color:"#2a4a40",marginBottom:8}}>This Recipe</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:compatColor(r.combining),marginBottom:8}}>{r.combining}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#555",lineHeight:1.6}}>{r.combiningDetail}</div>
            </div>
            {/* Group compatibility grid */}
            <div style={{background:"white",borderRadius:12,padding:15,marginBottom:12}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,color:"#2a4a40",marginBottom:12}}>Ingredient Pairs</div>
              {r.ingredients.length > 1 ? (
                r.ingredients.flatMap((a,i) => r.ingredients.slice(i+1).map(b => {
                  const result = COMPAT[a.group]?.[b.group] ?? "—";
                  const ga = GROUPS[a.group], gb = GROUPS[b.group];
                  return (
                    <div key={`${i}-${b.name}`} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #f0ede8"}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,flex:1,color:"#555"}}>
                        <span style={{color:ga?.color}}>{ga?.emoji} {ga?.label}</span>
                        <span style={{color:"#ccc",margin:"0 6px"}}>+</span>
                        <span style={{color:gb?.color}}>{gb?.emoji} {gb?.label}</span>
                      </div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:compatColor(result),textAlign:"right",maxWidth:130}}>{result}</div>
                    </div>
                  );
                }))
              ) : <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#aaa"}}>Single ingredient — no pairing needed.</div>}
            </div>
            {/* Digestion wait */}
            <div style={{background:"#fff8f0",border:"1.5px solid #f0ddc0",borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:"#8b5e3c",marginBottom:4}}>⏰ Digestion Window</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#7a4f2e",lineHeight:1.6}}>
                Normal: <b>{fmtMins(r.digestMins)}</b> · On Mounjaro: <b>{fmtMins(r.mjDigestMins)}</b><br/>
                {r.waitNote}
              </div>
            </div>
          </>}

          {/* INGREDIENTS TAB */}
          {tab==="ingredients" && <>
            <div style={{background:"white",borderRadius:12,padding:15,marginBottom:12}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,color:"#2a4a40",marginBottom:12}}>Ingredients</div>
              {r.ingredients.map((ing,i)=>{
                const g = GROUPS[ing.group];
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #f7f5f0"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${g?.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{g?.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:"#2c2c2c"}}>{ing.name}</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:g?.color,marginTop:1}}>{g?.label}</div>
                    </div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",textAlign:"right"}}>{ing.amount}</div>
                  </div>
                );
              })}
            </div>
            {/* Food group guide */}
            <div style={{background:"white",borderRadius:12,padding:15}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,color:"#2a4a40",marginBottom:12}}>Digestion Guide</div>
              {Object.entries(GROUPS).map(([key,g])=>(
                <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f7f5f0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>{g.emoji}</span>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#555"}}>{g.label}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#888"}}>{fmtMins(g.digestMins)}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:g.color}}>MJ: {fmtMins(g.mjMins)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>}

        </div>
      </div>
    </div>
  );
}

// ─── AI FOOD COMBINER ────────────────────────────────────────────────────────

function FoodCombiner() {
  const [foods, setFoods] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const SYSTEM = `You are a food combining expert specialising in natural hygiene principles (Shelton/Diamond) and Mounjaro (tirzepatide) digestion. 

When given a list of foods, respond ONLY with a JSON object (no markdown, no backticks) in this exact shape:
{
  "foods": [
    {
      "name": "pineapple",
      "category": "Acid Fruit",
      "emoji": "🍍",
      "digestMins": 40,
      "mjDigestMins": 65,
      "note": "One-line fact about this food re: digestion"
    }
  ],
  "pairs": [
    {
      "a": "pineapple",
      "b": "kiwi",
      "verdict": "✅",
      "label": "Great combo",
      "reason": "Both acid fruits — same digestive chemistry, clean combination."
    }
  ],
  "summary": "One overall sentence about eating all these foods together."
}

Categories to use: Sweet Fruit, Acid Fruit, Sub-acid Fruit, Melon, Non-starchy Veg, Starchy Veg, Grain/Legume, Protein, Healthy Fat, Processed Starch, Processed Sugar, Processed Fat+Starch.

Verdict must be exactly one of: ✅ ⚠️ ❌

Mounjaro slows digestion 1.5–2×. digestMins is normal digestion time, mjDigestMins is on Mounjaro.

Food combining rules:
- Fruit always alone (each subtype separate)
- Melon ALWAYS alone, strictest rule
- Acid + sub-acid fruit = ok; acid + sweet = bad; sweet + sub-acid = ok
- Protein + non-starchy veg = ✅; protein + starch = ❌; protein + fruit = ❌
- Starch + non-starchy veg = ✅; starch + protein = ❌; starch + fat = ⚠️ (slows)
- Fat + veg = ✅; fat + starch = ⚠️; fat + fruit = ❌
- Peanut butter = protein+fat, not just fat
- Processed foods (bread, chips, chocolate, candy) get realistic combining notes`;

  const analyse = async () => {
    if (foods.length < 1) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM,
          messages: [{ role: "user", content: `Analyse these foods: ${foods.join(", ")}` }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setResult(parsed);
    } catch(e) {
      setError("Couldn't analyse — try again.");
    }
    setLoading(false);
  };

  const addFood = () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || foods.includes(trimmed)) return;
    setFoods(p => [...p, trimmed]);
    setInput("");
    setResult(null);
  };

  const removeFood = (f) => {
    setFoods(p => p.filter(x => x !== f));
    setResult(null);
  };

  const verdictColor = (v) => v === "✅" ? "#3d6b5e" : v === "⚠️" ? "#b8860b" : "#c0392b";
  const verdictBg   = (v) => v === "✅" ? "#f0f7f4" : v === "⚠️" ? "#fdf8ec" : "#fdf0ee";

  return (
    <div>
      {/* Input row */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addFood()}
          placeholder="Type a food (e.g. pineapple)..."
          style={{flex:1,border:"1.5px solid #e8e4de",borderRadius:9,padding:"10px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#2c2c2c",background:"#fafaf8",outline:"none"}}
        />
        <button onClick={addFood} style={{padding:"10px 14px",background:"#3d6b5e",color:"white",border:"none",borderRadius:9,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer",flexShrink:0}}>Add</button>
      </div>

      {/* Food chips */}
      {foods.length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
          {foods.map(f=>(
            <div key={f} style={{display:"flex",alignItems:"center",gap:5,background:"#f0f7f4",border:"1.5px solid #c0d8d0",borderRadius:99,padding:"4px 10px 4px 12px"}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#2a4a40"}}>{f}</span>
              <button onClick={()=>removeFood(f)} style={{background:"none",border:"none",color:"#aaa",fontSize:15,cursor:"pointer",padding:"0 2px",lineHeight:1}}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Analyse button */}
      {foods.length >= 1 && !loading && (
        <button onClick={analyse} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#3d6b5e,#2a4a40)",color:"white",border:"none",borderRadius:11,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,cursor:"pointer",marginBottom:result?14:0}}>
          {foods.length === 1 ? `Look up "${foods[0]}"` : `Check ${foods.length} foods together`}
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#888"}}>Analysing{foods.length>1?" combinations":""}…</div>
          <div style={{display:"flex",justifyContent:"center",gap:5,marginTop:10}}>
            {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:50,background:"#3d6b5e",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#c0392b",padding:"10px 0"}}>{error}</div>}

      {/* Results */}
      {result && (
        <div>
          {/* Per-food cards */}
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:".8px",marginBottom:8}}>Food Profiles</div>
            {result.foods?.map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#f7f5f0",borderRadius:11,marginBottom:7}}>
                <div style={{fontSize:26,flexShrink:0}}>{f.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:"#2a4a40",textTransform:"capitalize"}}>{f.name}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#aaa",textAlign:"right"}}>MJ: {f.mjDigestMins}min</div>
                  </div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#3d6b5e",marginTop:2,fontWeight:500}}>{f.category}</div>
                  {f.note && <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",marginTop:3,lineHeight:1.4}}>{f.note}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Pair verdicts */}
          {result.pairs?.length > 0 && (
            <div style={{marginBottom:14}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:".8px",marginBottom:8}}>Combining Results</div>
              {result.pairs.map((p,i)=>(
                <div key={i} style={{background:verdictBg(p.verdict),border:`1.5px solid ${verdictColor(p.verdict)}33`,borderRadius:11,padding:"11px 13px",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#2c2c2c"}}>
                      <span style={{textTransform:"capitalize"}}>{p.a}</span>
                      <span style={{color:"#ccc",margin:"0 6px"}}>+</span>
                      <span style={{textTransform:"capitalize"}}>{p.b}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:16}}>{p.verdict}</span>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:500,color:verdictColor(p.verdict)}}>{p.label}</span>
                    </div>
                  </div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#555",lineHeight:1.5}}>{p.reason}</div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {result.summary && (
            <div style={{background:"#e8f0ec",borderLeft:"3px solid #3d6b5e",borderRadius:"0 10px 10px 0",padding:"11px 13px"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#2a4a40",lineHeight:1.5}}>🌿 {result.summary}</div>
            </div>
          )}

          {/* Reset */}
          <button onClick={()=>{setFoods([]);setResult(null);}} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#aaa",background:"none",border:"none",cursor:"pointer",padding:"12px 0 0",display:"block"}}>
            ← Start over
          </button>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function MounjaroApp() {
  const [tab, setTab] = useState("today");
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const [editingWeight, setEditingWeight] = useState(null); // { date, value }
  const [dose, setDose] = useLocalData("mj_dose", "2.5 mg");
  const [startDate, setStartDate] = useLocalData("mj_start", today());
  const [eatStart, setEatStart] = useLocalData("mj_eatstart", 12);
  const [eatEnd, setEatEnd] = useLocalData("mj_eatend", 20);
  const [lastInjection, setLastInjection] = useLocalData("mj_lastinj", null);
  const [injectionLog, setInjectionLog] = useLocalData("mj_injlog", []);
  const [logs, setLogs] = useLocalData("mj_logs", {});
  const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [mealInput, setMealInput] = useState({ type:"fruit", desc:"" });
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealLookupText, setMealLookupText] = useState("");
  const [mealLookupLoading, setMealLookupLoading] = useState(false);
  const [mealLookupResult, setMealLookupResult] = useState(null); // { emoji, category, type, mjDigestMins, note }
  const [showInjForm, setShowInjForm] = useState(false);
  const [selectedSite, setSelectedSite] = useState("");
  const [openRecipe, setOpenRecipe] = useState(null);
  const [recipeFilter, setRecipeFilter] = useState("all");
  const [combinerGroups, setCombinerGroups] = useState([]);

  const INJ_SITES = [
    { id:"belly-left",  label:"Belly Left",  emoji:"⬅️", group:"belly" },
    { id:"belly-right", label:"Belly Right", emoji:"➡️", group:"belly" },
    { id:"thigh-left",  label:"Thigh Left",  emoji:"🦵", group:"thigh" },
    { id:"thigh-right", label:"Thigh Right", emoji:"🦵", group:"thigh" },
    { id:"arm-left",    label:"Arm Left",    emoji:"💪", group:"arm" },
    { id:"arm-right",   label:"Arm Right",   emoji:"💪", group:"arm" },
  ];

  const lastUsedSite = injectionLog.length > 0 ? injectionLog[injectionLog.length-1].site : null;
  const suggestedSite = (() => {
    if (!lastUsedSite) return INJ_SITES[0];
    const idx = INJ_SITES.findIndex(s => s.id === lastUsedSite);
    return INJ_SITES[(idx + 1) % INJ_SITES.length];
  })();

  const logInjection = () => {
    if (!selectedSite) return;
    const entry = { date: todayKey, site: selectedSite };
    setInjectionLog([...injectionLog, entry]);
    setLastInjection(todayKey);
    updateToday({ injSite: selectedSite });
    setShowInjForm(false);
    setSelectedSite("");
  };

  const todayKey = today();
  const todayLog = logs[todayKey] || { water:0, protein:0, weight:"", symptoms:[], notes:"", meals:[], fruited:false };
  const updateToday = (patch) => setLogs({ ...logs, [todayKey]:{ ...todayLog, ...patch } });

  const daysOnMed = Math.max(1, Math.floor((new Date(todayKey)-new Date(startDate))/86400000)+1);
  const nextInjection = lastInjection ? new Date(new Date(lastInjection).getTime()+7*86400000).toISOString().split("T")[0] : null;
  const daysUntilNext = nextInjection ? Math.ceil((new Date(nextInjection)-new Date(todayKey))/86400000) : null;

  const weightEntries = Object.entries(logs).filter(([,v])=>v.weight).sort(([a],[b])=>a.localeCompare(b)).map(([d,v])=>({date:d,weight:parseFloat(v.weight)}));
  const startWeight = weightEntries[0]?.weight;
  const latestWeight = weightEntries[weightEntries.length-1]?.weight;
  const totalLoss = startWeight && latestWeight ? (startWeight-latestWeight).toFixed(1) : null;

  const toggleSymptom = (s) => {
    const cur = todayLog.symptoms||[];
    updateToday({ symptoms: cur.includes(s)?cur.filter(x=>x!==s):[...cur,s] });
  };

  const lookupMeal = async (text) => {
    if (!text.trim()) return;
    setMealLookupLoading(true);
    setMealLookupResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:300,
          system:`You are a food combining and digestion expert. Given a food or meal description, return ONLY a JSON object (no markdown, no backticks) with these exact fields:
{
  "emoji": "🍍",
  "category": "Acid Fruit",
  "type": "fruit",
  "mjDigestMins": 65,
  "note": "One short sentence about this food's digestion or combining rule."
}

type must be exactly one of: fruit, raw, cooked, snack, realistic
category options: Sweet Fruit, Acid Fruit, Sub-acid Fruit, Melon, Non-starchy Veg, Starchy Veg, Grain/Legume, Protein, Healthy Fat, Processed Starch, Processed Sugar, Mixed/Cooked Meal
mjDigestMins is digestion time in minutes on Mounjaro (1.5-2x normal).
Typical ranges: melon 40, acid fruit 65, sweet fruit 90, raw veg 75-145, grain 185, protein 275, processed starch 270-390.
For mixed meals (e.g. "salad with avocado and seeds") use the slowest-digesting component.`,
          messages:[{role:"user", content:`Food: ${text.trim()}`}]
        })
      });
      const data = await res.json();
      const txt = data.content?.find(b=>b.type==="text")?.text||"";
      const parsed = JSON.parse(txt.replace(/```json|```/g,"").trim());
      setMealLookupResult(parsed);
    } catch(e) {
      setMealLookupResult({ emoji:"🍽", category:"Unknown", type:"cooked", mjDigestMins:120, note:"Couldn't identify — category set to Cooked Meal." });
    }
    setMealLookupLoading(false);
  };

  const addMeal = () => {
    const desc = mealLookupText.trim();
    if (!desc) return;
    const type = mealLookupResult?.type || "cooked";
    const meals = [...(todayLog.meals||[]), {
      type,
      desc,
      emoji: mealLookupResult?.emoji || "🍽",
      category: mealLookupResult?.category || "",
      mjDigestMins: mealLookupResult?.mjDigestMins,
      time: new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})
    }];
    updateToday({ meals, fruited:meals.some(m=>m.type==="fruit") });
    setMealLookupText("");
    setMealLookupResult(null);
    setShowMealForm(false);
  };

  const removeMeal = (i) => {
    const meals = (todayLog.meals||[]).filter((_,idx)=>idx!==i);
    updateToday({ meals, fruited:meals.some(m=>m.type==="fruit") });
  };

  const rawCount = (todayLog.meals||[]).filter(m=>m.type==="fruit"||m.type==="raw").length;
  const totalMeals = (todayLog.meals||[]).length;
  const rawPct = totalMeals > 0 ? Math.round((rawCount/totalMeals)*100) : 0;

  // Digestion timeline — compute clear time for each meal logged today
  const digestTimeline = (todayLog.meals||[]).map((m, i) => {
    const ate = parseTimeToDate(m.time);
    if (!ate) return null;
    const mins = m.mjDigestMins || MEAL_DIGEST_MJ[m.type] || 90;
    const clearAt = new Date(ate.getTime() + mins * 60000);
    const minsLeft = Math.round((clearAt - now) / 60000);
    const pctDone = Math.min(100, Math.max(0, Math.round(((now - ate) / (clearAt - ate)) * 100)));
    return { ...m, index: i, ate, clearAt, mins, minsLeft, pctDone, cleared: minsLeft <= 0 };
  }).filter(Boolean);

  const nextSafeEat = digestTimeline.length > 0
    ? digestTimeline.reduce((latest, m) => m.clearAt > latest ? m.clearAt : latest, digestTimeline[0].clearAt)
    : null;
  const minsUntilSafe = nextSafeEat ? Math.round((nextSafeEat - now) / 60000) : null;

  const filteredRecipes = recipeFilter==="all" ? RECIPES : RECIPES.filter(r=>r.meal===recipeFilter);

  // Combiner: check compatibility between selected groups
  const toggleCombiner = (key) => setCombinerGroups(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev, key]);
  const combinerResult = () => {
    if (combinerGroups.length < 2) return null;
    const pairs = [];
    for (let i=0;i<combinerGroups.length;i++) for (let j=i+1;j<combinerGroups.length;j++) {
      const a=combinerGroups[i], b=combinerGroups[j];
      const r = COMPAT[a]?.[b] ?? "—";
      pairs.push({ a, b, result:r });
    }
    return pairs;
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#f7f5f0;}
    .app{max-width:420px;margin:0 auto;padding:0 0 80px;}
    .hdr{background:linear-gradient(135deg,#2a4a40,#1a3530);color:white;padding:22px 18px 16px;}
    .hdr h1{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:600;letter-spacing:.5px;}
    .hdr p{font-family:'DM Sans',sans-serif;font-size:12px;opacity:.65;margin-top:2px;}
    .srow{display:flex;gap:8px;padding:12px 0 0;}
    .stt{flex:1;background:rgba(255,255,255,.12);border-radius:10px;padding:9px 10px;text-align:center;}
    .stt .n{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;}
    .stt .l{font-family:'DM Sans',sans-serif;font-size:10px;opacity:.75;margin-top:2px;}
    .tipbar{background:#e8f0ec;border-left:3px solid #3d6b5e;margin:13px;padding:10px 13px;border-radius:0 8px 8px 0;font-family:'DM Sans',sans-serif;font-size:13px;color:#2a4a40;line-height:1.5;}
    .tabs{display:flex;background:white;border-bottom:1px solid #e8e4de;position:sticky;top:0;z-index:10;}
    .tab{flex:1;padding:12px 0;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;text-align:center;border:none;background:none;cursor:pointer;color:#999;border-bottom:2px solid transparent;transition:all .2s;}
    .tab.on{color:#3d6b5e;border-bottom-color:#3d6b5e;}
    .sec{padding:14px 13px;}
    .card{background:white;border-radius:14px;padding:15px;margin-bottom:11px;box-shadow:0 1px 4px rgba(0,0,0,.06);}
    .ctitle{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:#2a4a40;margin-bottom:11px;}
    .trow{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
    .brnd{width:30px;height:30px;border-radius:50%;border:1.5px solid #3d6b5e;background:white;color:#3d6b5e;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .brnd:active{background:#3d6b5e;color:white;}
    .cnt{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:#3d6b5e;min-width:34px;text-align:center;}
    .pb{height:7px;background:#e8e4de;border-radius:99px;overflow:hidden;margin-top:5px;}
    .pf{height:100%;background:linear-gradient(90deg,#3d6b5e,#5a9b87);border-radius:99px;transition:width .4s;}
    .inp{width:100%;border:1.5px solid #e8e4de;border-radius:9px;padding:10px 12px;font-family:'DM Sans',sans-serif;font-size:14px;color:#2c2c2c;background:#fafaf8;outline:none;transition:border .2s;}
    .inp:focus{border-color:#3d6b5e;}
    textarea.inp{resize:none;height:72px;}
    .sgrid{display:flex;flex-wrap:wrap;gap:7px;}
    .sbtn{font-family:'DM Sans',sans-serif;font-size:12px;padding:5px 11px;border-radius:99px;border:1.5px solid #d8d4ce;background:white;cursor:pointer;transition:all .15s;color:#555;}
    .sbtn.on{background:#3d6b5e;color:white;border-color:#3d6b5e;}
    .ijbtn{width:100%;padding:13px;background:linear-gradient(135deg,#3d6b5e,#2a4a40);color:white;border:none;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;}
    .ninj{text-align:center;padding:11px;background:#f0f7f4;border-radius:10px;margin-top:10px;}
    .ninj .big{font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:600;color:#3d6b5e;}
    .ninj .sm{font-family:'DM Sans',sans-serif;font-size:11px;color:#888;margin-top:2px;}
    .sel{width:100%;border:1.5px solid #e8e4de;border-radius:9px;padding:10px 12px;font-family:'DM Sans',sans-serif;font-size:14px;background:#fafaf8;color:#2c2c2c;outline:none;cursor:pointer;}
    .mchip{display:flex;align-items:center;justify-content:space-between;background:#f7f5f0;border-radius:9px;padding:9px 12px;margin-bottom:7px;}
    .mtgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
    .mtbtn{padding:10px 8px;border-radius:10px;border:1.5px solid #e8e4de;background:white;cursor:pointer;text-align:left;transition:all .15s;}
    .mtbtn.on{border-color:#3d6b5e;background:#f0f7f4;}
    .addbtn{width:100%;padding:11px;border:1.5px dashed #c0d8d0;border-radius:10px;background:white;color:#3d6b5e;font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;}
    .confbtn{width:100%;padding:11px;background:#3d6b5e;color:white;border:none;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;margin-top:8px;}
    .srow2{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid #f0ede8;}
    .srow2:last-child{border-bottom:none;}
    .slbl{font-family:'DM Sans',sans-serif;font-size:14px;color:#2c2c2c;}
    .ssub{font-family:'DM Sans',sans-serif;font-size:12px;color:#aaa;margin-top:2px;}
    .lentry{border-bottom:1px solid #f0ede8;padding:11px 0;}
    .lentry:last-child{border-bottom:none;}
    .empty{text-align:center;padding:26px 0;color:#bbb;font-family:'DM Sans',sans-serif;font-size:14px;}
    .dx{background:none;border:none;color:#ccc;font-size:17px;cursor:pointer;padding:0 3px;}
    .rfiltrow{display:flex;gap:7px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px;}
    .rfilt{font-family:'DM Sans',sans-serif;font-size:12px;padding:6px 13px;border-radius:99px;border:1.5px solid #d8d4ce;background:white;cursor:pointer;white-space:nowrap;color:#555;transition:all .15s;}
    .rfilt.on{background:#2a4a40;color:white;border-color:#2a4a40;}
    .rcard{background:white;border-radius:14px;overflow:hidden;margin-bottom:12px;box-shadow:0 1px 6px rgba(0,0,0,.07);cursor:pointer;transition:transform .15s;}
    .rcard:active{transform:scale(.98);}
    .rcardtop{padding:14px 14px 10px;}
    .rcardbot{background:#f7f5f0;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;}
    .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
    .cgbtn{padding:10px;border-radius:11px;border:1.5px solid #e8e4de;background:white;cursor:pointer;text-align:center;transition:all .15s;}
    .cgbtn.on{border-width:2px;}
  `;

  return (
    <div style={{background:"#f7f5f0",minHeight:"100vh"}}>
      <style>{css}</style>
      {openRecipe && <RecipeCard r={openRecipe} onClose={()=>setOpenRecipe(null)}/>}
      <div className="app">

        {/* HEADER */}
        <div className="hdr">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><h1>Mounjaro Journal</h1><p>IF {24-(eatEnd-eatStart > 0 ? eatEnd-eatStart : 24-eatStart+eatEnd)}:{eatEnd-eatStart > 0 ? eatEnd-eatStart : 24-eatStart+eatEnd} · Raw-first · {dose}</p></div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,opacity:.7}}>DAY</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600,lineHeight:1}}>{daysOnMed}</div>
            </div>
          </div>
          <div className="srow">
            {[["Dose",dose],["Lost",totalLoss?`−${totalLoss} kg`:"—"],["Raw meals",`${(todayLog.meals||[]).filter(m=>m.type==="fruit"||m.type==="raw").length} today`]].map(([l,n])=>(
              <div className="stt" key={l}><div className="n">{n}</div><div className="l">{l}</div></div>
            ))}
          </div>
          <FastingClock eatStart={eatStart} eatEnd={eatEnd}/>
        </div>

        <div className="tipbar">{tip}</div>

        {/* TABS */}
        <div className="tabs">
          {[["today","Today"],["recipes","Recipes"],["food","Food"],["log","Log"],["settings","⚙️"]].map(([k,l])=>(
            <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {/* ── TODAY ── */}
        {tab==="today" && (
          <div className="sec">
            <div style={{borderRadius:12,padding:"12px 14px",marginBottom:11,display:"flex",alignItems:"center",gap:10,background:todayLog.fruited?"linear-gradient(135deg,#f0f7f4,#e4f5ed)":"linear-gradient(135deg,#fef3f0,#fde8e4)",border:`1.5px solid ${todayLog.fruited?"#b5d9c5":"#f5c5bc"}`}}>
              <div style={{fontSize:28}}>{todayLog.fruited?"✅":"🍓"}</div>
              <div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:todayLog.fruited?"#2a6b45":"#8b3a2a"}}>{todayLog.fruited?"Fruit break-fast logged!":"Break fast with fruit at 12:00"}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",marginTop:2}}>{todayLog.fruited?"Great start 🌿":"Log your first meal below — check Recipes for ideas"}</div>
              </div>
            </div>

            {/* Compact injection status */}
            {lastInjection && (
              <div style={{background:"white",borderRadius:11,padding:"10px 14px",marginBottom:11,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>💉</span>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888"}}>
                    {todayLog.injSite ? `Injected today · ${INJ_SITES.find(s=>s.id===todayLog.injSite)?.label}` : "Last injection: " + lastInjection}
                  </div>
                </div>
                <div>
                  {daysUntilNext===0 ? <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,background:"#fef3f0",color:"#e05a4a",padding:"3px 9px",borderRadius:99}}>Due today</span>
                  : daysUntilNext>0 ? <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,background:"#f0f7f4",color:"#3d6b5e",padding:"3px 9px",borderRadius:99}}>Next in {daysUntilNext}d</span>
                  : <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,background:"#fdf0ee",color:"#c0392b",padding:"3px 9px",borderRadius:99}}>Overdue</span>}
                </div>
              </div>
            )}

            {/* Water */}
            <div className="card">
              <div className="ctitle">💧 Water</div>
              <div className="trow">
                <button className="brnd" onClick={()=>updateToday({water:Math.max(0,(todayLog.water||0)-1)})}>−</button>
                <div className="cnt">{todayLog.water||0}</div>
                <button className="brnd" onClick={()=>updateToday({water:(todayLog.water||0)+1})}>+</button>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#888"}}>× 8oz glasses (goal: 8)</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",marginBottom:4}}><span>{todayLog.water||0} / 8</span><span>{Math.min(100,Math.round(((todayLog.water||0)/8)*100))}%</span></div>
              <div className="pb"><div className="pf" style={{width:`${Math.min(100,(((todayLog.water||0)/8)*100))}%`}}/></div>
            </div>

            {/* Raw % + Today's Meals */}
            <div className="card">
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
                <svg width="48" height="48" viewBox="0 0 60 60" style={{flexShrink:0}}>
                  <circle cx="30" cy="30" r="24" fill="none" stroke="#e8e4de" strokeWidth="6"/>
                  <circle cx="30" cy="30" r="24" fill="none" stroke="#3d6b5e" strokeWidth="6" strokeDasharray={`${rawPct*1.508} 150.8`} strokeDashoffset="37.7" strokeLinecap="round"/>
                  <text x="30" y="35" textAnchor="middle" fontFamily="'Cormorant Garamond'" fontSize="13" fontWeight="600" fill="#2a4a40">{rawPct}%</text>
                </svg>
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,color:"#2a4a40"}}>Today's Meals</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",marginTop:2}}>{rawCount} of {totalMeals} raw or fruit · goal: open with fruit 🍓</div>
                </div>
              </div>

              {totalMeals===0&&<div className="empty" style={{padding:"10px 0"}}>No meals yet</div>}
              {(todayLog.meals||[]).map((m,i)=>{
                const mt=MEAL_TYPES.find(x=>x.id===m.type);
                return (
                  <div className="mchip" key={i}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{fontSize:20,flexShrink:0}}>{m.emoji||mt?.label?.split(" ")[0]||"🍽"}</div>
                      <div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:mt?.color}}>{m.category||mt?.label}</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#444",marginTop:1}}>{m.desc}</div>
                        {m.mjDigestMins&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#aaa",marginTop:1}}>⏱ {m.mjDigestMins}min on MJ</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa"}}>{m.time}</div>
                      <button className="dx" onClick={()=>removeMeal(i)}>×</button>
                    </div>
                  </div>
                );
              })}

              {showMealForm ? (
                <div style={{marginTop:12}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:".8px",marginBottom:8}}>What did you eat?</div>
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    <input className="inp" placeholder="e.g. pineapple, banana smoothie, lentil soup..."
                      value={mealLookupText}
                      onChange={e=>{setMealLookupText(e.target.value);setMealLookupResult(null);}}
                      onKeyDown={e=>e.key==="Enter"&&mealLookupText.trim()&&lookupMeal(mealLookupText)}
                      style={{flex:1}}/>
                    <button onClick={()=>lookupMeal(mealLookupText)} disabled={!mealLookupText.trim()||mealLookupLoading}
                      style={{padding:"10px 13px",background:mealLookupText.trim()?"#3d6b5e":"#e8e4de",color:"white",border:"none",borderRadius:9,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:mealLookupText.trim()?"pointer":"default",flexShrink:0}}>
                      {mealLookupLoading?"…":"Look up"}
                    </button>
                  </div>
                  {mealLookupLoading&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",color:"#aaa",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
                      <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:50,background:"#3d6b5e",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
                      Identifying food…
                    </div>
                  )}
                  {mealLookupResult&&(
                    <div style={{background:"#f0f7f4",border:"1.5px solid #b5d9c5",borderRadius:11,padding:"12px 14px",marginBottom:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                        <div style={{fontSize:26}}>{mealLookupResult.emoji}</div>
                        <div>
                          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:"#2a4a40",textTransform:"capitalize"}}>{mealLookupText}</div>
                          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3d6b5e",marginTop:1}}>{mealLookupResult.category}</div>
                        </div>
                        <div style={{marginLeft:"auto",textAlign:"right"}}>
                          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:"#8b5e3c"}}>{mealLookupResult.mjDigestMins}min</div>
                          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#aaa"}}>MJ digest</div>
                        </div>
                      </div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#555",lineHeight:1.5}}>{mealLookupResult.note}</div>
                      <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #d5ead5"}}>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#aaa",marginBottom:6,textTransform:"uppercase",letterSpacing:".6px"}}>Meal type — tap to change</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {MEAL_TYPES.map(mt=>(
                            <button key={mt.id} onClick={()=>setMealLookupResult(p=>({...p,type:mt.id}))}
                              style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,padding:"4px 10px",borderRadius:99,border:`1.5px solid ${mealLookupResult.type===mt.id?mt.color:"#d8d4ce"}`,background:mealLookupResult.type===mt.id?`${mt.color}18`:"white",color:mealLookupResult.type===mt.id?mt.color:"#666",cursor:"pointer"}}>
                              {mt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <button className="confbtn" onClick={addMeal} disabled={!mealLookupText.trim()} style={{opacity:mealLookupText.trim()?1:0.4}}>
                    {mealLookupResult?`Log ${mealLookupResult.emoji} ${mealLookupText}`:"Log Meal"}
                  </button>
                  <div style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#aaa",cursor:"pointer",marginTop:8}}
                    onClick={()=>{setShowMealForm(false);setMealLookupText("");setMealLookupResult(null);}}>Cancel</div>
                </div>
              ):(
                <button className="addbtn" style={{marginTop:totalMeals>0?10:0}} onClick={()=>setShowMealForm(true)}>+ Log a meal</button>
              )}
            </div>

            {/* Digestion timeline */}
            {digestTimeline.length > 0 && (
              <div className="card">
                <div className="ctitle">⏱ Digestion Timeline</div>
                <div style={{borderRadius:10,padding:"11px 13px",marginBottom:14,background:minsUntilSafe<=0?"linear-gradient(135deg,#f0f7f4,#e4f5ed)":"linear-gradient(135deg,#fff8f0,#fef0e4)",border:`1.5px solid ${minsUntilSafe<=0?"#b5d9c5":"#f0d5b0"}`}}>
                  {minsUntilSafe<=0?(
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{fontSize:22}}>✅</div>
                      <div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:"#2a6b45"}}>Stomach clear — safe to eat</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#888",marginTop:1}}>All meals fully digested</div>
                      </div>
                    </div>
                  ):(
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#8b5e3c"}}>Next safe eating time</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:"#8b5e3c",marginTop:2}}>{fmtTime(nextSafeEat)}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,color:"#d4703a"}}>{minsUntilSafe>=60?`${Math.floor(minsUntilSafe/60)}h ${minsUntilSafe%60}m`:`${minsUntilSafe}m`}</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#aaa",marginTop:1}}>to wait</div>
                      </div>
                    </div>
                  )}
                </div>
                {digestTimeline.map((m,i)=>{
                  const mt=MEAL_TYPES.find(x=>x.id===m.type);
                  const barColor=m.cleared?"#b5d9c5":mt?.color||"#3d6b5e";
                  return (
                    <div key={i} style={{marginBottom:i<digestTimeline.length-1?14:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:m.cleared?"#aaa":mt?.color}}>{m.emoji||mt?.label}</span>
                          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#bbb"}}>· {m.time}</span>
                        </div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11}}>
                          {m.cleared?<span style={{color:"#3d6b5e"}}>✓ cleared</span>:<span style={{color:"#8b5e3c"}}>clears {fmtTime(m.clearAt)}</span>}
                        </div>
                      </div>
                      <div style={{height:8,background:"#f0ede8",borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${m.pctDone}%`,background:m.cleared?"linear-gradient(90deg,#5a9b87,#3d6b5e)":`linear-gradient(90deg,${barColor}88,${barColor})`,borderRadius:99,transition:"width 30s linear"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#ccc",marginTop:3}}>
                        <span>{fmtTime(m.ate)}</span>
                        <span>{m.cleared?`${fmtMins(m.mins)} total`:`${m.minsLeft>=60?`${Math.floor(m.minsLeft/60)}h ${m.minsLeft%60}m`:`${m.minsLeft}m`} left`}</span>
                        <span>{fmtTime(m.clearAt)}</span>
                      </div>
                      {m.desc&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",marginTop:3,fontStyle:"italic"}}>{m.desc}</div>}
                    </div>
                  );
                })}
                <div style={{marginTop:14,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#bbb",lineHeight:1.5,borderTop:"1px solid #f0ede8",paddingTop:10}}>
                  Digestion times estimated for Mounjaro (1.5–2× normal). Fruit: ~65 min · Raw: ~2h · Cooked: ~3.5h
                </div>
              </div>
            )}

            {/* Symptoms, weight, notes */}
            <div className="card">
              <div className="ctitle">🩺 How You Feel</div>
              <div className="sgrid">
                {SYMPTOMS.map(s=><button key={s} className={`sbtn${(todayLog.symptoms||[]).includes(s)?" on":""}`} onClick={()=>toggleSymptom(s)}>{s}</button>)}
              </div>
            </div>
            <div className="card"><div className="ctitle">⚖️ Weight</div><input className="inp" type="number" placeholder="Today's weight (kg)" value={todayLog.weight||""} onChange={e=>updateToday({weight:e.target.value})}/></div>
            <div className="card"><div className="ctitle">📝 Notes</div><textarea className="inp" placeholder="Energy levels, digestion, observations..." value={todayLog.notes||""} onChange={e=>updateToday({notes:e.target.value})}/></div>
          </div>
        )}

        {/* ── RECIPES ── */}
        {tab==="recipes" && (
          <div className="sec">
            <div className="rfiltrow">
              {[["all","All"],["fruit","🍓 Break-Fast"],["raw","🥗 Raw"],["cooked","🍲 Cooked"],["snack","🌰 Snack"],["realistic","🍫 Real Life"]].map(([k,l])=>(
                <button key={k} className={`rfilt${recipeFilter===k?" on":""}`} onClick={()=>setRecipeFilter(k)}>{l}</button>
              ))}
            </div>
            {filteredRecipes.map(r=>(
              <div className="rcard" key={r.id} onClick={()=>setOpenRecipe(r)}>
                <div className="rcardtop">
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <div style={{fontSize:30,lineHeight:1}}>{r.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:"#2a4a40"}}>{r.title}</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",marginTop:2}}>⏰ {r.windowTime}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
                        {r.tags.map(t=><span key={t} style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,background:"#f0f7f4",color:"#3d6b5e",padding:"2px 8px",borderRadius:99}}>{t}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rcardbot">
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:compatColor(r.combining)}}>{r.combining.split("—")[0].trim()}</div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa"}}>MJ digest</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:600,color:"#8b5e3c"}}>{fmtMins(r.mjDigestMins)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FOOD KNOWLEDGE ── */}
        {tab==="food" && (
          <div className="sec">

            {/* Food Combiner — AI */}
            <div className="card">
              <div className="ctitle">🔬 Food Combiner</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#888",marginBottom:14}}>Type any foods — I'll identify the category, check if they combine, and give you the Mounjaro digestion time.</div>
              <FoodCombiner />
            </div>

            {/* Digestion reference */}
            <div className="card">
              <div className="ctitle">⏱ Digestion Times</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",marginBottom:10}}>On Mounjaro, digestion is 1.5–2× slower. Space meals accordingly.</div>
              {Object.entries(GROUPS).map(([key,g])=>(
                <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f7f5f0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>{g.emoji}</span>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#555"}}>{g.label}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#888"}}>{fmtMins(g.digestMins)}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:g.color,marginTop:1}}>MJ: {fmtMins(g.mjMins)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* What is what guide */}
            {[
              {
                key:"melon", title:"Melon", subtitle:"Always eat alone — never combine with anything", color:"#27ae60", bg:"#f0faf4",
                items:[
                  {e:"🍉",n:"Watermelon"},{e:"🍈",n:"Honeydew"},{e:"🫐",n:"Canteloupe"},{e:"🟡",n:"Galia melon"},{e:"🟠",n:"Charentais"},{e:"🟤",n:"Casaba melon"},
                ]
              },
              {
                key:"sweetFruit", title:"Sweet Fruit", subtitle:"Eat alone or with other sweet/sub-acid fruit", color:"#d4a020", bg:"#fdf8ec",
                items:[
                  {e:"🍌",n:"Banana"},{e:"🥭",n:"Mango"},{e:"🌴",n:"Dates"},{e:"🍇",n:"Dried figs"},{e:"🟤",n:"Dried apricot"},{e:"🍑",n:"Dried peach"},{e:"🍒",n:"Dried cherry"},{e:"🟡",n:"Plantain"},{e:"🫐",n:"Açaí"},{e:"🟤",n:"Tamarind"},
                ]
              },
              {
                key:"subAcidFruit", title:"Sub-acid Fruit", subtitle:"Pairs with sweet OR acid fruit — not both at once", color:"#c0392b", bg:"#fdf2f0",
                items:[
                  {e:"🍎",n:"Apple"},{e:"🍐",n:"Pear"},{e:"🍑",n:"Peach"},{e:"🍒",n:"Cherry"},{e:"🍇",n:"Grapes"},{e:"🫐",n:"Blueberry"},{e:"🍓",n:"Strawberry (borderline)"},{e:"🥝",n:"Kiwi (borderline)"},{e:"🍈",n:"Lychee"},{e:"🟣",n:"Plum"},{e:"🟠",n:"Apricot"},{e:"🔴",n:"Pomegranate"},{e:"🟡",n:"Guava"},{e:"🟤",n:"Sapodilla"},
                ]
              },
              {
                key:"acidFruit", title:"Acid Fruit", subtitle:"Eat alone or with sub-acid fruit — not with sweet fruit", color:"#e05a4a", bg:"#fef3f0",
                items:[
                  {e:"🍍",n:"Pineapple"},{e:"🍊",n:"Orange"},{e:"🍋",n:"Lemon"},{e:"🟡",n:"Grapefruit"},{e:"🟠",n:"Clementine"},{e:"🟡",n:"Lime"},{e:"🍓",n:"Raspberry"},{e:"🔴",n:"Cranberry"},{e:"🟡",n:"Passion fruit"},{e:"🍅",n:"Tomato"},{e:"🟡",n:"Kumquat"},{e:"🟢",n:"Gooseberry"},{e:"🔴",n:"Tamarillo"},
                ]
              },
              {
                key:"leafyVeg", title:"Non-starchy Veg", subtitle:"Combines with everything — the universal pairing", color:"#3d6b5e", bg:"#f0f7f4",
                items:[
                  {e:"🥬",n:"Lettuce"},{e:"🥬",n:"Spinach"},{e:"🌿",n:"Rocket/Arugula"},{e:"🥒",n:"Cucumber"},{e:"🟢",n:"Zucchini"},{e:"🥦",n:"Broccoli"},{e:"🥦",n:"Broccolini"},{e:"🌿",n:"Asparagus"},{e:"🟢",n:"Green beans"},{e:"🟢",n:"Celery"},{e:"🟢",n:"Fennel"},{e:"🫑",n:"Bell pepper"},{e:"🧅",n:"Onion"},{e:"🧄",n:"Garlic"},{e:"🌿",n:"Herbs"},{e:"🟢",n:"Bok choy"},{e:"🥬",n:"Kale"},{e:"🌿",n:"Cabbage"},{e:"🟤",n:"Mushroom"},{e:"🟢",n:"Leek"},
                ]
              },
              {
                key:"starchyVeg", title:"Starchy Veg", subtitle:"Pair with non-starchy veg or fat — not with protein", color:"#d4703a", bg:"#fdf5f0",
                items:[
                  {e:"🥕",n:"Carrot"},{e:"🍠",n:"Sweet potato"},{e:"🥔",n:"Potato"},{e:"🌽",n:"Corn"},{e:"🟤",n:"Parsnip"},{e:"🟠",n:"Butternut squash"},{e:"🟠",n:"Pumpkin"},{e:"🟣",n:"Beetroot"},{e:"🟤",n:"Turnip"},{e:"🟤",n:"Yam"},
                ]
              },
              {
                key:"grain", title:"Grain & Legume", subtitle:"Combine with veg only — never with animal protein", color:"#b8860b", bg:"#fdfaec",
                items:[
                  {e:"🌾",n:"Rice"},{e:"🌾",n:"Oats"},{e:"🌾",n:"Quinoa"},{e:"🌾",n:"Millet"},{e:"🍞",n:"Bread"},{e:"🍝",n:"Pasta"},{e:"🫘",n:"Lentils"},{e:"🫘",n:"Chickpeas"},{e:"🫘",n:"Black beans"},{e:"🫘",n:"Kidney beans"},{e:"🫘",n:"Edamame"},{e:"🌽",n:"Polenta"},{e:"🟤",n:"Buckwheat"},
                ]
              },
              {
                key:"protein", title:"Protein", subtitle:"One protein per meal — pair with non-starchy veg only", color:"#8b4513", bg:"#faf3ee",
                items:[
                  {e:"🥩",n:"Meat"},{e:"🐟",n:"Fish"},{e:"🍗",n:"Chicken"},{e:"🥚",n:"Eggs"},{e:"🌰",n:"Almonds"},{e:"🌰",n:"Walnuts"},{e:"🌰",n:"Cashews"},{e:"🌻",n:"Sunflower seeds"},{e:"🌿",n:"Hemp seeds"},{e:"🟤",n:"Pumpkin seeds"},{e:"🫘",n:"Peanuts/peanut butter"},{e:"🟤",n:"Tofu"},{e:"🟤",n:"Tempeh"},{e:"🫙",n:"Miso"},{e:"🐟",n:"Tuna"},
                ]
              },
              {
                key:"fat", title:"Healthy Fat", subtitle:"Pairs well with veg — use sparingly with starch", color:"#5d8a3c", bg:"#f4f9f0",
                items:[
                  {e:"🥑",n:"Avocado"},{e:"🫒",n:"Olive oil"},{e:"🥥",n:"Coconut oil"},{e:"🥥",n:"Coconut milk"},{e:"🌰",n:"Tahini"},{e:"🌿",n:"Flaxseed oil"},{e:"🟡",n:"Ghee"},{e:"🧈",n:"Butter (small amounts)"},{e:"🌰",n:"Nut oils"},
                ]
              },
            ].map(group=>(
              <div key={group.key} className="card" style={{background:group.bg,border:`1.5px solid ${group.color}22`}}>
                <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:group.color}}>{group.title}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:group.color,opacity:.7}}>{GROUPS[group.key] && fmtMins(GROUPS[group.key].mjMins)} MJ</div>
                </div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#888",marginBottom:12,lineHeight:1.4}}>{group.subtitle}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {group.items.map((item,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:4,background:"white",borderRadius:99,padding:"4px 10px 4px 7px",border:`1px solid ${group.color}22`}}>
                      <span style={{fontSize:14}}>{item.e}</span>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#444"}}>{item.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── LOG ── */}
        {tab==="log" && (
          <div className="sec">

            {/* ── MY SETUP ── */}
            <div className="card">
              <div className="ctitle">⚙️ My Setup</div>

              {/* Start date */}
              <div className="srow2">
                <div><div className="slbl">Start date</div><div className="ssub">When you began Mounjaro</div></div>
                <input className="inp" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:140}}/>
              </div>

              {/* Dose */}
              <div className="srow2">
                <div><div className="slbl">Current dose</div><div className="ssub">Your weekly injection dose</div></div>
                <select className="sel" value={dose} onChange={e=>setDose(e.target.value)} style={{width:110}}>
                  {DOSES.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>

              {/* Fasting window */}
              <div style={{padding:"12px 0"}}>
                <div className="slbl" style={{marginBottom:4}}>Fasting window</div>
                <div className="ssub" style={{marginBottom:10}}>Set your eating window start and end</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#aaa",textTransform:"uppercase",letterSpacing:".7px",marginBottom:5}}>Window opens</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {[8,9,10,11,12,13,14].map(h=>(
                        <button key={h} onClick={()=>setEatStart(h)}
                          style={{padding:"5px 10px",borderRadius:8,border:`1.5px solid ${eatStart===h?"#3d6b5e":"#e8e4de"}`,background:eatStart===h?"#3d6b5e":"white",color:eatStart===h?"white":"#555",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>
                          {`${h.toString().padStart(2,"0")}:00`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#aaa",textTransform:"uppercase",letterSpacing:".7px",marginBottom:5}}>Window closes</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {[16,17,18,19,20,21,22].map(h=>(
                        <button key={h} onClick={()=>setEatEnd(h)}
                          style={{padding:"5px 10px",borderRadius:8,border:`1.5px solid ${eatEnd===h?"#3d6b5e":"#e8e4de"}`,background:eatEnd===h?"#3d6b5e":"white",color:eatEnd===h?"white":"#555",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>
                          {`${h.toString().padStart(2,"0")}:00`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{marginTop:10,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3d6b5e",background:"#f0f7f4",borderRadius:8,padding:"7px 11px",display:"inline-block"}}>
                  Current: {`${eatStart.toString().padStart(2,"0")}:00`} – {`${eatEnd.toString().padStart(2,"0")}:00`} · {eatEnd-eatStart > 0 ? eatEnd-eatStart : 24-eatStart+eatEnd}h eating · {24-(eatEnd-eatStart > 0 ? eatEnd-eatStart : 24-eatStart+eatEnd)}h fast
                </div>
              </div>
            </div>

            {/* ── INJECTION ── */}
            <div className="card">
              <div className="ctitle">💉 Injection</div>
              {todayLog.injSite ? (
                <div style={{background:"#f0f7f4",borderRadius:10,padding:"12px 14px",marginBottom:lastInjection&&daysUntilNext!==0?10:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontSize:22}}>✅</div>
                    <div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:"#2a6b45"}}>Injection logged today</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",marginTop:2}}>Site: <b style={{color:"#3d6b5e"}}>{INJ_SITES.find(s=>s.id===todayLog.injSite)?.label}</b></div>
                    </div>
                  </div>
                </div>
              ) : showInjForm ? (
                <div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",marginBottom:10}}>
                    {lastUsedSite && <span>Last: <b>{INJ_SITES.find(s=>s.id===lastUsedSite)?.label}</b> · Suggested: <b style={{color:"#3d6b5e"}}>{suggestedSite.label}</b></span>}
                    {!lastUsedSite && <span>Choose injection site:</span>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {["belly","thigh","arm"].map(grp=>(
                      <React.Fragment key={grp}>
                        <div style={{gridColumn:"1/-1",fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#aaa",textTransform:"uppercase",letterSpacing:".8px",marginBottom:2,marginTop:grp==="belly"?4:6}}>{grp==="belly"?"Belly":grp==="thigh"?"Thigh":"Upper Arm"}</div>
                        {INJ_SITES.filter(s=>s.group===grp).map(s=>(
                          <button key={s.id} onClick={()=>setSelectedSite(s.id)}
                            style={{padding:"11px 8px",borderRadius:10,border:`1.5px solid ${selectedSite===s.id?"#3d6b5e":"#e8e4de"}`,background:selectedSite===s.id?"#f0f7f4":"white",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:selectedSite===s.id?"#3d6b5e":"#444",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .15s"}}>
                            {s.emoji} {s.label}
                            {suggestedSite.id===s.id&&<span style={{fontSize:9,background:"#3d6b5e",color:"white",padding:"1px 5px",borderRadius:99,marginLeft:2}}>suggested</span>}
                          </button>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                  <button className="ijbtn" onClick={logInjection} style={{opacity:selectedSite?1:0.5}}>
                    {selectedSite?`Confirm — ${INJ_SITES.find(s=>s.id===selectedSite)?.label}`:"Select a site above"}
                  </button>
                  <div style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#aaa",cursor:"pointer",marginTop:8}} onClick={()=>{setShowInjForm(false);setSelectedSite("");}}>Cancel</div>
                </div>
              ) : (
                <button className="ijbtn" onClick={()=>setShowInjForm(true)}>Log Today's Injection</button>
              )}
              {lastInjection && (
                <div className="ninj" style={{marginTop:10}}>
                  {daysUntilNext===0?<><div className="big">Today!</div><div className="sm">Injection day</div></>
                  :daysUntilNext>0?<><div className="big">{daysUntilNext} day{daysUntilNext!==1?"s":""}</div><div className="sm">until next · {nextInjection}</div></>
                  :<><div className="big" style={{color:"#c0392b"}}>Overdue</div><div className="sm">Last: {lastInjection}</div></>}
                </div>
              )}
            </div>
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:11}}>
                <div className="ctitle" style={{marginBottom:0}}>⚖️ Weight Log</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa"}}>tap to edit</div>
              </div>

              {/* Stats row */}
              {weightEntries.length >= 1 && (
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  {[
                    ["Start", startWeight ? `${startWeight} kg` : "—"],
                    ["Now",   latestWeight ? `${latestWeight} kg` : "—"],
                    ["Lost",  totalLoss && parseFloat(totalLoss) > 0 ? `−${totalLoss} kg` : totalLoss && parseFloat(totalLoss) < 0 ? `+${Math.abs(totalLoss)} kg` : "—"],
                  ].map(([l,v])=>(
                    <div key={l} style={{flex:1,textAlign:"center",background:"#f7f5f0",borderRadius:9,padding:"8px 0"}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:"#3d6b5e"}}>{v}</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#aaa",marginTop:1}}>{l}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mini chart */}
              {weightEntries.length >= 2 && (
                <div style={{marginBottom:14}}>
                  <svg width="100%" height="80" viewBox={`0 0 ${Math.max(weightEntries.length*46,200)} 80`} style={{overflow:"visible"}}>
                    {(()=>{
                      const ws=weightEntries.map(e=>e.weight);
                      const mn=Math.min(...ws)-1, mx=Math.max(...ws)+1;
                      const pts=weightEntries.map((e,i)=>[i*46+10, 70-((e.weight-mn)/(mx-mn))*60]);
                      return <>
                        <polyline points={pts.map(p=>p.join(",")).join(" ")} fill="none" stroke="#3d6b5e" strokeWidth="2" strokeLinejoin="round"/>
                        {pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3.5" fill="#3d6b5e"/>)}
                      </>;
                    })()}
                  </svg>
                </div>
              )}

              {/* Editable entries */}
              {weightEntries.length === 0 && (
                <div className="empty" style={{padding:"16px 0"}}>No weight logged yet — add it in Today tab</div>
              )}
              {weightEntries.slice().reverse().map(({date, weight}) => {
                const isEditing = editingWeight?.date === date;
                const label = new Date(date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
                const isToday = date === todayKey;
                return (
                  <div key={date} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f5f2ee"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#444"}}>{label}</div>
                        {isToday && <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,background:"#e8f0ec",color:"#3d6b5e",padding:"1px 7px",borderRadius:99}}>today</span>}
                      </div>
                    </div>
                    {isEditing ? (
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <input
                          type="number"
                          step="0.1"
                          value={editingWeight.value}
                          onChange={e=>setEditingWeight(p=>({...p,value:e.target.value}))}
                          onKeyDown={e=>{
                            if(e.key==="Enter"){
                              setLogs({...logs,[date]:{...logs[date],weight:editingWeight.value}});
                              setEditingWeight(null);
                            }
                            if(e.key==="Escape") setEditingWeight(null);
                          }}
                          autoFocus
                          style={{width:80,border:"1.5px solid #3d6b5e",borderRadius:8,padding:"5px 8px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#2c2c2c",background:"white",outline:"none",textAlign:"right"}}
                        />
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#aaa"}}>kg</span>
                        <button onClick={()=>{
                          setLogs({...logs,[date]:{...logs[date],weight:editingWeight.value}});
                          setEditingWeight(null);
                        }} style={{background:"#3d6b5e",color:"white",border:"none",borderRadius:7,padding:"5px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>✓</button>
                        <button onClick={()=>setEditingWeight(null)} style={{background:"#f0ede8",color:"#888",border:"none",borderRadius:7,padding:"5px 8px",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>✕</button>
                      </div>
                    ) : (
                      <button onClick={()=>setEditingWeight({date,value:String(weight)})} style={{display:"flex",alignItems:"center",gap:5,background:"#f7f5f0",border:"1.5px solid #e8e4de",borderRadius:8,padding:"5px 12px",cursor:"pointer",transition:"all .15s"}}>
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,color:"#2a4a40"}}>{weight}</span>
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa"}}>kg</span>
                        <span style={{fontSize:12,color:"#bbb",marginLeft:2}}>✏️</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── GENERAL LOG ── */}
            <div className="card">
              <div className="ctitle">Daily Log</div>
              {Object.entries(logs).length===0?<div className="empty">No entries yet. Start today!</div>:
                Object.entries(logs).sort(([a],[b])=>b.localeCompare(a)).map(([date,entry])=>(
                  <div className="lentry" key={date}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888"}}>{new Date(date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                    <div style={{display:"flex",gap:10,marginTop:5,flexWrap:"wrap"}}>
                      {entry.water>0&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3d6b5e"}}>💧 {entry.water}</span>}
                      {entry.protein>0&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3d6b5e"}}>🥩 {entry.protein}g</span>}
                      {entry.weight&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3d6b5e"}}>⚖️ {entry.weight} kg</span>}
                      {entry.injSite&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#2a4a40"}}>💉 {INJ_SITES.find(s=>s.id===entry.injSite)?.label}</span>}
                      {(entry.meals||[]).length>0&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3d6b5e"}}>🍽 {entry.meals.length} meals</span>}
                      {entry.fruited&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#e05a4a"}}>🍓 Fruit ✓</span>}
                      {(entry.symptoms||[]).length>0&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888"}}>🩺 {entry.symptoms.join(", ")}</span>}
                    </div>
                    {entry.notes&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#999",marginTop:5,fontStyle:"italic"}}>"{entry.notes}"</div>}
                  </div>
                ))}
            </div>

          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab==="settings" && (
          <div className="sec">
            <div style={{background:"#e8f0ec",borderLeft:"3px solid #3d6b5e",borderRadius:"0 10px 10px 0",padding:"10px 13px",marginBottom:12,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#2a4a40"}}>
              ⚙️ To change your start date, dose, or fasting window — go to the <b>Log tab</b> and tap "My Setup" at the top.
            </div>
            <div className="card">
              <div className="ctitle">🍓 Your Protocol</div>
              {[["Fasting",`${24-(eatEnd-eatStart)}h (${eatEnd.toString().padStart(2,"0")}:00 → ${eatStart.toString().padStart(2,"0")}:00)`],["Eating",`${eatEnd-eatStart}h (${eatStart.toString().padStart(2,"0")}:00 → ${eatEnd.toString().padStart(2,"0")}:00)`],["First meal","Fruit break-fast"],["Mid-window","Raw foods"],["Evening","Cooked if needed"]].map(([k,v])=>(
                <div className="srow2" key={k}><div className="slbl">{k}</div><div className="ssub" style={{textAlign:"right",maxWidth:180}}>{v}</div></div>
              ))}
            </div>
            <div className="card">
              <div className="ctitle">📋 Quick Ref</div>
              {[["Inject","Same day each week"],["Rotation","Belly, thigh, upper arm"],["Storage","Fridge; room temp ≤21 days"],["Missed?","Within 4 days, else skip"],["Nausea","Inject at night, eat small"]].map(([k,v])=>(
                <div className="srow2" key={k}><div className="slbl">{k}</div><div className="ssub" style={{textAlign:"right",maxWidth:180}}>{v}</div></div>
              ))}
            </div>
            <div className="card" style={{background:"#fff8f0",border:"1.5px solid #f0ddc0"}}>
              <div className="ctitle" style={{color:"#8b5e3c"}}>⚠️ Always Remember</div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#7a4f2e",lineHeight:1.6}}>Personal tracker only — not medical advice. Follow your prescriber's guidance and report persistent side effects.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
