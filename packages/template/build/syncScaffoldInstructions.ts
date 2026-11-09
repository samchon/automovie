// Copy the repository skill items the scaffold's `$<name>` placeholders name
// into `lib/skills`, where the scaffold reader ships them in the placeholders'
// place, so a generated production inherits them verbatim instead of a hand copy.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { listAutoMovieScaffoldFiles } from "../src/listAutoMovieScaffoldFiles";
import { scaffoldSharedSkillPath } from "../src/scaffoldSharedSkillPath";

const HERE: string = __dirname;
const ROOT_SKILLS: string = resolve(HERE, "../../../.agents/skills");
const SCAFFOLD: string = resolve(HERE, "../scaffold/instructions");

// `lib/skills` is the directory `src/scaffoldSharedSkillDirectory.ts` reads;
// it is rebuilt whole so an item a placeholder no longer names cannot ship.
const DESTINATION: string = resolve(HERE, "../lib/skills");

rmSync(DESTINATION, { force: true, recursive: true });
let count: number = 0;
for (const relative of listAutoMovieScaffoldFiles(SCAFFOLD)) {
  const shared: string | null = scaffoldSharedSkillPath(relative);
  if (shared === null) continue;
  const destination: string = resolve(DESTINATION, shared);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(resolve(ROOT_SKILLS, shared), destination, { recursive: true });
  count++;
}
console.log(`synced ${count} shared scaffold skill items`);
