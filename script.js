// ===== Petal Animation ===== //꽃잎
(function initPetals() {
  const container = document.getElementById('heroPetals');
  if (!container) return;

  const petalColors = [
  'rgba(255, 255, 255, 0.90)',
  'rgba(255, 255, 255, 0.75)',
  'rgba(255, 255, 255, 0.60)',
  'rgba(255, 255, 255, 0.85)',
  'rgba(255, 255, 255, 0.70)',
];


  function spawnPetal() {
    const el = document.createElement('div');
    el.className = 'petal';

    const size = Math.random() * 9 + 6;
    const duration = Math.random() * 5 + 7;
    const delay = Math.random() * 3;
    const left = Math.random() * 110 - 5;
    const color = petalColors[Math.floor(Math.random() * petalColors.length)];
    const startRotate = Math.random() * 360;

    el.style.cssText = `
      width: ${size}px;
      height: ${size * 1.45}px;
      left: ${left}%;
      background: ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      transform: rotate(${startRotate}deg);
    `;

    container.appendChild(el);
    el.addEventListener('animationend', () => {
      el.remove();
      spawnPetal();
    });
  }

  for (let i = 0; i < 18; i++) {
    spawnPetal();
  }
})();

// ===== Fix iOS hero height =====
(function fixHeroHeight() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const setHeight = () => { hero.style.height = window.innerHeight + 'px'; };
  setHeight();
  window.addEventListener('orientationchange', () => setTimeout(setHeight, 200));
})();

// ===== Countdown Timer =====
(function initCountdown() {
  const target = new Date('2026-10-24T12:00:00');

  function update() {
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      document.getElementById('cdDays').textContent = '00';
      document.getElementById('cdHours').textContent = '00';
      document.getElementById('cdMinutes').textContent = '00';
      document.getElementById('cdSeconds').textContent = '00';
      document.getElementById('cdDaysText').textContent = '0';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('cdDays').textContent = String(days).padStart(2, '0');
    document.getElementById('cdHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('cdMinutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('cdSeconds').textContent = String(seconds).padStart(2, '0');
    document.getElementById('cdDaysText').textContent = days;
  }

  update();
  setInterval(update, 1000);
})();

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
const photoFiles = Array.from({ length: 30 }, (_, i) => `images/wedding_photo/photo${i + 1}.jpeg`);

let currentPhotoIndex = 0;
let galleryLoaded = [];

// --- Carousel ---
(function initGallery() {
  const track = document.getElementById('galleryTrack');
  const dotsWrap = document.getElementById('galleryDots');
  const carousel = document.getElementById('galleryCarousel');
  if (!track) return;

  let loaded = 0;
  const checks = photoFiles.map((src, i) => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ src, i, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  }));

  Promise.all(checks).then(results => {
    galleryLoaded = results.filter(Boolean).sort((a, b) => a.i - b.i);
    const total = galleryLoaded.length;

    if (total === 0) {
      track.innerHTML = `<div class="gallery-slide"><div class="gallery-slide-placeholder"><span>📷</span><span>images/ 폴더에 사진을 넣어주세요</span></div></div>`;
      dotsWrap.innerHTML = '';
      return;
    }

    track.innerHTML = galleryLoaded.map((p, idx) =>
      `<div class="gallery-slide" data-idx="${idx}">
        <img src="${p.src}" alt="웨딩 사진 ${idx + 1}" draggable="false" />
      </div>`
    ).join('');

    dotsWrap.innerHTML = galleryLoaded.map((_, idx) =>
      `<div class="gallery-dot${idx === 0 ? ' active' : ''}" onclick="galleryGoTo(${idx})"></div>`
    ).join('');

    // 첫 사진 비율로 초기화
    const first = galleryLoaded[0];
    if (first.w && first.h) carousel.style.aspectRatio = `${first.w} / ${first.h}`;

    // Touch swipe + tap to open modal
    let tsX = 0, tsDX = 0, dragging = false, swiped = false;
    carousel.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; tsDX = 0; dragging = true; swiped = false; }, { passive: true });
    carousel.addEventListener('touchmove', e => { if (dragging) tsDX = e.touches[0].clientX - tsX; }, { passive: true });
    carousel.addEventListener('touchend', () => {
      if (Math.abs(tsDX) > 40) { galleryNav(tsDX < 0 ? 1 : -1); swiped = true; }
      dragging = false;
    });
    carousel.addEventListener('click', (e) => {
      if (swiped) { swiped = false; return; }
      if (e.target.closest('.gallery-dots')) return;
      openPhotoModal(currentPhotoIndex);
    });
  });
})();

