// Copy the repository's production-neutral instructions into the scaffold,
// so a generated production inherits them verbatim instead of a hand copy.
import { copyFileSync, cpSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const HERE: string = __dirname;
const ROOT: string = resolve(HERE, "../../..");
const SCAFFOLD: string = resolve(HERE, "../scaffold");

/**
 * Repository instruction paths a production shares unchanged, relative to both
 * roots. A directory is mirrored whole, so files added to or removed from the
 * repository skill reach the scaffold without editing this list. Only content
 * without repository-specific links belongs here; the scaffold owns every other
 * instruction it ships. The copies are ignored by git, so the root `.gitignore`
 * lists the same paths.
 */
const SHARED: readonly string[] = [
  ".agents/skills/3d-modeling",
  ".agents/skills/contracts/common.md",
  ".agents/skills/contracts/testing.md",
  ".agents/skills/development/repair.md",
  ".agents/skills/documentation/writing.md",
];

for (const path of SHARED) {
  const source: string = resolve(ROOT, path);
  const destination: string = resolve(SCAFFOLD, path);
  if (statSync(source).isDirectory()) {
    // Removing first drops copies of files the repository skill deleted.
    rmSync(destination, { recursive: true, force: true });
    cpSync(source, destination, { recursive: true });
  } else {
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
  }
}
console.log(`synced ${SHARED.length} scaffold instruction paths`);
