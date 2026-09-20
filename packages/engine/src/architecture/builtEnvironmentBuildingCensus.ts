import { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { builtEnvironmentDescendantSpaces } from "./builtEnvironmentDescendantSpaces";
import { builtEnvironmentSpaceConnectors } from "./builtEnvironmentSpaceConnectors";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { IAutoMovieBuildingObservationCensus } from "./IAutoMovieBuildingObservationCensus";
import { builtEnvironmentEnvelopeCorners } from "./builtEnvironmentEnvelopeCorners";
import { builtEnvironmentEnvelopeFaces } from "./builtEnvironmentEnvelopeFaces";

/**
 * The complete observation topology of every building unit in one environment.
 *
 * This is the building aggregate a review counts against. A building is not the
 * sum of the rooms a space tree happens to index, so the census carries the
 * envelope, its corners, the openings cut through it, and the connectors that
 * cross it beside the spaces, and every one of those populations is derived
 * from the record rather than declared by whoever writes the review.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Aggregates every derived envelope, corner, entrance, space, and route population per building unit.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Implements the building aggregate the review denominator and the subject hierarchy share.
 */
export const builtEnvironmentBuildingCensus = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuildingObservationCensus[] => {
  const faces = builtEnvironmentEnvelopeFaces(environment);
  const corners = builtEnvironmentEnvelopeCorners(environment);
  return environment.buildings
    .map((building) => {
      const owned = new Set(
        builtEnvironmentDescendantSpaces(environment, building.space),
      );
      const mine = faces.filter((face) => face.building === building.id);
      const envelope = new Set(mine.map((face) => face.boundary));
      return {
        building: building.id,
        facades: mine.filter((face) => face.aspect === "facade"),
        roofs: mine.filter((face) => face.aspect === "roof"),
        undersides: mine.filter((face) => face.aspect === "underside"),
        corners: corners.filter((corner) => corner.building === building.id),
        entrances: environment.openings
          .filter((opening) => envelope.has(opening.boundary))
          .map((opening) => opening.id)
          .sort(compareAutoMovieRenderIds),
        spaces: environment.spaces
          .filter(
            (space) => owned.has(space.id) && builtSpaceStatesVolume(space),
          )
          .map((space) => space.id)
          .sort(compareAutoMovieRenderIds),
        connectors: [
          ...new Set(
            [...owned].flatMap((space) =>
              builtEnvironmentSpaceConnectors(environment, space).map(
                (connector) => connector.id,
              ),
            ),
          ),
        ].sort(compareAutoMovieRenderIds),
      };
    })
    .sort((left, right) =>
      compareAutoMovieRenderIds(left.building, right.building),
    );
};
