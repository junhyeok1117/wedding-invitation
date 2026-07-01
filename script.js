// ===== Calendar =====
(function renderCalendar() {
  const year = 2026;
  const month = 9; // 0-indexed: October
  const weddingDay = 24;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const container = document.getElementById('calendarDays');
  if (!container) return;

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    container.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'cal-day';
    dayEl.textContent = d;

    const dayOfWeek = (firstDay + d - 1) % 7;
    if (dayOfWeek === 0) dayEl.classList.add('sun');
    if (dayOfWeek === 6) dayEl.classList.add('sat');
    if (d === weddingDay) dayEl.classList.add('today');

    container.appendChild(dayEl);
  }
})();

// ===== Photo Gallery =====
const photoFiles = [
  'images/photo1.jpg',
  'images/photo2.jpg',
  'images/photo3.jpg',
  'images/photo4.jpg',
  'images/photo5.jpg',
  'images/photo6.jpg',
];

let currentPhotoIndex = 0;

// Replace placeholders with actual images if they exist
(function loadPhotos() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const placeholders = grid.querySelectorAll('.gallery-placeholder');
  placeholders.forEach((el, i) => {
    const img = new Image();
    img.onload = () => {
      el.innerHTML = `<img src="${photoFiles[i]}" alt="웨딩 사진 ${i + 1}" />`;
    };
    img.src = photoFiles[i];
  });
})();

function openPhotoModal(index) {
  currentPhotoIndex = index;
  const modal = document.getElementById('photoModal');
  const img = document.getElementById('modalImg');
  const src = photoFiles[index];

  const testImg = new Image();
  testImg.onload = () => {
    img.src = src;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  testImg.onerror = () => {
    alert('사진이 아직 등록되지 않았습니다.\nimages/ 폴더에 photo1.jpg ~ photo6.jpg 파일을 넣어주세요.');
  };
  testImg.src = src;
}

function closePhotoModal() {
  const modal = document.getElementById('photoModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function changePhoto(dir) {
  currentPhotoIndex = (currentPhotoIndex + dir + photoFiles.length) % photoFiles.length;
  document.getElementById('modalImg').src = photoFiles[currentPhotoIndex];
}

document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('photoModal');
  if (!modal.classList.contains('active')) return;
  if (e.key === 'Escape') closePhotoModal();
  if (e.key === 'ArrowLeft') changePhoto(-1);
  if (e.key === 'ArrowRight') changePhoto(1);
});

// ===== RSVP Form =====
async function submitRSVP(e) {
  e.preventDefault();

  const form = document.getElementById('rsvpForm');
  const btn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const spinner = document.getElementById('submitSpinner');

  const attendance = form.querySelector('input[name="attendance"]:checked');
  if (!attendance) {
    alert('참석 여부를 선택해주세요.');
    return;
  }

  const payload = {
    name: form.name.value.trim(),
    attendance: attendance.value,
    guestCount: parseInt(form.guestCount.value) || 1,
    phone: form.phone.value.trim(),
    message: form.message.value.trim(),
  };

  btn.disabled = true;
  submitText.classList.add('hidden');
  spinner.classList.remove('hidden');

  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || '오류가 발생했습니다.');
    }

    form.classList.add('hidden');
    document.getElementById('rsvpSuccess').classList.remove('hidden');
  } catch (err) {
    alert(err.message || '전송 중 오류가 발생했습니다. 다시 시도해주세요.');
    btn.disabled = false;
    submitText.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
}

// Show/hide guest count based on attendance
document.addEventListener('DOMContentLoaded', () => {
  const radios = document.querySelectorAll('input[name="attendance"]');
  const guestGroup = document.getElementById('guestCountGroup');

  radios.forEach(r => {
    r.addEventListener('change', () => {
      if (r.value === '불참') {
        guestGroup.style.display = 'none';
      } else {
        guestGroup.style.display = '';
      }
    });
  });
});
