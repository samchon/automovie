import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo";
const SOURCE = [".ts", ".mts", ".cts", ".tsx", ".js", ".mjs", ".json", ".wasm"];

/**
 * The source file an import specifier names, or `null` for a module outside
 * the repository's own source (a registry package, a Node built-in).
 *
 * A relative specifier is tried as written, then with each source extension,
 * then as a folder index, and a written `.js`, `.mjs` or `.cjs` also stands for
 * the TypeScript file that compiles to it. `@automovie/<name>` is that
 * workspace package's `src/index.ts`, and `@automovie/<name>/<path>` a file
 * under the package or under its `src`, the same aliases the development
 * server applies. Paths are forward-slash and absolute, `root` being the
 * repository root; the answer is never a guess, only a file that exists.
 */
export function resolveHumanViewerImport(
  specifier: string,
  from: string,
  props: { root: string; io: IHumanViewerResolveIo },
): string | null {
  const stem = (base: string): string | null => {
    const written = base.replace(/\.(mjs|cjs|js)$/, "");
    const forms = [
      base,
      ...SOURCE.map((extension) => base + extension),
      ...(written === base
        ? []
        : [".ts", ".mts", ".cts"].map((extension) => written + extension)),
      ...SOURCE.map((extension) => `${base}/index${extension}`),
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
  if (workspace[2] === undefined) return stem(`${base}/src/index`);
  return stem(`${base}/${workspace[2]}`) ?? stem(`${base}/src/${workspace[2]}`);
}
