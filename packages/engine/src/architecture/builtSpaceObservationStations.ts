import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMoviePlanarPoint,
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { IAutoMovieSpaceObservationStation } from "./IAutoMovieSpaceObservationStation";
import { builtConvexCellVertices } from "./builtConvexCellVertices";
import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { builtSpaceVolumeBounds } from "./builtSpaceVolumeBounds";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./constants/AUTOMOVIE_OBSERVATION_EPSILON";
import { AUTOMOVIE_OBSERVATION_EYE_HEIGHT } from "./constants/AUTOMOVIE_OBSERVATION_EYE_HEIGHT";
import { AUTOMOVIE_OBSERVATION_INSET_LADDER } from "./constants/AUTOMOVIE_OBSERVATION_INSET_LADDER";
import { AUTOMOVIE_OBSERVATION_PROBE } from "./constants/AUTOMOVIE_OBSERVATION_PROBE";
import { outlineCentroid } from "./outlineCentroid";
import { outlineHull } from "./outlineHull";
import { polygonBounds } from "./polygonBounds";
import { requireBuiltSpace } from "./requireBuiltSpace";

/** A station's aimed pose, or null when it could not be placed. */
type IStationPose = IAutoMovieSpaceObservationStation["pose"];

/** The four outward centre views, along world `-x`, `+x`, `-z` and `+z`. */
const CENTRE_VIEWS: readonly (readonly [string, IAutoMovieVector3])[] = [
  ["center-x-minus", { x: -1, y: 0, z: 0 }],
  ["center-x-plus", { x: 1, y: 0, z: 0 }],
  ["center-z-minus", { x: 0, y: 0, z: -1 }],
  ["center-z-plus", { x: 0, y: 0, z: 1 }],
];

/** The four inward corner views, by which box corner each starts from. */
const CORNER_VIEWS: readonly (readonly [
  string,
  "min" | "max",
  "min" | "max",
])[] = [
  ["corner-x-minus-z-minus", "min", "min"],
  ["corner-x-minus-z-plus", "min", "max"],
  ["corner-x-plus-z-minus", "max", "min"],
  ["corner-x-plus-z-plus", "max", "max"],
];

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
 * The anchor stands at reading height, `AUTOMOVIE_OBSERVATION_EYE_HEIGHT` or
 * half the volume's height when that is less, above an interior point: the
 * volume box's centre when the space contains it, otherwise the mean corner of
 * the first cell that closes a volume. When the raised anchor falls outside a
 * space that narrows with height, the interior point itself is used. Centre
 * views look along world `±x` and `±z` from the anchor; corner and threshold
 * eyes are pulled along `AUTOMOVIE_OBSERVATION_INSET_LADDER` toward the anchor
 * until one lands inside, and look at it. A threshold eye starts at the
 * opening's centre, its profile's box centre or else its host face's centroid,
 * at anchor height. Stations come centre, corner, then threshold, with
 * threshold stations sorted by opening id. A shelled space whose box centre
 * falls in a void or notch gets no anchor, so every pose of it is null, as is
 * a threshold pose whose host boundary states no face, and any pose whose eye could not be placed or coincides with its target. Throws
 * an `Error` for an undeclared space id.
 *
 * @param environment Building record holding the space.
 * @param spaceId Logical space to observe.
 * @returns Eight interior stations plus one per opening on the space's boundaries, or none for a volume-less space.
 *
 * @evidence contracts/common.md#principled-implementation Every eye is moved along a fixed inset ladder toward an interior anchor and accepted only where `builtSpaceContainsPoint` proves it inside the stated volume, so no station is placed by assumption; the anchor is the box centre or a convex cell's corner mean, which a convex cell always contains. A shelled space with a hollow centre has no fallback, a limitation the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design Station roles are two fixed tables and one opening pass over shared settle and aim helpers; containment, volume bounds, face centroid and the space lookup are the shared architecture helpers rather than copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space, opening or room type; the eye height, probe length and inset ladder are named observation constants applied to every space alike.
 * @evidence contracts/common.md#meaningful-documentation States the closed population and why each role exists, the containment proof, how the anchor is chosen and its fallback, each role's direction and start point, the station order, every null pose case, and the thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms Builds a boundary index once, so selecting and centring the space's openings is linear in the opening and boundary counts plus a sort of the selected openings; each station costs at most one containment test per ladder rung.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one space per call from the caller's mutable record; within the call the anchor and boundary index serve every station.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the boundary index only for the call; the caller owns the returned station list, bounded by eight plus the space's opening count.
 */
