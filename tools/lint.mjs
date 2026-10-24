import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {readdir} from 'node:fs/promises';

async function javascriptFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await javascriptFiles(path));
    else if (/\.(js|mjs)$/.test(entry.name)) files.push(path);
  }
  return files;
}

const files = await javascriptFiles('src');
files.push('tools/lint.mjs');
for (const file of files.filter(file => file.endsWith('.js') || file.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', file], {encoding: 'utf8'});
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}
for (const file of ['manifests/chromium.json', 'manifests/firefox.json', 'package.json']) {
  JSON.parse(await readFile(file, 'utf8'));
}
console.log(`syntax and JSON checks passed for ${files.length} files`);
