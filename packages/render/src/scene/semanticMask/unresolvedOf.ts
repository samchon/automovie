import type {
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Ids that claim a drawable and resolved to no object, in the mask's own ascending order. Ownership-only entries do not claim pixels; instance sets do even when their node list is empty. The caller retains the roots and palette.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Collects ids actually present in roots and filters palette entries that claim nodes or an instance-set root but have no resolved object id.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Drawable-root absence classification stays separate from ownership-only entries, scene traversal and actual pixel coverage.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Ownership-only chains do not become false missing drawables; result order follows the already-ordered palette and root presence is not rendered visibility proof.
 * @evidence contracts/development/common.md#meaningful-documentation Documents drawable criteria, instance-set exception, input ordering and borrowed roots/palette.
 * @evidence contracts/development/implementation.md#efficient-algorithms R roots and E entries are scanned once through a Set, O(R+E) with proportional id references/result strings and no nested root search.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Resolved-id membership is shared for one filtering call, while changed roots/palette requires reevaluation and no cross-call memo exists.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only call-local id Set and returned id list are owned; no scene object, material or native resource is acquired.
 */
export const unresolvedOf: (
  mask: IAutoMovieSemanticMask,
  roots: ReadonlyMap<THREE.Object3D, IAutoMovieSemanticMaskEntry>,
) => string[] = (
  mask: IAutoMovieSemanticMask,
  roots: ReadonlyMap<THREE.Object3D, IAutoMovieSemanticMaskEntry>,
): string[] => {
  const resolved: Set<string> = new Set<string>();
  for (const entry of roots.values()) resolved.add(entry.id);
  return mask.entries
    .filter(
      (entry: IAutoMovieSemanticMaskEntry): boolean =>
        (entry.nodes.length !== 0 || entry.kind === "instance-set") &&
        !resolved.has(entry.id),
    )
    .map((entry: IAutoMovieSemanticMaskEntry): string => entry.id);
};