export const builtSpaceObservationStations = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieSpaceObservationStation[] => {
  const space: IAutoMovieBuiltSpace = requireBuiltSpace(environment, spaceId);
  if (builtSpaceStatesVolume(space) === false) return [];
  const bounds: IAutoMovieSubjectBox | null = builtSpaceVolumeBounds(space);
  const anchor: IAutoMovieVector3 | null =
    bounds === null ? null : readingAnchor(space, bounds);
  const stations: IAutoMovieSpaceObservationStation[] = [];
  for (const [id, direction] of CENTRE_VIEWS)
    stations.push({
      id,
      role: "center",
      opening: null,
      pose:
        bounds === null || anchor === null
          ? null
          : aim(
              anchor,
              Vector3.add(
                anchor,
                Vector3.scale(
                  direction,
                  Math.max(
                    bounds.max.x - bounds.min.x,
                    bounds.max.z - bounds.min.z,
                    AUTOMOVIE_OBSERVATION_PROBE,
                  ),
                ),
              ),
            ),
    });
  for (const [id, sx, sz] of CORNER_VIEWS)
    stations.push({
      id,
      role: "corner",
      opening: null,
      pose:
        bounds === null || anchor === null
          ? null
          : settledPose(
              space,
              { x: bounds[sx].x, y: anchor.y, z: bounds[sz].z },
              anchor,
            ),
    });
  const boundaries: Map<string, IAutoMovieBuiltBoundary> = new Map(
    environment.boundaries.map(
      (boundary: IAutoMovieBuiltBoundary): [string, IAutoMovieBuiltBoundary] => [
        boundary.id,
        boundary,
      ],
    ),
  );
  const openings: IAutoMovieBuiltOpening[] = environment.openings
    .filter(
      (opening: IAutoMovieBuiltOpening): boolean =>
        boundaries.get(opening.boundary)?.spaces.includes(spaceId) === true,
    )
    .sort((left: IAutoMovieBuiltOpening, right: IAutoMovieBuiltOpening): number =>
      compareAutoMovieRenderIds(left.id, right.id),
    );
  for (const opening of openings) {
    const mouth: IAutoMovieVector3 | null =
      anchor === null
        ? null
        : openingCentre(boundaries.get(opening.boundary)!, opening);
    stations.push({
      id: `threshold-${opening.id}`,
      role: "threshold",
      opening: opening.id,
      pose:
        anchor === null || mouth === null
          ? null
          : settledPose(space, { ...mouth, y: anchor.y }, anchor),
    });
  }
  return stations;
};

/**
 * The point every interior station is measured against, at reading height.
 *
 * The eye stands at reading height above the space's own floor, and a space
 * whose stated volume narrows with height can leave that point outside itself,
 * so the interior point it was derived from is kept as the fallback.
 */
const readingAnchor = (
  space: IAutoMovieBuiltSpace,
  bounds: IAutoMovieSubjectBox,
): IAutoMovieVector3 | null => {
  const interior: IAutoMovieVector3 | null = interiorCentre(space, bounds);
  if (interior === null) return null;
  const eye: IAutoMovieVector3 = {
    ...interior,
    y:
      bounds.min.y +
      Math.min(
        AUTOMOVIE_OBSERVATION_EYE_HEIGHT,
        (bounds.max.y - bounds.min.y) / 2,
      ),
  };
  return builtSpaceContainsPoint(space, eye) ? eye : interior;
};

/** An interior point of the space, or null when none is found. */
const interiorCentre = (
  space: IAutoMovieBuiltSpace,
  bounds: IAutoMovieSubjectBox,
): IAutoMovieVector3 | null => {
  const middle: IAutoMovieVector3 = {
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
    const vertices: IAutoMovieVector3[] = builtConvexCellVertices(cell);
    if (vertices.length === 0) continue;
    return Vector3.scale(
      vertices.reduce(
        (sum: IAutoMovieVector3, vertex: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(sum, vertex),
        { x: 0, y: 0, z: 0 },
      ),
      1 / vertices.length,
    );
  }
  return null;
};

/** Pull an eye toward the anchor until it lands inside, then aim it there. */
const settledPose = (
  space: IAutoMovieBuiltSpace,
  from: IAutoMovieVector3,
  anchor: IAutoMovieVector3,
): IStationPose => {
  for (const fraction of AUTOMOVIE_OBSERVATION_INSET_LADDER) {
    const point: IAutoMovieVector3 = Vector3.lerp(from, anchor, fraction);
    if (builtSpaceContainsPoint(space, point)) return aim(point, anchor);
  }
  return null;
};

/** Aim one station at a target, or refuse it when the two coincide. */
const aim = (
  position: IAutoMovieVector3,
  target: IAutoMovieVector3,
): IStationPose => {
  const offset: IAutoMovieVector3 = Vector3.subtract(target, position);
  if (Vector3.length(offset) <= AUTOMOVIE_OBSERVATION_EPSILON) return null;
  return { position, direction: Vector3.normalize(offset), target };
};

/**
 * World centre of one opening's void, or of its host face when uncut, or null
 * when the host boundary states no face to place it on.
 */
const openingCentre = (
  boundary: IAutoMovieBuiltBoundary,
  opening: IAutoMovieBuiltOpening,
): IAutoMovieVector3 | null => {
  const face: IAutoMovieBuiltBoundary["face"] = boundary.face;
  if (face === undefined) return null;
  let planar: IAutoMoviePlanarPoint;
  if (opening.profile === undefined) planar = outlineCentroid(face.outline);
  else {
    const box: { min: IAutoMoviePlanarPoint; max: IAutoMoviePlanarPoint } =
      polygonBounds(outlineHull(opening.profile));
    planar = { x: (box.min.x + box.max.x) / 2, y: (box.min.y + box.max.y) / 2 };
  }
  return Vector3.add(
    face.origin,
    Quaternion.rotateVector(face.rotation, { x: planar.x, y: planar.y, z: 0 }),
  );
};
