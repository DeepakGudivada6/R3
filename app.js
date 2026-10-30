const form = document.querySelector('#searchForm');
const input = document.querySelector('#query');
const response = document.querySelector('#response');
const welcome = document.querySelector('#welcomeCard');
const statusPill = document.querySelector('#catalogueStatus');
const picked = new Map();
const history = [];
let browseProducts = [];
let activeCategory = '';
let browsePage = 1;
let apiReady = false;
let localCatalogue = null;
let demoCatalogue = [];
let localPolicy = '';
const ALERTS_KEY='truecart-price-alerts-v1';
const NOTIFICATIONS_KEY='truecart-notifications-enabled-v1';
const DEMO_SIZE=200;
const PAGE_SIZE=16;
let priceAlerts=loadAlerts();
let selectedAlertProduct=null;
let simulatedPrice=0;

function loadAlerts(){try{const stored=JSON.parse(localStorage.getItem(ALERTS_KEY)||'[]');return Array.isArray(stored)?stored:[]}catch{showToast('Saved alerts could not be read from this browser.');return []}}
function persistAlerts(){try{localStorage.setItem(ALERTS_KEY,JSON.stringify(priceAlerts))}catch{showToast('This browser could not save alerts locally.')}renderAlerts()}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const formatINR = value => `₹${Number(value).toLocaleString('en-IN')}`;
const readable = value => String(value ?? '').replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase());
function selectDemoCatalogue(products){
  const rank=(a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0)||(Number(b.review_count)||0)-(Number(a.review_count)||0)||a.product_id.localeCompare(b.product_id);
  const categories=[...new Set(products.map(product=>product.category))].sort();
  const selected=[];const selectedIds=new Set();
  for(const category of categories){
    for(const product of products.filter(item=>item.category===category).sort(rank).slice(0,20)){
      selected.push(product);selectedIds.add(product.product_id);
    }
  }
  if(selected.length<DEMO_SIZE){
    for(const product of [...products].sort(rank)){
      if(selected.length>=DEMO_SIZE)break;
      if(!selectedIds.has(product.product_id)){selected.push(product);selectedIds.add(product.product_id);}
    }
  }
  return selected.slice(0,DEMO_SIZE);
}

function retailerSearchUrl(product, retailer){
  const query=encodeURIComponent(`${product.brand} ${product.title}`);
  return retailer==='Amazon.in'?`https://www.amazon.in/s?k=${query}`:`https://www.flipkart.com/search?q=${query}`;
}
function retailerSearchLinks(product){
  return `<a class="retailer-link" href="${retailerSearchUrl(product,'Amazon.in')}" target="_blank" rel="noopener noreferrer">Amazon.in search ↗</a><a class="retailer-link" href="${retailerSearchUrl(product,'Flipkart')}" target="_blank" rel="noopener noreferrer">Flipkart search ↗</a>`;
}
function csvCell(value){return `"${String(value??'').replaceAll('"','""')}"`}
function exportComparisonCsv(){
  if(demoCatalogue.length!==DEMO_SIZE){showToast('The 200-product sample is still loading. Try again in a moment.');return}
  const headers=['Product ID','Product','Brand','Category','Snapshot price (INR)','Listed MRP (INR)','Snapshot stock','Rating in supplied data','Review count in supplied data','Amazon.in official search URL','Flipkart official search URL','Price source note'];
  const rows=demoCatalogue.map(product=>[
    product.product_id,product.title,product.brand,product.category,product.price_inr,product.mrp_inr,
    readable(product.stock_status),product.rating??'',product.review_count,
    retailerSearchUrl(product,'Amazon.in'),retailerSearchUrl(product,'Flipkart'),
    'Supplied synthetic hackathon snapshot; retailer links are searches, not exact product matches or live price verification.'
  ]);
  const csv='\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download='TrueCart-200-product-retailer-search-comparison.csv';
  document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
  showToast('Exported 200 sample rows with official retailer search links. Prices remain snapshot values.','success');
}

function showToast(message,tone='info'){
  const region=document.querySelector('#toastRegion');if(!region)return;
  const toast=document.createElement('div');toast.className=`toast ${tone}`;toast.textContent=message;region.append(toast);
  window.setTimeout(()=>toast.remove(),5200);
}

function notifyBrowser(title,body){
  try{if('Notification' in window&&Notification.permission==='granted')new Notification(title,{body})}catch{showToast('The browser blocked the notification; the alert remains visible on this page.')}
}

