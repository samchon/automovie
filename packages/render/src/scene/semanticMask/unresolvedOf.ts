import type {
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Ids that claim a drawable and resolved to no object, in the mask's own
 * ascending order. Ownership-only entries do not claim pixels; instance sets do
 * even when their node list is empty. The caller retains the roots and
 * palette.
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
