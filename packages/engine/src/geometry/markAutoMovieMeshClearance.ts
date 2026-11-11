import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieMark } from "./IAutoMovieMark";
import type { IAutoMovieMeshClearanceWitness } from "./IAutoMovieMeshClearanceWitness";

/**
 * Turn the witnesses of a mesh clearance measurement into inspection marks: one segment per witness from its point on the front surface to the matching point on the back surface, flagged where the back lies in front.
 *
 * A witness's front point is its front triangle's vertices weighted by its barycentric weights, and its back point is that point moved `gap` metres back along the measured axis, because the gap is the front depth minus the back depth there. Each becomes a segment of kind `clearance`, label `clearance witness`, colour yellow-green `9acd32`, at path `<path>/clearance/<ordinal>`, flagged when its gap is negative. Coordinates are those of the meshes, which share one frame; `anchor` names the scene object that frame belongs to, or null for world space.
 *
 * It throws for a witness that names a vertex outside the front mesh or does not hold three vertices and three weights.
 *
 * @param props.path The front object's path, which the marks extend.
 * @param props.front The front mesh the witnesses were measured on.
 * @param props.axis The depth axis the clearance was measured along.
 * @param props.witnesses Witnesses as `measureAutoMovieMeshClearance` hands them to its visitor.
 * @param props.anchor Path of the object whose frame the meshes share, or null for world space.
 * @returns One mark per witness, in the witnesses' order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how both ends of a segment follow from a witness, the kind, label, colour, path, flag and frame, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The witness's weights belong to the front triangle and its gap is a signed depth difference along the measured axis, so the back point is the front point less the gap along that axis; the segment's length is the clearance and its direction says which surface is in front.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the witnesses with one weighted sum each.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Weights are used as measured, slightly negative roundoff included, as the witness type requires, and a malformed witness is refused.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the witnesses.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one measurement.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh marks and keeps nothing.
 */
export function markAutoMovieMeshClearance(props: {
  path: string;
  front: Pick<IAutoMovieMesh, "positions">;
  axis: "x" | "y" | "z";
  witnesses: readonly IAutoMovieMeshClearanceWitness[];
  anchor: string | null;
}): IAutoMovieMark[] {
  const vertices: number = props.front.positions.length / 3;
  const axis: number = { x: 0, y: 1, z: 2 }[props.axis];
  return props.witnesses.map(
    (witness: IAutoMovieMeshClearanceWitness, ordinal: number): IAutoMovieMark => {
      if (witness.vertices.length !== 3 || witness.weights.length !== 3)
        throw new Error(
          `markAutoMovieMeshClearance: witness ${ordinal} does not hold three vertices and three weights`,
        );
      const front: number[] = [0, 0, 0];
      witness.vertices.forEach((vertex: number, k: number): void => {
        if (!Number.isInteger(vertex) || vertex < 0 || vertex >= vertices)
          throw new Error(
            `markAutoMovieMeshClearance: witness ${ordinal} names vertex ${vertex}, outside the ${vertices} vertices of the front mesh`,
          );
        for (let c: number = 0; c < 3; c++)
          front[c]! += witness.weights[k]! * props.front.positions[vertex * 3 + c]!;
      });
      const back: number[] = [...front];
      back[axis]! -= witness.gap;
      return {
        path: `${props.path}/clearance/${ordinal}`,
        kind: "clearance",
        label: "clearance witness",
        color: 0x9acd32,
        shape: { type: "segments", points: [...front, ...back] },
        flagged: witness.gap < 0,
        anchor: props.anchor,
      };
    },
  );
}
