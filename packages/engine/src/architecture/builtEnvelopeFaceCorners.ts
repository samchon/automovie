import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { IAutoMovieBuiltEnvelopeCorner } from "./IAutoMovieBuiltEnvelopeCorner";
import { IAutoMovieBuiltEnvelopeFace } from "./IAutoMovieBuiltEnvelopeFace";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./constants/AUTOMOVIE_OBSERVATION_EPSILON";

/**
 * Proximity-based corner records among already placed envelope facades.
 *
 * Only non-parallel `facade` pairs of one building qualify. Vertex proximity within the thicker separation plus numeric slack supplies an allowance rather than proof of a shared edge. The position averages approximately nearest vertex-pair midpoints; it equals a shared edge midpoint only when those pairs describe its ends. Boundary ids fix pair order. The first probe-oriented normal's sign toward the second centroid determines exterior/reentrant; negligible direction or dot product skips an unreadable pair. Results sort by id.
 *
 * {@link builtEnvironmentEnvelopeCorners} answers for a whole environment, and
 * the building census passes the faces it already placed so they are not
 * placed twice.
 *
 * @evidence contracts/common.md#principled-implementation Pairs facades by vertex proximity within the thicker wall thickness and reads the turn from the first normal's dot product toward the second centroid. Boundary-id ordering stabilizes pair identity and the side convention. Near-equal distances use the observation tolerance; the predicate does not prove edge intersection or simultaneous orientation behind both planes.
 * @evidence contracts/common.md#clear-and-simple-design Takes placed faces rather than an environment, so the environment-level corner query and the census, which already holds the faces, share one pairing rule without placing the envelope twice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no building or boundary; the proximity slack is each pair's own wall thickness plus the shared observation tolerance, and unreadable pairs are skipped by a stated rule rather than given a guessed side.
 * @evidence contracts/common.md#meaningful-documentation States which faces are paired, the meeting rule and its slack, where the meeting point falls, the pair order, the exterior and reentrant tests, when a pair is skipped, the sort, and who calls it.
 * @evidence contracts/performance.md#efficient-algorithms O(F² + sum(Vi Vj) + Q log Q) for F facades, outline sizes Vi/Vj of eligible pairs and Q returned corners. Building and parallel-normal checks precede each vertex-product scan; no measured crossover with a spatial index is asserted.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's already placed faces instead of re-deriving them, which is what lets the census place the envelope once per call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one meeting list per pair during the scan and the returned corners, which the caller owns; nothing is kept between calls.
 */
export const builtEnvelopeFaceCorners: (
  faces: readonly IAutoMovieBuiltEnvelopeFace[],
) => IAutoMovieBuiltEnvelopeCorner[] = (
  faces: readonly IAutoMovieBuiltEnvelopeFace[],
): IAutoMovieBuiltEnvelopeCorner[] => {
  const facades: IAutoMovieBuiltEnvelopeFace[] = faces.filter(
    (face: IAutoMovieBuiltEnvelopeFace): boolean => face.aspect === "facade",
  );
  const corners: IAutoMovieBuiltEnvelopeCorner[] = [];
  for (let i: number = 0; i < facades.length; i++)
    for (let j: number = i + 1; j < facades.length; j++) {
      const ordered: boolean =
        compareAutoMovieRenderIds(facades[i]!.boundary, facades[j]!.boundary) <=
        0;
      const a: IAutoMovieBuiltEnvelopeFace = ordered
        ? facades[i]!
        : facades[j]!;
      const b: IAutoMovieBuiltEnvelopeFace = ordered
        ? facades[j]!
        : facades[i]!;
      if (a.building !== b.building) continue;
      if (
        Vector3.length(Vector3.cross(a.normal, b.normal)) <=
        AUTOMOVIE_OBSERVATION_EPSILON
      )
        continue;
      const tolerance: number =
        Math.max(a.thickness, b.thickness) + AUTOMOVIE_OBSERVATION_EPSILON;
      // Average approximately nearest vertex-pair midpoints as the corner proxy.
      // Proximity alone does not establish a shared geometric edge.
      let best: number = Number.POSITIVE_INFINITY;
      const meetings: IAutoMovieVector3[] = [];
      for (const left of a.vertices)
        for (const right of b.vertices) {
          const gap: number = Vector3.length(Vector3.subtract(left, right));
          if (gap > Math.min(tolerance, best + AUTOMOVIE_OBSERVATION_EPSILON))
            continue;
          if (gap < best - AUTOMOVIE_OBSERVATION_EPSILON) {
            best = gap;
            meetings.length = 0;
          }
          meetings.push(Vector3.scale(Vector3.add(left, right), 0.5));
        }
      if (meetings.length === 0) continue;
      const meeting: IAutoMovieVector3 = Vector3.scale(
        meetings.reduce(
          (
            sum: IAutoMovieVector3,
            point: IAutoMovieVector3,
          ): IAutoMovieVector3 => Vector3.add(sum, point),
          { x: 0, y: 0, z: 0 },
        ),
        1 / meetings.length,
      );
      const toB: IAutoMovieVector3 = Vector3.subtract(b.centroid, meeting);
      if (Vector3.length(toB) <= AUTOMOVIE_OBSERVATION_EPSILON) continue;
      const turn: number = Vector3.dot(a.normal, Vector3.normalize(toB));
      if (Math.abs(turn) <= AUTOMOVIE_OBSERVATION_EPSILON) continue;
      corners.push({
        id: `${a.boundary}+${b.boundary}`,
        building: a.building,
        facades: [a.boundary, b.boundary],
        kind: turn < 0 ? "exterior" : "reentrant",
        position: meeting,
        normal: Vector3.normalize(Vector3.add(a.normal, b.normal)),
      });
    }
  return corners.sort(
    (
      left: IAutoMovieBuiltEnvelopeCorner,
      right: IAutoMovieBuiltEnvelopeCorner,
    ): number => compareAutoMovieRenderIds(left.id, right.id),
  );
};
