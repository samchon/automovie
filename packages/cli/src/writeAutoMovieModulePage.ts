import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Write a one-script page over a subject module into a scratch folder of the production, with the Vite configuration and public folder the production's own page uses, for the draw page and the inspector page alike.
 *
 * The folder is `<root>/node_modules/.cache/automovie/<kind>-<pid>-<time>`, inside the production so the page's bare imports resolve from the production's own dependencies. It holds an `index.html` with `body` and a `main.js` whose text `script` writes from the module's import specifier, a path relative to the folder with the module's own extension, so the page imports exactly the named file even where a compiled `.js` lies beside it. `configFile` is the production's `vite.config.ts` when it has one, and `publicDir` its `public` folder when it has one, `false` otherwise.
 *
 * It throws naming the module when the module does not exist, before anything is written.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the page is written and why, what it holds, what the specifier is, what the configuration fields hold, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Node resolves a bare import from the importing file's folder upward, so a page written inside the production imports the production's installed packages; Vite compiles a relative import of a `.ts` file named with its extension, and the extension keeps resolution from preferring a stale `.js` beside it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check, write two files, report the folder and its configuration; what the page runs is the caller's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The production's own page and configuration file are only read, never changed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two small writes and three existence checks.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One page per host.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned `remove` deletes the folder; the caller owns it from the return on.
 */
export function writeAutoMovieModulePage(props: {
  /** The production's root folder. */
  root: string;

  /** Path of the subject module, relative to `root` or absolute. */
  module: string;

  /** A short name for the page, the start of the scratch folder's name, such as `draw` or `inspect`. */
  kind: string;

  /** The page's title. */
  title: string;

  /** The body's markup before the script. */
  body: string;

  /** The text of `main.js`, given the module's import specifier. */
  script: (specifier: string) => string;
}): {
  /** The scratch folder, the page's Vite root. */
  folder: string;

  /** The production's `vite.config.ts`, or `false` when it has none. */
  configFile: string | false;

  /** The production's `public` folder, or `false` when it has none. */
  publicDir: string | false;

  /** Delete the scratch folder. */
  remove: () => void;
} {
  const module: string = path.resolve(props.root, props.module);
  if (!fs.existsSync(module))
    throw new Error(`The subject module ${module} does not exist`);

  const folder: string = path.join(
    props.root,
    "node_modules",
    ".cache",
    "automovie",
    `${props.kind}-${process.pid}-${Date.now()}`,
  );
  fs.mkdirSync(folder, { recursive: true });
  const relative: string = path
    .relative(folder, module)
    .split(path.sep)
    .join("/");
  fs.writeFileSync(
    path.join(folder, "index.html"),
    `<!doctype html>\n<html><head><meta charset="utf-8" /><title>${props.title}</title></head><body>${props.body}<script type="module" src="./main.js"></script></body></html>\n`,
  );
  fs.writeFileSync(
    path.join(folder, "main.js"),
    props.script(relative.startsWith(".") ? relative : `./${relative}`),
  );

  const config: string = path.join(props.root, "vite.config.ts");
  const publicDir: string = path.join(props.root, "public");
  return {
    folder,
    configFile: fs.existsSync(config) ? config : false,
    publicDir: fs.existsSync(publicDir) ? publicDir : false,
    remove: (): void => fs.rmSync(folder, { recursive: true, force: true }),
  };
}
