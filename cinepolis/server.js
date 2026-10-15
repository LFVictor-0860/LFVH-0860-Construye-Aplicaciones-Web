const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_TOKEN = process.env.TMDB_BEARER_TOKEN;

app.use(express.static(path.join(__dirname)));

const genreNames = {
  28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
  80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familiar',
  14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
  9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia ficción',
  10770: 'Película para televisión', 53: 'Suspenso', 10752: 'Bélica', 37: 'Western'
};

app.get('/api/peliculas', async (req, res) => {
  if (!TMDB_TOKEN) {
    return res.status(500).json({ error: 'Falta configurar TMDB_BEARER_TOKEN en el archivo .env.' });
  }

  const tipo = ['cartelera', 'proximamente', 'populares'].includes(req.query.tipo)
    ? req.query.tipo
    : 'cartelera';
  const endpoints = {
    cartelera: '/movie/now_playing',
    proximamente: '/movie/upcoming',
    populares: '/movie/popular'
  };
  const url = new URL(`https://api.themoviedb.org/3${endpoints[tipo]}`);
  url.searchParams.set('language', 'es-MX');
  url.searchParams.set('region', 'MX');
  url.searchParams.set('page', '1');

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('TMDB respondió:', response.status, details);
      return res.status(response.status).json({
        error: 'TMDB no pudo entregar la cartelera. Revisa tu token y vuelve a intentarlo.'
      });
    }

    const data = await response.json();
    const today = new Date();
    const movies = (data.results || []).map(movie => {
      const release = movie.release_date ? new Date(`${movie.release_date}T12:00:00`) : null;
      const daysSinceRelease = release ? (today - release) / 86400000 : 999;
      const type = tipo === 'proximamente'
        ? 'Próximamente'
        : (daysSinceRelease >= 0 && daysSinceRelease <= 45 ? 'Estreno' : 'En cartelera');
      const genres = (movie.genre_ids || []).map(id => genreNames[id]).filter(Boolean);
      return {
        id: movie.id,
        title: movie.title || movie.original_title || 'Película sin título',
        type,
        genre: genres.length ? genres.join(' · ') : 'Género por confirmar',
        duration: 'No disponible en este listado',
        overview: movie.overview || 'No hay sinopsis disponible en español.',
        release_date: movie.release_date || '',
        vote_average: movie.vote_average || 0,
        poster_path: movie.poster_path || null,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
      };
    });
    res.set('Cache-Control', 'public, max-age=900');
    res.json({ results: movies, page: data.page, total_pages: data.total_pages });
  } catch (error) {
    console.error('Error consultando TMDB:', error.message);
    res.status(502).json({ error: 'No se pudo conectar con TMDB. Revisa tu conexión a internet.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cinépolis Chihuahua está disponible en el puerto ${PORT}`);
});
