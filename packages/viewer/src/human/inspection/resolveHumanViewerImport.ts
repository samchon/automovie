import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo.js";
import type { IHumanViewerRevisionReadIo } from "./IHumanViewerRevisionReadIo.js";

const SOURCE = [".ts", ".mts", ".cts", ".tsx", ".js", ".mjs", ".json", ".wasm"];

/**
 * The source file an import specifier names, or `null` for a module outside
 * the repository's own source (a registry package, a Node built-in).
 *
 * A relative specifier is tried as written, then with each source extension,
 * then as a folder index, and a written `.js`, `.mjs` or `.cjs` also stands for
 * the TypeScript module of the same emitted kind. Workspace imports select
 * the actual package manifest's exact or most-specific pattern export, then
 * its ordered Node/import/default conditions. These are source-graph consumers:
 * the numerical Node realm uses those conditions and the inspection browser's
 * explicit Human source aliases currently select the same declared source.
 * Normal Playground browser/library receipts have their own input authority.
 * Browser-only exports are not silently guessed into a private source leaf.
 * With no export map, only the declared root main entry is supported. Public
 * assets and compiled targets retain their declared path and bytes as well.
 * Paths are forward-slash and absolute; an unavailable target returns null.
 *
 * @evidence contracts/common.md#principled-implementation Relative module kinds retain their emitted extension mapping, while workspace ownership follows the actual declared export and ordered active Node conditions.
 * @evidence contracts/common.md#clear-and-simple-design One resolver separates relative-source probing from public manifest selection without a private-package leaf fallback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing, blocked or unsupported public targets remain unknown; an existing private file cannot override the package's declared route.
 * @evidence contracts/common.md#meaningful-documentation States the current inspection source consumers, separate normal browser authority, manifest selection and actual target ownership.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Supported relative and workspace specifiers probe actual source and emitted-extension candidates through the supplied filesystem authority.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor One existence-based resolver supplies the revision graph with a shared path and extension convention.
 */
export function resolveHumanViewerImport(
  specifier: string,
  from: string,
  props: { root: string; io: IHumanViewerResolveIo & IHumanViewerRevisionReadIo },
): string | null {
  const stem = (base: string): string | null => {
    const written = base.replace(/\.(mjs|cjs|js)$/, "");
    const emitted = base.endsWith(".mjs") ? [".mts"] : base.endsWith(".cjs") ? [".cts"] : [".ts", ".tsx"];
    const forms = [
      base,
      ...(written === base ? SOURCE.map((extension) => base + extension) : []),
      ...(written === base
        ? []
        : emitted.map((extension) => written + extension)),
      ...(written === base ? SOURCE.map((extension) => `${base}/index${extension}`) : []),
    ];
    return forms.find((form) => props.io.exists(form)) ?? null;
  };
  if (specifier.startsWith(".")) {
    const parts = from.split("/").slice(0, -1);
    for (const part of specifier.split("/")) {
      if (part === "..") parts.pop();
      else if (part !== ".") parts.push(part);
    }
    return stem(parts.join("/"));
  }
  const workspace = /^@automovie\/([^/]+)(?:\/(.+))?$/.exec(specifier);
  if (workspace === null) return null;
  const base = `${props.root}/packages/${workspace[1]}`;
  const manifestFile = `${base}/package.json`;
  if (!props.io.exists(manifestFile)) return null;
  const text = props.io.read(manifestFile);
  if (text === undefined) return null;
  let manifest: Record<string, unknown>;
  try { manifest = JSON.parse(text) as Record<string, unknown>; }
  catch { return null; }
  const key = workspace[2] === undefined ? "." : `./${workspace[2]}`;
  const choose = (value: unknown): string | null | undefined => {
    if (typeof value === "string") return value;
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
    for (const [condition, target] of Object.entries(value))
      if (condition === "node" || condition === "import" || condition === "default") {
        const selected = choose(target);
        if (selected !== undefined) return selected;
      }
    return undefined;
  };
  let target: string | null;
  if (manifest.exports === undefined) {
    if (key !== "." || typeof manifest.main !== "string") return null;
    target = manifest.main.startsWith("./") ? manifest.main : "./" + manifest.main;
  } else {
    const exports = manifest.exports;
    if (exports !== null && typeof exports === "object" && !Array.isArray(exports) &&
        Object.keys(exports).some((name) => name.startsWith("."))) {
      const entries = exports as Record<string, unknown>;
      if (Object.hasOwn(entries, key)) target = choose(entries[key]) ?? null;
      else {
        const pattern = Object.keys(entries).filter((name) => {
          const star = name.indexOf("*");
          return star !== -1 && key.startsWith(name.slice(0, star)) &&
            key.endsWith(name.slice(star + 1)) && key.length >= name.length - 1;
        }).sort((left, right) => right.indexOf("*") - left.indexOf("*") || right.length - left.length)[0];
        if (pattern === undefined) return null;
        const star = pattern.indexOf("*");
        const matched = key.slice(star, key.length - (pattern.length - star - 1));
        target = choose(entries[pattern]) ?? null;
        if (target !== null) target = target.replaceAll("*", matched);
      }
    } else target = key === "." ? choose(exports) ?? null : null;
  }
  if (target === null || !target.startsWith("./") || target.includes("\\")) return null;
  const segments = target.slice(2).split("/");
  if (segments.some((segment) => segment === "." || segment === ".." || segment === "node_modules")) return null;
  const selected = `${base}/${target.slice(2)}`;
  return props.io.exists(selected) ? selected : null;
}
