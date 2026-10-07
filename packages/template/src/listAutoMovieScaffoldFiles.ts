import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Directory names the scaffold never ships, whatever a host leaves there.
 *
 * A generated project installs its own dependencies and builds its own
 * caches, so anything under these names is a working artifact of whoever ran a
 * tool inside the scaffold directory rather than something the scaffold means
 * to hand over. Naming them here is what makes the shipped set a fact the code
 * decides instead of a fact the disk decides.
 */
const UNSHIPPED_DIRECTORIES = new Set([".cache", ".git", "node_modules"]);

/**
 * Compiler outputs are never authored scaffold inputs.
 *
 * All executable scaffold sources are TypeScript under src. A prior local
 * compilation must not add emitted modules, maps or declarations to the next
 * generated project. There are no filename-specific JavaScript exceptions.
 */
const UNSHIPPED_FILES =
  /(?:\.(?:c|m)?js(?:\.map)?|\.d\.(?:c|m)?ts|\.tsbuildinfo)$/u;

/**
 * Every shipped file under `root`, root-relative, in deterministic sorted
 * order.
 *
 * Walking without exclusions made the scaffold's contents whatever happened to
 * be sitting in its directory: a `ttsc` lint cache under
 * `scaffold/node_modules/.cache` rode into every generated project, and did it
 * silently, because a clean CI checkout has no such directory and the gate
 * never saw it.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Decides the shipped scaffold inventory from code rather than from whatever a host left in the directory.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Lists the authored scaffold sources in host-independent code-unit order before derivation.
 * @author Samchon
 */
export const listAutoMovieScaffoldFiles = (root: string): string[] => {
  const out: string[] = [];
  const walk = (dir: string): void => {
    // Code-unit order, not localeCompare: the file listing must be identical
    // on every host (localeCompare varies with host locale/ICU build).
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => Number(a.name > b.name) - Number(a.name < b.name));
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (UNSHIPPED_DIRECTORIES.has(entry.name)) continue;
        walk(full);
      } else if (entry.isFile()) {
        const relative = path.relative(root, full);
        if (UNSHIPPED_FILES.test(entry.name) === false) out.push(relative);
      }
    }
  };
  walk(root);
  return out;
};
