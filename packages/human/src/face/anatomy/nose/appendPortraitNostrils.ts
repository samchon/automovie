import { orderCutPatchBoundary } from "../../mesh/orderCutPatchBoundary";
import { IControlMesh } from "../../mesh/structures/IControlMesh";
import { portraitNasalCavityOffset } from "./portraitNasalCavityOffset";
import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";

/**
 * Build lining and cavity from the actual fitted rim. Original rim IDs stay
 * shared with the face. Changing an opening therefore changes its lining and
 * neighbouring skin together instead of placing a new cavity under an old hole.
 *
 * Each opening is a connected patch of cut control triangles whose boundary is
 * one closed loop of `n` edges (`orderCutPatchBoundary` refuses anything
 * else). The lining is the rim loop itself, a near support ring at
 * `rimSupport` of the cavity travel and a deep ring at full travel, joined by
 * two triangles per edge and ring gap and closed by a fan to one floor point,
 * so an opening adds `2n + 1` positions and `5n` triangles whatever the shape
 * values are. A ring at travel fraction `f` is the rim scaled about the rim
 * centre by `1 - f (1 - cavityContraction)` and moved by `f` times the
 * cavity offset, which `portraitNasalCavityOffset` rotates with the aperture
 * tilt; the floor is the centre moved by the whole offset. Lengths are head-frame
 * millimetres (+X anatomical left, +Y up, +Z anterior).
 *
 * Every rim edge is traversed in the removed patch's own winding, so the
 * lining meets the surrounding skin with opposite edge direction and the
 * surface stays consistently oriented. The contraction and support fraction
 * must lie in (0, 1), which `resolvePortraitNoseShape` admits. The lining is a
 * geometric hypothesis for a cavity, not a measured airway, and nothing
 * prevents a large cavity offset from reaching neighbouring surfaces.
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
    const boundary = orderCutPatchBoundary(faces);
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
