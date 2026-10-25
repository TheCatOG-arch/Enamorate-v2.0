// js/app.js (Página Web Pública Fusionada con Supabase)

const SUPABASE_URL = 'https://vdfflrcfmxuzwemajcuc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZmZscmNmbXh1endlbWFqY3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MDM2NTYsImV4cCI6MjEwODA3OTY1Nn0.k0T3ZO-DUgXatiur_6GwsjnaXiUxrsmY0CTovYCDkTA';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const mapaCategorias = { 1: 'Piqueos', 2: 'Platos', 3: 'Cócteles', 4: 'Cafés', 5: 'Refrescos', 6: 'Postres' };

let products = []; 
let tiendaAbierta = true;
let cart = JSON.parse(localStorage.getItem("enamorate_cart") || "[]");
let favorites = JSON.parse(localStorage.getItem("enamorate_favs") || "[]");
let currentGPS = null; 

let currentSlide = 0;
let selectedCategory = "Todos";
let currentSort = "featured";
let selectedPayment = "Yape / Plin";
let discountApplied = false;
let currentCustomProduct = null;

const heroSlides = [
  { num: "01 / 03", badge: "Cosecha Especial de Chanchamayo", title: "EL MEJOR CAFÉ Y FRAPPUCCINOS DE PICHANAKI", desc: "Granos seleccionados de nuestra Selva Central, leche cremosa y recetas artesanales que puedes personalizar a tu gusto.", cta: "Ver Carta Completa", productId: 1, image: "images/bar.jpg" },
  { num: "02 / 03", badge: "Recién salidos de plancha", title: "WAFFLES BELGAS CON FRUTAS Y NUTELLA", desc: "Crujientes por fuera y suaves por dentro, coronados con fresas, plátano, helado artesanal y fudge casero.", cta: "Ver Postres", productId: 2, image: "images/pollo-broaster.jpg" },
  { num: "03 / 03", badge: "Tardes & Noches en Café Enamórate", title: "SÁNGUCHES GOURMET, ALITAS Y MOCKTAILS", desc: "El punto de encuentro favorito en Pichanaki. Pide por delivery con Yape o reserva tu mesa VIP sin costo.", cta: "Ver Piqueos", productId: 6, image: "images/salchipapa.jpg" }
];

