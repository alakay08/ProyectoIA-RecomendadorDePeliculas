document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const recommendBtn = document.getElementById('recommend-btn');
    const resultsContainer = document.getElementById('results-container');
    let movies = [];

    // Cargar la base de datos de películas
    fetch('movies.json')
        .then(response => response.json())
        .then(data => {
            movies = data;
        })
        .catch(error => console.error('Error al cargar las películas:', error));

    // --- FUNCIONES DE LÓGICA DIFUSA ---

    function triangularMembership(x, a, b, c) {
        if (x <= a || x >= c) return 0;
        if (x > a && x <= b) return (x - a) / (b - a);
        if (x > b && x < c) return (c - x) / (c - b);
        return 0;
    }

    function trapezoidalMembership(x, a, b, c, d) {
        if (x <= a || x >= d) return 0;
        if (x > a && x < b) return (x - a) / (b - a);
        if (x >= b && x <= c) return 1;
        if (x > c && x < d) return (d - x) / (d - c);
        return 0;
    }

    function calculateTimeMembership(duration) {
        return {
            Corto: trapezoidalMembership(duration, 0, 0, 75, 90),
            Medio: trapezoidalMembership(duration, 75, 90, 135, 150),
            Largo: trapezoidalMembership(duration, 135, 150, 300, 300)
        };
    }

    function calculateRecencyMembership(year) {
        const currentYear = 2025;
        return {
            Estreno: trapezoidalMembership(year, currentYear - 3, currentYear - 2, currentYear, currentYear),
            Reciente: trapezoidalMembership(year, 2005, 2010, 2015, currentYear - 2),
            Clasico: trapezoidalMembership(year, 0, 0, 2005, 2010)
        };
    }

    function calculateIntensityMembership(intensityValue) {
        return {
            Ligera: triangularMembership(intensityValue, 0, 0.2, 0.4),
            Moderada: triangularMembership(intensityValue, 0.3, 0.5, 0.7),
            Alta: triangularMembership(intensityValue, 0.6, 0.8, 1.0)
        };
    }

    // --- LÓGICA DE RECOMENDACIÓN ---
    recommendBtn.addEventListener('click', () => {
        const userPrefs = {
            generos: {
                Accion: document.getElementById('genre-accion').value / 10,
                Comedia: document.getElementById('genre-comedia').value / 10,
                Drama: document.getElementById('genre-drama').value / 10,
                "Sci-Fi": document.getElementById('genre-scifi').value / 10,
                Terror: document.getElementById('genre-terror').value / 10,
                Fantasia: document.getElementById('genre-fantasia').value / 10,
            },
            estado_animo: document.getElementById('mood-select').value,
            tiempo: document.getElementById('time-select').value,
            intensidad: document.getElementById('intensity-select').value,
            novedad: document.getElementById('recency-select').value,
        };

        const recommendations = movies.map(movie => {
            let genreScore = 0;
            let totalWeight = 0;
            for (const genre in userPrefs.generos) {
                const userPref = userPrefs.generos[genre];
                const moviePref = movie.generos[genre] || 0;
                genreScore += Math.min(userPref, moviePref);
                totalWeight += userPref > 0 ? 1: 0;
            }
            genreScore = totalWeight > 0 ? genreScore / totalWeight : 0;

            const moodScore = movie.estado_animo[userPrefs.estado_animo] || 0;
            const timeMembership = calculateTimeMembership(movie.duracion);
            const timeScore = timeMembership[userPrefs.tiempo];
            const intensityMembership = calculateIntensityMembership(movie.intensidad);
            const intensityScore = intensityMembership[userPrefs.intensidad];
            const recencyMembership = calculateRecencyMembership(movie.año);
            const recencyScore = recencyMembership[userPrefs.novedad];
            const finalScore = ((genreScore * 3) + (moodScore * 2) + timeScore + intensityScore + recencyScore) / 8;

            return { ...movie, score: finalScore };
        });

        // 4. Ordenar y obtener las MEJORES 6 recomendaciones
        recommendations.sort((a, b) => b.score - a.score);
        
        // ===================================================================
        // === CAMBIO IMPORTANTE: Dejamos de filtrar y solo tomamos las 6 mejores ===
        // const topRecommendations = recommendations.filter(rec => rec.score > 0.35); // <-- LÍNEA ANTIGUA
        const topRecommendations = recommendations.slice(0, 6); // <-- NUEVA LÍNEA: Tomamos las 6 primeras sin importar su puntaje
        // ===================================================================

        // 5. Mostrar resultados
        displayResults(topRecommendations);
    });

    function displayResults(recs) {
        resultsContainer.innerHTML = '';
        if (recs.length === 0 && movies.length > 0) { // Añadida comprobación de que las películas se hayan cargado
            resultsContainer.innerHTML = '<p class="placeholder">No se encontraron recomendaciones. ¡Intenta de nuevo!</p>';
            return;
        }

        recs.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <img src="${rec.poster}" alt="Póster de ${rec.titulo}">
                <h3>${rec.titulo} (${rec.año})</h3>
                <div class="score">Coincidencia: ${(rec.score * 100).toFixed(0)}%</div>
            `;
            resultsContainer.appendChild(item);
        });
    }
});