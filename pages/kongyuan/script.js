const openButton = document.querySelector(".envelope-trigger");
const closeButton = document.querySelector(".close-letter");
const letterPage = document.querySelector(".letter-page");

if (
  !(openButton instanceof HTMLButtonElement) ||
  !(closeButton instanceof HTMLButtonElement) ||
  !(letterPage instanceof HTMLElement)
) {
  throw new Error("Envelope controls or letter page are missing from the document.");
}

openButton.addEventListener("click", () => {
  if (document.body.classList.contains("is-open")) return;

  window.scrollTo({ top: 0, behavior: "instant" });
  document.body.classList.add("is-open");
  openButton.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => letterPage.focus({ preventScroll: true }));
});

closeButton.addEventListener("click", () => {
  if (!document.body.classList.contains("is-open")) return;

  document.body.classList.add("is-closing");
  window.scrollTo({ top: 0, behavior: "smooth" });

  const closeDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 850;
  window.setTimeout(() => {
    document.body.classList.remove("is-open", "is-closing");
    openButton.setAttribute("aria-expanded", "false");
    openButton.focus({ preventScroll: true });
  }, closeDelay);
});
