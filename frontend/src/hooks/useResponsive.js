import { useEffect } from 'react';

const ID = 'mus-responsive-runtime';

function buildCSS(w) {
  const mobile  = w <= 768;
  const small   = w <= 540;
  const tiny    = w <= 480;
  const xsmall  = w <= 380;
  const tablet  = w <= 900;

  return `
/* Runtime responsive overrides (${w}px) */
html, body, #root { overflow-x: hidden !important; max-width: 100vw; }

/* LOGIN */
.login-left  { display: ${mobile ? 'none' : 'flex'} !important; }
.mobile-logo { display: ${mobile ? 'flex' : 'none'} !important; }
${mobile ? `.login-right { padding: ${tiny ? '20px 14px' : '28px 20px'} !important; }` : ''}

/* SIGNUP */
.signup-left { display: ${mobile ? 'none' : 'flex'} !important; }
${mobile ? `.signup-right { padding: ${tiny ? '18px 12px' : '28px 20px'} !important; }` : ''}

/* MEMBER SIDEBAR */
${mobile ? `
.mem-sidebar { width: ${tiny ? '48px' : '56px'} !important; min-width: ${tiny ? '48px' : '56px'} !important; }
.mem-sidebar .side-label    { display: none !important; }
.mem-sidebar .side-user     { display: none !important; }
.mem-sidebar .side-collapse { display: none !important; }
.mem-main { padding: ${tiny ? '12px 8px' : '16px 12px'} !important; }
` : ''}

/* ADMIN SIDEBAR */
${mobile ? `aside { max-width: ${tiny ? '48px' : '56px'} !important; min-width: ${tiny ? '48px' : '56px'} !important; }` : ''}
${mobile ? `main { padding: ${tiny ? '12px 8px' : '16px 12px'} !important; }` : ''}

/* GRIDS — two-panel → stack */
${tablet ? `
[style*="gridTemplateColumns:'1fr 340px'"],
[style*='gridTemplateColumns:"1fr 340px"'],
[style*="gridTemplateColumns:'1fr 300px'"],
[style*="gridTemplateColumns:'300px 1fr'"],
[[style*="gridTemplateColumns:'2fr"],
[style*="gridTemplateColumns:\"2fr"] { grid-template-columns: 1fr !important; }
` : ''}

/* GRIDS — auto-fit cards → 2 col then 1 col */
${tablet ? `
[style*="repeat(auto-fit,minmax(200px"],
[style*="repeat(auto-fit,minmax(190px"],
[style*="repeat(auto-fit,minmax(180px"] { grid-template-columns: repeat(2, 1fr) !important; }
` : ''}
${tiny ? `
[style*="repeat(auto-fit,minmax(200px"],
[style*="repeat(auto-fit,minmax(190px"],
[style*="repeat(auto-fit,minmax(180px"],
[style*="repeat(auto-fit,minmax(160px"] { grid-template-columns: 1fr !important; }
` : ''}

/* GRIDS — member cards */
${small ? `[style*="repeat(auto-fill,minmax(280px"] { grid-template-columns: 1fr !important; }` : ''}

/* GRIDS — month payment grid */
${small ? `[style*="minmax(130px"] { grid-template-columns: repeat(3, 1fr) !important; }` : ''}
${xsmall ? `[style*="minmax(130px"] { grid-template-columns: repeat(2, 1fr) !important; }` : ''}

/* GRIDS — 2-col form rows → stack on tiny */
${xsmall ? `
[style*="gridTemplateColumns:'1fr 1fr'"],
[style*='gridTemplateColumns:"1fr 1fr"'] { grid-template-columns: 1fr !important; }
` : ''}

/* TABLE SCROLL */
${mobile ? `div:has(> table) { overflow-x: auto !important; } table { min-width: 540px; }` : ''}

/* MODALS — bottom sheet */
${small ? `
[style*="backdropFilter:"][style*="position:'fixed'"] { align-items: flex-end !important; padding: 0 !important; }
[style*="backdropFilter:"][style*="position:'fixed'"] > div { max-width: 100% !important; width: 100% !important; border-radius: 20px 20px 0 0 !important; max-height: 92vh !important; overflow-y: auto !important; }
` : ''}

/* TOASTS */
${small ? `
[style*="position:'fixed'"][style*="bottom:28"],
[style*="position:'fixed'"][style*="bottom:24"] { left: 12px !important; right: 12px !important; bottom: 16px !important; max-width: calc(100% - 24px) !important; }
` : ''}

/* CARD PADDING */
${tiny ? `
[style*="padding:'32px'"] { padding: 16px !important; }
[style*="padding: 32px"]  { padding: 16px !important; }
[style*="padding:'24px'"] { padding: 14px !important; }
[style*="padding: 24px"]  { padding: 14px !important; }
` : ''}

/* TYPOGRAPHY */
${small ? `
h1 { font-size: clamp(1.7rem, 6.5vw, 2.4rem) !important; line-height: 1.15 !important; }
h2 { font-size: clamp(1.3rem, 5vw, 1.9rem) !important; }
h3 { font-size: clamp(1rem, 4vw, 1.3rem) !important; }
` : ''}

/* FAMILY TREE DETAIL PANEL */
${small ? `
[style*="right:24"][style*="zIndex:600"] { right:0!important;left:0!important;top:auto!important;bottom:0!important;width:100%!important;transform:none!important;border-radius:20px 20px 0 0!important;max-height:55vh!important;overflow-y:auto!important; }
` : ''}

/* PENDING PAYMENTS / ANNOUNCEMENT CARDS */
${mobile ? `[style*="display:'flex'"][style*="alignItems:'flex-start'"][style*="gap:16"] { flex-wrap: wrap !important; }` : ''}
`;
}

export function useResponsive() {
  useEffect(() => {
    function apply() {
      const w = window.innerWidth;
      let el = document.getElementById(ID);
      if (!el) {
        el = document.createElement('style');
        el.id = ID;
        document.head.appendChild(el);
      }
      el.textContent = buildCSS(w);
    }
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
}