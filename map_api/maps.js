const mapa = L.map('mapa').setView([20.67, -103.35], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

let marcadores = []; 

document.getElementById('btnBuscar').addEventListener('click', () => {
  
  // 1. Obtener ubicación del usuario
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // Centrar mapa en el usuario
      mapa.setView([lat, lng], 15);

      // Marcador del usuario
      L.marker([lat, lng])
        .addTo(mapa)
        .bindPopup('<b>📍 Tú estás aquí</b>')
        .openPopup();

      // 2. Consultar Overpass API
      const radio = 1000; // metros
      const query = `
        [out:json];
        (
          node["amenity"="restaurant"](around:${radio},${lat},${lng});
          way["amenity"="restaurant"](around:${radio},${lat},${lng});
        );
        out center;
      `;

      fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      })
      .then(res => res.json())
      .then(data => {

        // Limpiar marcadores anteriores
        marcadores.forEach(m => mapa.removeLayer(m));
        marcadores = [];

        if (data.elements.length === 0) {
          alert('No se encontraron restaurantes cercanos.');
          return;
        }

        // 3. Pintar marcadores de restaurantes
        data.elements.forEach(lugar => {
          const nombre = lugar.tags.name || 'Restaurante sin nombre';
          const cocina = lugar.tags.cuisine ? `🍴 ${lugar.tags.cuisine}` : '';

          const lat = lugar.lat ?? lugar.center.lat;
          const lon = lugar.lon ?? lugar.center.lon;

          const marcador = L.marker([lat, lon])
            .addTo(mapa)
            .bindPopup(`<b>${nombre}</b><br>${cocina}`);

          marcadores.push(marcador);
        });

        alert(`Se encontraron ${data.elements.length} restaurantes cercanos.`);
      })
      .catch(() => alert('Error al consultar restaurantes. Intenta de nuevo.'));
    },
    () => alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.')
  );
});