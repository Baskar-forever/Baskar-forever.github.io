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
