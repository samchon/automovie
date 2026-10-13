import type { IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Ids that claim a drawable and resolved to no object, in the mask's own
 * ascending order.
 * Ownership-only entries do not claim pixels; instance sets do even when
 * their node list is empty. The caller retains the roots and palette.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Reports declared drawable identities with no corresponding mask root.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Preserves palette order while exposing absent drawable coverage to the pass consumer.
 */
export const unresolvedOf = (
  mask: IAutoMovieSemanticMask,
  roots: ReadonlyMap<THREE.Object3D, IAutoMovieSemanticMaskEntry>,
): string[] => {
  const resolved = new Set<string>();
  for (const entry of roots.values()) resolved.add(entry.id);
  return mask.entries
    .filter(
      (entry) =>
        (entry.nodes.length !== 0 || entry.kind === "instance-set") &&
        !resolved.has(entry.id),
    )
    .map((entry) => entry.id);
};
