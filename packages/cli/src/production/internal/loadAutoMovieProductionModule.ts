import { createRequire } from "node:module";
import * as path from "node:path";

/*
 * Load a package as the production at `root` resolves it, for the capture
 * host's optional peers: `@automovie/render`, `vite`, `playwright-core` and
 * `ffmpeg-static`.
 *
 * The command itself depends on none of them, so `npx automovie create`
 * installs nothing a capture needs. Resolve dependencies from the production in
 * order to diagnose a missing package or an installed module that fails to
 * initialize. Preserve the original failure as the cause.
 * Parameter root: The production's folder.
 * Parameter id: The package to load.
 * Returns: The package's exports, typed by the module's declared type T.
 */
export function loadAutoMovieProductionModule<T = unknown>(
  root: string,
  id: string,
): T {
  const load: NodeJS.Require = createRequire(path.join(root, "package.json"));
  try {
    return load(id);
  } catch (error) {
    let resolved: string;
    try {
      resolved = load.resolve(id);
    } catch {
      throw new Error(
        `${id} is not installed in ${root}. Add it to the production's dependencies.`,
        { cause: error },
      );
    }
    throw new Error(`Could not load ${id} at ${resolved}`, { cause: error });
  }
}
