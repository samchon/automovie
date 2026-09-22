import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { portraitNormals } from "../../mesh/portraitNormals";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import type { integrateHumanFaceHairCurve } from "./integrateHumanFaceHairCurve";

const { perpendicular, direction: requireDirection } = humanFaceHairFrame;

/**
 * Mesh integrated metric curves with transported transverse ribbon frames.
 * The numerical hair builder passes the exact generated stations; this owner
 * never resamples or fits a second curve. A root vertex opens into a triangular
 * fan, followed by paired rows. UV v is measured cumulative arc length divided
 * by total measured length, and taper uses that same coordinate.
 *
 * The first nonparallel tangent fixes the binormal of the emergence/combing
 * plane. Starting from skin normal cross root tangent would be singular for
 * normal emergence and would select a world axis even when the curve specifies
 * a combing plane. A completely straight curve instead uses the supplied normal
 * and the shared frame's least-aligned-axis convention when both are parallel.
 * Successive averaged tangents use Rodrigues' minimal rotation. Antiparallel
 * tangents have no unique minimal transport and refuse. Projection removes
 * accumulated floating-point drift from the transverse frame before normalizing.
 * Generated triangles must remain finite and nondegenerate. This does not
 * establish root-fan clearance, self-intersection freedom or hair-to-hair contact.
 * Positions are already metres; no portrait millimetre conversion applies.
 * Neither input curves nor layer fields mutate; the mesh owns all its buffers.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Materializes numerical locks without storing personal mesh data.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Renders the same integrated stations used for metric evaluation.
 */
export function buildHumanFaceHairMesh(
  curves: ReturnType<typeof integrateHumanFaceHairCurve>[],
  layer: Pick<IAutoMovieHumanFaceHair.Layer, "width" | "taper">,
): IAutoMovieMesh {
  const positions: number[] = [],
    indices: number[] = [],
    uvs: number[] = [];
  for (const curve of curves) {
    const offset = positions.length / 3;
    const points = curve.points;
    const tangents = points.map((_, at) =>
      requireDirection(
        Vector3.subtract(
          points[Math.min(at + 1, points.length - 1)],
          points[Math.max(at - 1, 0)],
        ),
      ),
    );
    const distances = [0];
    for (let at = 1; at < points.length; at++)
      distances.push(
        distances[at - 1] +
          Vector3.length(Vector3.subtract(points[at], points[at - 1])),
      );
    const total = distances[distances.length - 1];
    const reference =
      tangents.find(
        (tangent) =>
          Vector3.length(Vector3.cross(tangents[0], tangent)) >
          64 * Number.EPSILON,
      ) ?? curve.normal;
    let frame = perpendicular(tangents[0], reference);
    positions.push(points[0].x, points[0].y, points[0].z);
    uvs.push(0.5, 0);
    for (let at = 1; at < points.length; at++) {
      const before = tangents[at - 1],
        after = tangents[at];
      const cosine = Math.max(-1, Math.min(1, Vector3.dot(before, after)));
      if (1 + cosine <= 64 * Number.EPSILON)
        throw new Error(
          "Antiparallel hair tangents have no unique transverse transport.",
        );
      const axis = Vector3.cross(before, after);
      frame = Vector3.add(
        Vector3.add(frame, Vector3.cross(axis, frame)),
        Vector3.scale(
          Vector3.cross(axis, Vector3.cross(axis, frame)),
          1 / (1 + cosine),
        ),
      );
      frame = requireDirection(
        Vector3.subtract(
          frame,
          Vector3.scale(after, Vector3.dot(frame, after)),
        ),
      );
      const t = distances[at] / total;
      const radius =
        (layer.width / 2) *
        (1 -
          ((1 - layer.taper.tipWidth) * Math.max(0, t - layer.taper.start)) /
            (1 - layer.taper.start));
      for (const side of [-1, 1]) {
        const point = Vector3.add(
          points[at],
          Vector3.scale(frame, side * radius),
        );
        positions.push(point.x, point.y, point.z);
        uvs.push((side + 1) / 2, t);
      }
      const row = offset + 2 * at - 1;
      if (at === 1) indices.push(offset, row, row + 1);
      else indices.push(row - 2, row, row - 1, row - 1, row, row + 1);
    }
  }
  const point = (id: number) =>
    Vector3.create(
      positions[3 * id],
      positions[3 * id + 1],
      positions[3 * id + 2],
    );
  for (let at = 0; at < indices.length; at += 3) {
    const a = point(indices[at]),
      b = point(indices[at + 1]),
      c = point(indices[at + 2]);
    const area = Vector3.length(
      Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
    );
    if (!Number.isFinite(area) || area === 0)
      throw new Error(
        "Numerical hair generated an unrepresentable ribbon triangle.",
      );
  }
  return {
    positions,
    indices,
    normals: portraitNormals(positions, indices),
    uvs,
    skin: null,
  };
}
