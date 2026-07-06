(() => {
  const config = window.WEDDING_CONFIG || {};

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function setTextFromConfig() {
    $$("[data-config]").forEach((el) => {
      const key = el.getAttribute("data-config");
      if (Object.prototype.hasOwnProperty.call(config, key)) {
        el.textContent = config[key];
      }
    });
  }

  function renderEvents() {
    const eventGrid = $("#eventGrid");
    if (!eventGrid || !Array.isArray(config.events)) return;

    eventGrid.innerHTML = config.events
      .map(
        (event) => `
          <article class="event-card">
            <span class="label">${escapeHtml(event.label)}</span>
            <h3>${escapeHtml(event.title)}</h3>
            <p><strong>Date:</strong> ${escapeHtml(event.date)}</p>
            <p><strong>Time:</strong> ${escapeHtml(event.time)}</p>
            <p><strong>Location:</strong> ${escapeHtml(event.location)}</p>
            <p>${escapeHtml(event.description)}</p>
            <div class="attire"><strong>Dress Code:</strong> ${escapeHtml(event.attire)}</div>
          </article>
        `
      )
      .join("");
  }

  function renderHotels() {
    const hotelGrid = $("#hotelGrid");
    if (!hotelGrid || !Array.isArray(config.hotels)) return;

    hotelGrid.innerHTML = config.hotels
      .map(
        (hotel) => `
          <article class="hotel-card">
            <h4>${escapeHtml(hotel.name)}</h4>
            <p>${escapeHtml(hotel.note)}</p>
          </article>
        `
      )
      .join("");
  }

  function setupLinks() {
    const mapLink = $("#mapLink");
    if (mapLink) {
      mapLink.href = config.googleMapsLink;
    }

    const calendarLink = $("#calendarLink");
    if (calendarLink) {
      const title = encodeURIComponent("Divya and Nandan Wedding");
      const details = encodeURIComponent(
        "Wedding ceremony for Divya and Nandan at " +
          config.venueName +
          ", " +
          config.venueAddress
      );
      const location = encodeURIComponent(config.venueName + ", " + config.venueAddress);
      calendarLink.href =
        `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}` +
        `&dates=${config.weddingCalendarStart}/${config.weddingCalendarEnd}` +
        `&details=${details}&location=${location}`;
    }
  }

  function setupMenu() {
    const menuBtn = $("#menuBtn");
    const navMenu = $("#navMenu");

    if (!menuBtn || !navMenu) return;

    menuBtn.addEventListener("click", () => {
      navMenu.classList.toggle("open");
    });

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => navMenu.classList.remove("open"));
    });
  }

  function setupRevealAnimation() {
    const revealEls = $$(".reveal");

    if (!("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  function setupCountdown() {
    const target = config.countdownTarget ? new Date(config.countdownTarget).getTime() : NaN;

    const daysEl = $("#days");
    const hoursEl = $("#hours");
    const minutesEl = $("#minutes");
    const secondsEl = $("#seconds");

    if (!target || Number.isNaN(target) || !daysEl || !hoursEl || !minutesEl || !secondsEl) {
      return;
    }

    const update = () => {
      const distance = target - Date.now();

      if (distance <= 0) {
        daysEl.textContent = "00";
        hoursEl.textContent = "00";
        minutesEl.textContent = "00";
        secondsEl.textContent = "00";
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / (1000 * 60)) % 60);
      const seconds = Math.floor((distance / 1000) % 60);

      daysEl.textContent = String(days).padStart(2, "0");
      hoursEl.textContent = String(hours).padStart(2, "0");
      minutesEl.textContent = String(minutes).padStart(2, "0");
      secondsEl.textContent = String(seconds).padStart(2, "0");
    };

    update();
    setInterval(update, 1000);
  }

  function setupCopyInviteLink() {
    const copyBtn = $("#copyInviteLink");
    const copyStatus = $("#copyStatus");

    if (!copyBtn) return;

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href.split("?")[0]);
        if (copyStatus) copyStatus.textContent = "Invite link copied.";
      } catch (error) {
        if (copyStatus) copyStatus.textContent = "Copy failed. Please copy the browser link.";
      }
    });
  }

  function setupRSVP() {
    const form = $("#rsvpForm");
    const status = $("#formStatus");

    if (!form) return;

    if (config.RSVP_ENDPOINT) {
      form.action = config.RSVP_ENDPOINT;
    }

    const deadline = config.RSVP_DEADLINE ? new Date(config.RSVP_DEADLINE) : null;
    if (deadline && Date.now() > deadline.getTime()) {
      form.querySelectorAll("input, select, textarea, button").forEach((el) => {
        el.disabled = true;
      });
      if (status) {
        status.textContent = "RSVP deadline has passed.";
      }
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

    const endpoint = config.RSVP_ENDPOINT || form.action;

if (!endpoint) {
  if (status) {
    status.textContent = "RSVP endpoint is missing.";
  }
  return;
}

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      if (status) {
        status.textContent = "Submitting RSVP...";
      }

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: {
            Accept: "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Form submission failed");
        }

        form.reset();

        if (status) {
          status.textContent = "Thank you. Your RSVP has been submitted.";
        }
      } catch (error) {
        if (status) {
          status.textContent = "Could not submit RSVP. Please try again.";
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Submit RSVP";
        }
      }
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTextFromConfig();
    renderEvents();
    renderHotels();
    setupLinks();
    setupMenu();
    setupRevealAnimation();
    setupCountdown();
    setupCopyInviteLink();
    setupRSVP();
  });
})();
document.addEventListener("DOMContentLoaded", () => {
  const openInviteCard = document.getElementById("openInviteCard");

  openInviteCard?.addEventListener("click", () => {
    const actualInvitationCard = document.getElementById("actualInvitationCard");

    actualInvitationCard?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });

  openInviteCard?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      const actualInvitationCard = document.getElementById("actualInvitationCard");

      actualInvitationCard?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  });
});