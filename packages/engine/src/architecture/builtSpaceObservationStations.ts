import { IAutoMovieBuiltEnvironment, IAutoMovieBuiltOpening, IAutoMovieBuiltSpace, IAutoMoviePlanarPoint, IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { outlineHull } from "./outlineHull";
import { polygonBounds } from "./polygonBounds";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./constants/AUTOMOVIE_OBSERVATION_EPSILON";
import { AUTOMOVIE_OBSERVATION_EYE_HEIGHT } from "./constants/AUTOMOVIE_OBSERVATION_EYE_HEIGHT";
import { AUTOMOVIE_OBSERVATION_INSET_LADDER } from "./constants/AUTOMOVIE_OBSERVATION_INSET_LADDER";
import { AUTOMOVIE_OBSERVATION_PROBE } from "./constants/AUTOMOVIE_OBSERVATION_PROBE";
import { IAutoMovieSpaceObservationStation } from "./IAutoMovieSpaceObservationStation";
import { builtConvexCellVertices } from "./builtConvexCellVertices";
import { builtSpaceVolumeBounds } from "./builtSpaceVolumeBounds";

/** Area-weighted centroid of a planar outline, or its vertex mean when flat. */
const outlineCentroid = (
  outline: readonly IAutoMoviePlanarPoint[],
): IAutoMoviePlanarPoint => {
  let doubleArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < outline.length; index++) {
    const from = outline[index]!;
    const to = outline[(index + 1) % outline.length]!;
    const cross = from.x * to.y - to.x * from.y;
    doubleArea += cross;
    x += (from.x + to.x) * cross;
    y += (from.y + to.y) * cross;
  }
  if (Math.abs(doubleArea) <= AUTOMOVIE_OBSERVATION_EPSILON)
    return {
      x: outline.reduce((sum, point) => sum + point.x, 0) / outline.length,
      y: outline.reduce((sum, point) => sum + point.y, 0) / outline.length,
    };
  return { x: x / (3 * doubleArea), y: y / (3 * doubleArea) };
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

/**
 * The closed interior observation population one logical space owes.
 *
 * Four outward views from the interior centre and four inward views from the
 * corners of the space's own extent read the room's proportion, its junctions,
 * and the parts a single flattering angle hides. One threshold view for every
 * opening on one of the space's boundaries reads the arrival, which is the
 * observation a sweep taken from inside can never substitute for. A space that
 * states no volume is a name rather than a room and owes nothing here.
 *
 * Every station's point is proved inside the space's own stated volume before
 * it is returned, which is what separates an interior observation from a
 * turntable that circles the room from outside and photographs its walls.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Enumerates the closed interior station population and proves each camera stands inside its own space.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Implements the centre, corner, and threshold station derivation over a stated space volume.
 */
export const builtSpaceObservationStations = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieSpaceObservationStation[] => {
  const space = environment.spaces.find(
    (candidate) => candidate.id === spaceId,
  );
  if (space === undefined)
    throw new Error(
      `built environment "${environment.id}" has no logical space "${spaceId}"`,
    );
  if (builtSpaceStatesVolume(space) === false) return [];
  const bounds = builtSpaceVolumeBounds(space);
  const interior = bounds === null ? null : interiorCentre(space, bounds);
  // The eye stands at reading height above the space's own floor, and a space
  // whose stated volume narrows with height can leave that point outside
  // itself, so the interior point it was derived from is kept as the fallback.
  const placed =
    bounds === null || interior === null
      ? null
      : {
          bounds,
          anchor: ((eye: IAutoMovieVector3) =>
            builtSpaceContainsPoint(space, eye) ? eye : interior)({
            ...interior,
            y:
              bounds.min.y +
              Math.min(
                AUTOMOVIE_OBSERVATION_EYE_HEIGHT,
                (bounds.max.y - bounds.min.y) / 2,
              ),
          }),
        };
  const stations: IAutoMovieSpaceObservationStation[] = [];
  for (const [id, direction] of [
    ["center-x-minus", { x: -1, y: 0, z: 0 }],
    ["center-x-plus", { x: 1, y: 0, z: 0 }],
    ["center-z-minus", { x: 0, y: 0, z: -1 }],
    ["center-z-plus", { x: 0, y: 0, z: 1 }],
  ] as const)
    stations.push({
      id,
      role: "center",
      opening: null,
      pose:
        placed === null
          ? null
          : aim(
              placed.anchor,
              Vector3.add(
                placed.anchor,
                Vector3.scale(
                  direction,
                  Math.max(
                    placed.bounds.max.x - placed.bounds.min.x,
                    placed.bounds.max.z - placed.bounds.min.z,
                    AUTOMOVIE_OBSERVATION_PROBE,
                  ),
                ),
              ),
            ),
    });
  for (const [id, sx, sz] of [
    ["corner-x-minus-z-minus", "min", "min"],
    ["corner-x-minus-z-plus", "min", "max"],
    ["corner-x-plus-z-minus", "max", "min"],
    ["corner-x-plus-z-plus", "max", "max"],
  ] as const)
    stations.push({
      id,
      role: "corner",
      opening: null,
      pose:
        placed === null
          ? null
          : ((settled: IAutoMovieVector3 | null) =>
              settled === null ? null : aim(settled, placed.anchor))(
              settle(
                space,
                {
                  x: placed.bounds[sx].x,
                  y: placed.anchor.y,
                  z: placed.bounds[sz].z,
                },
                placed.anchor,
              ),
            ),
    });
  for (const opening of environment.openings
    .filter((candidate) =>
      environment.boundaries.some(
        (boundary) =>
          boundary.id === candidate.boundary &&
          boundary.spaces.includes(spaceId),
      ),
    )
    .slice()
    .sort((left, right) => compareAutoMovieRenderIds(left.id, right.id)))
    stations.push({
      id: `threshold-${opening.id}`,
      role: "threshold",
      opening: opening.id,
      pose:
        placed === null
          ? null
          : thresholdPose({
              environment,
              space,
              opening,
              anchor: placed.anchor,
            }),
    });
  return stations;
};
