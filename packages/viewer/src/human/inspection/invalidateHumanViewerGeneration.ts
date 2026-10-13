import type { IHumanViewerModuleNode } from "./IHumanViewerModuleNode.js";

/**
 * Withdraw a complete compiler generation and its served runtime transforms.
 * Type-only dependencies do not appear in Vite's runtime import graph, so a
 * filesystem event must invalidate every transformed module of this source
 * owner even when the changed file has no runtime module. The injected graph
 * adapter uses Vite's public invalidation API and leaves page reload policy to
 * the host. Existing requests may finish their selected snapshot; invalidation
 * prevents Vite from caching their obsolete result for subsequent requests.
 *
 * This operation withdraws compile and served-source authority; numerical output-byte integrity remains with its separate owner.
 */
export function invalidateHumanViewerGeneration<
  Module extends IHumanViewerModuleNode,
>(
  sourceRoot: string,
  modules: Iterable<Module>,
  reset: () => void,
  invalidate: (module: Module) => void,
): void {
  const prefix = sourceRoot.replace(/\\/g, "/").replace(/\/$/, "") + "/";
  reset();
  for (const module of modules) {
    if (module.id === null) continue;
    const file = module.id.split("?")[0].replace(/\\/g, "/");
    if (
      file.startsWith(prefix) &&
      file.endsWith(".ts") &&
      !file.endsWith(".d.ts")
    )
      invalidate(module);
  }
}
