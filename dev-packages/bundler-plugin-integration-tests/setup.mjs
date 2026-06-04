/* eslint-disable no-console */
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Build the @sentry/bundler-plugins package and produce the tarball that the
// fixtures install via pnpm `file:` overrides.
const bundlerPluginsDir = join(__dirname, '..', '..', 'packages', 'bundler-plugins');
console.log('Building @sentry/bundler-plugins...');
execSync('yarn build', {
  cwd: bundlerPluginsDir,
  stdio: 'inherit',
});

// `npm pack` (run as part of the build) names the tarball after the current
// package version (e.g. `sentry-bundler-plugins-5.3.0.tgz`). The fixtures
// reference it via a version-independent `file:` override, so copy it to a
// stable name. This avoids having to update every fixture override whenever the
// package version changes.
const { version } = JSON.parse(await fs.readFile(join(bundlerPluginsDir, 'package.json'), { encoding: 'utf-8' }));
await fs.copyFile(
  join(bundlerPluginsDir, `sentry-bundler-plugins-${version}.tgz`),
  join(bundlerPluginsDir, 'sentry-bundler-plugins.tgz'),
);

console.log('Installing all dependencies for fixtures...');

const fixturesDir = join(__dirname, 'fixtures');
const entries = await fs.readdir(fixturesDir, { withFileTypes: true });

// Get all directories
const directories = entries.filter(entry => entry.isDirectory()).map(entry => join(fixturesDir, entry.name));

for (const dir of directories) {
  try {
    const pkgString = await fs.readFile(join(dir, 'package.json'), { encoding: 'utf-8' });
    const packageJson = JSON.parse(pkgString);
    // If there are no dependencies, skip installation
    if (!packageJson.dependencies) {
      continue;
    }
  } catch {
    continue;
  }

  execSync('pnpm install --force', {
    cwd: dir,
    stdio: 'inherit',
  });
}

console.log('All fixture dependencies installed successfully!');