function galleryGoTo(idx) {
  const total = galleryLoaded.length;
  if (total === 0) return;
  currentPhotoIndex = (idx + total) % total;
  const carousel = document.getElementById('galleryCarousel');
  const photo = galleryLoaded[currentPhotoIndex];
  if (photo.w && photo.h) carousel.style.aspectRatio = `${photo.w} / ${photo.h}`;
  document.getElementById('galleryTrack').style.transform = `translateX(-${currentPhotoIndex * carousel.offsetWidth}px)`;
  document.querySelectorAll('.gallery-dot').forEach((d, i) => d.classList.toggle('active', i === currentPhotoIndex));
}

function galleryNav(dir) { galleryGoTo(currentPhotoIndex + dir); }

// 화면 회전 시 캐러셀 위치 재계산
window.addEventListener('orientationchange', () => {
  setTimeout(() => galleryGoTo(currentPhotoIndex), 300);
});

// --- Modal ---
function openPhotoModal(index) {
  currentPhotoIndex = index;
  const modal = document.getElementById('photoModal');
  const img = document.getElementById('modalImg');
  img.style.transform = '';
  img.src = galleryLoaded[index].src;
  document.getElementById('modalCounter').textContent = `${index + 1} / ${galleryLoaded.length}`;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  initModalSwipe();
}

function closePhotoModal() {
  const modal = document.getElementById('photoModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('modalImg').style.transform = '';
}

function changePhoto(dir) {
  const total = galleryLoaded.length;
  currentPhotoIndex = (currentPhotoIndex + dir + total) % total;
  const img = document.getElementById('modalImg');
  img.style.transform = '';
  img.src = galleryLoaded[currentPhotoIndex].src;
  document.getElementById('modalCounter').textContent = `${currentPhotoIndex + 1} / ${total}`;
}

// Modal: swipe + pinch-to-zoom
function initModalSwipe() {
  const content = document.getElementById('modalContent');
  const img = document.getElementById('modalImg');
  if (!content || content._swipeInit) return;
  content._swipeInit = true;

  let ts = {}, pinchDist0 = 0, scale = 1;

  content.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      ts.x = e.touches[0].clientX;
      ts.y = e.touches[0].clientY;
      ts.scale = scale;
    } else if (e.touches.length === 2) {
      pinchDist0 = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      ts.scale = scale;
    }
  }, { passive: true });

  content.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      scale = Math.min(4, Math.max(1, ts.scale * (dist / pinchDist0)));
      img.style.transform = `scale(${scale})`;
    }
  }, { passive: false });

  content.addEventListener('touchend', e => {
    if (e.touches.length === 0 && e.changedTouches.length === 1 && scale <= 1) {
      const dx = e.changedTouches[0].clientX - ts.x;
      const dy = e.changedTouches[0].clientY - ts.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        changePhoto(dx < 0 ? 1 : -1);
      }
    }
    if (e.touches.length === 0) scale = Math.max(1, scale);
  }, { passive: true });
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
    phone4: form.phone4.value.trim(),
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

