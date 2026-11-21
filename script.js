const root = document.documentElement;
const menuBtn = document.querySelector("[data-menu-btn]");
const drawer = document.querySelector("[data-drawer]");
const dock = document.querySelector("[data-dock]");

// Mobile menu: full-screen sheet with scroll lock
const setMenu = (open) => {
  drawer.classList.toggle("is-open", open);
  root.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  drawer.toggleAttribute("inert", !open);
  syncDock();
};
drawer.setAttribute("inert", "");
menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
drawer.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
matchMedia("(min-width: 64rem)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

// Sticky booking bar: shown once the hero has scrolled away, hidden on the final CTA and while the menu is open
const hidden = new Set(["top", "book"]);
const seen = new Set(["top"]);
const syncDock = () => dock.classList.toggle("is-on", seen.size === 0 && !root.classList.contains("menu-open"));
const dockObserver = new IntersectionObserver((entries) => {
  entries.forEach((en) => (en.isIntersecting ? seen.add(en.target.id) : seen.delete(en.target.id)));
  syncDock();
});
hidden.forEach((id) => dockObserver.observe(document.getElementById(id)));

// Scroll reveal
const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((el) => observer.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add("is-in"));
}

document.querySelector("[data-year]").textContent = new Date().getFullYear();
