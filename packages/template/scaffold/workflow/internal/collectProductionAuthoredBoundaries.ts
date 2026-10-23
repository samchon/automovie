import fs from "node:fs";
import path from "node:path";

import { canonicalProductionPath } from "../canonicalProductionPath";

/** Collects protected roots and every nested link target without reading document bytes. */
export function collectProductionAuthoredBoundaries(location: string): string[] {
  const roots: string[] = [
    "docs/body",
    "docs/revision",
    "docs/naturalness",
    "docs/review",
    "docs/evidence",
    "docs/instructions",
    ".agents/skills/contracts/story",
  ].map((directory: string): string => path.resolve(location, directory));
  const boundaries: Set<string> = new Set(
    roots.map((directory: string): string => canonicalProductionPath(directory)),
  );
  const visited: Set<string> = new Set();
  const walk: (directory: string) => void = (directory: string): void => {
    const physical: string = canonicalProductionPath(directory);
    if (visited.has(physical)) return;
    visited.add(physical);
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      if (missing(error)) return;
      throw error;
    }
    for (const entry of entries) {
      const target: string = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.isSymbolicLink()) {
        boundaries.add(canonicalProductionPath(target));
        try {
          if (fs.statSync(target).isDirectory()) walk(target);
        } catch (error) {
          if (!missing(error)) throw error;
        }
      }
    }
  };
  for (const root of roots) walk(root);
  return [...boundaries];
}

/** Treats absent future documents as empty while preserving permission and loop failures. */
function missing(error: unknown): boolean {
  return (
    error instanceof Error &&
    ["ENOENT", "ENOTDIR"].includes(
      (error as NodeJS.ErrnoException).code ?? "",
    )
  );
}
