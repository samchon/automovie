import type * as THREE from "three";

import { disposeHumanViewerObject } from "./disposeHumanViewerObject";

/** Bind the actual page's two retained display materials to its dispose calls.
 * Create once after those materials exist. Removed construction/model trees
 * release their own resources through this callback; final page teardown owns
 * the two retained materials and the separate texture cache.
 *
 * @evidence contracts/common.md#principled-implementation Retains only the two page-owned substitution materials while releasing actual removed object resources.
 * @evidence contracts/common.md#clear-and-simple-design One page-scoped closure supplies the retained material set to the object disposer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads actual resources rather than substituting a fixture or skipping line geometry.
 * @evidence contracts/common.md#meaningful-documentation States the separate owners of model resources, page materials and texture cache.
 * @evidence contracts/performance.md#efficient-algorithms Creates one fixed-size Set per page; each call scans only its removed tree.
 * @evidence contracts/performance.md#reuse-equivalent-work The same retained Set is reused for every model and construction replacement on that page.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains two materials until page teardown, which disposes them separately.

 */
export function createHumanViewerDisposer(props: {
  ghost: THREE.Material;
  constructionOnly: THREE.Material;
}): (root: THREE.Object3D) => void {
  const retained: ReadonlySet<THREE.Material> = new Set([
    props.ghost,
    props.constructionOnly,
  ]);
  return (root: THREE.Object3D): void =>
    disposeHumanViewerObject(root, retained);
}
