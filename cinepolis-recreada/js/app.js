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
const movies = [
  {title:'La Odisea', type:'Estreno', genre:'Aventura · Acción', duration:'Por confirmar'},
  {title:'Avengers: Doomsday', type:'Próximamente', genre:'Acción · Ciencia ficción', duration:'Por confirmar'},
  {title:'Duna: Parte tres', type:'Próximamente', genre:'Ciencia ficción · Aventura', duration:'Por confirmar'},
  {title:'Resident Evil', type:'Próximamente', genre:'Terror · Acción', duration:'Por confirmar'},
  {title:'El diablo viste a la moda 2', type:'Estreno', genre:'Comedia · Drama', duration:'Por confirmar'},
  {title:'Película sorpresa', type:'Evento especial', event:true, genre:'Evento especial', duration:'Función por confirmar'},
  {title:'Coyote vs. Acme', type:'Próximamente', genre:'Comedia · Aventura', duration:'Por confirmar'},
  {title:'Los juegos del hambre: Amanecer en la cosecha', type:'Próximamente', genre:'Aventura · Acción', duration:'Por confirmar'},
  {title:'Hechizo de amor: La magia continúa', type:'Estreno', genre:'Comedia · Romance', duration:'Por confirmar'},
  {title:'Función especial', type:'Evento especial', event:true, genre:'Evento especial', duration:'Función por confirmar'}
];
const palette = [
  ['#11234b','#9a2b4e'],['#172d3c','#bc7a3d'],['#19224b','#513e8e'],['#30233f','#bd3f35'],['#163b51','#d2a345'],['#1d2140','#7e273c'],['#2d1c30','#a6533e'],['#173f45','#9e863f'],['#1b2145','#35769a'],['#30221b','#a75e38']
];
const promotions = [
  {kicker:'PREPARA TU PRÓXIMA VISITA',title:'CARTELERA EN CHIHUAHUA',description:'Explora las películas de muestra y elige qué te gustaría ver.',label:'VER CARTELERA',target:'#movies'},
  {kicker:'UNA EXPERIENCIA PARA DISFRUTAR',title:'CLUB CINÉPOLIS',description:'Esta sección es una demostración local de beneficios y recompensas.',label:'CONOCER MÁS',target:'#rewards'},
  {kicker:'ELIGE TU COMPLEJO',title:'CINES EN CHIHUAHUA',description:'Encuentra opciones en Chihuahua capital, Juárez y otros municipios.',label:'BUSCAR CINE',target:'#home'},
  {kicker:'PLAN CON AMIGOS O FAMILIA',title:'TU PRÓXIMA NOCHE DE CINE',description:'Selecciona un cine y consulta los horarios de demostración.',label:'VER HORARIOS',target:'#home'},
  {kicker:'ESTRENOS Y EVENTOS',title:'NO TE PIERDAS NADA',description:'Las películas y los horarios de este sitio son datos de ejemplo.',label:'CONSULTAR',target:'#movies'}
];
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function isEvent(movie){return Boolean(movie.event)||/evento especial|película sorpresa/i.test(movie.title);}
function renderMovies(){
  const q=movieSearch.value.trim().toLowerCase();
  const filtered=movies.filter(m=>{
    const bySearch=m.title.toLowerCase().includes(q);
    const byFilter=activeFilter==='all'||(activeFilter==='deals'&&m.type==='Estreno')||(activeFilter==='event'&&isEvent(m));
    return bySearch&&byFilter;
  });
  resultCount.textContent=`${filtered.length} OPCIONES`;
  if(!filtered.length){movieGrid.innerHTML='<div class="loading">No encontramos resultados. Prueba con otro título.</div>';return;}
  movieGrid.innerHTML=filtered.map(m=>{
    const i=movies.indexOf(m), colors=palette[i%palette.length];
    const badge=isEvent(m)?'<span class="poster-badge">EVENTO ESPECIAL</span>':`<span class="poster-badge">${escapeHTML(m.type.toUpperCase())}</span>`;
    return `<article class="movie-card"><a href="#movie-${i}" data-movie="${i}" aria-label="Ver información de ${escapeHTML(m.title)}"><div class="poster"><div class="poster-art" style="--poster-a:${colors[0]};--poster-b:${colors[1]}"></div>${badge}<span class="poster-title">${escapeHTML(m.title)}</span><span class="poster-sub">CINÉPOLIS · CHIHUAHUA</span></div></a><div class="movie-info"><h3>${escapeHTML(m.title)}</h3><p>${escapeHTML(m.type).toUpperCase()} · ${escapeHTML(m.genre.toUpperCase())}</p><button class="movie-link" data-movie="${i}">VER DETALLES ↗</button></div></article>`;
  }).join('');
}
function renderPromos(){
  const visible=[0,1,2].map(i=>promotions[(promoOffset+i+promotions.length)%promotions.length]);
  promoGrid.innerHTML=visible.map(p=>`<article class="promo-card"><span class="promo-kicker">${escapeHTML(p.kicker)}</span><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description)}</p><a href="${p.target}" data-promo="${escapeHTML(p.title)}">${escapeHTML(p.label)} <span>→</span></a></article>`).join('');
}
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3000);}
function openModal(title,html,actionLabel='ENTENDIDO',action=closeModal){modalTitle.textContent=title;modalContent.innerHTML=html;modalAction.textContent=actionLabel;modalAction.onclick=action;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';document.getElementById('modalClose').focus();}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
function cinemaOptions(){return [...document.getElementById('heroLocation').options].filter(o=>o.value).map(o=>o.value);}
function showCinemaDetails(){
  const place=document.getElementById('heroLocation').value;
  if(!place){toast('Primero selecciona un cine de Chihuahua.');document.getElementById('heroLocation').focus();return;}
  selectedCinema=place;
  document.getElementById('locationLabel').textContent=place.toUpperCase();
  const list=movies.slice(0,5).map(m=>`<div class="showtime-item"><strong>${escapeHTML(m.title)}</strong><span>Horarios por confirmar · Función de muestra</span></div>`).join('');
  openModal('Cartelera de muestra',`<span class="local-badge">${escapeHTML(place)}</span><p>Esta es una cartelera de demostración para el complejo que seleccionaste. No consulta horarios en tiempo real ni vende boletos.</p><div class="showtime-list">${list}</div>`,'VER PELÍCULAS',()=>{closeModal();document.getElementById('movies').scrollIntoView({behavior:'smooth'});});
}
function showMovie(index){
  const m=movies[Number(index)]; if(!m)return;
  selectedMovie=m;
  const place=selectedCinema||'Selecciona un cine de Chihuahua';
  openModal(m.title,`<span class="local-badge">${escapeHTML(m.type.toUpperCase())}</span><p><strong>Género:</strong> ${escapeHTML(m.genre)}</p><p><strong>Duración:</strong> ${escapeHTML(m.duration)}</p><p><strong>Cine seleccionado:</strong> ${escapeHTML(place)}</p><p>Esta ficha es parte de una recreación escolar. Los datos, horarios y disponibilidad no están conectados a la cartelera real.</p>`,'ELEGIR CINE',()=>{closeModal();document.getElementById('heroLocation').scrollIntoView({behavior:'smooth',block:'center'});document.getElementById('heroLocation').focus();});
}
renderMovies(); renderPromos();
movieSearch.addEventListener('input',renderMovies);
filterButtons.forEach(btn=>btn.addEventListener('click',()=>{filterButtons.forEach(b=>b.classList.toggle('active',b===btn));activeFilter=btn.dataset.filter;renderMovies()}));
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
document.querySelectorAll('[data-local-info]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();openModal(link.dataset.localInfo==='privacidad'?'Aviso de privacidad de demostración':'Términos de uso de demostración',`<p>Esta página es una recreación local para fines de práctica. No recopila datos personales, no procesa pagos y no está afiliada a los sistemas de reservación de Cinépolis.</p><p>El formulario de correo solo muestra un mensaje en pantalla y no transmite información.</p>`)}));
