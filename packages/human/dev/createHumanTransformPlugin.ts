import ttsc from "@ttsc/unplugin";
import { resolve } from "node:path";
import { type UnpluginOptions, createUnplugin } from "unplugin";
import { type Plugin, normalizePath } from "vite";

/** Run the bundler transform only where a runtime compiler macro is used.
 * The complete native checker remains responsible for every application and
 * Human source file. Forwarding ordinary TypeScript modules to the macro
 * adapter only repeats generation-proof registration; Vite already strips
 * their types. The adapter retains its original configuration, watch and close
 * hooks, and receives the original transform context for the admitted entry.
 */
export function createHumanTransformPlugin(directory: string): Plugin {
  const entry: string = normalizePath(
    resolve(directory, "src/human/admitHumanParameters.ts"),
  );
  return createUnplugin<undefined, false>((): UnpluginOptions => {
    const original: UnpluginOptions = ttsc.raw(
      {
        project: resolve(directory, "tsconfig.transform.json"),
        projectRoot: resolve(directory, "../../.."),
      },
      { framework: "vite" },
    );
    return {
      ...original,
      transformInclude: (id: string): boolean =>
        normalizePath(id.split("?")[0]!) === entry &&
        (original.transformInclude?.(id) ?? true),
    };
  }).vite();
}
