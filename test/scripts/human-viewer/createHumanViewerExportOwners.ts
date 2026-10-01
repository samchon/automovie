import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo";
import { resolveHumanViewerImport } from "./resolveHumanViewerImport";

interface IExports {
  declared: Set<string>;
  named: Map<string, { specifier: string; original: string | null }>;
  spaces: Map<string, string>;
  stars: string[];
}

const DECLARED =
  /\bexport\s+(?:declare\s+)?(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(?:function\*?|class|const|let|var|interface|type|enum|namespace)\s+([\w$]+)/g;
const LISTED = /\bexport\s+(?:type\s+)?\{([^}]*)\}\s*(?:from\s*["']([^"']+)["'])?/g;
const STARRED = /\bexport\s+\*\s*(?:as\s+([\w$]+)\s*)?from\s*["']([^"']+)["']/g;

/**
 * The function that names the file declaring an exported name, following the
 * barrel files that re-export it, or `null` when the name cannot be traced.
 *
 * A barrel such as `packages/human/src/index.ts` lists every module of the
 * package; an import of one name from it depends on the module that declares
 * that name, not on the whole list. Following `export { name } from`,
 * `export { name as other } from`, `export * as name from` and
 * `export * from` lets a digest ignore the modules the importer never named.
 * A declaration or a local `export { name }` makes the file its own owner.
 * Each file's export table is read once and each answer is remembered, so a
 * package index with hundreds of `export *` lines costs one pass, and a cycle
 * ends its branch with `null`, which makes the caller depend on the whole file.
 */
export function createHumanViewerExportOwners(props: {
  root: string;
  io: IHumanViewerResolveIo & { read(file: string): string | undefined };
}): (file: string, name: string) => string | null {
  const tables = new Map<string, IExports | null>();
  const answers = new Map<string, string | null>();
  const table = (file: string): IExports | null => {
    if (tables.has(file)) return tables.get(file)!;
    const text = props.io.read(file);
    if (text === undefined) {
      tables.set(file, null);
      return null;
    }
    const found: IExports = {
      declared: new Set(),
      named: new Map(),
      spaces: new Map(),
      stars: [],
    };
    for (const match of text.matchAll(DECLARED)) found.declared.add(match[1]!);
    for (const match of text.matchAll(LISTED))
      for (const item of match[1]!.split(",")) {
        const [original, exposed] = item
          .replace(/^\s*type\s+/, "")
          .split(/\s+as\s+/)
          .map((part) => part.trim());
        if (original === undefined || original === "") continue;
        if (match[2] === undefined) found.declared.add(exposed ?? original);
        else
          found.named.set(exposed ?? original, {
            specifier: match[2],
            original,
          });
      }
    for (const match of text.matchAll(STARRED))
      if (match[1] === undefined) found.stars.push(match[2]!);
      else found.spaces.set(match[1], match[2]!);
    tables.set(file, found);
    return found;
  };
  const owner = (file: string, name: string): string | null => {
    const key = `${file}\0${name}`;
    if (answers.has(key)) return answers.get(key)!;
    // A cycle reaching this question again answers null instead of looping.
    answers.set(key, null);
    const exported = table(file);
    let found: string | null = null;
    if (exported !== null) {
      const named = exported.named.get(name);
      const space = exported.spaces.get(name);
      if (exported.declared.has(name)) found = file;
      else if (named !== undefined) {
        const target = resolveHumanViewerImport(named.specifier, file, props);
        found = target === null ? null : owner(target, named.original!);
      } else if (space !== undefined)
        found = resolveHumanViewerImport(space, file, props);
      else
        for (const star of exported.stars) {
          const target = resolveHumanViewerImport(star, file, props);
          const candidate = target === null ? null : owner(target, name);
          if (candidate !== null) {
            found = candidate;
            break;
          }
        }
    }
    answers.set(key, found);
    return found;
  };
  return owner;
}
