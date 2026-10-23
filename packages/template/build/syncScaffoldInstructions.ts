// Copy the repository's production-neutral instructions into the scaffold,
// so a generated production inherits them verbatim instead of a hand copy.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const HERE: string = __dirname;
const ROOT: string = resolve(HERE, "../../..");
const SCAFFOLD: string = resolve(HERE, "../scaffold");

/**
 * Repository instruction files a production shares unchanged, relative to both
 * roots. Only content without repository-specific links belongs here; the
 * scaffold owns every other instruction it ships. The copies are ignored by
 * git, so the root `.gitignore` lists the same paths.
 */
const SHARED: readonly string[] = [
  ".agents/skills/development/repair.md",
  ".agents/skills/documentation/writing.md",
];

for (const path of SHARED) {
  const source: string = resolve(ROOT, path);
  const destination: string = resolve(SCAFFOLD, path);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}
console.log(`synced ${SHARED.length} scaffold instruction paths`);
