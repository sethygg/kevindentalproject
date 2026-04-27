/* ==========================================================
   Farley Family Dental — Booking flow
   ----------------------------------------------------------
   Demo only. No backend yet. To wire to real availability,
   replace generateSlotsFor() with a fetch() against your
   scheduling API and replace handleConfirm() with a POST.
   ========================================================== */

(function () {
    "use strict";

    /* ----------------------------------------------------------
       CONFIG — edit the services and clinic hours here
       ---------------------------------------------------------- */
    const APP_CONFIG = {
        services: [
            {
                id: "cleaning-checkup",
                title: "Cleaning & Check-up",
                description: "Professional cleaning, exam, and X-rays if needed. Most common appointment.",
                duration: 60,
                recommended: true,
            },
            {
                id: "cleaning",
                title: "Cleaning",
                description: "Standalone hygienist cleaning, no exam.",
                duration: 45,
            },
            {
                id: "checkup",
                title: "Check-up Only",
                description: "Quick exam — useful if it's been a while or you're a new patient.",
                duration: 30,
            },
        ],
        // Open hours by weekday: 0=Sun, 1=Mon ... 6=Sat
        // null = closed
        hoursByDay: {
            0: null,                    // Sunday
            1: { start: "09:00", end: "17:00" }, // Mon
            2: { start: "09:00", end: "17:00" }, // Tue
            3: { start: "09:00", end: "17:00" }, // Wed
            4: { start: "09:00", end: "17:00" }, // Thu
            5: { start: "09:00", end: "14:00" }, // Fri
            6: null,                    // Saturday
        },
        slotInterval: 30, // minutes between slots
        bookableDaysAhead: 60,
    };

    /* ----------------------------------------------------------
       STATE
       ---------------------------------------------------------- */
    const state = {
        step: 1,
        service: null,        // service object
        date: null,           // ISO yyyy-mm-dd
        time: null,           // "HH:MM"
        details: {},
        calMonth: new Date(), // cursor for calendar nav
    };

    /* ----------------------------------------------------------
       UTILS
       ---------------------------------------------------------- */
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function isoDate(d) {
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }
    function parseISODate(s) {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m - 1, d);
    }
    function formatLongDate(d) {
        return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
    function formatTime(hhmm) {
        const [h, m] = hhmm.split(":").map(Number);
        const period = h >= 12 ? "PM" : "AM";
        const h12 = ((h + 11) % 12) + 1;
        return h12 + ":" + pad(m) + " " + period;
    }
    function startOfDay(d) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    }
    function addMinutes(hhmm, mins) {
        const [h, m] = hhmm.split(":").map(Number);
        const total = h * 60 + m + mins;
        return pad(Math.floor(total / 60)) + ":" + pad(total % 60);
    }

    // Deterministic pseudo-random based on date — so the same
    // demo "availability" stays consistent on reload
    function seededRand(seed) {
        let x = seed * 9301 + 49297;
        return ((x % 233280) / 233280);
    }

    /* ----------------------------------------------------------
       SERVICE SELECTION
       ---------------------------------------------------------- */
    function renderServices() {
        const wrap = $(".service-options");
        wrap.innerHTML = "";
        APP_CONFIG.services.forEach(svc => {
            const card = document.createElement("button");
            card.className = "service-option";
            card.setAttribute("role", "radio");
            card.setAttribute("aria-checked", "false");
            card.dataset.serviceId = svc.id;
            card.innerHTML = `
                ${svc.recommended ? '<span class="service-badge">Most popular</span>' : ''}
                <div class="service-option-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2C8.5 2 6 4 6 7c0 2 .5 3.5 1 5 .6 1.7 1 3 1 5.5 0 1.7.8 2.5 1.5 2.5.8 0 1.2-.7 1.5-2 .3-1.4.6-2 1-2s.7.6 1 2c.3 1.3.7 2 1.5 2 .7 0 1.5-.8 1.5-2.5 0-2.5.4-3.8 1-5.5.5-1.5 1-3 1-5 0-3-2.5-5-6-5z"/>
                    </svg>
                </div>
                <div class="service-option-body">
                    <h3>${svc.title}</h3>
                    <p>${svc.description}</p>
                    <span class="service-option-meta">${svc.duration} min</span>
                </div>
                <span class="service-option-check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
            `;
            card.addEventListener("click", () => selectService(svc));
            wrap.appendChild(card);
        });
    }

    function selectService(svc) {
        state.service = svc;
        state.time = null; // reset downstream
        $$(".service-option").forEach(el => {
            const isMine = el.dataset.serviceId === svc.id;
            el.classList.toggle("is-selected", isMine);
            el.setAttribute("aria-checked", isMine ? "true" : "false");
        });
        updateSummary();
        updateNextEnabled();
    }

    /* ----------------------------------------------------------
       CALENDAR
       ---------------------------------------------------------- */
    function renderCalendar() {
        const cursor = state.calMonth;
        const year = cursor.getFullYear();
        const month = cursor.getMonth();

        $("[data-cal-title]").textContent = cursor.toLocaleDateString(undefined, {
            month: "long", year: "numeric"
        });

        const grid = $("[data-cal-grid]");
        grid.innerHTML = "";

        const first = new Date(year, month, 1);
        const startOffset = first.getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = startOfDay(new Date());
        const maxDate = startOfDay(new Date());
        maxDate.setDate(maxDate.getDate() + APP_CONFIG.bookableDaysAhead);

        // Empty cells before day 1
        for (let i = 0; i < startOffset; i++) {
            const blank = document.createElement("div");
            blank.className = "calendar-cell is-empty";
            grid.appendChild(blank);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dow = dateObj.getDay();
            const iso = isoDate(dateObj);
            const isPast = dateObj < today;
            const isFuture = dateObj > maxDate;
            const isClosed = !APP_CONFIG.hoursByDay[dow];
            const isToday = iso === isoDate(today);
            const disabled = isPast || isFuture || isClosed;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "calendar-cell";
            btn.dataset.date = iso;
            btn.disabled = disabled;
            if (disabled) btn.classList.add("is-disabled");
            if (isToday) btn.classList.add("is-today");
            if (state.date === iso) btn.classList.add("is-selected");
            btn.innerHTML = `<span>${d}</span>`;
            btn.addEventListener("click", () => selectDate(iso));
            grid.appendChild(btn);
        }
    }

    function selectDate(iso) {
        state.date = iso;
        state.time = null;
        $$(".calendar-cell").forEach(c => c.classList.toggle("is-selected", c.dataset.date === iso));
        updateSummary();
        updateNextEnabled();
    }

    function calendarNav(dir) {
        const cursor = state.calMonth;
        const newCursor = new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1);
        const today = new Date();
        // don't let user go before current month
        const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (newCursor < minMonth) return;
        state.calMonth = newCursor;
        renderCalendar();
    }

    /* ----------------------------------------------------------
       TIME SLOTS
       ---------------------------------------------------------- */
    function generateSlotsFor(iso, durationMin) {
        const date = parseISODate(iso);
        const dow = date.getDay();
        const hours = APP_CONFIG.hoursByDay[dow];
        if (!hours) return [];

        const slots = [];
        let cursor = hours.start;
        // seed pseudo-random with date so availability is stable
        const seed = date.getDate() + (date.getMonth() + 1) * 31;
        let i = 0;

        while (true) {
            const slotEnd = addMinutes(cursor, durationMin);
            if (slotEnd > hours.end) break;
            // mock availability — about 35% are "booked"
            const r = seededRand(seed * 17 + i * 53);
            const available = r > 0.35;
            slots.push({ time: cursor, available });
            cursor = addMinutes(cursor, APP_CONFIG.slotInterval);
            i++;
        }
        return slots;
    }

    function renderTimeSlots() {
        const container = $("[data-time-blocks]");
        const empty = $("[data-time-empty]");
        container.innerHTML = "";

        if (!state.date || !state.service) return;

        const slots = generateSlotsFor(state.date, state.service.duration);
        const availableCount = slots.filter(s => s.available).length;

        $("[data-time-subtitle]").textContent =
            `${formatLongDate(parseISODate(state.date))} · ${availableCount} ${availableCount === 1 ? "opening" : "openings"} available`;

        if (availableCount === 0) {
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        // Group slots by morning / afternoon
        const morning = slots.filter(s => parseInt(s.time, 10) < 12);
        const afternoon = slots.filter(s => parseInt(s.time, 10) >= 12);

        function renderBlock(label, list) {
            if (!list.length) return;
            const block = document.createElement("div");
            block.className = "time-block";
            block.innerHTML = `<h4>${label}</h4><div class="time-grid"></div>`;
            const grid = block.querySelector(".time-grid");
            list.forEach(s => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "time-slot" + (s.available ? "" : " is-unavailable");
                btn.disabled = !s.available;
                btn.dataset.time = s.time;
                btn.textContent = formatTime(s.time);
                if (state.time === s.time) btn.classList.add("is-selected");
                btn.addEventListener("click", () => selectTime(s.time));
                grid.appendChild(btn);
            });
            container.appendChild(block);
        }

        renderBlock("Morning", morning);
        renderBlock("Afternoon", afternoon);
    }

    function selectTime(t) {
        state.time = t;
        $$(".time-slot").forEach(b => b.classList.toggle("is-selected", b.dataset.time === t));
        updateSummary();
        updateNextEnabled();
    }

    /* ----------------------------------------------------------
       SUMMARY (sidebar)
       ---------------------------------------------------------- */
    function updateSummary() {
        $("[data-sum-service]").textContent = state.service ? state.service.title : "—";
        $("[data-sum-date]").textContent = state.date ? formatLongDate(parseISODate(state.date)) : "—";
        $("[data-sum-time]").textContent = state.time ? formatTime(state.time) : "—";
        $("[data-sum-duration]").textContent = state.service ? state.service.duration + " min" : "—";
    }

    /* ----------------------------------------------------------
       CONFIRM PAGE
       ---------------------------------------------------------- */
    function renderConfirmList() {
        const list = $("[data-confirm-list]");
        const d = state.details;
        list.innerHTML = `
            <div><dt>Service</dt><dd>${state.service.title} <small>(${state.service.duration} min)</small></dd></div>
            <div><dt>Date</dt><dd>${formatLongDate(parseISODate(state.date))}</dd></div>
            <div><dt>Time</dt><dd>${formatTime(state.time)}</dd></div>
            <div><dt>Name</dt><dd>${escapeHTML(d.firstName + " " + d.lastName)}</dd></div>
            <div><dt>Email</dt><dd>${escapeHTML(d.email)}</dd></div>
            <div><dt>Phone</dt><dd>${escapeHTML(d.phone)}</dd></div>
            ${d.newPatient ? `<div><dt>New patient</dt><dd>${d.newPatient === "yes" ? "Yes" : "No, returning"}</dd></div>` : ""}
            ${d.notes ? `<div><dt>Notes</dt><dd>${escapeHTML(d.notes)}</dd></div>` : ""}
        `;
    }

    function escapeHTML(s) {
        return String(s || "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    /* ----------------------------------------------------------
       DETAILS FORM
       ---------------------------------------------------------- */
    function readForm() {
        const form = $(".booker-form");
        const fd = new FormData(form);
        return {
            firstName: (fd.get("firstName") || "").trim(),
            lastName: (fd.get("lastName") || "").trim(),
            email: (fd.get("email") || "").trim(),
            phone: (fd.get("phone") || "").trim(),
            newPatient: fd.get("newPatient") || "",
            notes: (fd.get("notes") || "").trim(),
        };
    }

    function detailsValid(d) {
        if (!d.firstName || !d.lastName) return false;
        if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return false;
        if (!d.phone || d.phone.replace(/\D/g, "").length < 7) return false;
        return true;
    }

    /* ----------------------------------------------------------
       STEP NAVIGATION
       ---------------------------------------------------------- */
    function showStep(n) {
        state.step = n;
        $$(".booker-step").forEach(el => el.classList.toggle("is-active", parseInt(el.dataset.step, 10) === n));
        // progress
        $$(".booker-progress li").forEach(li => {
            const s = parseInt(li.dataset.step, 10);
            li.classList.toggle("is-active", s === n);
            li.classList.toggle("is-done", s < n);
        });

        // hide controls on step 6 (done)
        const controls = $("[data-controls]");
        controls.style.display = n === 6 ? "none" : "";

        // toggle back btn
        $("[data-back]").hidden = n <= 1 || n === 6;

        // next button text
        const nextBtn = $("[data-next]");
        if (n === 4) nextBtn.textContent = "Review →";
        else if (n === 5) nextBtn.textContent = "Confirm booking";
        else nextBtn.textContent = "Continue →";

        // hide summary on done step
        $(".booker-summary").style.display = n === 6 ? "none" : "";

        // step-specific renders
        if (n === 2) renderCalendar();
        if (n === 3) renderTimeSlots();
        if (n === 5) renderConfirmList();

        updateNextEnabled();
        // scroll to top of card
        $(".booker-card").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function updateNextEnabled() {
        const nextBtn = $("[data-next]");
        const ok = (() => {
            if (state.step === 1) return !!state.service;
            if (state.step === 2) return !!state.date;
            if (state.step === 3) return !!state.time;
            if (state.step === 4) return detailsValid(readForm());
            if (state.step === 5) return true;
            return false;
        })();
        nextBtn.disabled = !ok;
    }

    function onNext() {
        if (state.step === 4) {
            state.details = readForm();
        }
        if (state.step === 5) {
            handleConfirm();
            return;
        }
        showStep(state.step + 1);
    }

    function onBack() {
        if (state.step <= 1) return;
        showStep(state.step - 1);
    }

    function handleConfirm() {
        // Demo only — in production POST to your booking API here.
        const confId = "FFD-" + Math.floor(100000 + Math.random() * 900000);
        $("[data-conf-id]").textContent = confId;
        $("[data-done-summary]").innerHTML =
            `${escapeHTML(state.service.title)} on <strong>${formatLongDate(parseISODate(state.date))}</strong> at <strong>${formatTime(state.time)}</strong>.`;
        showStep(6);
    }

    function restart() {
        state.service = null;
        state.date = null;
        state.time = null;
        state.details = {};
        state.calMonth = new Date();
        $(".booker-form") && $(".booker-form").reset();
        $$(".service-option").forEach(el => {
            el.classList.remove("is-selected");
            el.setAttribute("aria-checked", "false");
        });
        updateSummary();
        showStep(1);
    }

    /* ----------------------------------------------------------
       INIT
       ---------------------------------------------------------- */
    function init() {
        // Only run on the booking page
        if (!document.body.classList.contains("page-book")) return;

        renderServices();
        updateSummary();

        $("[data-next]").addEventListener("click", onNext);
        $("[data-back]").addEventListener("click", onBack);
        $("[data-restart]").addEventListener("click", restart);
        $("[data-cal-prev]").addEventListener("click", () => calendarNav(-1));
        $("[data-cal-next]").addEventListener("click", () => calendarNav(1));
        const calBack = $("[data-cal-back]");
        if (calBack) calBack.addEventListener("click", e => { e.preventDefault(); showStep(2); });

        // Re-validate on form input
        $(".booker-form").addEventListener("input", updateNextEnabled);

        showStep(1);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
