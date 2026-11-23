import { createRequire } from "node:module";
import * as path from "node:path";

/**
 * Load a package as the production at `root` resolves it, for the capture host's optional peers: `@automovie/render`, `vite`, `playwright-core` and `ffmpeg-static`.
 *
 * The command itself depends on none of them, so `npx automovie create` installs nothing a capture needs; a production that captures installs them, and this resolves the copies it installed. It throws naming the package and the production when it is not installed there.
 */
export function loadAutoMovieProductionModule(
  root: string,
  id: string,
): unknown {
  const load: NodeJS.Require = createRequire(path.join(root, "package.json"));
  try {
    return load(id);
  } catch (error) {
    throw new Error(
      `${id} is not installed in ${root}; capture loads it from the production, so add it to the production's dependencies`,
      { cause: error },
    );
  }
}
