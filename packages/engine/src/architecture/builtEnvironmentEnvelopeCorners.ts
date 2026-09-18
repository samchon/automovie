import { IAutoMovieBuiltEnvironment, IAutoMovieBuiltOpening, IAutoMovieBuiltSpace, IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { outlineHull } from "./outlineHull";
import { polygonBounds } from "./polygonBounds";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./AUTOMOVIE_OBSERVATION_EPSILON";
import { AUTOMOVIE_OBSERVATION_INSET_LADDER } from "./AUTOMOVIE_OBSERVATION_INSET_LADDER";
import { IAutoMovieBuiltEnvelopeCorner } from "./IAutoMovieBuiltEnvelopeCorner";
import { IAutoMovieSpaceObservationStation } from "./IAutoMovieSpaceObservationStation";
import { builtConvexCellVertices } from "./builtConvexCellVertices";
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

/** The first point of a ladder toward the interior centre that lands inside. */
const settle = (
  space: IAutoMovieBuiltSpace,
  from: IAutoMovieVector3,
  centre: IAutoMovieVector3,
): IAutoMovieVector3 | null => {
  for (const fraction of AUTOMOVIE_OBSERVATION_INSET_LADDER) {
    const point = Vector3.lerp(from, centre, fraction);
    if (builtSpaceContainsPoint(space, point)) return point;
  }
  return null;
};

/** Aim one station at a target, or refuse it when the two coincide. */
const aim = (
  position: IAutoMovieVector3,
  target: IAutoMovieVector3,
): IAutoMovieSpaceObservationStation["pose"] => {
  const offset = Vector3.subtract(target, position);
  if (Vector3.length(offset) <= AUTOMOVIE_OBSERVATION_EPSILON) return null;
  return { position, direction: Vector3.normalize(offset), target };
};

/** The interior point every other interior station is measured against. */
const interiorCentre = (
  space: IAutoMovieBuiltSpace,
  bounds: IAutoMovieSubjectBox,
): IAutoMovieVector3 | null => {
  const middle = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  };
  if (builtSpaceContainsPoint(space, middle)) return middle;
  // A space split into several cells, or pierced by a void, can miss its own
  // box centre. A convex cell contains the mean of its own corners, and that
  // cell is part of the space's own union, so the first cell closing a volume
  // supplies an interior point without a second containment test. A cell that
  // closes nothing supplies no corners and is passed over.
  for (const cell of space.cells) {
    const vertices = builtConvexCellVertices(cell);
    if (vertices.length === 0) continue;
    return Vector3.scale(
      vertices.reduce((sum, vertex) => Vector3.add(sum, vertex), {
        x: 0,
        y: 0,
        z: 0,
      }),
      1 / vertices.length,
    );
  }
  return null;
};

/** World centre of one opening's void, or of its host face when uncut. */
const openingCentre = (
  environment: IAutoMovieBuiltEnvironment,
  opening: IAutoMovieBuiltOpening,
): IAutoMovieVector3 | null => {
  const face = environment.boundaries.find(
    (candidate) => candidate.id === opening.boundary,
  )?.face;
  if (face === undefined) return null;
  const profile = opening.profile;
  let planar = outlineCentroid(face.outline);
  if (profile !== undefined) {
    const box = polygonBounds(outlineHull(profile));
    planar = {
      x: (box.min.x + box.max.x) / 2,
      y: (box.min.y + box.max.y) / 2,
    };
  }
  return Vector3.add(
    face.origin,
    Quaternion.rotateVector(face.rotation, {
      x: planar.x,
      y: planar.y,
      z: 0,
    }),
  );
};

/** Where an eye stands to read one opening from inside the space it serves. */
const thresholdPose = (props: {
  environment: IAutoMovieBuiltEnvironment;
  space: IAutoMovieBuiltSpace;
  opening: IAutoMovieBuiltOpening;
  anchor: IAutoMovieVector3;
}): IAutoMovieSpaceObservationStation["pose"] => {
  const mouth = openingCentre(props.environment, props.opening);
  if (mouth === null) return null;
  const settled = settle(
    props.space,
    { ...mouth, y: props.anchor.y },
    props.anchor,
  );
  return settled === null ? null : aim(settled, props.anchor);
};

/** World centre of one opening's void, or of its host face when uncut. */
const openingCentre = (
  environment: IAutoMovieBuiltEnvironment,
  opening: IAutoMovieBuiltOpening,
): IAutoMovieVector3 | null => {
  const face = environment.boundaries.find(
    (candidate) => candidate.id === opening.boundary,
  )?.face;
  if (face === undefined) return null;
  const profile = opening.profile;
  let planar = outlineCentroid(face.outline);
  if (profile !== undefined) {
    const box = polygonBounds(outlineHull(profile));
    planar = {
      x: (box.min.x + box.max.x) / 2,
      y: (box.min.y + box.max.y) / 2,
    };
  }
  return Vector3.add(
    face.origin,
    Quaternion.rotateVector(face.rotation, {
      x: planar.x,
      y: planar.y,
      z: 0,
    }),
  );
};
