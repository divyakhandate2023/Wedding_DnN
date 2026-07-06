const config = window.WEDDING_CONFIG || {};

function setConfigText() {
  document.querySelectorAll("[data-config]").forEach((element) => {
    const key = element.getAttribute("data-config");
    if (config[key] !== undefined && config[key] !== null) element.textContent = config[key];
  });
}

function setupMobileNav() {
  const toggle = document.getElementById("menuBtn");
  const links = document.getElementById("navMenu");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => links.classList.remove("open")));
}

function setupInviteOpen() {
  const openBtn = document.getElementById("openCardButton");
  const card = document.getElementById("inviteCard");
  if (!openBtn || !card) return;
  openBtn.addEventListener("click", () => {
    card.classList.add("open");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function renderEvents() {
  const grid = document.getElementById("eventGrid");
  if (!grid) return;
  grid.innerHTML = "";
  (config.events || []).forEach((event) => {
    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <span class="event-label">${event.label || "Event"}</span>
      <h3 class="event-title">${event.title}</h3>
      <p class="event-date">${event.date}</p>
      <p class="event-time">${event.time}</p>
      <p class="event-location"><strong>Location:</strong> ${event.location}</p>
      <p class="event-description">${event.description}</p>
    `;
    card.addEventListener("click", () => card.classList.toggle("expanded"));
    grid.appendChild(card);
  });
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("visible"));
    return;
  }
  elements.forEach((el) => el.classList.add("animate-ready"));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  elements.forEach((el) => observer.observe(el));
}

function setupLinks() {
  const mapLink = document.getElementById("mapLink");
  if (mapLink) mapLink.href = config.googleMapsLink || "https://maps.google.com/?q=Dallas%20Texas";

  const calendarLink = document.getElementById("calendarLink");
  if (calendarLink) {
    const title = encodeURIComponent(`${config.brideName} & ${config.groomName} Wedding`);
    const details = encodeURIComponent("We are delighted to invite you to celebrate our wedding.");
    const location = encodeURIComponent(`${config.venueName || ""}, ${config.venueAddress || ""}`);
    calendarLink.href =
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}` +
      `&dates=${config.weddingCalendarStart}/${config.weddingCalendarEnd}` +
      `&details=${details}&location=${location}`;
  }
}

function getCheckedEvents() {
  return Array.from(document.querySelectorAll('input[name="events"]:checked')).map((input) => input.value).join(", ");
}

async function submitToEndpoint(payload) {
  const response = await fetch(config.RSVP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Failed to submit RSVP.");
}

function submitByEmail(payload) {
  const subject = encodeURIComponent(`RSVP from ${payload.guestName}`);
  const body = encodeURIComponent(
    `Name: ${payload.guestName}\nContact: ${payload.guestContact}\nAttendance: ${payload.attendance}\nGuests: ${payload.guestCount}\nEvents: ${payload.eventsAttending || "Not selected"}\nMessage: ${payload.message || "None"}`
  );
  window.location.href = `mailto:${config.RSVP_EMAIL}?subject=${subject}&body=${body}`;
}

function setupRSVP() {
  const form = document.getElementById("rsvpForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      guestName: form.guestName.value.trim(),
      guestContact: form.guestContact.value.trim(),
      attendance: form.attendance.value,
      guestCount: form.guestCount.value,
      eventsAttending: getCheckedEvents(),
      message: form.message.value.trim(),
      submittedAt: new Date().toISOString()
    };
    status.textContent = "Submitting your RSVP...";
    try {
      if (config.RSVP_ENDPOINT) {
        await submitToEndpoint(payload);
        status.textContent = "Thank you. Your RSVP has been submitted successfully.";
        form.reset();
      } else {
        status.textContent = "Opening your email app to send RSVP.";
        submitByEmail(payload);
      }
    } catch (error) {
      status.textContent = "Could not submit the RSVP. Please try again.";
    }
  });
}

function setupCountdown() {
  const dayEl = document.getElementById("days");
  const hourEl = document.getElementById("hours");
  const minuteEl = document.getElementById("minutes");
  const secondEl = document.getElementById("seconds");
  if (!dayEl || !hourEl || !minuteEl || !secondEl) return;

  const weddingTime = new Date(config.countdownTarget || "2026-11-26T11:55:00-06:00").getTime();
  function updateCountdown() {
    const distance = weddingTime - new Date().getTime();
    if (distance <= 0) {
      dayEl.textContent = hourEl.textContent = minuteEl.textContent = secondEl.textContent = "00";
      return;
    }
    dayEl.textContent = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0");
    hourEl.textContent = String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, "0");
    minuteEl.textContent = String(Math.floor((distance / (1000 * 60)) % 60)).padStart(2, "0");
    secondEl.textContent = String(Math.floor((distance / 1000) % 60)).padStart(2, "0");
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function setupCopyInviteLink() {
  const button = document.getElementById("copyInviteLink");
  const status = document.getElementById("copyStatus");
  if (!button || !status) return;
  button.addEventListener("click", async () => {
    const link = window.location.href.split("#")[0];
    try {
      await navigator.clipboard.writeText(link);
      status.textContent = "Invite link copied.";
    } catch (error) {
      status.textContent = link;
    }
  });
}

function setupMusicToggle() {
  const music = document.getElementById("weddingMusic");
  const button = document.getElementById("musicToggle");
  if (!music || !button) return;
  music.volume = 0.35;
  button.addEventListener("click", async () => {
    if (music.paused) {
      try {
        await music.play();
        button.textContent = "❚❚ Pause Music";
      } catch (error) {
        button.textContent = "Tap again to play";
      }
    } else {
      music.pause();
      button.textContent = "♪ Play Music";
    }
  });
}

function createPetals() {
  const petalLayer = document.getElementById("petalLayer");
  if (!petalLayer) return;
  const total = window.innerWidth < 760 ? 12 : 18;
  for (let i = 0; i < total; i++) {
    const petal = document.createElement("span");
    petal.className = "petal" + (i % 4 === 0 ? " gold" : "");
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.animationDuration = `${8 + Math.random() * 8}s`;
    petal.style.animationDelay = `${Math.random() * 6}s`;
    petal.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    petalLayer.appendChild(petal);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setConfigText();
  setupMobileNav();
  setupInviteOpen();
  renderEvents();
  setupRevealAnimations();
  setupLinks();
  setupRSVP();
  setupCountdown();
  setupCopyInviteLink();
  setupMusicToggle();
  createPetals();
});
