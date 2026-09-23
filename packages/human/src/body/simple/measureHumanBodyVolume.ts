import { humanBodyCappedSurface } from "./humanBodyCappedSurface";

/**
 * The volume enclosed by a triangle surface, in cubic metres, with its open
 * boundary loops capped.
 *
 * The signed volume is the sum of the tetrahedra each triangle spans with
 * the origin, `a · (b × c) / 6`; on a closed, consistently wound surface the
 * sum is the enclosed volume up to sign. The body basis is not closed: the
 * face was cut away at the neck, leaving one boundary loop. Every boundary
 * loop is fanned to its own vertex centroid with the winding its triangles
 * imply. This closes each opening independently, including a top and bottom
 * opening on one surface.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Reads the skin volume the body mass index is solved against.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Realizes the tetrahedron sum and the boundary cap the mass model specifies.
 */
export function measureHumanBodyVolume(
  positions: number[],
  indices: number[],
): number {
  return humanBodyCappedSurface(positions, indices).volume;
}
