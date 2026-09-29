const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');

if (menuButton && navigation) {
  const mobile = window.matchMedia('(max-width: 800px)');
  const setMenu = (open) => {
    navigation.hidden = mobile.matches && !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('span').textContent = open ? 'Close' : 'Menu';
  };
  const syncMenu = () => {
    const focusedToggle = document.activeElement === menuButton;
    const focusedLink = navigation.contains(document.activeElement);
    menuButton.hidden = !mobile.matches;
    setMenu(false);
    if (mobile.matches && focusedLink) menuButton.focus();
    if (!mobile.matches && focusedToggle) navigation.querySelector('a').focus();
  };
  syncMenu();
  mobile.addEventListener('change', syncMenu);
  menuButton.addEventListener('click', () => setMenu(navigation.hidden));
  navigation.addEventListener('click', (event) => {
    if (mobile.matches && event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobile.matches && !navigation.hidden) {
      setMenu(false);
      menuButton.focus();
    }
  });
}

const copyButton = document.querySelector('[data-copy-email]');
if (copyButton && navigator.clipboard && window.isSecureContext) {
  const status = document.querySelector('.copy-status');
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    copyButton.disabled = true;
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(copyButton.dataset.copyEmail);
      status.textContent = 'Email address copied.';
    } catch {
      status.textContent = 'Could not copy. Use the email link above.';
    } finally {
      copyButton.disabled = false;
    }
  });
}

const printButton = document.querySelector('[data-print]');
if (printButton) {
  printButton.hidden = false;
  printButton.addEventListener('click', () => window.print());
}

const depthEnabled = window.matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
document.querySelectorAll('[data-depth]').forEach((scene) => {
  let frame = 0;
  let x = 0;
  let y = 0;
  const strength = Number(scene.dataset.depth);
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    scene.style.removeProperty('--tilt-x');
    scene.style.removeProperty('--tilt-y');
  };
  scene.addEventListener('pointermove', (event) => {
    if (!depthEnabled.matches || event.pointerType !== 'mouse' || scene.matches(':focus-within')) return;
    const bounds = scene.getBoundingClientRect();
    x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    // Update only on pointer input, at most once per frame; no idle animation loop.
    if (!frame) frame = requestAnimationFrame(() => {
      scene.style.setProperty('--tilt-x', `${(-y * strength).toFixed(2)}deg`);
      scene.style.setProperty('--tilt-y', `${(x * strength).toFixed(2)}deg`);
      frame = 0;
    });
  });
  scene.addEventListener('pointerleave', reset);
  scene.addEventListener('pointercancel', reset);
  scene.addEventListener('focusin', reset);
  depthEnabled.addEventListener('change', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('scroll', reset, { passive: true });
});
