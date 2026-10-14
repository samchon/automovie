import type { IHumanViewerModuleNode } from "./IHumanViewerModuleNode.js";

/**
 * Withdraw a complete compiler generation and its served runtime transforms. Type-only dependencies do not appear in Vite's runtime import graph, so a filesystem event must invalidate every transformed module of this source owner even when the changed file has no runtime module. The injected graph adapter uses Vite's public invalidation API and leaves page reload policy to the host. Existing requests may finish their selected snapshot; invalidation prevents Vite from caching their obsolete result for subsequent requests.
 *
 * This operation withdraws compile and served-source authority; numerical output-byte integrity remains with its separate owner.
 *
 * @evidence contracts/common.md#principled-implementation Complete compile reset precedes invalidation of every non-declaration TypeScript module under the exact source root, including changes absent from Vite's runtime graph.
 * @evidence contracts/common.md#clear-and-simple-design Root/path selection and the injected public module invalidator adapt the existing graph without implementing reload or numerical cache policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type-only change still withdraws the complete compiler generation, while null ids, sibling roots and declaration files are not mislabeled as runtime transforms.
 * @evidence contracts/common.md#meaningful-documentation The comment defines whole-generation withdrawal, snapshot requests, public graph ownership and separation from numerical-byte integrity.
 * @evidence contracts/performance.md#efficient-algorithms One graph traversal performs path checks linear in each module id; reset occurs once rather than recompiling separately per module.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing requests may complete their selected snapshot but obsolete transform reuse is withdrawn for subsequent requests; candidate replacement remains with the host.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The borrowed iterable and callbacks transfer no graph, compiler process or GPU ownership to this synchronous invalidation adapter.
 */
export function invalidateHumanViewerGeneration<
  Module extends IHumanViewerModuleNode,
>(
  sourceRoot: string,
  modules: Iterable<Module>,
  reset: () => void,
  invalidate: (module: Module) => void,
): void {
  const prefix: string =
    sourceRoot.replace(/\\/g, "/").replace(/\/$/, "") + "/";
  reset();
  for (const module of modules) {
    if (module.id === null) continue;
    const file: string = module.id.split("?")[0].replace(/\\/g, "/");
    if (
      file.startsWith(prefix) &&
      file.endsWith(".ts") &&
      !file.endsWith(".d.ts")
    )
      invalidate(module);
  }
}
