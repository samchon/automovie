import { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { AUTOMOVIE_OBSERVATION_EYE_HEIGHT } from "./AUTOMOVIE_OBSERVATION_EYE_HEIGHT";
import { AUTOMOVIE_OBSERVATION_PROBE } from "./AUTOMOVIE_OBSERVATION_PROBE";
import { IAutoMovieSpaceObservationStation } from "./IAutoMovieSpaceObservationStation";
import { builtSpaceVolumeBounds } from "./builtSpaceVolumeBounds";

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
