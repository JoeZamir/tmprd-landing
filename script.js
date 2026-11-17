const $ = (s, r = document) => r.querySelector(s);

// Mobile menu
const btn = $("#menuBtn"), drawer = $("#drawer");
const setMenu = (open) => {
  drawer.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", String(open));
  btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
btn.addEventListener("click", () => setMenu(btn.getAttribute("aria-expanded") !== "true"));
drawer.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

// Scroll reveal
const items = document.querySelectorAll(".rv");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
} else items.forEach((el) => el.classList.add("in"));

$("#yr").textContent = new Date().getFullYear();
