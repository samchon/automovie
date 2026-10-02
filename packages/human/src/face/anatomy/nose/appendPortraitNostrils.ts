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
 *
 * @evidence contracts/common.md#principled-implementation Rings are the rim interpolated linearly toward a contracted deep outline and a floor point, so the lining is a closed strip continuous with the rim edges; the closed single-loop boundary and the open intervals of the contraction and support are preconditions stated beside the construction, and the lack of an intersection test is stated as a limitation.
 * @evidence contracts/common.md#clear-and-simple-design The rim loop, the shared offset helper and one ring recurrence are separate steps; the rings and fan are the least structure that keeps the aperture edge through subdivision and reaches a floor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; every vertex follows from the rim, the shape and the offset.
 * @evidence contracts/common.md#meaningful-documentation The comment states the input structure, the emitted counts, the ring formula, the units and frame, the orientation rule and the stated limitations.
 * @evidence contracts/modeling.md#emitted-geometry The population is `2n + 1` positions and `5n` triangles for an opening of `n` boundary edges: it follows from the rim length alone and does not grow with the number of shape channels, and the support ring is the only ring the subdivision needs to retain the rim edge, so no smaller strip holds both the edge and a floor.
 * @evidence contracts/modeling.md#spatial-conventions Positions are head-frame millimetres with +X anatomical left, +Y up and +Z anterior, the offset is rotated by the aperture tilt in the one helper the component also uses, and the function converts nothing else.
 * @evidence contracts/modeling.md#shared-boundaries The first ring reuses the face's own rim ids, so lining and skin meet at one shared vertex set without a gap or an overlap; the rim stays a crease by design and the normal is not continuous across it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function adds one tissue label's triangles under the group its caller names; the part is the nose component.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own, and the lining is a geometric hypothesis rather than a measured airway.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no quantity; the shape admission bounds the contraction and support, and the bounds of a living vestibule are not encoded.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is geometry from channels IPortraitNoseShape already names, not an input through which a caller shapes a human form.
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
