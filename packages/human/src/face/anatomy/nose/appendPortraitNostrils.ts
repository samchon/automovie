import { IControlMesh } from "../../mesh/structures/IControlMesh";
import { portraitCutBoundary } from "../cranium/portraitCutBoundary";
import { portraitNasalCavityOffset } from "./portraitNasalCavityOffset";
import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";

/**
 * Build lining and cavity from the actual fitted rim. Original rim IDs stay
 * shared with the face. Changing an opening therefore changes its lining and
 * neighbouring skin together instead of placing a new cavity under an old hole.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs nasal lining from the actual fitted aperture instead of placing a cavity under an unrelated hole.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Retains the host rim IDs, adds support and contracted deep rings, and joins them to the floor using the same rotated cavity offset.
 */
export function appendPortraitNostrils(
  cage: IControlMesh,
  nostrilFaces: number[][][],
  shape: IPortraitNoseShape,
  group: number,
): void {
  const { positions, indices, groups } = cage;
  const offset = portraitNasalCavityOffset(shape);
  for (const faces of nostrilFaces) {
    const boundary = portraitCutBoundary(faces);
    const ids = [...new Set(boundary.flatMap((edge) => [edge.a, edge.b]))];
    const center = [0, 1, 2].map(
      (axis) =>
        ids.reduce((sum, id) => sum + positions[id][axis], 0) / ids.length,
    );
    // A near support ring retains the aperture edge through subdivision before
    // the lining travels to its contracted deep ring and recessed floor.
    const rings = [new Map(ids.map((id) => [id, id]))];
    for (const fraction of [shape.rimSupport, 1]) {
      const ring = new Map<number, number>();
      for (const id of ids) {
        ring.set(id, positions.length);
        positions.push(
          positions[id].map(
            (value, axis) =>
              center[axis] +
              (1 - fraction * (1 - shape.cavityContraction)) *
                (value - center[axis]) +
              fraction * offset[axis],
          ),
        );
      }
      rings.push(ring);
    }
    const floor = positions.length;
    positions.push(center.map((value, axis) => value + offset[axis]));
    for (const edge of boundary) {
      for (let ring = 0; ring < rings.length - 1; ring++) {
        const a = rings[ring].get(edge.a)!,
          b = rings[ring].get(edge.b)!;
        const c = rings[ring + 1].get(edge.a)!,
          d = rings[ring + 1].get(edge.b)!;
        indices.push(a, b, c, b, d, c);
        groups.push(group, group);
      }
      indices.push(
        rings[rings.length - 1].get(edge.a)!,
        rings[rings.length - 1].get(edge.b)!,
        floor,
      );
      groups.push(group);
    }
  }
}