// ===== Phone Popup (Desktop) =====
document.querySelectorAll('.contact-phone-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) return;

    e.preventDefault();
    const number = btn.getAttribute('href').replace('tel:', '');

    const existing = document.getElementById('phonePopup');
    if (existing) {
      existing.remove();
      return;
    }

    const popup = document.createElement('div');
    popup.id = 'phonePopup';
    popup.innerHTML = `
      <span class="phone-popup-number">${number}</span>
      <button class="phone-popup-copy" onclick="copyPhoneNumber('${number}', this)">복사</button>
    `;
    document.body.appendChild(popup);

    const rect = btn.getBoundingClientRect();
    const popupW = popup.offsetWidth;
    popup.style.top = `${rect.bottom + window.scrollY + 8}px`;
    popup.style.left = `${rect.left + window.scrollX + btn.offsetWidth / 2 - popupW / 2}px`;

    setTimeout(() => {
      document.addEventListener('click', () => document.getElementById('phonePopup')?.remove(), { once: true });
    }, 0);
  });
});

function copyPhoneNumber(number, btn) {
  navigator.clipboard.writeText(number).then(() => {
    btn.textContent = '복사됨 ✓';
    setTimeout(() => document.getElementById('phonePopup')?.remove(), 900);
  });
}

// ===== Guestbook =====
let guestbookEntries = [];

function formatGbDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

function renderGuestbookCard(entry, deletable = false) {
  const safeMsg = entry.message.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const deleteBtn = deletable
    ? `<button class="gb-delete-btn" onclick="toggleDeleteForm('${entry.id}')" aria-label="삭제">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>`
    : '';
  return `
    <div class="guestbook-card" id="gbCard-${entry.id}">
      <p class="guestbook-card-msg">${safeMsg}</p>
      <div class="guestbook-card-footer">
        <span class="guestbook-card-name">${entry.name} · ${formatGbDate(entry.createdAt)}</span>
        <div style="display:flex;align-items:center;gap:6px">
          ${deleteBtn}
        </div>
      </div>
      ${deletable ? `
      <div class="gb-delete-form hidden" id="gbDeleteForm-${entry.id}">
        <input type="password" class="gb-delete-input" placeholder="비밀번호 입력" id="gbDeletePw-${entry.id}" />
        <button class="gb-delete-confirm" onclick="confirmDelete('${entry.id}')">확인</button>
      </div>` : ''}
    </div>`;
}

function toggleDeleteForm(id) {
  const form = document.getElementById(`gbDeleteForm-${id}`);
  if (!form) return;
  const isHidden = form.classList.contains('hidden');
  // 다른 열린 삭제폼 닫기
  document.querySelectorAll('.gb-delete-form').forEach(f => f.classList.add('hidden'));
  if (isHidden) {
    form.classList.remove('hidden');
    document.getElementById(`gbDeletePw-${id}`)?.focus();
  }
}

async function confirmDelete(id) {
  const pwEl = document.getElementById(`gbDeletePw-${id}`);
  const password = pwEl?.value.trim();
  if (!password) return;

  try {
    const res = await fetch('/api/guestbook', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    });

    if (res.status === 403) {
      alert('비밀번호가 맞지 않습니다.');
      pwEl.value = '';
      pwEl.focus();
      return;
    }
    if (!res.ok) throw new Error();

    // 데이터 갱신
    guestbookEntries = guestbookEntries.filter(e => e.id !== id);

    // 프리뷰 갱신
    const preview = document.getElementById('guestbookPreview');
    if (preview) {
      preview.innerHTML = guestbookEntries.length === 0
        ? '<p class="guestbook-empty">아직 등록된 메시지가 없습니다.</p>'
        : guestbookEntries.slice(0, 3).map(e => renderGuestbookCard(e, true)).join('');
    }

    // 삭제 완료 팝업 표시 후 전체 목록 갱신
    showGbToast('메시지가 삭제되었습니다.');
    const list = document.getElementById('gbPopupList');
    if (list) {
      list.innerHTML = guestbookEntries.length === 0
        ? '<p class="guestbook-empty">아직 등록된 메시지가 없습니다.</p>'
        : guestbookEntries.map(e => renderGuestbookCard(e, true)).join('');
    }
  } catch {
    alert('삭제 중 오류가 발생했습니다.');
  }
}

