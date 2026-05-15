import { useEffect, useState } from 'react';

const STYLE_ID = 'mus-responsive-overrides';

// Generates CSS overrides applied via JS so they beat inline styles
function buildStyles(w) {
  const mobile  = w <= 768;
  const small   = w <= 540;
  const tiny    = w <= 480;

  return `
    /* ── Injected by useResponsive.js (overrides inline styles) ── */

    html, body, #root { overflow-x: hidden !important; }

    /* ─ Navbar ─ */
    .hamburger  { display: ${mobile ? 'flex' : 'none'} !important; }
    .nav-links  { display: ${mobile ? 'none' : 'flex'} !important; }
    .nav-auth   { display: ${mobile ? 'none' : 'flex'} !important; }

    /* ─ Login ─ */
    .login-left   { display: ${mobile ? 'none' : 'flex'} !important; }
    .login-right  { padding: ${tiny ? '20px 14px' : mobile ? '28px 20px' : ''} ${mobile ? '!important' : ''}; }

    /* ─ Member sidebar ─ */
    ${mobile ? `
    .mem-sidebar {
      width: ${tiny ? '48px' : '56px'} !important;
      min-width: ${tiny ? '48px' : '56px'} !important;
    }
    .mem-sidebar .side-label    { display: none !important; }
    .mem-sidebar .side-user     { display: none !important; }
    .mem-sidebar .side-collapse { display: none !important; }
    .mem-main { padding: ${tiny ? '12px 10px' : '18px 14px'} !important; }
    ` : ''}

    /* ─ Modals → bottom sheet on small screens ─ */
    ${small ? `
    .modal-backdrop {
      align-items: flex-end !important;
      padding: 0 !important;
    }
    .modal-card {
      border-radius: 20px 20px 0 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      max-height: 90vh !important;
      overflow-y: auto !important;
    }
    ` : ''}

    /* ─ Toasts ─ */
    ${small ? `
    .toast-fixed {
      left: 12px !important;
      right: 12px !important;
      bottom: 16px !important;
      max-width: calc(100% - 24px) !important;
    }
    ` : ''}
  `;
}

export function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Inject or update the <style> tag
    function apply(w) {
      let el = document.getElementById(STYLE_ID);
      if (!el) {
        el = document.createElement('style');
        el.id = STYLE_ID;
        document.head.appendChild(el);
      }
      el.textContent = buildStyles(w);
    }

    apply(window.innerWidth);

    const onResize = () => {
      setWidth(window.innerWidth);
      apply(window.innerWidth);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    isMobile : width <= 768,
    isSmall  : width <= 540,
    isTiny   : width <= 480,
    width,
  };
}