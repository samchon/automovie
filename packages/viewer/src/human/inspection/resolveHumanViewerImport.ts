import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo.js";
import type { IHumanViewerRevisionReadIo } from "./IHumanViewerRevisionReadIo.js";

const SOURCE: readonly string[] = [".ts", ".mts", ".cts", ".tsx", ".js", ".mjs", ".json", ".wasm"];

/**
 * The source file an import specifier names, or `null` for a module outside the repository's own source (a registry package, a Node built-in).
 *
 * A relative specifier is tried as written, then with each source extension, then as a folder index, and a written `.js`, `.mjs` or `.cjs` also stands for the TypeScript module of the same emitted kind. Workspace imports select the actual package manifest's exact or most-specific pattern export, then its ordered Node/import/default conditions. These are source-graph consumers: the numerical Node realm uses those conditions and the inspection browser's explicit Human source aliases currently select the same declared source. Normal Playground browser/library receipts have their own input authority. Browser-only exports are not silently guessed into a private source leaf. With no export map, only the declared root main entry is supported. Public assets and compiled targets retain their declared path and bytes as well. Paths are forward-slash and absolute; an unavailable target returns null.
 *
 * @evidence contracts/common.md#principled-implementation Resolves relative source forms and workspace manifest exact/pattern exports under ordered node/import/default conditions, rejecting unsupported external or unavailable paths.
 * @evidence contracts/common.md#clear-and-simple-design Source-form lookup and manifest target selection remain in one source-graph resolver; the actual dependency collector owns traversal and byte hashing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registry modules and browser-only targets are not guessed into convenient repository leaves; export arrays are unsupported and this adapter is not a general Node resolver.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies supported extensions, emitted-kind mapping, workspace conditions and physical target availability limitations.
 * @evidence contracts/performance.md#efficient-algorithms Relative resolution tries a fixed extension list; workspace selection scans and sorts matching export patterns and parses manifest bytes, with work driven by manifest size and export count.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied IO records manifest/source dependencies; completed graph reuse belongs to revision ownership and this resolver holds no independent path memo.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only temporary path strings and manifest objects are allocated; file reads and physical path ownership remain with the supplied IO and no handle is retained.
 */
export function resolveHumanViewerImport(
  specifier: string,
  from: string,
  props: { root: string; io: IHumanViewerResolveIo & IHumanViewerRevisionReadIo },
): string | null {
  const stem: (base: string) => string | null = (base: string): string | null => {
    const written: string = base.replace(/\.(mjs|cjs|js)$/, "");
    const emitted: string[] = base.endsWith(".mjs") ? [".mts"] : base.endsWith(".cjs") ? [".cts"] : [".ts", ".tsx"];
    const forms: string[] = [
      base,
      ...(written === base ? SOURCE.map((extension: string): string => base + extension) : []),
      ...(written === base
        ? []
        : emitted.map((extension: string): string => written + extension)),
      ...(written === base ? SOURCE.map((extension: string): string => `${base}/index${extension}`) : []),
    ];
    return forms.find((form: string): boolean => props.io.exists(form)) ?? null;
  };
  if (specifier.startsWith(".")) {
    const parts: string[] = from.split("/").slice(0, -1);
    for (const part of specifier.split("/")) {
      if (part === "..") parts.pop();
      else if (part !== ".") parts.push(part);
    }
    return stem(parts.join("/"));
  }
  const workspace: RegExpExecArray | null = /^@automovie\/([^/]+)(?:\/(.+))?$/.exec(specifier);
  if (workspace === null) return null;
  const base: string = `${props.root}/packages/${workspace[1]}`;
  const manifestFile: string = `${base}/package.json`;
  if (!props.io.exists(manifestFile)) return null;
  const text: string | undefined = props.io.read(manifestFile);
  if (text === undefined) return null;
  let manifest: Record<string, unknown>;
  try { manifest = JSON.parse(text) as Record<string, unknown>; }
  catch { return null; }
  const key: string = workspace[2] === undefined ? "." : `./${workspace[2]}`;
  const choose: (value: unknown) => string | null | undefined = (value: unknown): string | null | undefined => {
    if (typeof value === "string") return value;
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
    for (const [condition, target] of Object.entries(value))
      if (condition === "node" || condition === "import" || condition === "default") {
        const selected: string | null | undefined = choose(target);
        if (selected !== undefined) return selected;
      }
    return undefined;
  };
  let target: string | null;
  if (manifest.exports === undefined) {
    if (key !== "." || typeof manifest.main !== "string") return null;
    target = manifest.main.startsWith("./") ? manifest.main : "./" + manifest.main;
  } else {
    const exports: unknown = manifest.exports;
    if (exports !== null && typeof exports === "object" && !Array.isArray(exports) &&
        Object.keys(exports).some((name: string): boolean => name.startsWith("."))) {
      const entries: Record<string, unknown> = exports as Record<string, unknown>;
      if (Object.hasOwn(entries, key)) target = choose(entries[key]) ?? null;
      else {
        const pattern: string | undefined = Object.keys(entries).filter((name: string): boolean => {
          const star: number = name.indexOf("*");
          return star !== -1 && key.startsWith(name.slice(0, star)) &&
            key.endsWith(name.slice(star + 1)) && key.length >= name.length - 1;
        }).sort((left: string, right: string): number => right.indexOf("*") - left.indexOf("*") || right.length - left.length)[0];
        if (pattern === undefined) return null;
        const star: number = pattern.indexOf("*");
        const matched: string = key.slice(star, key.length - (pattern.length - star - 1));
        target = choose(entries[pattern]) ?? null;
        if (target !== null) target = target.replaceAll("*", matched);
      }
    } else target = key === "." ? choose(exports) ?? null : null;
  }
  if (target === null || !target.startsWith("./") || target.includes("\\")) return null;
  const segments: string[] = target.slice(2).split("/");
  if (segments.some((segment: string): boolean => segment === "." || segment === ".." || segment === "node_modules")) return null;
  const selected: string = `${base}/${target.slice(2)}`;
  return props.io.exists(selected) ? selected : null;
}
