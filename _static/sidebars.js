// Collapsible sidebars on wide screens (styles in sidebars.css).
// Both sidebars start hidden. The header buttons (left: chapters, right: page
// contents) open and close them, and the choice is kept while the reader moves
// between chapters in the same browser tab.
(function () {
  var KEY = "sbx-sidebars";
  var root = document.documentElement;
  var state = { primary: false, secondary: false };
  try {
    var saved = JSON.parse(sessionStorage.getItem(KEY));
    if (saved) state = saved;
  } catch (e) {}

  function apply() {
    root.classList.toggle("sbx-hide-primary", !state.primary);
    root.classList.toggle("sbx-hide-secondary", !state.secondary);
  }
  apply();

  document.addEventListener("click", function (ev) {
    if (window.innerWidth < 992) return; // small screens: theme's own drawers
    var button = ev.target.closest("label.primary-toggle, label.secondary-toggle");
    if (!button) return;
    ev.preventDefault();
    ev.stopPropagation();
    var side = button.classList.contains("primary-toggle") ? "primary" : "secondary";
    state[side] = !state[side];
    apply();
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }, true);
})();
