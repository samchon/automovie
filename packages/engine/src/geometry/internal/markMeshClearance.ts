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
  if (!Number.isSafeInteger(vertices))
    throw new Error(
      "markAutoMovieMeshClearance: front positions must hold XYZ triples",
    );
  if (props.axis !== "x" && props.axis !== "y" && props.axis !== "z")
    throw new Error("markAutoMovieMeshClearance: axis must be X, Y or Z");
  const axis: number = { x: 0, y: 1, z: 2 }[props.axis];
  return Array.from(
    props.witnesses,
    (
      witness: IAutoMovieMeshClearanceWitness,
      ordinal: number,
    ): IAutoMovieMark => {
      if (
        witness === undefined ||
        witness === null ||
        !Array.isArray(witness.vertices) ||
        !Array.isArray(witness.weights) ||
        witness.vertices.length !== 3 ||
        witness.weights.length !== 3
      )
        throw new Error(
          `markAutoMovieMeshClearance: witness ${ordinal} does not hold three vertices and three weights`,
        );
      if (!Number.isFinite(witness.gap))
        throw new Error(
          `markAutoMovieMeshClearance: witness ${ordinal} requires a finite gap`,
        );
      const front: number[] = [0, 0, 0];
      for (let k: number = 0; k < 3; ++k) {
        const vertex: number = witness.vertices[k]!;
        const weight: number = witness.weights[k]!;
        if (!Number.isSafeInteger(vertex) || vertex < 0 || vertex >= vertices)
          throw new Error(
            `markAutoMovieMeshClearance: witness ${ordinal} names vertex ${vertex}, outside the ${vertices} vertices of the front mesh`,
          );
        if (!Number.isFinite(weight))
          throw new Error(
            `markAutoMovieMeshClearance: witness ${ordinal} requires finite weights`,
          );
        for (let c: number = 0; c < 3; c++) {
          const coordinate: number = props.front.positions[vertex * 3 + c]!;
          if (!Number.isFinite(coordinate))
            throw new Error(
              `markAutoMovieMeshClearance: witness ${ordinal} requires finite front positions`,
            );
          front[c]! += weight * coordinate;
        }
      }
      const back: number[] = [...front];
      back[axis]! -= witness.gap;
      const points: number[] = [...front, ...back];
      if (!points.every(Number.isFinite))
        throw new Error(
          `markAutoMovieMeshClearance: witness ${ordinal} requires finite endpoints`,
        );
      return {
        path: `${props.path}/clearance/${ordinal}`,
        kind: "clearance",
        label: "clearance witness",
        color: 0x9acd32,
        shape: { type: "segments", points },
        flagged: witness.gap < 0,
        anchor: props.anchor,
      };
    },
  );
}
