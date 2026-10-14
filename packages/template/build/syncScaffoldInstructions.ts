// Copy the repository's production-neutral instructions into the scaffold,
// so a generated production inherits them verbatim instead of a hand copy.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const HERE: string = __dirname;
const ROOT: string = resolve(HERE, "../../..");
const SCAFFOLD: string = resolve(HERE, "../scaffold");

/**
 * Repository instruction files a production shares unchanged, as
 * `[repository path, scaffold path]` pairs relative to their roots. Only
 * files without repository-specific links belong here; the scaffold owns
 * every other instruction it ships.
 */
const SHARED: readonly (readonly [string, string])[] = [
  [
    ".agents/skills/3d-modeling/SKILL.md",
    ".agents/skills/3d-modeling/SKILL.md",
  ],
  [".agents/skills/contracts/common.md", ".agents/skills/contracts/common.md"],
];

for (const [source, target] of SHARED) {
  const destination: string = resolve(SCAFFOLD, target);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(resolve(ROOT, source), destination);
}
console.log(`synced ${SHARED.length} scaffold instruction files`);