function showGbToast(msg) {
  const existing = document.getElementById('gbToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'gbToast';
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

async function loadGuestbook() {
  try {
    const res = await fetch('/api/guestbook');
    if (!res.ok) throw new Error();
    const data = await res.json();
    guestbookEntries = data.entries || [];

    const preview = document.getElementById('guestbookPreview');
    if (guestbookEntries.length === 0) {
      preview.innerHTML = '<p class="guestbook-empty">아직 등록된 메시지가 없습니다.</p>';
    } else {
      preview.innerHTML = guestbookEntries.slice(0, 3).map(e => renderGuestbookCard(e, true)).join('');
    }
  } catch {
    document.getElementById('guestbookPreview').innerHTML = '<p class="guestbook-empty">메시지를 불러올 수 없습니다.</p>';
  }
}

function openGuestbookPopup() {
  const popup = document.getElementById('gbPopup');
  const list = document.getElementById('gbPopupList');
  popup.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (guestbookEntries.length === 0) {
    list.innerHTML = '<p class="guestbook-empty">아직 등록된 메시지가 없습니다.</p>';
  } else {
    list.innerHTML = guestbookEntries.map(e => renderGuestbookCard(e, true)).join('');
  }
}

function closeGuestbookPopup() {
  document.getElementById('gbPopup').classList.add('hidden');
  document.body.style.overflow = '';
}

function toggleGuestbookForm() {
  const body = document.getElementById('guestbookWriteBody');
  const arrow = document.getElementById('guestbookWriteArrow');
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  body.classList.toggle('hidden', false);
  arrow.classList.toggle('open', !isOpen);
}

function updateGbCount() {
  const len = document.getElementById('gbMessage').value.length;
  document.getElementById('gbCharCount').textContent = len;
}

async function submitGuestbook(e) {
  e.preventDefault();
  const btn = document.getElementById('gbSubmitBtn');
  const text = document.getElementById('gbSubmitText');
  const spinner = document.getElementById('gbSubmitSpinner');

  const payload = {
    name: document.getElementById('gbName').value.trim(),
    password: document.getElementById('gbPassword').value.trim(),
    message: document.getElementById('gbMessage').value.trim(),
  };

  btn.disabled = true;
  text.classList.add('hidden');
  spinner.classList.remove('hidden');

  try {
    const res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || '오류가 발생했습니다.');
    }

    document.getElementById('guestbookForm').reset();
    document.getElementById('gbCharCount').textContent = '0';
    toggleGuestbookForm();
    await loadGuestbook();
    showGbToast('메시지가 등록되었습니다 💕');
  } catch (err) {
    alert(err.message || '전송 중 오류가 발생했습니다.');
  } finally {
    btn.disabled = false;
    text.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', loadGuestbook);

// ===== Account Tabs =====
function openAccountPopup(side) {
  const src = document.getElementById(side === 'groom' ? 'acctSrcGroom' : 'acctSrcBride');
  document.getElementById('accountPopupTitle').textContent = side === 'groom' ? '신랑측 계좌번호' : '신부측 계좌번호';
  document.getElementById('accountPopupBody').innerHTML = src.innerHTML;
  document.getElementById('accountPopupOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAccountPopup() {
  document.getElementById('accountPopupOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function copyAccount(number, btn) {
  navigator.clipboard.writeText(number).then(() => {
    showGbToast(`${number} 복사되었습니다`);
  });
}

// ===== RSVP Toggle =====
function toggleRSVP() {
  const body = document.getElementById('rsvpBody');
  const arrow = document.getElementById('rsvpToggleArrow');
  const isOpen = body.classList.contains('open');

  body.classList.toggle('open', !isOpen);
  body.classList.toggle('hidden', false);
  arrow.classList.toggle('open', !isOpen);
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