function showToast(message, icon = "check-circle-2") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "bg-[#18181c] border border-brand-pink/50 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-2xl flex items-center gap-2 text-[10px] sm:text-xs font-bold animate-slide-up pointer-events-auto";
  toast.innerHTML = `<i data-lucide="${icon}" class="w-3 h-3 sm:w-4 sm:h-4 text-brand-pink shrink-0"></i><span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => { toast.style.opacity = "0"; toast.style.transition = "opacity 0.3s ease"; setTimeout(() => toast.remove(), 300); }, 3500);
}

async function cargarDatosDB() {
    const { data: config } = await supabaseClient.from('configuracion').select('*').single();
    if (config) tiendaAbierta = config.tienda_abierta;

    const { data, error } = await supabaseClient.from('productos').select('*');
    if (error) { console.error("Error:", error); return; }

    products = data.map(p => ({
        id: p.id, name: p.nombre, category: mapaCategorias[p.categoria_id] || 'Otros', price: Number(p.precio),
        img: p.imagen_url || 'images/bar.jpg', desc: p.descripcion, size: p.tiempo || 'Regular',
        featuredBento: p.tag?.includes('Vendido') || p.tag?.includes('Recomendado'),
        opciones: p.opciones || { tamaños: [{nombre: "Normal", precio: 0}], extras: [{nombre: "Sin extras", precio: 0}] },
        stock: p.stock !== null ? p.stock : 0
    }));

    document.getElementById("favCountBadge").textContent = favorites.length;
    renderHero();
    renderBentoProducts();
    renderCategories();
    filterCategory("Todos");
    updateCartUI();
    
    const headerStatus = document.getElementById("estado-tienda-header");
    if (headerStatus) {
        headerStatus.innerHTML = tiendaAbierta 
            ? `<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>Abierto</span>`
            : `<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></span><span>Cerrado</span>`;
    }
}

// ================= HERO SLIDER RESPONSIVE =================
function renderHero() {
  const slide = heroSlides[currentSlide];
  document.getElementById("heroSlideContent").innerHTML = `
    <div class="lg:col-span-6 space-y-3 sm:space-y-5 z-10 text-center lg:text-left w-full overflow-hidden">
      <div class="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-3">
        <span class="text-[9px] sm:text-xs font-extrabold tracking-widest text-zinc-300 bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-white/15">${slide.num}</span>
        <span class="text-[9px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">${slide.badge}</span>
      </div>
      
      <h1 class="text-xl sm:text-4xl lg:text-5xl font-extrabold font-display leading-[1.1] tracking-tight text-white break-words w-full">
        ${slide.title}
      </h1>
      
      <p class="text-[11px] sm:text-base text-zinc-300 max-w-xl mx-auto lg:mx-0 leading-relaxed px-1 sm:px-0">
        ${slide.desc}
      </p>
      
      <div class="pt-1 sm:pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 w-full px-2 sm:px-0">
        <button onclick="filterCategory('Todos'); document.getElementById('catalogo-completo').scrollIntoView({behavior:'smooth'})" class="bg-white text-black font-extrabold text-[10px] sm:text-sm px-4 py-2 sm:px-6 sm:py-3.5 rounded-full inline-flex items-center justify-center gap-1.5 transition shadow-xl w-full sm:w-auto">
          <span>${slide.cta}</span><i data-lucide="arrow-right" class="w-3 h-3 sm:w-4 sm:h-4"></i>
        </button>
        <button onclick="toggleReservationModal()" class="bg-white/[0.07] text-white border border-white/15 font-bold text-[10px] sm:text-sm px-4 py-2 sm:px-5 sm:py-3.5 rounded-full inline-flex items-center justify-center gap-1.5 transition w-full sm:w-auto">
          <i data-lucide="calendar-heart" class="w-3 h-3 sm:w-4 sm:h-4 text-amber-400"></i><span>Reservar Mesa</span>
        </button>
      </div>
    </div>

    <div class="lg:col-span-6 flex justify-center relative mt-3 lg:mt-0">
      <div class="w-36 h-36 sm:w-64 sm:h-64 lg:w-[340px] lg:h-[340px] rounded-full overflow-hidden border-2 sm:border-4 border-white/10 shadow-2xl shadow-brand-pink/25 group">
        <img src="${slide.image}" alt="Slide" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
      </div>
    </div>
  `;
  document.getElementById("heroDots").innerHTML = heroSlides.map((_, idx) => `
    <button onclick="goToSlide(${idx})" class="h-1.5 sm:h-2 rounded-full transition-all ${currentSlide === idx ? "w-5 sm:w-8 bg-brand-pink" : "w-1.5 sm:w-2 bg-white/30 hover:bg-white/60"}"></button>
  `).join("");
  lucide.createIcons();
}
function nextSlide() { currentSlide = (currentSlide + 1) % heroSlides.length; renderHero(); }
function prevSlide() { currentSlide = (currentSlide - 1 + heroSlides.length) % heroSlides.length; renderHero(); }
function goToSlide(idx) { currentSlide = idx; renderHero(); }

// ================= TARJETAS DE PRODUCTO =================
function createProductCardHTML(item) {
  const isFav = favorites.includes(item.id);
  const agotado = item.stock <= 0;
  
  return `
    <div class="bg-[#121215] border border-white/[0.08] rounded-[16px] sm:rounded-[24px] p-2 sm:p-3.5 flex flex-col justify-between card-glow hover:border-white/20 transition group relative w-full">
      ${agotado ? `<div class="absolute inset-0 bg-black/60 z-20 flex items-center justify-center rounded-[16px] sm:rounded-[24px]"><span class="bg-red-500 text-white font-extrabold px-3 py-1 text-xs sm:text-base sm:px-4 sm:py-2 rounded-full rotate-[-10deg]">AGOTADO</span></div>` : ''}
      <div>
        <div class="relative h-32 sm:h-48 rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 w-full">
          <img onclick="openCustomizer(${item.id})" src="${item.img}" alt="${item.name}" class="cursor-pointer w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          <span class="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 bg-black/75 backdrop-blur-md text-[8px] sm:text-[11px] font-bold text-zinc-200 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full">${item.size}</span>
          <button onclick="toggleFavorite(${item.id})" class="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/10 hover:scale-110 transition z-30">
            <i data-lucide="heart" class="w-3 h-3 sm:w-4 sm:h-4 ${isFav ? 'text-brand-pink fill-current' : 'text-white'}"></i>
          </button>
        </div>
        <div class="mt-2 sm:mt-3.5 px-0.5 sm:px-1">
          <span class="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400">${item.category}</span>
          <h4 onclick="openCustomizer(${item.id})" class="cursor-pointer font-extrabold text-[11px] sm:text-base text-white line-clamp-1 hover:text-brand-pink transition">${item.name}</h4>
          <p class="text-[9px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 line-clamp-2 leading-relaxed hidden sm:block">${item.desc}</p>
        </div>
      </div>
      <div class="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-white/[0.06] px-0.5 sm:px-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
        <div><span class="text-[8px] sm:text-[10px] uppercase text-zinc-500 block font-semibold">Precio</span><span class="text-xs sm:text-lg font-extrabold text-white">S/ ${item.price.toFixed(2)}</span></div>
        
        <div class="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-end">
          <button onclick="openCustomizer(${item.id})" class="bg-white/[0.07] text-zinc-200 text-[9px] sm:text-xs font-bold px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-full transition flex-1 sm:flex-none" title="Personalizar">Personalizar</button>
          <button onclick="quickAddToCart(${item.id})" class="bg-brand-pink text-white w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition shadow-md z-30 shrink-0" title="Agregar rápido"><i data-lucide="plus" class="w-3 h-3 sm:w-4 sm:h-4"></i></button>
        </div>
      </div>
    </div>
  `;
}

function renderBentoProducts() {
  const featured = products.filter(p => p.featuredBento).slice(0, 4);
  document.getElementById("bentoProductsGrid").innerHTML = featured.map(createProductCardHTML).join("");
  lucide.createIcons();
}

function renderCategories() {
  const cats = Object.values(mapaCategorias);
  document.getElementById("categoriesGrid").innerHTML = cats.map(cat => `
    <button onclick="filterCategory('${cat}'); document.getElementById('catalogo-completo').scrollIntoView({behavior: 'smooth'})" class="bg-[#121215] border border-white/[0.08] rounded-xl sm:rounded-2xl p-2 sm:p-3.5 text-left h-24 sm:h-36 flex flex-col justify-between relative overflow-hidden group transition w-full">
      <div class="z-10"><span class="font-extrabold text-[10px] sm:text-sm text-white block leading-snug group-hover:text-amber-400 transition">${cat}</span><span class="text-[8px] sm:text-[10px] text-zinc-500 font-semibold">Ver productos</span></div>
      <img src="images/bar.jpg" class="w-12 h-12 sm:w-20 sm:h-20 object-cover rounded-lg sm:rounded-xl self-end group-hover:scale-110 transition duration-500 shadow-lg opacity-50" />
    </button>
  `).join("");
}

function handleSortChange() { currentSort = document.getElementById("sortSelect").value; filterCategory(selectedCategory); }

function filterCategory(catName, searchQuery = "") {
  selectedCategory = catName;
  document.getElementById("activeCategoryTitle").textContent = catName === "Todos" ? "CARTA COMPLETA" : `CATEGORÍA: ${catName.toUpperCase()}`;

  let filtered = products.filter(p => {
    const matchesCat = catName === "Todos" || p.category === catName || catName === "Favoritos";
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    if (catName === "Favoritos") return favorites.includes(p.id) && matchesSearch;
    return matchesCat && matchesSearch;
  });

  if (currentSort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (currentSort === "price-desc") filtered.sort((a, b) => b.price - a.price);

  const catalogGrid = document.getElementById("fullCatalogGrid");
  catalogGrid.innerHTML = filtered.length === 0 
    ? `<p class="text-sm text-zinc-400 col-span-full py-8 text-center">No se encontraron productos.</p>` 
    : filtered.map(createProductCardHTML).join("");

  renderCategoryPills();
  lucide.createIcons();
}

function renderCategoryPills() {
  const allCats = ["Todos", ...Object.values(mapaCategorias)];
  document.getElementById("categoryPills").innerHTML = allCats.map(cat => `
    <button onclick="filterCategory('${cat}')" class="text-[10px] sm:text-xs font-bold px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full shrink-0 transition ${selectedCategory === cat ? "bg-brand-pink text-white" : "bg-white/[0.06] text-zinc-300 hover:bg-white/15"}">${cat}</button>
  `).join("");
}

function toggleFavorite(productId) {
  if (favorites.includes(productId)) { favorites = favorites.filter(id => id !== productId); showToast("Quitado de favoritos", "heart"); }
  else { favorites.push(productId); showToast("Guardado en favoritos ❤️", "heart"); }
  localStorage.setItem("enamorate_favs", JSON.stringify(favorites));
  document.getElementById("favCountBadge").textContent = favorites.length;
  renderBentoProducts(); filterCategory(selectedCategory);
}
function filterFavorites() {
  if (favorites.length === 0) { showToast("Aún no tienes favoritos.", "info"); return; }
  filterCategory("Favoritos");
  document.getElementById("catalogo-completo").scrollIntoView({ behavior: "smooth" });
}

function openCustomizer(productId) {
  currentCustomProduct = products.find(p => p.id === productId);
  if (!currentCustomProduct) return;
  if (currentCustomProduct.stock <= 0) { showToast("Producto agotado", "alert-circle"); return; }

  const opciones = currentCustomProduct.opciones;
  const sizes = opciones.tamaños || [{nombre: "Normal", precio: 0}];
  const extras = opciones.extras || [{nombre: "Sin extras", precio: 0}];

  document.getElementById("customizerContent").innerHTML = `
    <div class="relative h-36 sm:h-56 w-full shrink-0">
      <img src="${currentCustomProduct.img}" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-[#121215] via-black/40 to-transparent"></div>
      <button onclick="closeCustomizer()" class="absolute top-2 right-2 sm:top-4 sm:right-4 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/70 text-white flex items-center justify-center"><i data-lucide="x" class="w-3 h-3 sm:w-4 sm:h-4"></i></button>
      <div class="absolute bottom-2 left-3 right-3 sm:bottom-3 sm:left-5 sm:right-5">
        <span class="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-widest bg-brand-pink text-white px-2 py-0.5 rounded-full">${currentCustomProduct.category}</span>
        <h3 class="text-base sm:text-xl font-extrabold font-display text-white mt-1">${currentCustomProduct.name}</h3>
      </div>
    </div>
    <div class="p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 text-[10px] sm:text-xs flex-1">
      <p class="text-zinc-400 leading-relaxed">${currentCustomProduct.desc}</p>
      <div>
        <label class="font-extrabold text-white uppercase block mb-1 sm:mb-2">1. Tamaño:</label>
        <div class="grid grid-cols-2 gap-1 sm:gap-2">
          ${sizes.map((t, i) => `
            <label class="cursor-pointer border border-white/15 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex flex-col items-center text-center has-[:checked]:border-brand-pink has-[:checked]:bg-brand-pink/15">
              <input type="radio" name="custSize" value="${t.nombre}" data-extra="${t.precio}" ${i===0?'checked':''} onchange="recalcCustomPrice()" class="hidden" />
              <span class="font-bold text-white text-[10px] sm:text-xs">${t.nombre}</span>
              <span class="text-[8px] sm:text-[10px] ${t.precio > 0 ? 'text-amber-400' : 'text-zinc-400'}">+ S/ ${Number(t.precio).toFixed(2)}</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div>
        <label class="font-extrabold text-white uppercase block mb-1 sm:mb-2">2. Extras:</label>
        <div class="grid grid-cols-1 gap-1 sm:gap-2">
          ${extras.map(e => `
            <label class="cursor-pointer border border-white/10 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center justify-between has-[:checked]:border-amber-400 has-[:checked]:bg-amber-400/10">
              <div class="flex items-center gap-1.5"><input type="checkbox" name="custExtra" value="${e.nombre}" data-extra="${e.precio}" onchange="recalcCustomPrice()" class="accent-brand-pink w-3 h-3" /><span class="text-white font-semibold text-[10px] sm:text-xs">${e.nombre}</span></div>
              <span class="text-amber-400 font-bold text-[9px] sm:text-xs">${e.precio !== 0 ? `+S/ ${Number(e.precio).toFixed(2)}` : 'Gratis'}</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div>
        <label class="font-extrabold text-white uppercase block mb-1">3. Nota:</label>
        <input id="custNote" type="text" placeholder="Ej. Poco hielo..." class="w-full bg-black/50 border border-white/10 rounded-lg sm:rounded-xl px-2 sm:px-3.5 py-1.5 sm:py-2 text-white focus:outline-none focus:border-brand-pink" />
      </div>
    </div>
    <div class="p-2 sm:p-4 border-t border-white/10 bg-[#0d0d10] flex items-center justify-between gap-2">
      <div><span class="text-[8px] sm:text-[10px] text-zinc-400 uppercase block font-bold">Total</span><span id="customLivePrice" class="text-sm sm:text-xl font-extrabold text-amber-400">S/ ${currentCustomProduct.price.toFixed(2)}</span></div>
      <button onclick="confirmCustomAdd()" class="flex-1 bg-brand-pink text-white font-extrabold py-2 sm:py-3.5 px-3 sm:px-6 rounded-full text-[10px] sm:text-sm flex items-center justify-center gap-1"><i data-lucide="shopping-bag" class="w-3 h-3 sm:w-4 sm:h-4"></i><span>Agregar</span></button>
    </div>
  `;
  document.getElementById("customizerModal").classList.remove("hidden");
  lucide.createIcons();
}

function recalcCustomPrice() {
  let total = currentCustomProduct.price;
  const sizeInput = document.querySelector('input[name="custSize"]:checked');
  if (sizeInput) total += parseFloat(sizeInput.dataset.extra || 0);
  document.querySelectorAll('input[name="custExtra"]:checked').forEach(chk => { total += parseFloat(chk.dataset.extra || 0); });
  document.getElementById("customLivePrice").textContent = `S/ ${total.toFixed(2)}`;
  return total;
}

function confirmCustomAdd() {
  const finalPrice = recalcCustomPrice();
  const sizeVal = document.querySelector('input[name="custSize"]:checked')?.value || "Normal";
  const extras = Array.from(document.querySelectorAll('input[name="custExtra"]:checked')).map(c => c.value);
  const note = document.getElementById("custNote").value.trim();

  const customDetails = [`Tamaño: ${sizeVal}`, ...(extras.length ? [`Extras: ${extras.join(", ")}`] : []), ...(note ? [`Nota: ${note}`] : [])].join(" | ");
  const cartItemKey = `${currentCustomProduct.id}-${customDetails}`;
  const existing = cart.find(i => i.cartKey === cartItemKey);

  if (existing) existing.qty += 1;
  else cart.push({ ...currentCustomProduct, cartKey: cartItemKey, price: finalPrice, customDetails, qty: 1 });

  saveAndRefreshCart(); closeCustomizer(); showToast(`${currentCustomProduct.name} agregado ☕`);
}
function closeCustomizer() { document.getElementById("customizerModal").classList.add("hidden"); }

function quickAddToCart(productId) {
  const prod = products.find(p => p.id === productId);
  if (prod.stock <= 0) { showToast("Agotado", "alert-circle"); return; }
  const cartKey = `${prod.id}-estandar`;
  const existing = cart.find(item => item.cartKey === cartKey);
  if (existing) existing.qty += 1;
  else cart.push({ ...prod, cartKey, customDetails: "Estándar", qty: 1, price: prod.price });
  saveAndRefreshCart(); showToast(`${prod.name} agregado 🛍️`);
}

function changeQty(cartKey, delta) {
  const item = cart.find(i => i.cartKey === cartKey);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.cartKey !== cartKey);
  saveAndRefreshCart();
}

function applyCoupon() {
  const code = document.getElementById("couponInput").value.trim().toUpperCase();
  if (code === "ENAMORATE10" || code === "PICHANAKI") { discountApplied = true; updateCartUI(); showToast("¡Cupón 10% OFF activado! 🎉", "sparkles"); }
  else { showToast("Código no válido.", "alert-circle"); }
}

function selectPaymentMethod(method) {
  selectedPayment = method;
  const btnYape = document.getElementById("payBtnYape"), btnCard = document.getElementById("payBtnCard"), btnCash = document.getElementById("payBtnCash"), qrBox = document.getElementById("yapeQrBox");
  [btnYape, btnCard, btnCash].forEach(b => b.className = "py-1.5 rounded-lg border border-white/10 bg-black/40 text-zinc-300 font-bold text-[10px]");
  if (method === "Yape / Plin") { btnYape.className = "py-1.5 rounded-lg border border-brand-pink bg-brand-pink/15 text-white font-bold text-[10px]"; qrBox.classList.remove("hidden"); }
  else if (method === "Tarjeta POS") { btnCard.className = "py-1.5 rounded-lg border border-brand-pink bg-brand-pink/15 text-white font-bold text-[10px]"; qrBox.classList.add("hidden"); }
  else { btnCash.className = "py-1.5 rounded-lg border border-brand-pink bg-brand-pink/15 text-white font-bold text-[10px]"; qrBox.classList.add("hidden"); }
  lucide.createIcons();
}

function copyYapeNumber() { navigator.clipboard.writeText("969054687"); showToast("Número copiado", "copy"); }

// ================= LÓGICA DE GPS CON VISTA PREVIA =================
function toggleGPS() {
    const btn = document.getElementById("btnGPS");
    const input = document.getElementById("customerAddress");
    const mapPreview = document.getElementById("gps-preview-map");
    const iframe = document.getElementById("gps-iframe");
    
    // Si ya hay coordenadas guardadas, significa que quiere desactivarlo
    if (currentGPS) {
        currentGPS = null;
        input.style.display = "block";
        input.value = "";
        mapPreview.classList.add("hidden"); // Ocultar mapa
        btn.innerHTML = `<i data-lucide="map-pin" class="w-4 h-4 text-emerald-400"></i> Usar mi ubicación GPS`;
        btn.classList.remove("border-emerald-500", "text-emerald-400", "bg-emerald-500/10");
        btn.disabled = false;
        lucide.createIcons();
        showToast("Ubicación GPS removida", "info");
        return;
    }

    if (navigator.geolocation) {
        // Estado de carga
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Buscando señal GPS...`;
        btn.disabled = true;
        
        // enableHighAccuracy: true obliga a usar el GPS real del celular
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Éxito
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                currentGPS = `${lat},${lng}`;
                
                input.value = "📍 Ubicación GPS seleccionada";
                input.style.display = "none"; 
                
                // Mostrar el mapa de confirmación
                iframe.src = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
                mapPreview.classList.remove("hidden");
                
                // Cambiamos el botón a verde
                btn.innerHTML = `<i data-lucide="map-pin" class="w-4 h-4 text-emerald-400"></i> Ubicación Lista (Click para quitar)`;
                btn.classList.add("border-emerald-500", "text-emerald-400", "bg-emerald-500/10");
                btn.disabled = false;
                lucide.createIcons();
                showToast("¡Ubicación obtenida! Verifica el mapa abajo 👇", "check-circle-2");
            },
            (error) => {
                // Manejo de errores
                btn.disabled = false;
                btn.innerHTML = `<i data-lucide="map-pin" class="w-4 h-4 text-emerald-400"></i> Usar mi ubicación GPS`;
                lucide.createIcons();
                
                if (error.code === error.PERMISSION_DENIED) {
                    showToast("Por favor, activa el GPS y da permisos a tu navegador.", "alert-circle");
                } else if (error.code === error.TIMEOUT) {
                    showToast("La señal GPS tardó mucho. Intenta de nuevo en un lugar abierto.", "alert-circle");
                } else {
                    showToast("No pudimos obtener tu ubicación. Verifica que tu GPS esté encendido.", "alert-circle");
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    } else {
        showToast("Tu navegador no soporta geolocalización.", "alert-circle");
    }
}

function saveAndRefreshCart() { localStorage.setItem("enamorate_cart", JSON.stringify(cart)); updateCartUI(); }

function updateCartUI() {
  const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discount = discountApplied ? subtotal * 0.10 : 0;
  const orderSelect = document.getElementById("orderType");
  const selectedOption = orderSelect?.options[orderSelect.selectedIndex];
  const deliveryFee = subtotal > 0 ? parseFloat(selectedOption?.dataset.fee || 0) : 0;
  const finalTotal = Math.max(0, subtotal - discount + deliveryFee);

  document.getElementById("headerCartCount").textContent = totalCount;
  document.getElementById("dockCartCount").textContent = totalCount;
  document.getElementById("headerCartTotal").textContent = `S/ ${finalTotal.toFixed(2)}`;
  document.getElementById("summarySubtotal").textContent = `S/ ${subtotal.toFixed(2)}`;
  document.getElementById("summaryDelivery").textContent = `S/ ${deliveryFee.toFixed(2)}`;
  document.getElementById("drawerCartTotal").textContent = `S/ ${finalTotal.toFixed(2)}`;

  const discountRow = document.getElementById("summaryDiscountRow");
  if (discountApplied && subtotal > 0) { discountRow.style.display = "flex"; document.getElementById("summaryDiscount").textContent = `- S/ ${discount.toFixed(2)}`; }
  else { discountRow.style.display = "none"; }

  const container = document.getElementById("cartItemsContainer");
  if (cart.length === 0) {
    container.innerHTML = `<div class="h-24 flex flex-col items-center justify-center text-center text-zinc-500 space-y-1"><i data-lucide="coffee" class="w-6 h-6 stroke-1"></i><p class="text-[10px]">Tu carrito está vacío.</p></div>`;
  } else {
    container.innerHTML = cart.map(item => `
      <div class="bg-white/[0.04] border border-white/10 rounded-lg sm:rounded-2xl p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2.5">
        <img src="${item.img}" class="w-8 h-8 sm:w-12 sm:h-12 rounded-md sm:rounded-xl object-cover shrink-0" />
        <div class="flex-1 min-w-0">
          <h5 class="text-[10px] sm:text-xs font-bold text-white truncate">${item.name}</h5>
          <p class="text-[8px] sm:text-[10px] text-zinc-400 truncate">${item.customDetails || "Estándar"}</p>
          <span class="text-[10px] sm:text-xs font-extrabold text-amber-400">S/ ${(item.price * item.qty).toFixed(2)}</span>
        </div>
        <div class="flex items-center gap-1 bg-black/50 rounded-full px-1 py-0.5 sm:px-2 sm:py-1 border border-white/10">
          <button onclick="changeQty('${item.cartKey}', -1)" class="text-zinc-300 text-[10px] sm:text-xs font-bold px-1">-</button>
          <span class="text-[10px] sm:text-xs font-extrabold">${item.qty}</span>
          <button onclick="changeQty('${item.cartKey}', 1)" class="text-zinc-300 text-[10px] sm:text-xs font-bold px-1">+</button>
        </div>
      </div>
    `).join("");
  }
  lucide.createIcons();
}

function toggleCart() { document.getElementById("cartModal").classList.toggle("hidden"); }

// ================= GENERAR PDF =================
function generarPDF(nombreCliente, tipoEntrega, direccion, pago, subtotal, descuento, envio, total) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Estilos básicos
    doc.setFontSize(20);
    doc.text("Café Enamórate", 105, 20, null, null, "center");
    
    doc.setFontSize(10);
    doc.text("Pichanaki, Chanchamayo - Junín", 105, 27, null, null, "center");
    doc.text("WhatsApp: +51 969 054 687", 105, 32, null, null, "center");

    doc.setFontSize(14);
    doc.text("BOLETA DE VENTA", 105, 45, null, null, "center");

    doc.setFontSize(10);
    doc.text(`Cliente: ${nombreCliente}`, 20, 60);
    doc.text(`Tipo de entrega: ${tipoEntrega}`, 20, 67);
    doc.text(`Dirección/Ubicación: ${direccion}`, 20, 74);
    doc.text(`Método de pago: ${pago}`, 20, 81);

    // Tabla de productos
    let y = 95;
    doc.text("Cant.", 20, y);
    doc.text("Producto", 40, y);
    doc.text("Subtotal", 170, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 10;

    cart.forEach(item => {
        doc.text(item.qty.toString(), 20, y);
        // Cortar el nombre si es muy largo
        let nombre = item.name;
        if (nombre.length > 40) nombre = nombre.substring(0, 40) + "...";
        doc.text(`${nombre} (${item.customDetails})`, 40, y);
        doc.text(`S/ ${(item.price * item.qty).toFixed(2)}`, 170, y);
        y += 8;
    });

    doc.line(20, y, 190, y);
    y += 10;

    doc.text(`Subtotal: S/ ${subtotal.toFixed(2)}`, 150, y);
    if (descuento > 0) {
        y += 7;
        doc.text(`Descuento: -S/ ${descuento.toFixed(2)}`, 150, y);
    }
    y += 7;
    doc.text(`Envío: S/ ${envio.toFixed(2)}`, 150, y);
    
    y += 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: S/ ${total.toFixed(2)}`, 150, y);

    // Guardar
    doc.save(`Boleta_CafeEnamorate_${Date.now()}.pdf`);
}

// ================= PROCESAR PAGO Y WHATSAPP =================
async function procesarPago(e) {
  if(e) e.preventDefault();
  if (cart.length === 0) { showToast("Agrega productos al carrito", "alert-circle"); return; }
  if (!tiendaAbierta) { showToast("La tienda está cerrada.", "alert-circle"); return; }

  const btn = document.querySelector("#cartModal button[onclick='procesarPago(event)']");
  const textoOriginal = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
  btn.disabled = true;

  const name = document.getElementById("customerName").value.trim() || "Cliente";
  const orderSelect = document.getElementById("orderType");
  const modalityText = orderSelect.options[orderSelect.selectedIndex].text;
  
  // Lógica GPS
  let address = "";
  if (currentGPS) {
      address = `GPS: ${currentGPS}`;
  } else {
      address = document.getElementById("customerAddress").value.trim() || "Por coordinar";
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discount = discountApplied ? subtotal * 0.10 : 0;
  const deliveryFee = parseFloat(orderSelect.options[orderSelect.selectedIndex].dataset.fee || 0);
  const finalTotal = Math.max(0, subtotal - discount + deliveryFee);

  // 1. Generar PDF de Inmediato
  generarPDF(name, modalityText, address, selectedPayment, subtotal, discount, deliveryFee, finalTotal);

  // 2. Guardar en Supabase
  try {
      let tipoEntregaDB = modalityText.includes("Delivery") ? "delivery" : "recojo";
      let metodoPagoDB = selectedPayment.includes("Yape") ? "yape" : selectedPayment.includes("Tarjeta") ? "tarjeta" : "efectivo";

      const { data: pedidoData, error: pedidoError } = await supabaseClient
          .from('pedidos')
          .insert([{ cliente_nombre: name, cliente_telefono: "000000000", tipo_entrega: tipoEntregaDB, direccion: address, metodo_pago: metodoPagoDB, subtotal: subtotal, costo_envio: deliveryFee, total: finalTotal, estado: 'pendiente' }])
          .select().single();

      if (pedidoError) throw new Error(pedidoError.message);

      const itemsInsert = cart.map(item => ({
          pedido_id: pedidoData.id, 
          producto_id: parseInt(item.id), 
          cantidad: parseInt(item.qty),
          precio_unitario: parseFloat(item.price), 
          extras: item.customDetails, 
          subtotal: parseFloat(item.price * item.qty)
      }));
      
      const { error: itemsError } = await supabaseClient.from('pedido_items').insert(itemsInsert);
      if (itemsError) throw new Error(itemsError.message);
      
  } catch (error) {
      console.error("Error DB:", error);
      showToast("Error al guardar pedido, enviando WhatsApp", "alert-circle");
  }

  // 3. Enviar a WhatsApp
  const lines = cart.map(i => `• ${i.qty}x *${i.name}* [${i.customDetails}] — S/ ${(i.price * i.qty).toFixed(2)}`).join("%0A");
  const message = `¡Hola *Café Enamórate*! ☕❤️%0ANuevo pedido:%0A%0A👤 *Cliente:* ${name}%0A🛵 *Modalidad:* ${modalityText}%0A📍 *Dirección/Ubicación:* ${address}%0A💳 *Pago:* ${selectedPayment}%0A%0A*DETALLE:*%0A${lines}%0A%0A${discountApplied ? `🏷️ *Descuento:* -S/ ${discount.toFixed(2)}%0A` : ""}🚚 *Envío:* S/ ${deliveryFee.toFixed(2)}%0A💰 *TOTAL: S/ ${finalTotal.toFixed(2)}*`;

  window.open(`https://wa.me/51969054687?text=${message}`, "_blank");

  setTimeout(() => {
      cart = []; saveAndRefreshCart(); toggleCart();
      currentGPS = null; // Resetear GPS
      btn.innerHTML = textoOriginal; btn.disabled = false;
      showToast("¡Pedido confirmado y PDF descargado!", "check-circle-2");
  }, 1500);
}

function toggleReservationModal() { document.getElementById("reservationModal").classList.toggle("hidden"); }
function sendReservationWhatsApp() {
  const name = document.getElementById("resName").value.trim() || "Cliente";
  const date = document.getElementById("resDate").value || "Hoy";
  const time = document.getElementById("resTime").value || "19:30";
  const guests = document.getElementById("resGuests").value;
  const zone = document.getElementById("resZone").value;
  const notes = document.getElementById("resNotes").value.trim() || "Reserva estándar";
  const msg = `¡Hola *Café Enamórate*! ✨☕%0AQuisiera confirmar una *RESERVA*:%0A%0A👤 *Nombre:* ${name}%0A📅 *Fecha:* ${date}%0A🕒 *Hora:* ${time}%0A👥 *Personas:* ${guests}%0A📍 *Zona:* ${zone}%0A🎁 *Detalle:* ${notes}`;
  window.open(`https://wa.me/51969054687?text=${msg}`, "_blank");
}

function abrirReclamaciones() { document.getElementById("modal-reclamaciones").classList.remove("hidden"); }
function cerrarReclamaciones() { document.getElementById("modal-reclamaciones").classList.add("hidden"); }
async function enviarReclamacion(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const btnText = btn.innerHTML;
    btn.innerHTML = 'Enviando...'; btn.disabled = true;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    const nombre = inputs[0].value;
    const documento = inputs[1].value;
    const correo = inputs[2].value;
    const tipo = inputs[3].value === "Queja" ? "queja" : "reclamo";
    const detalle = inputs[4].value;

    try {
        const { error } = await supabaseClient.from('reclamos').insert([{ nombre_cliente: nombre, documento, correo, tipo, detalle, estado: 'pendiente' }]);
        if (error) throw error;
        showToast("Reclamo registrado exitosamente.", "check-circle-2");
        cerrarReclamaciones(); form.reset();
    } catch (error) {
        console.error(error);
        showToast("Error de conexión. Intenta de nuevo.", "alert-circle");
    } finally { btn.innerHTML = btnText; btn.disabled = false; }
}

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("resDate");
  if (dateInput) dateInput.value = today;

  cargarDatosDB();

  const handleSearch = (e) => { filterCategory("Todos", e.target.value); if (e.target.value.length === 1) document.getElementById("catalogo-completo").scrollIntoView({ behavior: "smooth" }); };
  document.getElementById("searchInput").addEventListener("input", handleSearch);
  document.getElementById("mobileSearchInput").addEventListener("input", handleSearch);

  setInterval(nextSlide, 6500);
});