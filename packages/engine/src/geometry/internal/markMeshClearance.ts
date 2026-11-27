import type {
  IAutoMovieMark,
  IAutoMovieMarkMeshClearance,
  IAutoMovieMeshClearanceWitness,
} from "@automovie/interface";

/*
 * Turn the witnesses of a mesh clearance measurement into inspection marks: one
 * segment per witness from its point on the front surface to the matching point
 * on the back surface, flagged where the back lies in front.
 *
 * A witness's front point is its front triangle's vertices weighted by its
 * barycentric weights, and its back point is that point moved `gap` metres back
 * along the measured axis, because the gap is the front depth minus the back
 * depth there. Each becomes a segment of kind `clearance`, label `clearance
 * witness`, colour yellow-green `9acd32`, at path `<path>/clearance/<ordinal>`,
 * flagged when its gap is negative. Coordinates are those of the meshes, which
 * share one frame; `anchor` names the scene object that frame belongs to, or
 * null for world space.
 *
 * It throws for a witness that names a vertex outside the front mesh or does
 * not hold three vertices and three weights.
 * Parameter props.path: The front object's path, which the marks extend.
 * Parameter props.front: The front mesh the witnesses were measured on.
 * Parameter props.axis: The depth axis the clearance was measured along.
 * Parameter props.witnesses: Witnesses as `measureMeshClearance` hands
 * them to its visitor.
 * Parameter props.anchor: Path of the object whose frame the meshes share, or null
 * for world space.
 * Returns: One mark per witness, in the witnesses' order.
 */
export function markMeshClearance(
  props: IAutoMovieMarkMeshClearance.IProps,
): IAutoMovieMark[] {
  const vertices: number = props.front.positions.length / 3;
  const axis: number = { x: 0, y: 1, z: 2 }[props.axis];
  return props.witnesses.map(
    (
      witness: IAutoMovieMeshClearanceWitness,
      ordinal: number,
    ): IAutoMovieMark => {
      if (witness.vertices.length !== 3 || witness.weights.length !== 3)
        throw new Error(
          `markAutoMovieMeshClearance: witness ${ordinal} does not hold three vertices and three weights`,
        );
      const front: number[] = [0, 0, 0];
      witness.vertices.forEach((vertex: number, k: number): void => {
        if (vertex < 0 || vertex >= vertices)
          throw new Error(
            `markAutoMovieMeshClearance: witness ${ordinal} names vertex ${vertex}, outside the ${vertices} vertices of the front mesh`,
          );
        for (let c: number = 0; c < 3; c++)
          front[c]! +=
            witness.weights[k]! * props.front.positions[vertex * 3 + c]!;
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
