/* TrueCart catalogue artwork: product-type SVG illustrations, never retailer photos. */
(() => {
  const names = {
    sneaker: "running shoe illustration",
    jutti: "traditional jutti illustration",
    sandal: "sandal illustration",
    tee: "t-shirt illustration",
    kurta: "kurta illustration",
    shirt: "shirt illustration",
    jeans: "jeans illustration",
    headphones: "headphones illustration",
    backpack: "backpack illustration",
    trolley: "trolley bag illustration",
    folder: "document folder illustration",
    notebook: "notebook illustration",
    bottle: "personal care bottle illustration",
    straightener: "hair straightener illustration",
    mug: "mug illustration",
    fryer: "air fryer illustration",
    kettle: "kettle illustration",
    dumbbell: "dumbbell illustration",
    mat: "yoga mat illustration",
    controller: "game controller illustration",
    box: "product category illustration",
  };

  const shapes = {
    sneaker: '<path d="M25 57c13 0 20-10 27-31l12 4c5 15 13 24 28 29 7 3 9 8 7 14H27c-9 0-12-12-2-16z" fill="var(--item)"/><path d="M34 69h61M56 43l10 4m-14 4 11 4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M61 29l7 3" stroke="#fff" stroke-width="2" opacity=".7"/>',
    jutti: '<path d="M24 59c10-3 21-6 29-21l11-18 9 5c-1 11 4 20 13 26l12 8c7 5 7 13-2 15H31c-10 0-14-9-7-15z" fill="var(--item)"/><path d="M31 69h67M51 51l5 3m4-8 5 3m4-8 5 3" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M65 27l5 2" stroke="#f9d46a" stroke-width="3" stroke-linecap="round"/>',
    sandal: '<path d="M43 22c12-4 25 3 28 18l11 31c2 6-3 11-9 11H43c-8 0-12-6-9-13l7-18c3-8 4-19 2-29z" fill="var(--item)"/><path d="M45 29c8 10 18 17 31 20M39 52c9 1 17 5 24 11" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
    tee: '<path d="M39 27l12-9h18l12 9 17 8-9 18-11-6v31H42V47l-11 6-9-18z" fill="var(--item)"/><path d="M51 19c2 10 16 10 18 0" fill="none" stroke="#fff" stroke-width="3"/><path d="M48 39h24" stroke="#fff" stroke-width="2" opacity=".5"/>',
    kurta: '<path d="M44 27l9-9h14l9 9 13 7-7 16-8-4v32H46V46l-8 4-7-16z" fill="var(--item)"/><path d="M53 19c1 7 13 7 14 0M60 27v34m-3-20h6m-6 8h6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="60" cy="39" r="1.5" fill="#fff"/><circle cx="60" cy="48" r="1.5" fill="#fff"/>',
    shirt: '<path d="M42 26l10-8h16l10 8 14 8-8 17-10-5v31H46V46l-10 5-8-17z" fill="var(--item)"/><path d="M52 19l8 10 8-10m-8 10v43m-3-28h6m-6 8h6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="60" cy="39" r="1.4" fill="#fff"/><circle cx="60" cy="48" r="1.4" fill="#fff"/>',
    jeans: '<path d="M42 19h36l-4 62H59l-3-31-4 31H39z" fill="var(--item)"/><path d="M42 28h34M57 20v10m-13 2 10 4m20-4-10 4M59 50h13" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="60" cy="25" r="2" fill="#fff"/>',
    headphones: '<path d="M33 53V43a27 27 0 0 1 54 0v10" fill="none" stroke="var(--item)" stroke-width="10" stroke-linecap="round"/><rect x="27" y="47" width="17" height="27" rx="8" fill="var(--item)"/><rect x="76" y="47" width="17" height="27" rx="8" fill="var(--item)"/><path d="M33 53v13m54-13v13" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>',
    backpack: '<path d="M39 35a8 8 0 0 1 8-8h26a8 8 0 0 1 8 8v43H39z" fill="var(--item)"/><path d="M49 28v-5a11 11 0 0 1 22 0v5M39 51h42M48 51v27m24-27v27" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="48" y="53" width="24" height="16" rx="5" fill="#fff" opacity=".25"/>',
    trolley: '<rect x="39" y="29" width="42" height="48" rx="9" fill="var(--item)"/><path d="M51 29v-8h18v8M51 38v30m18-30v30M49 77v5m22-5v5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M39 48h42" stroke="#fff" stroke-width="2" opacity=".6"/>',
    folder: '<path d="M28 34a7 7 0 0 1 7-7h19l8 8h23a7 7 0 0 1 7 7v32a7 7 0 0 1-7 7H35a7 7 0 0 1-7-7z" fill="var(--item)"/><path d="M29 44h61M46 52h29m-29 8h29m-29 8h20" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    notebook: '<rect x="39" y="20" width="43" height="61" rx="6" fill="var(--item)"/><path d="M47 20v61m10-47h17m-17 9h17m-17 9h17m-17 9h12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M34 29v6m0 8v6m0 8v6m0 8v6" stroke="#7a65e8" stroke-width="4" stroke-linecap="round"/>',
    bottle: '<path d="M52 20h16v10H52zM48 30h24l6 10v39H42V40z" fill="var(--item)"/><path d="M51 51h18m-18 8h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M52 35h16" stroke="#fff" stroke-width="2" opacity=".6"/>',
    straightener: '<path d="M43 23c-4-5-11 0-8 6l14 23m28-29c4-5 11 0 8 6L71 52" fill="none" stroke="var(--item)" stroke-width="9" stroke-linecap="round"/><path d="M49 51l8 24c2 6 10 6 12 0l8-24" fill="var(--item)"/><path d="M52 56l6 17m16-17-6 17" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="61" cy="44" r="3" fill="#fff"/>',
    mug: '<path d="M37 35h41v25a15 15 0 0 1-15 15h-11a15 15 0 0 1-15-15z" fill="var(--item)"/><path d="M78 42h6a10 10 0 0 1 0 20h-7M44 28h28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M47 44h20" stroke="#fff" stroke-width="2" opacity=".55"/>',
    fryer: '<rect x="38" y="20" width="44" height="60" rx="11" fill="var(--item)"/><rect x="46" y="32" width="28" height="14" rx="5" fill="#15234a" opacity=".85"/><circle cx="52" cy="39" r="2" fill="#69eed4"/><path d="M47 54h26v16H47z" fill="#fff" opacity=".25"/><path d="M52 61h16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>',
    kettle: '<path d="M44 36a17 17 0 0 1 34 0v34H44z" fill="var(--item)"/><path d="M78 43h8l8 12-12 7M52 31v-9h18v9M52 70h18" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
    dumbbell: '<path d="M32 39v22m10-30v38m36-38v38m10-30v22M42 50h36" fill="none" stroke="var(--item)" stroke-width="9" stroke-linecap="round"/><path d="M32 39v22m10-30v38m36-38v38m10-30v22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
    mat: '<ellipse cx="59" cy="62" rx="29" ry="14" fill="var(--item)"/><ellipse cx="60" cy="59" rx="17" ry="8" fill="#fff" opacity=".35"/><path d="M31 61v-8a28 13 0 0 1 56 0v8" fill="none" stroke="#fff" stroke-width="3"/><path d="M45 47v15m30-15v15" stroke="#fff" stroke-width="2" opacity=".7"/>',
    controller: '<path d="M37 40c2-8 8-12 16-12h14c8 0 14 4 16 12l10 22c3 7-4 12-10 8L68 60H52L37 70c-6 4-13-1-10-8z" fill="var(--item)"/><path d="M45 43v14m-7-7h14m26-6h.1m7 12h.1" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    box: '<rect x="39" y="26" width="42" height="49" rx="11" fill="var(--item)"/><path d="M50 26v-7h20v7m-20 21h20m-20 9h14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
  };

  function hash(text) {
    let value = 2166136261;
    for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
    return value >>> 0;
  }

  function productKind(product) {
    const text = `${product.title || ""} ${product.sub_category || ""}`.toLowerCase();
    if (/jutti|mojari/.test(text)) return "jutti";
    if (/sandal|slipper|chappal|flip.flop/.test(text)) return "sandal";
    if (/running shoe|sneaker|sports shoe|trainer/.test(text)) return "sneaker";
    if (/kurta|kurti/.test(text)) return "kurta";
    if (/jean|trouser|jogger|legging/.test(text)) return "jeans";
    if (/shirt|formal wear/.test(text)) return /t.shirt|tee/.test(text) ? "tee" : "shirt";
    if (/headphone|earbud|earphone/.test(text)) return "headphones";
    if (/trolley|suitcase/.test(text)) return "trolley";
    if (/backpack|school bag|laptop bag/.test(text)) return "backpack";
    if (/folder|file pack|document/.test(text)) return "folder";
    if (/notebook|diary|journal/.test(text)) return "notebook";
    if (/straightener|hair iron/.test(text)) return "straightener";
    if (/shampoo|conditioner|lotion|cleanser|face wash|serum/.test(text)) return "bottle";
    if (/air fryer/.test(text)) return "fryer";
    if (/kettle/.test(text)) return "kettle";
    if (/mug|cup/.test(text)) return "mug";
    if (/dumbbell|weight|fitness/.test(text)) return "dumbbell";
    if (/yoga mat|exercise mat/.test(text)) return "mat";
    if (/game|controller|console/.test(text)) return "controller";
    if (/apparel|t.shirt|tshirt/.test(text)) return "tee";
    if (/footwear|shoe/.test(text)) return "sneaker";
    if (/bag|luggage/.test(text)) return "backpack";
    if (/stationery|office/.test(text)) return "notebook";
    if (/beauty|personal care/.test(text)) return "bottle";
    if (/electronics/.test(text)) return "headphones";
    if (/appliance/.test(text)) return "fryer";
    if (/sports/.test(text)) return "dumbbell";
    if (/home|kitchen/.test(text)) return "mug";
    return "box";
  }

  function itemColor(product, seed) {
    const title = String(product.title || "").toLowerCase();
    const named = [
      ["black", "#30394f", "#737f98"], ["white", "#8290a6", "#d8e2ee"],
      ["brown", "#986043", "#dcad73"], ["red", "#d94668", "#ff9c78"],
      ["blue", "#386ce2", "#4dc8d5"], ["navy", "#304986", "#5783d7"],
      ["olive", "#627b3c", "#b3bc61"], ["green", "#258c70", "#91cf79"],
      ["purple", "#8050cc", "#d176bb"], ["pink", "#db6897", "#ffb3a5"],
      ["yellow", "#e3ad36", "#ffe27b"], ["grey", "#657385", "#b7c2ce"],
      ["gray", "#657385", "#b7c2ce"], ["beige", "#b89a71", "#ead8b7"],
    ].find(([word]) => title.includes(word));
    if (named) return named.slice(1);
    const palettes = [
      ["#6754df", "#18b8bd"], ["#d94d77", "#ffb15a"],
      ["#286fbf", "#56c6dd"], ["#258c70", "#a8cf61"],
      ["#8a4fc3", "#ef88b6"], ["#d47633", "#f0c45f"],
    ];
    return palettes[seed % palettes.length];
  }

  function render(product) {
    const seed = hash(String(product.product_id || product.title || "item"));
    const kind = productKind(product);
    const colors = itemColor(product, seed);
    return `<svg class="product-art-illustration" viewBox="0 0 120 100" role="img" aria-label="${names[kind]}; illustrative, not an exact product photo" focusable="false"><defs><linearGradient id="bg-${seed}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#f8f9fc"/></linearGradient><linearGradient id="item-${seed}" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient><filter id="shadow-${seed}" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#25345c" flood-opacity=".18"/></filter></defs><rect x="0" y="0" width="120" height="100" rx="10" fill="url(#bg-${seed})"/><circle cx="93" cy="23" r="22" fill="#edf1f8" opacity=".35"/><ellipse cx="60" cy="82" rx="31" ry="5" fill="#303b68" opacity=".11"/><g filter="url(#shadow-${seed})" style="--item:url(#item-${seed})">${shapes[kind]}</g><path d="M19 22h5m70 50h5m-66-9h3" stroke="#e5e9f2" stroke-width="2" stroke-linecap="round" opacity=".9"/></svg>`;
  }

  window.TrueCartArt = { render };
})();
