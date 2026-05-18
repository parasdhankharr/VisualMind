const fs = require('fs');
const path = require('path');

const files = [
  'components/dashboard.jsx',
  'components/app-shell.jsx',
  'components/momentum-path.jsx',
  'components/ranks-roadmap.jsx',
  'components/ai-lab.jsx',
  'components/landing-page.jsx',
];

const LIGHT_GRADIENT_DIV = `<div \n        className="pointer-events-none fixed inset-0 z-[-1]" \n        style={{\n          backgroundImage: "radial-gradient(circle 476px at 54.8% 51.5%, rgba(168,229,253,1) 0%, rgba(244,244,254,1) 42.3%, rgba(244,244,254,1) 100.2%)"\n        }}\n      />`;

const LIGHT_GRADIENT_DIV_ONE_LINE = `<div \n        className="pointer-events-none fixed inset-0 z-[-1]" \n        style={{\n          backgroundImage: "radial-gradient(circle 476px at 54.8% 51.5%, rgba(168,229,253,1) 0%, rgba(244,244,254,1) 42.3%, rgba(244,244,254,1) 100.2%)"\n        }}\n      />`;


files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (file === 'components/dashboard.jsx') {
    content = content.replace('bg-transparent text-white', 'bg-[#050505] text-white');
    content = content.replace(LIGHT_GRADIENT_DIV, '<div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_50%)]" />');
    
    // Update BRAND_GRADIENT to the custom radial gradient
    content = content.replace(
      'const BRAND_GRADIENT = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";',
      'const BRAND_GRADIENT = "radial-gradient(circle 476px at 54.8% 51.5%, rgba(168,229,253,1) 0%, rgba(244,244,254,1) 42.3%, rgba(244,244,254,1) 100.2%)";'
    );
    // Fix text colors for elements using BRAND_GRADIENT
    // For the Resume Path card:
    content = content.replace(/text-white shadow-\[0_20px_50px_rgba\(79,172,254,0\.2\)\]/g, 'text-slate-900 shadow-[0_20px_50px_rgba(168,229,253,0.3)]');
    content = content.replace(/text-white\/70/g, 'text-slate-800/80');
    content = content.replace(/text-white\/85/g, 'text-slate-800');
    // For GlowBar
    content = content.replace(/bg-white\/20/g, 'bg-slate-900/10');
    content = content.replace(/bg-white\/14/g, 'bg-slate-900/5');
    // Button text colors
    content = content.replace(/text-cyan-100/g, 'text-slate-900');
    content = content.replace(/text-white/g, 'text-white'); // Leave others as white, handle specific ones below
  } else if (file === 'components/app-shell.jsx') {
    content = content.replace('bg-transparent text-white', 'bg-[#050505] text-white');
    content = content.replace(LIGHT_GRADIENT_DIV, '<div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_50%)]" />');
  } else if (file === 'components/momentum-path.jsx') {
    content = content.replace('<main className="min-h-screen overflow-x-hidden text-slate-850">', '<main className="min-h-screen overflow-x-hidden bg-[#05050b] text-white">');
    content = content.replace(LIGHT_GRADIENT_DIV, '<div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />\n      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(45,212,191,0.1),transparent_26%),radial-gradient(circle_at_72%_10%,rgba(99,102,241,0.11),transparent_24%),radial-gradient(circle_at_88%_78%,rgba(167,139,250,0.09),transparent_28%),linear-gradient(180deg,rgba(5,5,11,0.88),rgba(5,5,11,1))]" />');
  } else if (file === 'components/ranks-roadmap.jsx') {
    content = content.replace('<main className="min-h-screen overflow-x-hidden text-slate-850">', '<main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">');
    content = content.replace(LIGHT_GRADIENT_DIV, '<div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(79,172,254,0.11),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(0,242,254,0.09),transparent_22%),linear-gradient(180deg,rgba(5,5,5,0.86),rgba(5,5,5,1))]" />\n      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />');
  } else if (file === 'components/ai-lab.jsx') {
    content = content.replace('<main className="min-h-screen px-4 py-6 text-slate-850 sm:px-6 xl:px-8">', '<main className="min-h-screen bg-midnight px-4 py-6 text-white sm:px-6 xl:px-8">');
    content = content.replace(LIGHT_GRADIENT_DIV, '<div className="fixed inset-0 bg-hero-grid bg-[length:42px_42px] opacity-20" />\n      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_72%_20%,rgba(168,85,247,0.12),transparent_18%),linear-gradient(180deg,rgba(7,10,18,1),rgba(3,6,15,1))]" />');
  } else if (file === 'components/landing-page.jsx') {
    content = content.replace('<div className="overflow-hidden text-slate-850 relative">', '<div className="overflow-hidden bg-midnight text-white">');
    content = content.replace(LIGHT_GRADIENT_DIV, '');
  }

  fs.writeFileSync(file, content);
});

// also revert globals.css
let css = fs.readFileSync('app/globals.css', 'utf8');
css = css.replace(/body \{\n  background-color: transparent;\n  color: #0f172a;\n\}/g, 'body {\n  background-color: transparent;\n  color: #ffffff;\n}');
fs.writeFileSync('app/globals.css', css);

console.log('Reverted backgrounds successfully!');
