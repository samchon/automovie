/**
 * Construct the legacy vestibular lining from a fitted nasal rim. The nose
 * component passes an owned mutable cage, oriented cut faces, admitted shape
 * settings and a material-group number. This owner appends two contracted rings
 * and a floor, preserving resident rim IDs and caller face arrays. Coordinates
 * use head-frame millimetres (+Y superior, +Z anterior); aperture tilt rotates
 * the inward displacement about X. Ring order must precede wall/floor triangles
 * so subdivision receives shared topology. The envelope alternative shares the
 * same offset formula but owns its own surface. These rings are a construction
 * model, not recovered mucosal thickness or a global collision guarantee.
 */
import type { IControlMesh } from "../geometry/subdivideControlMesh";
import { portraitCutBoundary } from "./nasalBoundary";
import type { IPortraitNoseShape } from "./noseShape";

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

/**
 * Rotate the authored vestibular displacement with the aperture's X tilt.
 * The component's envelope path and legacy lining use this same frame so an
 * opening edit cannot leave its interior travelling along a stale direction.
 * Input and output are head-frame millimetres; tilt is in degrees.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Keeps the vestibular travel coupled to the authored nasal opening.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Rotates the shared cavity displacement around head X before either lining construction consumes it.
 */
export function portraitNasalCavityOffset(shape: IPortraitNoseShape): number[] {
  const angle = (shape.nostrilTilt * Math.PI) / 180;
  return [
    shape.cavityOffset[0],
    shape.cavityOffset[1] * Math.cos(angle) -
      shape.cavityOffset[2] * Math.sin(angle),
    shape.cavityOffset[1] * Math.sin(angle) +
      shape.cavityOffset[2] * Math.cos(angle),
  ];
}
