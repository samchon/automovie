import { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./constants/AUTOMOVIE_OBSERVATION_EPSILON";
import { IAutoMovieBuiltEnvelopeCorner } from "./IAutoMovieBuiltEnvelopeCorner";
import { builtEnvironmentEnvelopeFaces } from "./builtEnvironmentEnvelopeFaces";

/**
 * Every meeting of two exposed facades of one building unit.
 *
 * Two facades meet when a corner of one stands within the thicker of the two
 * separations of a corner of the other, which is exactly the slack a wall's own
 * construction introduces between two faces authored on the same envelope
 * corner. The side the corner turns toward is read from the meeting point
 * itself: a corner is exterior when each facade's own body lies behind the
 * other's outward plane, and reentrant when it lies in front of it.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Derives the exterior and reentrant corner population an envelope review owes.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Implements the corner derivation and its exterior or reentrant classification.
 */
export const builtEnvironmentEnvelopeCorners = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvelopeCorner[] => {
  const facades = builtEnvironmentEnvelopeFaces(environment).filter(
    (face) => face.aspect === "facade",
  );
  const corners: IAutoMovieBuiltEnvelopeCorner[] = [];
  for (let i = 0; i < facades.length; i++)
    for (let j = i + 1; j < facades.length; j++) {
      const a = facades[i]!;
      const b = facades[j]!;
      if (a.building !== b.building) continue;
      if (
        Vector3.length(Vector3.cross(a.normal, b.normal)) <=
        AUTOMOVIE_OBSERVATION_EPSILON
      )
        continue;
      const tolerance =
        Math.max(a.thickness, b.thickness) + AUTOMOVIE_OBSERVATION_EPSILON;
      // Two facades meeting at a building corner share a whole edge, so the
      // nearest pair is not one point but every pair along it. Averaging them
      // puts the corner at the middle of that edge rather than at whichever end
      // the outlines happened to be written from, which is both the point a
      // corner observation aims at and an answer independent of authoring order.
      let best = Number.POSITIVE_INFINITY;
      const meetings: IAutoMovieVector3[] = [];
      for (const left of a.vertices)
        for (const right of b.vertices) {
          const gap = Vector3.length(Vector3.subtract(left, right));
          if (gap > Math.min(tolerance, best + AUTOMOVIE_OBSERVATION_EPSILON))
            continue;
          if (gap < best - AUTOMOVIE_OBSERVATION_EPSILON) {
            best = gap;
            meetings.length = 0;
          }
          meetings.push(Vector3.scale(Vector3.add(left, right), 0.5));
        }
      if (meetings.length === 0) continue;
      const meeting = Vector3.scale(
        meetings.reduce((sum, point) => Vector3.add(sum, point), {
          x: 0,
          y: 0,
          z: 0,
        }),
        1 / meetings.length,
      );
      const toB = Vector3.subtract(b.centroid, meeting);
      if (Vector3.length(toB) <= AUTOMOVIE_OBSERVATION_EPSILON) continue;
      const turn = Vector3.dot(a.normal, Vector3.normalize(toB));
      if (Math.abs(turn) <= AUTOMOVIE_OBSERVATION_EPSILON) continue;
      // The facade list is already in boundary-id order, so `i < j` puts the
      // two ids in code-unit order without a second comparison.
      corners.push({
        id: `${a.boundary}+${b.boundary}`,
        building: a.building,
        facades: [a.boundary, b.boundary],
        kind: turn < 0 ? "exterior" : "reentrant",
        position: meeting,
        normal: Vector3.normalize(Vector3.add(a.normal, b.normal)),
      });
    }
  return corners.sort((left, right) =>
    compareAutoMovieRenderIds(left.id, right.id),
  );
};
