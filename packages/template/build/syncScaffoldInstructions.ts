// Copy the repository's production-neutral instructions into the scaffold,
// so a generated production inherits them verbatim instead of a hand copy.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const HERE: string = __dirname;
const ROOT: string = resolve(HERE, "../../..");
const SCAFFOLD: string = resolve(HERE, "../scaffold");

/**
 * Repository instruction files a production shares unchanged, with explicit
 * source and destination paths. Only content without repository-specific links
 * belongs here; the scaffold owns every other instruction it ships. The copies
 * are ignored by git, so the root `.gitignore` lists their destination paths.
 */
const SHARED: readonly { source: string; destination: string }[] = [
  {
    source: ".agents/skills/development/repair.md",
    destination: ".agents/skills/development/repair.md",
  },
  {
    source: ".agents/skills/documentation/writing.md",
    destination: ".agents/skills/development/writing.md",
  },
];

for (const entry of SHARED) {
  const source: string = resolve(ROOT, entry.source);
  const destination: string = resolve(SCAFFOLD, entry.destination);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}
console.log(`synced ${SHARED.length} scaffold instruction paths`);
