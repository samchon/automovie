import type { IPlaygroundAdapter } from "./IPlaygroundAdapter";

/**
 * Load the adapter the page uses.
 *
 * The adapter and the packages behind it are loaded in the browser, as a
 * chunk of their own, so the static page is rendered without evaluating
 * three.js or the motion packages on the build machine.
 *
 * @returns The adapter over the installed packages.
 */
export async function loadPlaygroundAdapter(): Promise<IPlaygroundAdapter> {
  return (await import("./package/PlaygroundPackageAdapter"))
    .PlaygroundPackageAdapter;
}