async function enableBrowserNotifications(){
  if(!('Notification' in window)){showToast('Browser notifications are not supported here.');return;}
  try{
    const permission=await Notification.requestPermission();
    if(permission==='granted'){
      try{localStorage.setItem(NOTIFICATIONS_KEY,'true')}catch{showToast('Permission is enabled, but the browser could not store the preference.')}
      showToast('Browser notifications are enabled for this open demo.','success');
    }else showToast('Notification permission was not granted. In-page alerts still work.');
  }catch{showToast('The browser could not enable notifications. In-page alerts still work.')}
}

function showCategories(categories){
  document.querySelector('#categoryFilters').innerHTML = `<button class="category-chip active" data-category="">All categories</button>${categories.map(category=>`<button class="category-chip" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('')}`;
}

function parseCSV(text){
  const rows=[]; let row=[], field='', quoted=false;
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(quoted){
      if(char==='"' && text[i+1]==='"'){field+='"';i++;}
      else if(char==='"') quoted=false;
      else field+=char;
    }else if(char==='"') quoted=true;
    else if(char===','){row.push(field);field='';}
    else if(char==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}
    else field+=char;
  }
  if(field.length||row.length){row.push(field.replace(/\r$/,''));rows.push(row);}
  const headers=(rows.shift()||[]).map(value=>value.replace(/^\uFEFF/,''));
  return rows.filter(values=>values.length===headers.length).map(values=>{
    const item=Object.fromEntries(headers.map((key,index)=>[key,values[index]]));
    try{item.attributes=JSON.parse(item.attributes||'{}');}catch{item.attributes={};}
    item.price_inr=Number(item.price_inr);item.mrp_inr=Number(item.mrp_inr);
    item.rating=item.rating?Number(item.rating):null;item.review_count=Number(item.review_count||0);
    return item;
  });
}

async function fetchLocalAsset(name){
  // Support Live Server when its document root is the project, workspace,
  // or directly the web folder.
  const candidates=[
    new URL(`data/${name}`,document.baseURI).href,
    new URL(`FULL_CODE/web/data/${name}`,`${location.origin}/`).href,
    new URL(`/FULL_CODE/web/data/${name}`,location.origin).href,
    new URL(`/data/${name}`,location.origin).href
  ];
  const failures=[];
  for(const url of [...new Set(candidates)]){
    try{const response=await fetch(url,{cache:'no-store'});if(response.ok)return response;failures.push(`${response.status} ${url}`)}
    catch(error){failures.push(`${error.message} ${url}`)}
  }
  throw new Error(failures.slice(0,3).join(' · '));
}

async function loadLocalCatalogue(){
  const [catalogueResponse,policyResponse]=await Promise.all([fetchLocalAsset('catalogue.csv'),fetchLocalAsset('policy.md')]);
  if(!catalogueResponse.ok||!policyResponse.ok) throw new Error('Local catalogue files are unavailable');
  const [csv,policy]=await Promise.all([catalogueResponse.text(),policyResponse.text()]);
  localCatalogue=parseCSV(csv);localPolicy=policy;
  if(!localCatalogue.length) throw new Error('Local catalogue is empty');
  return localCatalogue;
}

async function checkHealth(){
  try {
    const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),1800);
    let r;try{r=await fetch('/api/health',{signal:controller.signal})}finally{window.clearTimeout(timeout)}
    if(!r.ok) throw new Error('Catalogue is not ready');
    const data = await r.json();
    apiReady = true;
    statusPill.innerHTML = `<i></i> ${Number(data.demo_products||DEMO_SIZE).toLocaleString()} sample picks · API ready`;
    document.querySelector('#sourceMode').textContent=`${Number(data.products).toLocaleString()} supplied rows · 200 sample picks`;
    const sampleResponse=await fetch('/api/demo');
    if(!sampleResponse.ok) throw new Error('Sample catalogue export is unavailable');
    const sampleData=await sampleResponse.json();demoCatalogue=sampleData.products||[];
    showCategories(data.categories||[]);
    document.querySelector('#downloadCatalogue').disabled=false;
    await loadBrowse();
  } catch {
    apiReady=false;
    try{
      const products=await loadLocalCatalogue();
      demoCatalogue=selectDemoCatalogue(products);
      const categories=[...new Set(demoCatalogue.map(product=>product.category))].sort();
      statusPill.innerHTML=`<i></i> ${demoCatalogue.length.toLocaleString()} sample picks · local preview`;
      document.querySelector('#sourceMode').textContent=`${products.length.toLocaleString()} supplied rows · 200 sample picks`;
      showCategories(categories);await loadBrowse();
      document.querySelector('#downloadCatalogue').disabled=false;
    }catch{
      statusPill.innerHTML = '<i style="background:#d97963;box-shadow:0 0 0 3px #f7e2dc"></i> Catalogue not connected';
      document.querySelector('#browseCount').textContent='The local sample data could not be loaded.';
    }
  }
}

async function loadBrowse(){
  const sort=document.querySelector('#browseSort').value;
  const grid=document.querySelector('#browseGrid');
  grid.innerHTML='<div class="shelf-loading">Loading catalogue picks…</div>';
  try{
    let data;
    if(!apiReady && demoCatalogue.length){
      let products=demoCatalogue.filter(product=>!activeCategory||product.category===activeCategory);
      if(sort==='price-low') products.sort((a,b)=>a.price_inr-b.price_inr||a.product_id.localeCompare(b.product_id));
      else if(sort==='price-high') products.sort((a,b)=>b.price_inr-a.price_inr||a.product_id.localeCompare(b.product_id));
      else if(sort==='value') products.sort((a,b)=>(b.mrp_inr-b.price_inr)/Math.max(b.mrp_inr,1)-(a.mrp_inr-a.price_inr)/Math.max(a.mrp_inr,1));
      else products.sort((a,b)=>(b.rating||0)-(a.rating||0)||b.review_count-a.review_count);
      const start=(browsePage-1)*PAGE_SIZE;
      data={products:products.slice(start,start+PAGE_SIZE),total:products.length,page:browsePage};
    }else{
      const params=new URLSearchParams({sort,limit:String(PAGE_SIZE),page:String(browsePage)});
      if(activeCategory) params.set('category',activeCategory);
      const r=await fetch(`/api/browse?${params}`);
      if(!r.ok) throw new Error('Catalogue unavailable');
      data=await r.json();
    }
    browseProducts=data.products||[];
    const total=Number(data.total)||0;const start=total?(browsePage-1)*PAGE_SIZE+1:0;const end=Math.min(browsePage*PAGE_SIZE,total);
    document.querySelector('#browseCount').textContent=total?`Showing ${start}–${end} of ${total} sample products${activeCategory?` · ${activeCategory}`:''}`:'No products in this category.';
    const productGrid=makeGrid(browseProducts);
    productGrid.id='browseGrid';
    productGrid.classList.add('browse-grid');
    grid.replaceWith(productGrid);renderPagination(total);
  }catch(error){
    const detail=escapeHtml(error?.message||'The catalogue request failed.');
    grid.innerHTML=`<div class="shelf-loading"><strong>Could not load listings.</strong><br>Check the API or the local preview data files.<br><small>${detail}</small></div>`;
  }
}

function renderPagination(total){
  const host=document.querySelector('#browsePagination');const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  if(total<=PAGE_SIZE){host.innerHTML='';host.classList.add('hidden');return;}
  host.classList.remove('hidden');
  host.innerHTML=`<button type="button" class="page-button" data-page="${Math.max(1,browsePage-1)}" ${browsePage===1?'disabled':''}>← Previous</button><span>Page <b>${browsePage}</b> of ${pages}</span><button type="button" class="page-button" data-page="${Math.min(pages,browsePage+1)}" ${browsePage===pages?'disabled':''}>Next →</button>`;
  host.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{
    browsePage=Number(button.dataset.page);loadBrowse();document.querySelector('#catalogueShelf').scrollIntoView({behavior:'smooth',block:'start'});
  }));
}

function makeCard(p,index=0){
  const attrs = p.attributes || {};
  const facts = Object.entries(attrs).slice(0,3).map(([k,v]) => `<span class="fact">${escapeHtml(readable(k))}: ${escapeHtml(Array.isArray(v) ? v.join(', ') : v)}</span>`).join('');
  const discount = p.mrp_inr > p.price_inr ? `<span class="discount">${Math.round((p.mrp_inr-p.price_inr)*100/p.mrp_inr)}% less</span>` : '';
  const stock = p.stock_status === 'out_of_stock' ? 'out' : p.stock_status === 'low_stock' ? 'low' : '';
  const alreadyTracked=priceAlerts.some(alert=>alert.product_id===p.product_id);
  return `<article class="product-card" style="--card-index:${index}">
    <div class="product-art">${TrueCartArt.render(p)}<span class="product-art-label">PRODUCT-TYPE ILLUSTRATION · NOT AN EXACT PHOTO</span><span class="product-art-category">${escapeHtml(p.category)}</span></div>
    <div class="product-top"><span class="product-category">${escapeHtml(p.category)} · ${escapeHtml(p.sub_category)}</span><i class="product-dot ${stock}" title="${escapeHtml(p.stock_status)}"></i></div>
    <h3>${escapeHtml(p.title)}</h3><div class="product-brand">${escapeHtml(p.brand)} · ${escapeHtml(readable(p.stock_status))}</div>
    <div class="price-line"><span class="price">${formatINR(p.price_inr)}</span><span class="mrp">${formatINR(p.mrp_inr)}</span>${discount}</div>
    <div class="snapshot-caption">Supplied catalogue snapshot</div>
    ${p.rating ? `<div class="product-facts"><span class="fact">★ ${Number(p.rating).toFixed(1)} · ${Number(p.review_count).toLocaleString()} reviews</span></div>` : ''}
    ${facts ? `<div class="product-facts">${facts}</div>` : ''}
    <div class="product-id"><span>SOURCE ID · ${escapeHtml(p.product_id)}</span></div>
    <div class="retailer-links" aria-label="Retailer search links for ${escapeHtml(p.title)}">${retailerSearchLinks(p)}</div>
    <div class="product-card-actions"><label class="compare-check"><input type="checkbox" data-id="${escapeHtml(p.product_id)}" ${picked.has(p.product_id)?'checked':''}> Compare</label><button class="alert-product-button" type="button" data-alert-id="${escapeHtml(p.product_id)}">${alreadyTracked?'♧ Edit alert':'♧ Track price'}</button></div>
  </article>`;
}

function openAlert(product){
  selectedAlertProduct=product;
  const dialog=document.querySelector('#alertDialog'), range=document.querySelector('#targetPrice'), number=document.querySelector('#targetNumber');
  const saved=priceAlerts.find(alert=>alert.product_id===product.product_id);
  const max=Math.max(500,Math.ceil(product.price_inr*1.5/100)*100), initial=Math.max(1,Math.floor(product.price_inr*.9/50)*50);
  document.querySelector('#alertProductTitle').textContent=product.title;
  document.querySelector('#alertCurrentPrice').textContent=`Supplied snapshot: ${formatINR(product.price_inr)} · Source ID ${product.product_id}`;
  document.querySelector('#alertProductId').value=product.product_id;
  const currentTarget=saved?.target??initial, shownPrice=saved?.current_price??product.price_inr;
  range.min=1;range.max=max;range.value=Math.max(1,currentTarget);number.max=max;number.value=Math.max(1,currentTarget);
  simulatedPrice=shownPrice;
  const demoRange=document.querySelector('#demoPriceRange');demoRange.max=Math.max(1,Math.ceil(product.price_inr/100)*100);demoRange.value=shownPrice;
  document.querySelector('#demoPriceValue').textContent=formatINR(shownPrice);
  document.querySelector('#demoPriceNote').textContent=saved?'Adjust the demo value to preview crossing your target. This is not a retailer feed.':'Save this target first to preview a simulated drop. No retailer feed is connected.';
  document.querySelector('#rangeMaxLabel').textContent=formatINR(max);
  updateAlertPreview(product,currentTarget,max);
  range.oninput=()=>{number.value=range.value;updateAlertPreview(product,Number(range.value),max)};
  number.oninput=()=>{if(number.value){range.value=Math.min(max,Number(number.value));updateAlertPreview(product,Number(number.value),max)}};
  dialog.showModal();
}
function updateAlertPreview(product,target,max){
  document.querySelector('#targetOutput').textContent=formatINR(target);
  document.querySelector('#targetProgress').style.width=`${Math.min(100,Math.max(0,target/max*100))}%`;
  const savings=Math.max(0,product.price_inr-target);
  const snapshotHint=target>=product.price_inr?'The current snapshot already meets this target.':`Target is ${formatINR(savings)} below the snapshot (${Math.round((savings/product.price_inr)*100)}% lower).`;
  const previewHint=simulatedPrice!==product.price_inr&&simulatedPrice<=target?` Demo preview has reached ${formatINR(simulatedPrice)}.`:'';
  document.querySelector('#targetHint').textContent=snapshotHint+previewHint;
}
function renderAlerts(){
  const list=document.querySelector('#alertsList');if(!list)return;
  document.querySelector('#alertCount').textContent=`${priceAlerts.length} saved`;
  if(!priceAlerts.length){list.innerHTML='<div class="alerts-empty">No alerts yet. Add one from any product card.</div>';return}
  list.innerHTML=priceAlerts.map(a=>{
    const current=Number(a.current_price??a.price);const met=current<=Number(a.target);
    const state=a.notified?(a.triggered_source==='simulated demo'?`Demo alert fired at ${formatINR(a.notified_price??current)}`:'Target already met in snapshot'):a.simulated?'Demo price preview · not live':met?'Target met in snapshot':'Saved locally · no live feed';
    return `<article class="alert-row"><div class="alert-product-icon">♧</div><div class="alert-details"><b>${escapeHtml(a.title)}</b><span>${escapeHtml(a.product_id)} · ${a.simulated?'Demo price':'Snapshot price'} ${formatINR(current)}</span></div><div class="alert-target"><small>YOUR TARGET</small><b>${formatINR(a.target)}</b></div><span class="alert-state ${met?'met':''}">${escapeHtml(state)}</span><button class="alert-preview-button" type="button" data-preview-alert="${escapeHtml(a.product_id)}">Preview demo</button><button class="alert-remove" type="button" data-remove-alert="${escapeHtml(a.product_id)}" aria-label="Remove alert for ${escapeHtml(a.title)}">×</button></article>`;
  }).join('');
}

function renderCompareBar(){
  const dock=document.querySelector('#compareDock');
  let bar = document.querySelector('#compareBar');
  if(picked.size < 2){ dock.innerHTML='';const panel=document.querySelector('#comparisonPanel');panel.innerHTML='';panel.classList.add('hidden');return; }
  if(!bar){
    bar = document.createElement('div'); bar.id = 'compareBar'; bar.className = 'compare-bar';
    dock.append(bar);
  }
  bar.innerHTML = `<span>${picked.size} of 3 products selected</span><button id="compareNow">Compare side by side</button><button class="clear-compare" id="clearCompare">Clear</button>`;
  document.querySelector('#compareNow').onclick = renderComparison;
  document.querySelector('#clearCompare').onclick = () => { picked.clear();renderLast();loadBrowse();renderCompareBar(); };
}

function renderComparison(){
  const arr = [...picked.values()].slice(0,3);
  const row = (label, get) => `<tr><th>${escapeHtml(label)}</th>${arr.map(p=>`<td>${escapeHtml(get(p) ?? 'Not listed')}</td>`).join('')}</tr>`;
  const retailerRow=`<tr><th>Retailer lookup</th>${arr.map(p=>`<td><div class="compare-retailer-links">${retailerSearchLinks(p)}</div></td>`).join('')}</tr>`;
  const box=document.querySelector('#comparisonPanel');
  box.innerHTML=`<div class="comparison-heading"><div><span class="section-kicker">SIDE BY SIDE</span><h3>Compare sample catalogue records</h3></div><button class="comparison-close" type="button" aria-label="Clear comparison">Clear</button></div><p class="comparison-disclosure">Prices below are from the supplied snapshot. Retailer buttons open official search pages; they do not verify an exact match or show live prices.</p><div class="compare-table-wrap"><table class="compare-table"><tbody>${row('Product',p=>p.title)}${row('Snapshot price',p=>formatINR(p.price_inr))}${row('Listed MRP',p=>formatINR(p.mrp_inr))}${row('Stock snapshot',p=>readable(p.stock_status))}${row('Rating in data',p=>p.rating?`${p.rating} / 5 (${p.review_count} reviews)`:'No reviews listed')}${row('Source ID',p=>p.product_id)}${retailerRow}</tbody></table></div>`;
  box.classList.remove('hidden');
  box.querySelector('.comparison-close').addEventListener('click',()=>{box.innerHTML='';box.classList.add('hidden');picked.clear();renderCompareBar();loadBrowse();renderLast()});
  box.scrollIntoView({behavior:'smooth',block:'start'});
}

let lastResults = [];
function renderLast(){
  if(!lastResults.length) return;
  response.querySelector('.product-grid')?.replaceWith(makeGrid(lastResults));
  renderCompareBar();
}
function makeGrid(products){
  const grid=document.createElement('div'); grid.className='product-grid'; grid.innerHTML=products.map(makeCard).join('');
  grid.querySelectorAll('input[type="checkbox"]').forEach(box=>box.addEventListener('change',()=>{
    const product=products.find(p=>p.product_id===box.dataset.id);
    if(box.checked){ if(picked.size>=3){box.checked=false;return;} picked.set(product.product_id,product); }
    else picked.delete(box.dataset.id);
    renderCompareBar();
  }));
  grid.querySelectorAll('[data-alert-id]').forEach(button=>button.addEventListener('click',()=>{
    const product=products.find(p=>p.product_id===button.dataset.alertId);if(product)openAlert(product);
  }));
  return grid;
}

function localPolicyAnswer(query){
  const rules=[
    [/(?:earbud|earphone).*(?:seal|return|opened|broken)|(?:seal|return).*(?:earbud|earphone)/i,'6.2'],
    [/warranty.*claim|claim.*warranty|how to claim/i,'3.4'],
    [/restock|restocking|free return/i,'1.2'],[/refund/i,'1.5'],[/exchange/i,'1.6'],
    [/\bcod\b|cash on delivery/i,'4.2'],[/delivery charge|shipping charge|free delivery/i,'2.1'],
    [/international|outside india|ship abroad/i,'2.3'],[/cancel/i,'5.1'],[/warranty/i,'3.1'],
    [/\bgst\b/i,'7.1'],[/coupon/i,'7.3'],[/price match/i,'7.4'],[/return/i,'1.1']
  ];
  const match=rules.find(([pattern])=>pattern.test(query)); if(!match||!localPolicy)return null;
  const lines=localPolicy.split(/\r?\n/); const start=lines.findIndex(line=>line.startsWith(`### ${match[1]} `));
  if(start<0)return null;
  const body=[];for(let i=start+1;i<lines.length&&!lines[i].startsWith('### ')&&!lines[i].startsWith('## ');i++)body.push(lines[i]);
  return {action:'answer',kind:'policy',answer:body.join(' ').replace(/\s+/g,' ').replace(/\*\*/g,'').trim(),citations:[match[1]],products:[],latency_ms:null};
}

