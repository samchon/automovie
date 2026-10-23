import fs from "node:fs";
import path from "node:path";

import { resolveProductionPhysicalPath } from "./resolveProductionPhysicalPath";

/** Captures protected link targets and optional regular-file metadata without reading bytes. */
export function collectProductionAuthoredBoundaries(
  location: string,
  capture: (logical: string, physical: string) => void = (): void => {},
  file?: (
    logical: string,
    physical: string,
    metadata: fs.BigIntStats,
  ) => void,
): string[] {
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
    roots.map((directory: string): string =>
      resolveProductionPhysicalPath(directory),
    ),
  );
  const visited: Set<string> = new Set();
  const walk: (directory: string) => void = (directory: string): void => {
    const physical: string = resolveProductionPhysicalPath(directory);
    capture(directory, physical);
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
      const physicalEntry: string = path.join(physical, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.isSymbolicLink()) {
        const physicalTarget: string = resolveProductionPhysicalPath(target);
        capture(target, physicalTarget);
        boundaries.add(physicalTarget);
        try {
          const metadata: fs.BigIntStats = fs.statSync(physicalTarget, {
            bigint: true,
          });
          if (metadata.isDirectory()) walk(target);
          else if (metadata.isFile()) file?.(target, physicalTarget, metadata);
        } catch (error) {
          if (!missing(error)) throw error;
        }
      } else if (entry.isFile() && file !== undefined) {
        const metadata: fs.BigIntStats = fs.statSync(physicalEntry, {
          bigint: true,
        });
        if (!metadata.isFile())
          throw new Error("A protected input changed type during capture.");
        file(target, physicalEntry, metadata);
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
    ["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")
  );
}
