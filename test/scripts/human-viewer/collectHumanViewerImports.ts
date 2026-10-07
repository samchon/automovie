import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo";
import { createHumanViewerExportOwners } from "./createHumanViewerExportOwners";
import { resolveHumanViewerImport } from "./resolveHumanViewerImport";

const FROM =
  /\b(?:import|export)\s+(?:type\s+)?([^;'"()]*?)\s*from\s*["']([^"']+)["']/g;
const OTHER = new RegExp(
  [
    String.raw`\bimport\s*["']([^"']+)["']`,
    String.raw`\bimport\(\s*["']([^"']+)["']\s*\)`,
    String.raw`\bnew\s+(?:Shared)?Worker\(\s*new\s+URL\(\s*["']([^"']+)["']`,
    String.raw`\bnew\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url`,
  ].join("|"),
  "g",
);

/**
 * Every source file the given entries read, the entries included, by
 * following static imports, re-exports, dynamic imports of a string, and
 * worker or asset URLs built against `import.meta.url`.
 *
 * The result is what a build can depend on, so a digest of it changes exactly
 * when something the entries load changes, and an edit to any other file
 * does not. An import of named exports depends on the files that declare
 * those names, found through the barrels that re-export them, so importing
 * one export of a package index does not depend on the package's other
 * modules. A default, namespace, side-effect or `export *` import, and a name
 * that cannot be traced, depend on the whole target. Type-only imports count,
 * because a validator generated from a type is part of the runtime. A
 * specifier that leaves the repository's own source, or a file that cannot be
 * read, ends its branch. The list is sorted, so equal graphs give equal lists.
 */
export function collectHumanViewerImports(props: {
  entries: readonly string[];
  root: string;
  io: IHumanViewerResolveIo & { read(file: string): string | undefined };
}): string[] {
  // Prose in a comment can spell an import; only code decides a dependency.
  const code = new Map<string, string | undefined>();
  const io = {
    exists: props.io.exists,
    read: (file: string): string | undefined => {
      if (!code.has(file)) {
        const text = props.io.read(file);
        code.set(
          file,
          text?.replace(/\/\*[\s\S]*?\*\/|(?<![:"'`])\/\/[^\n]*/g, " "),
        );
      }
      return code.get(file);
    },
  };
  const owner = createHumanViewerExportOwners({ root: props.root, io });
  const seen = new Set<string>();
  const pending = [...props.entries];
  while (pending.length !== 0) {
    const file = pending.pop()!;
    if (seen.has(file)) continue;
    const text = io.read(file);
    if (text === undefined) continue;
    seen.add(file);
    if (!/\.(ts|mts|cts|tsx|js|mjs)$/.test(file)) continue;
    for (const match of text.matchAll(FROM)) {
      const target = resolveHumanViewerImport(match[2]!, file, props);
      if (target === null) continue;
      const clause = /^\{([\s\S]*)\}$/.exec(match[1]!.trim());
      const names =
        clause === null
          ? null
          : clause[1]!
              .split(",")
              .map((item) =>
                item
                  .replace(/^\s*type\s+/, "")
                  .split(/\s+as\s+/)[0]!
                  .trim(),
              )
              .filter((name) => name !== "");
      if (names === null || names.length === 0) pending.push(target);
      else
        for (const name of names) pending.push(owner(target, name) ?? target);
    }
    for (const match of text.matchAll(OTHER)) {
      const specifier = match[1] ?? match[2] ?? match[3] ?? match[4];
      if (specifier === undefined) continue;
      const target = resolveHumanViewerImport(specifier, file, props);
      if (target !== null) pending.push(target);
    }
  }
  return [...seen].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
