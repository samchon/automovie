import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { IAutoMovieBuiltEnvelopeCorner } from "./IAutoMovieBuiltEnvelopeCorner";
import { builtEnvironmentEnvelopeFaces } from "./builtEnvironmentEnvelopeFaces";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./constants/AUTOMOVIE_OBSERVATION_EPSILON";

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
 * Only facades of the same building are paired. A corner's id is
 * `<boundary>+<boundary>` in code-unit order, its position is the mean of the
 * midpoints of the nearest vertex pairs along the shared edge, its normal
 * bisects the two
 * outward normals, and the list is sorted by id.
 *
 * @evidence contracts/common.md#principled-implementation For each non-parallel same-building facade pair, keeps the vertex pairs within the thicker wall plus epsilon and nearest overall, averages their midpoints into one corner, and reads exterior or reentrant from the sign of one facade's normal toward the other's centroid.
 * @evidence contracts/common.md#clear-and-simple-design Corners are derived from `builtEnvironmentEnvelopeFaces` rather than declared, and come back as plain records whose two facade ids name the pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parallel facades, a coincident centroid and a turn within epsilon of perpendicular are skipped instead of forced into a kind; the wall-thickness slack is the construction gap between two faces authored on one corner.
 * @evidence contracts/common.md#meaningful-documentation States the meeting rule and its thickness tolerance, how the turn is classified, the same-building pairing, the id spelling and sort, and how position and normal are formed.
 * @evidence contracts/performance.md#cost-and-resources Pairwise over all facades, `O(F^2)`, plus `O(V_a V_b)` vertex comparisons per same-building non-parallel pair, where grouping by building first would skip the cross-building pairs now rejected one by one; it recomputes the faces itself and caches nothing.
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
