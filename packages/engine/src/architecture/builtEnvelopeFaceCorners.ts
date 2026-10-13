import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { IAutoMovieBuiltEnvelopeCorner } from "./IAutoMovieBuiltEnvelopeCorner";
import { IAutoMovieBuiltEnvelopeFace } from "./IAutoMovieBuiltEnvelopeFace";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./constants/AUTOMOVIE_OBSERVATION_EPSILON";

/**
 * Every meeting of two facades among already placed envelope faces.
 *
 * Only faces whose aspect is `facade` are paired, and only within one
 * building. Two facades meet when their normals are not parallel and a vertex
 * of one stands within the thicker of the two separations of a vertex of the
 * other, which is exactly the slack a wall's own construction introduces
 * between two faces authored on the same envelope corner. The meeting point is
 * the mean of the midpoints of the nearest vertex pairs, so it falls at the
 * middle of a shared edge whichever end the outlines were written from. Each
 * pair is read with its boundary ids in code-unit order: the corner is
 * `exterior` when the second facade's centroid lies behind the first facade's
 * outward plane and `reentrant` when in front, and a pair whose side cannot be
 * read, because the meeting point is the second centroid or lies in the first
 * plane, is skipped. Corners are sorted by id.
 *
 * {@link builtEnvironmentEnvelopeCorners} answers for a whole environment, and
 * the building census passes the faces it already placed so they are not
 * placed twice.
 *
 * @evidence contracts/common.md#principled-implementation Pairs facades by nearest-vertex proximity within the thicker wall thickness and reads the turn from the sign of the first outward normal against the direction to the second centroid; ordering each pair by boundary id before reading makes the id, the facade order and the side independent of input order.
 * @evidence contracts/common.md#clear-and-simple-design Takes placed faces rather than an environment, so the environment-level corner query and the census, which already holds the faces, share one pairing rule without placing the envelope twice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no building or boundary; the proximity slack is each pair's own wall thickness plus the shared observation tolerance, and unreadable pairs are skipped by a stated rule rather than given a guessed side.
 * @evidence contracts/common.md#meaningful-documentation States which faces are paired, the meeting rule and its slack, where the meeting point falls, the pair order, the exterior and reentrant tests, when a pair is skipped, the sort, and who calls it.
 * @evidence contracts/performance.md#efficient-algorithms Quadratic in the facade count with a constant-time building check before the vertex-pair loop, which is quadratic in the two outlines' point counts; an envelope holds tens to hundreds of facades, so a spatial index would cost more than the pairs it prunes.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's already placed faces instead of re-deriving them, which is what lets the census place the envelope once per call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one meeting list per pair during the scan and the returned corners, which the caller owns; nothing is kept between calls.
 */
export const builtEnvelopeFaceCorners = (
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
      // Two facades meeting at a building corner share a whole edge, so the
      // nearest pair is not one point but every pair along it. Averaging them
      // puts the corner at the middle of that edge rather than at whichever end
      // the outlines happened to be written from.
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
          (sum: IAutoMovieVector3, point: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(sum, point),
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
