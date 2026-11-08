// Progressive enhancement for the source-backed in-page program link.
// Menu disclosure, FAQ answers and subpage routing await the missing Figma sources.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    const heading = target.querySelector('[tabindex="-1"]');
    (heading || target).focus({ preventScroll: true });
  });
});
