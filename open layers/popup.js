export function showPopup(title, message) {
  const popup = document.getElementById('custom-popup');
  const popupTitle = document.getElementById('popup-title');
  const popupMessage = document.getElementById('popup-message');
  const popupClose = document.getElementById('popup-close');

  // Isi konten popup
  popupTitle.textContent = title;
  popupMessage.innerHTML = message; // Gunakan innerHTML untuk mendukung HTML di dalam pesan

  // Tampilkan popup
  popup.style.display = 'flex';

  // Event listener untuk menutup popup (hindari penambahan duplikat listener)
  if (!popupClose.dataset.listenerAdded) {
    popupClose.addEventListener('click', () => {
      popup.style.display = 'none';
    });
    popupClose.dataset.listenerAdded = 'true'; // Tandai listener sudah ditambahkan
  }
}

// Fungsi untuk menutup popup secara manual
export function closePopup() {
  const popup = document.getElementById('custom-popup');
  popup.style.display = 'none';
}
