// Builds the app as a claude.ai Artifact: npm run artifact:build → dist/index.html + dist/assets/*
//
// Same app as `npm run build`, but with relative asset paths and an index.html shaped for the Artifact host:
// the host wraps the page in its own <!doctype>/<head>/<body>, so we keep only the title, the built CSS/JS tags
// and the root element. A small stamp at the bottom names the version, branch and commit. Modelled on the
// design-system repo's scripts/build-preview.mjs.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { build } from 'vite';

const root = resolve(new URL('..', import.meta.url).pathname);
const outDir = join(root, 'dist');

await build({ root, base: './', logLevel: 'warn', build: { outDir, emptyOutDir: true } });

const git = (cmd) => {
  try { return execSync(`git ${cmd}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return 'unknown'; }
};
const branch = git('rev-parse --abbrev-ref HEAD');
const commit = git('rev-parse --short HEAD');
const dirty = git('status --porcelain') ? ' + uncommitted changes' : '';
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const builtAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

const html = readFileSync(join(outDir, 'index.html'), 'utf8');
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]);
// Vite emits the script as type="module"; keep it, plus stylesheet and modulepreload links.
const assets = [
  ...pick(/<link\b[^>]*rel="stylesheet"[^>]*>/g),
  ...pick(/<link\b[^>]*rel="modulepreload"[^>]*>/g),
  ...pick(/<script\b[^>]*src="[^"]*"[^>]*><\/script>/g),
];

// The design system has no dark theme, so the page pins the light look and an explicit page background.
const page = `<title>Brand Starter Flow</title>
<style>
  :root { color-scheme: light; }
  html, body { background: var(--tb-color-surface-page); }
  .stamp { padding: var(--tb-space-4); text-align: center; color: var(--tb-color-text-muted); }
</style>
${assets.join('\n')}
<div id="root"></div>
<p class="stamp tb-caption">v${version} &middot; ${branch} @ ${commit}${dirty} &middot; built ${builtAt}</p>
`;
writeFileSync(join(outDir, 'index.html'), page);
console.log(`dist/ ready: v${version} · ${branch} @ ${commit}${dirty}`);
