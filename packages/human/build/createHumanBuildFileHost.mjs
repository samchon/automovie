import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { replaceHumanBuildFile } from './replaceHumanBuildFile.mjs';

/**
 * Native file effects for staged Human output and rollback. The real package
 * directory bounds every path, and linked descendants refuse publication.
 * Windows watchers may retain directory handles, so only individual files
 * are renamed. Empty output directories remain ordinary harmless containers.
 * This is atomic per file, not an atomic import graph; the build lock covers
 * both compiler passes and publication for candidate admission.
 *
 * @param {string} directory Physical owning package directory.
 * @returns {import('./IHumanBuildFileHost').IHumanBuildFileHost}
 */
export function createHumanBuildFileHost(directory) {
  const inside = (candidate) => {
    const resolved = path.resolve(candidate);
    const relative = path.relative(directory, resolved);
    if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative))
      throw new Error('Human file publication refuses a path outside its owning package: ' + candidate);
    for (let entry = resolved; entry !== directory; entry = path.dirname(entry))
      if (fs.existsSync(entry) && fs.lstatSync(entry).isSymbolicLink())
        throw new Error('Human file publication refuses a linked path: ' + entry);
    return resolved;
  };
  return {
    files(root) {
      const base = inside(root);
      const files = [];
      const walk = (current) => {
        if (!fs.existsSync(current)) return;
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
          const file = inside(path.join(current, entry.name));
          if (entry.isDirectory()) walk(file);
          else if (entry.isFile()) files.push({
            file: path.relative(base, file),
            digest: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
          });
          else throw new Error('Human output contains a non-ordinary file: ' + file);
        }
      };
      walk(base);
      return files.sort((left, right) => left.file < right.file ? -1 : left.file > right.file ? 1 : 0);
    },
    replace(source, output, file) {
      const from = inside(path.join(source, file));
      const target = inside(path.join(output, file));
      fs.mkdirSync(inside(path.dirname(target)), { recursive: true });
      const temporary = inside(path.join(path.dirname(target), '.human-publish-' + randomUUID() + '.tmp'));
      replaceHumanBuildFile({
        reserve: () => {
          const handle = fs.openSync(temporary, 'wx');
          return () => fs.closeSync(handle);
        },
        copy: () => fs.copyFileSync(from, temporary),
        publish: () => fs.renameSync(temporary, target),
        discard: () => fs.rmSync(temporary, { force: true }),
      });
    },
    remove(output, file) { fs.unlinkSync(inside(path.join(output, file))); },
  };
}
