// Copies the design system's src/ into src/design-system/tailor-brands/ and records the source commit.
//   npm run ds:sync [-- /path/to/tailor-brands-design-system]
// Source lookup: CLI arg, then $DS_PATH, then ../tailor-brands-design-system, then ../moragron/tailor-brands-design-system.
// Skipped, as the design system's tb-ds-build-ui skill says: main.tsx, App.tsx, pages/, tokens/, patterns/, *.stories.tsx.
// The copied folder is replaced wholesale on every run: never edit it by hand.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const candidates = [process.argv[2], process.env.DS_PATH, join(root, '../tailor-brands-design-system'), join(root, '../moragron/tailor-brands-design-system')].filter(Boolean);
const source = candidates.map((p) => resolve(p)).find((p) => existsSync(join(p, 'src/index.ts')));
if (!source) {
  console.error('Design system not found. Clone Moragron/tailor-brands-design-system next to this repo or pass its path.');
  process.exit(1);
}

const dest = join(root, 'src/design-system/tailor-brands');
const skipDirs = new Set(['pages', 'tokens', 'patterns']);
const skipFiles = new Set(['main.tsx', 'App.tsx']);

rmSync(dest, { recursive: true, force: true });
cpSync(join(source, 'src'), dest, {
  recursive: true,
  filter: (src) => {
    const rel = src.slice(join(source, 'src').length + 1);
    if (!rel) return true;
    const name = basename(src);
    if (/\.stories\.tsx?$/.test(name)) return false;
    if (!rel.includes('/') && (skipDirs.has(name) || skipFiles.has(name))) return false;
    return true;
  },
});

const git = (cmd) => {
  try { return execSync(`git ${cmd}`, { cwd: source }).toString().trim(); } catch { return 'unknown'; }
};
const { version } = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
const commit = git('rev-parse HEAD');
writeFileSync(join(dest, 'SOURCE.md'), `# Design system source

Copied by \`npm run ds:sync\`. Do not edit anything in this folder: the next sync replaces it.

- Repository: https://github.com/Moragron/tailor-brands-design-system
- Version: ${version}
- Commit: ${commit}
- Skipped: main.tsx, App.tsx, pages/, tokens/, patterns/, *.stories.tsx
`);
console.log(`design system v${version} @ ${commit.slice(0, 7)} → src/design-system/tailor-brands/`);
