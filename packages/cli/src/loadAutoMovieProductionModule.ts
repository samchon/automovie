import { createRequire } from "node:module";
import * as path from "node:path";

/**
 * Load a package as the production at `root` resolves it, for the capture host's optional peers: `@automovie/render`, `vite`, `playwright-core` and `ffmpeg-static`.
 *
 * The command itself depends on none of them, so `npx automovie create` installs nothing a capture needs; a production that captures installs them, and this resolves the copies it installed. It throws naming the package and the production when it is not installed there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which packages it serves, why they come from the production, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation `createRequire` anchored at the production's `package.json` applies Node's resolution from that folder, the same copy the production's own scripts import.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One anchored require.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No copy beside the command is tried, so a capture never draws with a renderer the production did not install.
 * @evidence contracts/development/implementation.md#efficient-algorithms One resolution; Node caches the module.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Node's module cache serves a second load of the same package.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The module stays in Node's cache for the process, as any import does.
 */
export function loadAutoMovieProductionModule(root: string, id: string): unknown {
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
