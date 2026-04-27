/* =================================================
   Farley Family Dental — site script
   Tiny vanilla JS: mobile nav toggle + footer year
   ================================================= */

(function () {
    "use strict";

    // ---- Mobile nav toggle ----
    const toggle = document.querySelector(".menu-toggle");
    const mobileNav = document.getElementById("mobile-nav");

    if (toggle && mobileNav) {
        toggle.addEventListener("click", function () {
            const isOpen = mobileNav.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        // Close menu when a link is clicked
        mobileNav.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                mobileNav.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    // ---- Footer year ----
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ---- Subtle nav highlight on scroll (optional progressive enhancement) ----
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav a[href^='#']");

    if ("IntersectionObserver" in window && sections.length && navLinks.length) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navLinks.forEach(function (link) {
                        link.classList.toggle(
                            "is-active",
                            link.getAttribute("href") === "#" + id
                        );
                    });
                }
            });
        }, { rootMargin: "-50% 0px -50% 0px" });

        sections.forEach(function (s) { observer.observe(s); });
    }
})();