function localSearch(query){
  const q=query.toLowerCase();
  const policy=localPolicyAnswer(query);if(policy)return policy;
  if(/\b(iphone|smartphone|mobile phone|laptop|television|tv|groceries|noodles|maggi|medicine|jewellery|anklet|payal|car|motorcycle)\b/.test(q)){
    return {action:'refuse',kind:'out-of-catalogue',answer:'That item is outside this store catalogue. I won’t invent a listing or price.',products:[],citations:[],latency_ms:null};
  }
  const budgetMatch=q.match(/(?:under|below|less than|within)\s*₹?\s*([\d,]+)/)||q.match(/([\d,]+)\s*(?:rupees?|rs\.?)/);
  const budget=budgetMatch?Number(budgetMatch[1].replace(/,/g,'')):null;
  const stop=new Set('a an the is are was of for to in on me what who price cost how much show find looking options option recommend suggest want need give please can you do have tell tellme under below less than within rupees rs available stock'.split(' '));
  const aliases={shoes:'shoe',shoe:'shoe',earbuds:'earbud',earbud:'earbud',tshirts:'tshirt'};
  const terms=[...new Set((q.match(/[a-z0-9]+/g)||[]).map(word=>aliases[word]||word).filter(word=>!stop.has(word)&&!/^\d+$/.test(word)))];
  if(!terms.length)return {action:'refuse',kind:'empty',answer:'Tell me a product, detail, or store-policy question and I’ll search the catalogue.',products:[],citations:[],latency_ms:null};
  const colors=new Set('black white red blue green yellow pink purple brown beige grey gray navy teal orange'.split(' '));
  const requestedColor=terms.find(word=>colors.has(word));
  const compare=/cheapest|lowest|sasta|sasti|cheaper|costliest|most expensive/.test(q);
  const priceQuestion=/price|cost|rate|₹|rupee/.test(q);
  const matched=localCatalogue.map(product=>{
    const attrs=Object.entries(product.attributes||{}).flatMap(([key,value])=>[key.replaceAll('_',' '),Array.isArray(value)?value.join(' '):String(value)]).join(' ');
    const searchable=`${product.title} ${product.brand} ${product.category} ${product.sub_category} ${attrs}`.toLowerCase();
    const words=searchable.match(/[a-z0-9]+/g)||[];
    const has=term=>words.some(word=>word===term||(term.length>3&&word===`${term}s`)||(word.length>3&&term===`${word}s`));
    if(budget!==null&&product.price_inr>budget)return null;
    if(requestedColor&&product.attributes?.colour&&String(product.attributes.colour).toLowerCase()!==requestedColor)return null;
    if(!terms.every(has))return null;
    const title=product.title.toLowerCase();
    const score=terms.reduce((sum,term)=>sum+(title.includes(term)?4:1),0);
    return {product,score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.product.price_inr-b.product.price_inr||a.product.product_id.localeCompare(b.product.product_id));
  if(!matched.length)return {action:'refuse',kind:'no-match',answer:'I couldn’t find a catalogue item matching those details. Try removing one filter or naming the product type.',products:[],citations:[],latency_ms:null};
  if(compare)matched.sort((a,b)=>a.product.price_inr-b.product.price_inr);
  const candidates=matched.slice(0,8).map(item=>item.product);
  const action=priceQuestion&&candidates.length>1&&!compare?'clarify':'answer';
  const answer=action==='clarify'?'I found a few close matches with different prices. Which listing did you mean?':priceQuestion||compare?`${candidates[0].title} is listed at ${formatINR(candidates[0].price_inr)} and is ${readable(candidates[0].stock_status).toLowerCase()}.`:`I found ${matched.length} catalogue match${matched.length===1?'':'es'}. Compare the listed details below.`;
  return {action,kind:'catalogue',answer,products:candidates,citations:candidates.map(product=>product.product_id),latency_ms:null};
}

async function ask(query){
  const q=query.trim(); if(!q) return;
  if(!apiReady&&!localCatalogue) await checkHealth();
  input.value=q; form.querySelector('button').disabled=true; form.querySelector('button').innerHTML='Checking <span>…</span>';
  welcome.classList.add('hidden'); response.classList.remove('hidden');
  response.innerHTML='<div class="answer-block"><span class="answer-seal">…</span><div class="answer-copy"><div class="answer-label">Checking the source</div><p>Searching the supplied catalogue and policy.</p></div></div>';
  try{
    const started=performance.now();
    let data;
    if(apiReady){
      const res=await fetch(`/api/search?q=${encodeURIComponent(q)}&history=${encodeURIComponent(JSON.stringify(history.slice(-2)))}`);
      data=await res.json();
      if(!res.ok) throw new Error(data.error || 'Search failed');
    }else if(localCatalogue){data=localSearch(q);}
    else throw new Error('Local catalogue files could not be loaded');
    const measured=Math.max(0,performance.now()-started);
    lastResults=data.products || [];
    picked.clear();
    history.push(q);
    const action=data.action || 'answer';
    const label={answer:'Grounded answer',clarify:'A quick clarification',refuse:'I can’t verify that'}[action] || 'Grounded answer';
    const seal=action==='clarify'?'?':action==='refuse'?'!':'✓';
    const cites=(data.citations||[]).map(id=>`<span class="source-chip">${escapeHtml(data.kind==='policy'?'POLICY § '+id:id)}</span>`).join('');
    const latency=`<span class="latency-chip">Reply · ${(data.latency_ms ?? measured).toFixed(1)} ms · 0 AI tokens</span>`;
    response.innerHTML=`<div class="answer-block"><span class="answer-seal ${action}">${seal}</span><div class="answer-copy"><div class="answer-label">${label}</div><p>${escapeHtml(data.answer)}</p></div></div><div class="response-meta">${cites}${latency}</div>`;
    if(lastResults.length){
      const title=document.createElement('div'); title.className='results-title';
      title.innerHTML=`<b>${action==='clarify'?'Choose the listing you meant':lastResults.length+' matching catalogue listing'+(lastResults.length===1?'':'s')}</b><span>Price and stock are from the supplied snapshot</span>`;
      response.append(title,response.querySelector('.product-grid') || makeGrid(lastResults));
    } else if(action==='refuse') {
      const hint=document.createElement('div'); hint.className='welcome-card'; hint.style.marginTop='14px';
      hint.innerHTML='<div class="welcome-icon">↗</div><div><b>Try a narrower search</b><p>Name a product type, colour, brand, or one detail you want to check.</p></div>';
      response.append(hint);
    }
    renderCompareBar();
  }catch(e){
    response.innerHTML=`<div class="answer-block"><span class="answer-seal refuse">!</span><div class="answer-copy"><div class="answer-label">Catalogue connection issue</div><p>${escapeHtml(e.message)}. Start the local server from the project folder and refresh this page.</p></div></div>`;
  }finally{
    form.querySelector('button').disabled=false; form.querySelector('button').innerHTML='Ask TrueCart <span>↗</span>';
  }
}

form.addEventListener('submit',e=>{e.preventDefault();ask(input.value);});
document.querySelector('#headerSearchForm').addEventListener('submit',e=>{
  e.preventDefault();const query=document.querySelector('#headerSearch').value.trim();if(!query)return;
  input.value=query;ask(query);document.querySelector('#shoppingDesk').scrollIntoView({behavior:'smooth',block:'start'});
});
document.querySelectorAll('.suggestion').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.query)));
document.querySelector('#categoryFilters').addEventListener('click',e=>{
  const button=e.target.closest('[data-category]'); if(!button)return;
  activeCategory=button.dataset.category;
  browsePage=1;
  document.querySelectorAll('.category-chip').forEach(chip=>chip.classList.toggle('active',chip===button));
  loadBrowse();
});
document.querySelector('#browseSort').addEventListener('change',()=>{browsePage=1;loadBrowse()});
document.querySelector('#downloadCatalogue').addEventListener('click',exportComparisonCsv);
document.querySelector('#policyNav').addEventListener('click',()=>{input.value='return policy';ask('return policy');document.querySelector('#shoppingDesk').scrollIntoView({behavior:'smooth',block:'start'})});
document.querySelector('#alertsList').addEventListener('click',e=>{
  const button=e.target.closest('[data-remove-alert]');if(!button)return;
  priceAlerts=priceAlerts.filter(alert=>alert.product_id!==button.dataset.removeAlert);persistAlerts();
});
document.querySelector('#alertsList').addEventListener('click',e=>{
  const button=e.target.closest('[data-preview-alert]');if(!button)return;
  const id=button.dataset.previewAlert;const saved=priceAlerts.find(alert=>alert.product_id===id);
  const product=demoCatalogue.find(item=>item.product_id===id)||localCatalogue?.find(item=>item.product_id===id)||browseProducts.find(item=>item.product_id===id)||lastResults.find(item=>item.product_id===id)||(saved?{product_id:id,title:saved.title,price_inr:saved.price,mrp_inr:saved.price,stock_status:'unknown',rating:null,review_count:0,attributes:{}}:null);
  if(product)openAlert(product);else showToast('This product is not in the currently loaded sample.');
});
document.querySelector('#alertForm').addEventListener('submit',e=>{
  e.preventDefault();const id=document.querySelector('#alertProductId').value;
  const product=selectedAlertProduct?.product_id===id?selectedAlertProduct:(localCatalogue?.find(p=>p.product_id===id)||browseProducts.find(p=>p.product_id===id));
  const target=Math.floor(Number(document.querySelector('#targetNumber').value));if(!product||!Number.isFinite(target)||target<1)return;
  const existing=priceAlerts.find(alert=>alert.product_id===id);
  const previousTarget=existing?.target;const current=Number(existing?.current_price??existing?.price??product.price_inr);
  const targetChanged=previousTarget!==undefined&&Number(previousTarget)!==target;
  const met=current<=target;const source=existing?.simulated?'simulated demo':'catalogue snapshot';
  priceAlerts=priceAlerts.filter(alert=>alert.product_id!==id);
  const alert={product_id:id,title:product.title,price:product.price_inr,current_price:current,target,simulated:existing?.simulated??false,notified:targetChanged?false:Boolean(existing?.notified),triggered_source:existing?.triggered_source,notified_price:existing?.notified_price,created_at:existing?.created_at??new Date().toISOString()};
  if(met&&!alert.notified){alert.notified=true;alert.triggered_source=source;alert.notified_price=current}
  priceAlerts.unshift(alert);persistAlerts();document.querySelector('#alertDialog').close();
  if(met&&!existing?.notified){const message=source==='simulated demo'?`Demo price target reached at ${formatINR(current)}.`:`Current snapshot already meets your ${formatINR(target)} target.`;showToast(message,'success');notifyBrowser('TrueCart price target reached',message)}
  else if(!met)showToast('Alert saved on this device. Future real price changes are not monitored.');
  document.querySelector('.alerts-panel').scrollIntoView({behavior:'smooth',block:'center'});
});
document.querySelector('#demoPriceRange').addEventListener('input',e=>{
  simulatedPrice=Number(e.currentTarget.value);
  document.querySelector('#demoPriceValue').textContent=formatINR(simulatedPrice);
  const id=document.querySelector('#alertProductId').value;
  const alert=priceAlerts.find(item=>item.product_id===id);
  const product=selectedAlertProduct;
  if(!alert||!product){document.querySelector('#demoPriceNote').textContent='Save this target first to preview a simulated drop. No retailer feed is connected.';return}
  const crossed=!alert.notified&&(alert.current_price??alert.price)>alert.target&&simulatedPrice<=alert.target;
  alert.current_price=simulatedPrice;alert.simulated=true;
  if(crossed){alert.notified=true;alert.triggered_source='simulated demo';alert.notified_price=simulatedPrice}
  persistAlerts();
  if(crossed){const note=`Demo target reached at ${formatINR(simulatedPrice)}. This is a simulation, not a store price.`;document.querySelector('#demoPriceNote').textContent=note;showToast(note,'success');notifyBrowser('TrueCart demo price target reached',`${product.title}: simulated ${formatINR(simulatedPrice)} (target ${formatINR(alert.target)}).`)}
  else document.querySelector('#demoPriceNote').textContent=simulatedPrice<=alert.target?'Demo target is met. This is not a retailer price feed.':'Demo only — move the slider to or below your target to preview an alert.';
});
document.querySelector('#enableNotifications').addEventListener('click',enableBrowserNotifications);
document.querySelector('#closeAlert').onclick=()=>document.querySelector('#alertDialog').close();
document.querySelector('#newChat').onclick=()=>{
  history.length=0; picked.clear(); lastResults=[]; input.value='';
  response.innerHTML=''; response.classList.add('hidden'); welcome.classList.remove('hidden');
  const comparisonPanel=document.querySelector('#comparisonPanel');comparisonPanel.innerHTML='';comparisonPanel.classList.add('hidden');renderCompareBar();loadBrowse();
};
const dialog=document.querySelector('#aboutDialog');
document.querySelector('#aboutButton').onclick=()=>dialog.showModal();
document.querySelector('#closeAbout').onclick=()=>dialog.close();
checkHealth();
renderAlerts();
