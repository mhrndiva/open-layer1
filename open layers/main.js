import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import VectorLayer from 'https://cdn.skypack.dev/ol/layer/Vector.js';
import VectorSource from 'https://cdn.skypack.dev/ol/source/Vector.js';
import Feature from 'https://cdn.skypack.dev/ol/Feature.js';
import Point from 'https://cdn.skypack.dev/ol/geom/Point.js';
import { fromLonLat, toLonLat } from 'https://cdn.skypack.dev/ol/proj.js';
import { Icon, Style } from 'https://cdn.skypack.dev/ol/style.js';

// Sumber data untuk marker
const markerSource = new VectorSource();

// Layer untuk marker
const markerLayer = new VectorLayer({
  source: markerSource
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({ source: new OSM() }),
    markerLayer
  ],
  view: new View({
    center: fromLonLat([107.9019822944495, -7.215907720160664]),
    zoom: 12
  })
});

const savedLocations = [];
let currentCoordinate = null;

const popup = document.getElementById('input-popup');
const popupCoordinates = document.getElementById('popup-coordinates');
const descriptionInput = document.getElementById('location-description');
const saveButton = document.getElementById('save-location');
const cancelButton = document.getElementById('cancel-location');

// Fungsi untuk mendapatkan data lokasi menggunakan Nominatim API
async function fetchLocationData(longitude, latitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching location data:', error);
    return null;
  }
}

// Menambahkan event listener untuk klik pada peta
map.on('click', async (event) => {
  const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);

  // Jika klik pada marker yang sudah ada
  if (feature) {
    const props = feature.getProperties();
    if (props.description) {
      const pixel = map.getPixelFromCoordinate(feature.getGeometry().getCoordinates());
      showPopup(
        'Marker Information',
        `Longitude: ${props.longitude}\nLatitude: ${props.latitude}\nDescription: ${props.description}`,
        pixel
      );
    }
    return;
  }

  // Jika bukan marker, ambil koordinat klik
  currentCoordinate = event.coordinate;
  const lonLat = toLonLat(currentCoordinate);
  const longitude = lonLat[0].toFixed(6);
  const latitude = lonLat[1].toFixed(6);

  // Ambil data lokasi menggunakan Nominatim API
  const locationData = await fetchLocationData(longitude, latitude);

  if (locationData) {
    const { address } = locationData;
    const locationInfo = `
      <strong>Coordinates:</strong> ${longitude}, ${latitude}<br>
      <strong>Street:</strong> ${address.road || 'Not Available'}<br>
      <strong>Village:</strong> ${address.village || 'Not Available'}<br>
      <strong>District:</strong> ${address.suburb || 'Not Available'}<br>
      <strong>City:</strong> ${address.city || address.town || 'Not Available'}<br>
      <strong>State:</strong> ${address.state || 'Not Available'}<br>
      <strong>Country:</strong> ${address.country || 'Not Available'}
    `;

    // Tampilkan informasi lokasi di popup
    const pixel = map.getPixelFromCoordinate(currentCoordinate);
    showSavePopup(longitude, latitude, locationInfo, pixel);
  } else {
    // Jika data lokasi tidak dapat diambil, tampilkan pesan error
    const pixel = map.getPixelFromCoordinate(currentCoordinate);
    showPopup('Error', 'Unable to fetch location data.', pixel);
  }
});

// Simpan lokasi saat tombol "Save" diklik
saveButton.addEventListener('click', () => {
  const description = descriptionInput.value.trim();
  if (description && currentCoordinate) {
    const lonLat = toLonLat(currentCoordinate);

    // Simpan lokasi dengan informasi lengkap
    savedLocations.push({
      longitude: lonLat[0],
      latitude: lonLat[1],
      description,
      address: popupCoordinates.innerHTML
    });

    const marker = new Feature({
      geometry: new Point(currentCoordinate),
    });

    marker.setProperties({
      longitude: lonLat[0],
      latitude: lonLat[1],
      description,
      address: popupCoordinates.innerHTML
    });

    marker.setStyle(new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        scale: 0.08
      })
    }));

    markerSource.addFeature(marker);
    updateLocationList();

    // Tutup popup dan reset form
    popup.classList.add('hidden');
    descriptionInput.value = '';
  }
});

// Tutup popup saat tombol "Cancel" diklik
cancelButton.addEventListener('click', () => {
  popup.classList.add('hidden');
  descriptionInput.value = '';
});

// Fungsi untuk menampilkan popup dengan informasi lokasi dan tombol save
function showSavePopup(longitude, latitude, locationInfo, pixel) {
  // Update coordinates and description
  popupCoordinates.innerHTML = locationInfo;
  popup.classList.remove('hidden');

  // Atur posisi popup berdasarkan pixel
  popup.style.left = `${pixel[0]}px`;
  popup.style.top = `${pixel[1]}px`;
}

// Fungsi untuk menampilkan popup dengan informasi titik lokasi
function showPopup(title, message, pixel) {
  const overlayPopup = document.getElementById('marker-popup');
  const overlayTitle = overlayPopup.querySelector('.popup-title');
  const overlayMessage = overlayPopup.querySelector('.popup-message');

  overlayTitle.textContent = title;
  overlayMessage.innerHTML = message;

  // Atur posisi popup berdasarkan pixel
  overlayPopup.style.left = `${pixel[0]}px`;
  overlayPopup.style.top = `${pixel[1]}px`;
  overlayPopup.classList.remove('hidden');
}

// Perbarui daftar lokasi di UI
function updateLocationList() {
  const locationList = document.getElementById('location-list');
  locationList.innerHTML = '';
  savedLocations.forEach((location, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>Location ${index + 1}:</strong><br>
      Longitude: ${location.longitude}, Latitude: ${location.latitude}<br>
      Description: ${location.description}<br>
      Address: ${location.address}
    `;
    locationList.appendChild(li);
  });
}
