const movieGrid = document.getElementById('movieGrid');
const movieSearch = document.getElementById('movieSearch');
const resultCount = document.getElementById('resultCount');
const filterButtons = [...document.querySelectorAll('.filter')];
const promoGrid = document.getElementById('promoGrid');
const modal = document.getElementById('localModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalAction = document.getElementById('modalAction');
let activeFilter = 'all';
let promoOffset = 0;
let selectedMovie = null;
let selectedCinema = '';
let movies = [];
let loadingMovies = false;
let movieError = '';

const promotions = [
  {kicker:'PELÍCULAS ACTUALIZADAS',title:'CARTELERA DE PELÍCULAS',description:'Explora películas y estrenos con información obtenida de TMDB.',label:'VER CARTELERA',target:'#movies'},
  {kicker:'UNA EXPERIENCIA PARA DISFRUTAR',title:'CLUB CINÉPOLIS',description:'Esta sección es una demostración local de beneficios y recompensas.',label:'CONOCER MÁS',target:'#rewards'},
  {kicker:'ELIGE TU COMPLEJO',title:'CINES EN CHIHUAHUA',description:'Encuentra opciones en Chihuahua capital, Juárez y otros municipios.',label:'BUSCAR CINE',target:'#home'},
  {kicker:'PLAN CON AMIGOS O FAMILIA',title:'TU PRÓXIMA NOCHE DE CINE',description:'Consulta información de películas y selecciona un cine de Chihuahua.',label:'VER CARTELERA',target:'#home'},
  {kicker:'ESTRENOS Y PRÓXIMAMENTE',title:'NO TE PIERDAS NADA',description:'Los datos de películas vienen de TMDB; los horarios del cine no están conectados.',label:'CONSULTAR',target:'#movies'}
];

function escapeHTML(s){return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function isEvent(movie){return movie.type === 'Próximamente';}
function formatDate(value){
  if(!value) return 'Fecha por confirmar';
  const date = new Date(`${value}T12:00:00`);
  if(Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',year:'numeric'}).format(date);
}
function renderMovies(){
  if(loadingMovies){movieGrid.innerHTML='<div class="loading">Consultando películas en TMDB…</div>';resultCount.textContent='CARGANDO';return;}
  if(movieError){movieGrid.innerHTML=`<div class="loading">${escapeHTML(movieError)}<br><br><button class="outline-button" id="retryMovies">VOLVER A INTENTAR</button></div>`;resultCount.textContent='SIN DATOS';document.getElementById('retryMovies')?.addEventListener('click',()=>loadMovies(activeFilter==='upcoming'?'proximamente':'cartelera'));return;}
  const q=movieSearch.value.trim().toLowerCase();
  const filtered=movies.filter(m=>{
    const bySearch=(m.title||'').toLowerCase().includes(q);
    const byFilter=activeFilter==='all'||(activeFilter==='deals'&&m.type==='Estreno')||(activeFilter==='upcoming'&&isEvent(m));
    return bySearch&&byFilter;
  });
  resultCount.textContent=`${filtered.length} PELÍCULAS`;
  if(!filtered.length){movieGrid.innerHTML='<div class="loading">No encontramos resultados. Prueba con otro título o cambia el filtro.</div>';return;}
  movieGrid.innerHTML=filtered.map(m=>{
    const i=movies.indexOf(m);
    const badge=isEvent(m)?'PRÓXIMAMENTE':m.type.toUpperCase();
    const poster=m.poster_url
      ? `<img class="poster-image" src="${escapeHTML(m.poster_url)}" alt="Póster de ${escapeHTML(m.title)}" loading="lazy">`
      : `<div class="poster-art" style="--poster-a:#172d3c;--poster-b:#513e8e"></div><span class="poster-title">${escapeHTML(m.title)}</span>`;
    return `<article class="movie-card"><a href="#movie-${i}" data-movie="${i}" aria-label="Ver información de ${escapeHTML(m.title)}"><div class="poster">${poster}<span class="poster-badge">${escapeHTML(badge)}</span>${m.poster_url?'':'<span class="poster-sub">INFORMACIÓN: TMDB</span>'}</div></a><div class="movie-info"><h3>${escapeHTML(m.title)}</h3><p>${escapeHTML(m.genre).toUpperCase()} · ${escapeHTML(formatDate(m.release_date)).toUpperCase()}</p><button class="movie-link" data-movie="${i}">VER DETALLES ↗</button></div></article>`;
  }).join('');
}
async function loadMovies(tipo='cartelera'){
  loadingMovies=true;movieError='';renderMovies();
  try{
    const response=await fetch(`/api/peliculas?tipo=${encodeURIComponent(tipo)}`);
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||'No se pudo cargar la información de películas.');
    movies=Array.isArray(data.results)?data.results:[];
    if(!movies.length) movieError='TMDB no devolvió películas para esta consulta.';
  }catch(error){
    movieError=error.message||'No se pudieron cargar las películas. Asegúrate de iniciar el servidor con npm start.';
  }finally{loadingMovies=false;renderMovies();}
}
function renderPromos(){
  const visible=[0,1,2].map(i=>promotions[(promoOffset+i+promotions.length)%promotions.length]);
  promoGrid.innerHTML=visible.map(p=>`<article class="promo-card"><span class="promo-kicker">${escapeHTML(p.kicker)}</span><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description)}</p><a href="${p.target}" data-promo="${escapeHTML(p.title)}">${escapeHTML(p.label)} <span>→</span></a></article>`).join('');
}
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3000);}
function openModal(title,html,actionLabel='ENTENDIDO',action=closeModal){modalTitle.textContent=title;modalContent.innerHTML=html;modalAction.textContent=actionLabel;modalAction.onclick=action;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';document.getElementById('modalClose').focus();}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
function showCinemaDetails(){
  const place=document.getElementById('heroLocation').value;
  if(!place){toast('Primero selecciona un cine de Chihuahua.');document.getElementById('heroLocation').focus();return;}
  selectedCinema=place;
  document.getElementById('locationLabel').textContent=place.toUpperCase();
  const list=movies.slice(0,5).map(m=>`<div class="showtime-item"><strong>${escapeHTML(m.title)}</strong><span>${escapeHTML(m.type)} · Sin horarios disponibles</span></div>`).join('');
  openModal('Películas para tu visita',`<span class="local-badge">${escapeHTML(place)}</span><p>Estas son películas de TMDB para México. La selección del cine solo sirve para navegar la demostración: TMDB no confirma que se proyecten en este complejo ni proporciona sus horarios.</p><div class="showtime-list">${list||'<p>No hay películas cargadas. Revisa la conexión e inténtalo de nuevo.</p>'}</div>`,'VER PELÍCULAS',()=>{closeModal();document.getElementById('movies').scrollIntoView({behavior:'smooth'});});
}
function showMovie(index){
  const m=movies[Number(index)];if(!m)return;
  selectedMovie=m;
  const place=selectedCinema||'Todavía no seleccionas un cine';
  const poster=m.poster_url?`<img src="${escapeHTML(m.poster_url)}" alt="Póster de ${escapeHTML(m.title)}" style="width:110px;max-width:35%;float:right;margin:0 0 12px 16px">`:'';
  openModal(m.title,`${poster}<span class="local-badge">${escapeHTML(m.type.toUpperCase())}</span><p><strong>Género:</strong> ${escapeHTML(m.genre)}</p><p><strong>Estreno:</strong> ${escapeHTML(formatDate(m.release_date))}</p><p><strong>Calificación TMDB:</strong> ${m.vote_average?`${Number(m.vote_average).toFixed(1)}/10`:'Sin calificación'}</p><p><strong>Sinopsis:</strong> ${escapeHTML(m.overview||'No hay sinopsis disponible.')}</p><p><strong>Cine seleccionado:</strong> ${escapeHTML(place)}</p><p>La información de esta película viene de TMDB. Esta página todavía no tiene acceso a horarios, disponibilidad ni venta de boletos de Cinépolis.</p>`,'ELEGIR CINE',()=>{closeModal();document.getElementById('heroLocation').scrollIntoView({behavior:'smooth',block:'center'});document.getElementById('heroLocation').focus();});
}

renderPromos();
loadMovies('cartelera');
movieSearch.addEventListener('input',renderMovies);
filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
  filterButtons.forEach(b=>b.classList.toggle('active',b===btn));
  activeFilter=btn.dataset.filter;
  if(activeFilter==='upcoming') loadMovies('proximamente');
  else if(activeFilter==='all'||activeFilter==='deals'){
    if(!movies.length||movies.some(m=>m.type==='Próximamente')) loadMovies('cartelera');
    else renderMovies();
  }
}));
document.getElementById('promoPrev').addEventListener('click',()=>{promoOffset=(promoOffset-1+promotions.length)%promotions.length;renderPromos()});
document.getElementById('promoNext').addEventListener('click',()=>{promoOffset=(promoOffset+1)%promotions.length;renderPromos()});
document.getElementById('mobileMenu').addEventListener('click',()=>document.getElementById('mainNav').classList.toggle('open'));
document.getElementById('heroLocation').addEventListener('change',e=>{if(e.target.value){selectedCinema=e.target.value;document.getElementById('locationLabel').textContent=e.target.value.toUpperCase();}});
document.getElementById('locationButton').addEventListener('click',()=>{document.getElementById('heroLocation').focus();document.getElementById('heroLocation').scrollIntoView({behavior:'smooth',block:'center'});toast('Selecciona el complejo de Cinépolis que te quede mejor en Chihuahua.')});
document.getElementById('showtimeForm').addEventListener('submit',e=>{e.preventDefault();showCinemaDetails()});
movieGrid.addEventListener('click',e=>{const target=e.target.closest('[data-movie]');if(target){e.preventDefault();showMovie(target.dataset.movie);}});
promoGrid.addEventListener('click',e=>{const target=e.target.closest('[data-promo]');if(target){e.preventDefault();const promo=promotions.find(p=>p.title===target.dataset.promo);if(promo?.target==='#home'){document.getElementById('heroLocation').scrollIntoView({behavior:'smooth',block:'center'});document.getElementById('heroLocation').focus();toast('Elige un complejo de Chihuahua para continuar.');}else document.querySelector(promo?.target||'#movies')?.scrollIntoView({behavior:'smooth'});}});
document.getElementById('newsletterForm').addEventListener('submit',e=>{e.preventDefault();const email=document.getElementById('emailInput').value.trim();document.getElementById('newsletterMessage').textContent=`¡Gracias! Esta es una demostración: ${email} no se guardó ni se envió a ningún servicio.`;e.target.reset()});
document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',closeModal));
document.getElementById('modalClose').addEventListener('click',closeModal);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal()});
document.querySelectorAll('[data-local-info]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();openModal(link.dataset.localInfo==='privacidad'?'Aviso de privacidad de demostración':'Términos de uso de demostración',`<p>Esta página es una recreación local para fines de práctica. No recopila datos personales, no procesa pagos y no está afiliada a los sistemas de reservación de Cinépolis.</p><p>La información de películas y pósteres se consulta desde TMDB. Los horarios de Cinépolis no están conectados.</p>`)}));
