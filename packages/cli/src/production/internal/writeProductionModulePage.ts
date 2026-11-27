import * as fs from "node:fs";
import * as path from "node:path";

import type { AutoMovieCliProductionPageTypes } from "../AutoMovieCliProductionPageTypes";

/*
 * Write a one-script page over a subject module into a scratch folder of the
 * production, with the Vite configuration and public folder the production's
 * own page uses, for the draw page and the inspector page alike.
 *
 * The folder is `<root>/node_modules/.cache/automovie/<kind>-<pid>-<time>`,
 * inside the production so the page's bare imports resolve from the
 * production's own dependencies. It holds an `index.html` with `body` and a
 * `main.js` whose text `script` writes from the module's import specifier, a
 * path relative to the folder with the module's own extension, so the page
 * imports exactly the named file even where a compiled `.js` lies beside it.
 * `configFile` is the production's `vite.config.ts` when it has one, and
 * `publicDir` its `public` folder when it has one, `false` otherwise.
 *
 * It throws naming the module when the module does not exist, before anything
 * is written.
 */
export function writeProductionModulePage(
  props: AutoMovieCliProductionPageTypes.WriteProps,
): AutoMovieCliProductionPageTypes.WrittenPage {
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
