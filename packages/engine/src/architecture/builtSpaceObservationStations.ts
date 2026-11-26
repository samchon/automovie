import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMoviePlanarPoint,
  type IAutoMovieSpaceObservationStation,
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { builtConvexCellVertices } from "./builtConvexCellVertices";
import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { builtSpaceVolumeBounds } from "./builtSpaceVolumeBounds";
import { ObservationGeometry } from "./internal/ObservationGeometry";
import { outlineCentroid } from "./outlineCentroid";
import { outlineHull } from "./outlineHull";
import { polygonBounds } from "./polygonBounds";
import { requireBuiltSpace } from "./requireBuiltSpace";

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
 * Every returned eye passes the space's numerical containment predicate; this
 * is the stated interior-placement check, not proof of visibility or exact-real
 * containment.
 *
 * The interior candidate is the accepted volume-box centre, otherwise the first
 * enumerated cell-corner mean that passes containment. Enumeration does not
 * prove the cell closes a bounded volume. Reading height is the box floor plus
 * the lesser of {@link ObservationGeometry.EyeHeightMeters} and half box height.
 * A failed raised probe falls back to the interior candidate. Centre views aim
 * along world ±x/±z. Corner/threshold eyes try the fixed inset ladder toward
 * the anchor. Thresholds start from the profile-box centre or host-face
 * centroid at anchor height. Order is centre, corner, then opening-id-sorted
 * thresholds. Shelled spaces have no cell fallback. Missing bounds/anchor/face,
 * failed eye placement or non-finite/negligible aim yields null poses; an
 * unknown space throws.
 *
 * @param environment Building record holding the space.
 * @param spaceId Logical space to observe.
 * @returns Eight interior stations plus one per opening on the space's
 *   boundaries, or none for a volume-less space.
 */
export function builtSpaceObservationStations(
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieSpaceObservationStation[] {
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
                    ObservationGeometry.ProbeMeters,
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
      (
        boundary: IAutoMovieBuiltBoundary,
      ): [string, IAutoMovieBuiltBoundary] => [boundary.id, boundary],
    ),
  );
  const openings: IAutoMovieBuiltOpening[] = environment.openings
    .filter(
      (opening: IAutoMovieBuiltOpening): boolean =>
        boundaries.get(opening.boundary)?.spaces.includes(spaceId) === true,
    )
    .sort(
      (left: IAutoMovieBuiltOpening, right: IAutoMovieBuiltOpening): number =>
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
}

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

/** Fractions tried in order when nudging corner and threshold eyes inward. */
const INSET_FRACTIONS: readonly number[] = [0.05, 0.1, 0.2, 0.35, 0.5];

/**
 * The point every interior station is measured against, at reading height.
 *
 * The eye stands at reading height above the space's own floor, and a space
 * whose stated volume narrows with height can leave that point outside itself,
 * so the interior point it was derived from is kept as the fallback.
 */
function readingAnchor(
  space: IAutoMovieBuiltSpace,
  bounds: IAutoMovieSubjectBox,
): IAutoMovieVector3 | null {
  const interior: IAutoMovieVector3 | null = interiorCentre(space, bounds);
  if (interior === null) return null;
  const eye: IAutoMovieVector3 = {
    ...interior,
    y:
      bounds.min.y +
      Math.min(
        ObservationGeometry.EyeHeightMeters,
        (bounds.max.y - bounds.min.y) / 2,
      ),
  };
  return builtSpaceContainsPoint(space, eye) ? eye : interior;
}

/** An interior point of the space, or null when none is found. */
function interiorCentre(
  space: IAutoMovieBuiltSpace,
  bounds: IAutoMovieSubjectBox,
): IAutoMovieVector3 | null {
  const middle: IAutoMovieVector3 = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  };
  if (builtSpaceContainsPoint(space, middle)) return middle;
  // Cell means are candidate interiors; numerical enumeration/averaging does
  // not replace checking the candidate through the space's own predicate.
  for (const cell of space.cells) {
    const vertices: IAutoMovieVector3[] = builtConvexCellVertices(cell);
    if (vertices.length === 0) continue;
    const centre: IAutoMovieVector3 = Vector3.scale(
      vertices.reduce(
        (
          sum: IAutoMovieVector3,
          vertex: IAutoMovieVector3,
        ): IAutoMovieVector3 => Vector3.add(sum, vertex),
        { x: 0, y: 0, z: 0 },
      ),
      1 / vertices.length,
    );
    if (builtSpaceContainsPoint(space, centre)) return centre;
  }
  return null;
}

/** Pull an eye toward the anchor until it lands inside, then aim it there. */
function settledPose(
  space: IAutoMovieBuiltSpace,
  from: IAutoMovieVector3,
  anchor: IAutoMovieVector3,
): IStationPose {
  for (const fraction of INSET_FRACTIONS) {
    const point: IAutoMovieVector3 = Vector3.lerp(from, anchor, fraction);
    if (builtSpaceContainsPoint(space, point)) return aim(point, anchor);
  }
  return null;
}

/** Aim one station at a target, or refuse it when the two coincide. */
function aim(
  position: IAutoMovieVector3,
  target: IAutoMovieVector3,
): IStationPose {
  const offset: IAutoMovieVector3 = Vector3.subtract(target, position);
  const length: number = Vector3.length(offset);
  if (length <= ObservationGeometry.Epsilon) return null;
  return { position, direction: Vector3.scale(offset, 1 / length), target };
}

/**
 * World centre of one opening's void, or of its host face when uncut, or null
 * when the host boundary states no face to place it on.
 */
function openingCentre(
  boundary: IAutoMovieBuiltBoundary,
  opening: IAutoMovieBuiltOpening,
): IAutoMovieVector3 | null {
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
}
