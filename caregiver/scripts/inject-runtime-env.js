const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, '..', 'dist');
const indexPath = path.join(dist, 'index.html');
const envPath = path.join(dist, 'env.js');
const envScript = '<script src="/env.js"></script>';

if (!fs.existsSync(indexPath)) {
  throw new Error(`Missing ${indexPath}. Run expo export first.`);
}

let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes(envScript)) {
  const next = html.replace(/(<script src="\/_expo\/static\/js\/web\/entry-[^"]+" defer><\/script>)/, `${envScript}\n  $1`);
  if (next === html) {
    throw new Error('Could not find Expo entry script in dist/index.html.');
  }
  html = next;
  fs.writeFileSync(indexPath, html);
}

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(
    envPath,
    `window.__CARE_COMPANION_ENV__ = {
  EXPO_PUBLIC_API_URL: '',
};
`,
  );
}

console.log('Injected runtime env loader into dist/index.html');
