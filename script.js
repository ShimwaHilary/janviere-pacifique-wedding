/* Janvière & Pacifique — wedding invitation
 * Vanilla JS: reveal-on-scroll, countdown, ambient audio,
 * video film, marquee lightbox, smooth nav.
 */

(() => {
  "use strict";

  /* ---------- reveal-on-scroll ---------- */

  const reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- countdown ---------- */

  const cd = document.querySelector(".countdown");
  if (cd) {
    const target = new Date(cd.dataset.wedding || "2026-07-11T09:00:00+02:00").getTime();
    const out = {
      days: cd.querySelector('[data-unit="days"]'),
      hours: cd.querySelector('[data-unit="hours"]'),
      minutes: cd.querySelector('[data-unit="minutes"]'),
      seconds: cd.querySelector('[data-unit="seconds"]'),
    };
    const prev = { days: "", hours: "", minutes: "", seconds: "" };

    const pad = (n, w = 2) => String(Math.max(0, n)).padStart(w, "0");

    const tick = () => {
      const now = Date.now();
      let delta = Math.max(0, target - now);

      const day = 1000 * 60 * 60 * 24;
      const hour = 1000 * 60 * 60;
      const minute = 1000 * 60;

      const days = Math.floor(delta / day); delta -= days * day;
      const hours = Math.floor(delta / hour); delta -= hours * hour;
      const minutes = Math.floor(delta / minute); delta -= minutes * minute;
      const seconds = Math.floor(delta / 1000);

      const next = {
        days: pad(days, 3),
        hours: pad(hours),
        minutes: pad(minutes),
        seconds: pad(seconds),
      };

      for (const k of Object.keys(out)) {
        if (next[k] !== prev[k] && out[k]) {
          out[k].textContent = next[k];
          out[k].classList.remove("tick");
          void out[k].offsetWidth;
          out[k].classList.add("tick");
          prev[k] = next[k];
        }
      }
    };

    tick();
    setInterval(tick, 1000);
  }

  /* ---------- ambient audio + toggle ---------- */

  const audio = document.getElementById("ambient");
  const audioBtn = document.getElementById("audioToggle");

  if (audio && audioBtn) {
    audio.volume = 0.55;

    const setPressed = (on) => {
      audioBtn.setAttribute("aria-pressed", on ? "true" : "false");
      const text = audioBtn.querySelector(".audio-toggle__text");
      if (text) text.textContent = on ? "Pause" : "Music";
    };

    const tryAutoplay = async () => {
      try {
        await audio.play();
        setPressed(true);
      } catch {
        // Browsers block autoplay until a user gesture.
        // Resume on first interaction anywhere on the page.
        const resume = async () => {
          try {
            await audio.play();
            setPressed(true);
          } catch {}
          window.removeEventListener("pointerdown", resume);
          window.removeEventListener("keydown", resume);
          window.removeEventListener("scroll", resume);
        };
        window.addEventListener("pointerdown", resume, { once: true });
        window.addEventListener("keydown", resume, { once: true });
        window.addEventListener("scroll", resume, { once: true, passive: true });
      }
    };

    audioBtn.addEventListener("click", async () => {
      if (audio.paused) {
        try { await audio.play(); setPressed(true); } catch {}
      } else {
        audio.pause();
        setPressed(false);
      }
    });

    audio.addEventListener("play", () => setPressed(true));
    audio.addEventListener("pause", () => setPressed(false));

    tryAutoplay();
  }

  /* ---------- film ---------- */

  const filmFrame = document.getElementById("filmFrame");
  const filmVideo = document.getElementById("filmVideo");
  const filmPlay = document.getElementById("filmPlay");

  if (filmFrame && filmVideo && filmPlay) {
    const startFilm = async () => {
      filmVideo.controls = true;
      try {
        // Pause ambient music so the film audio is heard.
        if (audio && !audio.paused) audio.pause();
        await filmVideo.play();
        filmFrame.classList.add("is-playing");
      } catch {}
    };

    filmPlay.addEventListener("click", startFilm);
    filmFrame.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        startFilm();
      }
    });

    filmVideo.addEventListener("ended", () => {
      filmFrame.classList.remove("is-playing");
      filmVideo.controls = false;
    });
  }

  /* ---------- marquee — seed scroll to avoid same-image collision on row B ---------- */

  document.querySelectorAll(".marquee__row--b .marquee__track").forEach((t) => {
    // give row B a head start so it visually offsets from row A
    t.style.animationDelay = "-12s";
  });

  /* ---------- lightbox ---------- */

  const lb = document.getElementById("lightbox");
  if (lb) {
    const lbImg = lb.querySelector(".lightbox__img");
    const lbIndex = document.getElementById("lbIndex");
    const lbTotal = document.getElementById("lbTotal");
    const btnClose = lb.querySelector(".lightbox__close");
    const btnPrev = lb.querySelector(".lightbox__nav--prev");
    const btnNext = lb.querySelector(".lightbox__nav--next");

    // Unique list of images, in document order, ignoring duplicated marquee copies.
    const sources = [];
    document
      .querySelectorAll(".tile:not([aria-hidden='true'])")
      .forEach((t) => {
        const src = t.dataset.img;
        if (src && !sources.includes(src)) sources.push(src);
      });

    if (lbTotal) lbTotal.textContent = sources.length;
    let cursor = 0;

    const show = (i) => {
      cursor = (i + sources.length) % sources.length;
      lbImg.src = sources[cursor];
      if (lbIndex) lbIndex.textContent = cursor + 1;
    };

    const open = (src) => {
      const i = sources.indexOf(src);
      show(i >= 0 ? i : 0);
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    const close = () => {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    document.querySelectorAll(".tile[data-img]").forEach((t) => {
      t.addEventListener("click", () => open(t.dataset.img));
    });

    btnClose && btnClose.addEventListener("click", close);
    btnPrev && btnPrev.addEventListener("click", () => show(cursor - 1));
    btnNext && btnNext.addEventListener("click", () => show(cursor + 1));

    lb.addEventListener("click", (e) => {
      if (e.target === lb) close();
    });

    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(cursor - 1);
      else if (e.key === "ArrowRight") show(cursor + 1);
    });
  }

  /* ---------- smooth anchors ---------- */

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
})();
