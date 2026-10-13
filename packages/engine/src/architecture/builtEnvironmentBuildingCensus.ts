import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { IAutoMovieBuildingObservationCensus } from "./IAutoMovieBuildingObservationCensus";
import { builtEnvironmentDescendantSpaces } from "./builtEnvironmentDescendantSpaces";
import { builtEnvironmentEnvelopeCorners } from "./builtEnvironmentEnvelopeCorners";
import { builtEnvironmentEnvelopeFaces } from "./builtEnvironmentEnvelopeFaces";
import { builtEnvironmentSpaceConnectors } from "./builtEnvironmentSpaceConnectors";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";

/**
 * The complete observation topology of every building unit in one environment.
 *
 * This is the building aggregate a review counts against. A building is not the
 * sum of the rooms a space tree happens to index, so the census carries the
 * envelope, its corners, the openings cut through it, and the connectors that
 * cross it beside the spaces, and every one of those populations is derived
 * from the record rather than declared by whoever writes the review.
 *
 * Entrances are the openings on the building's exterior boundaries, spaces are
 * the descendants of its root that state a volume, and connectors are those
 * landing on any owned space. Every id list and the census itself are sorted in
 * code-unit order.
 *
 * @evidence contracts/common.md#principled-implementation Derives each building's populations from the record: exterior faces and corners filtered by building, entrances as openings on its envelope boundaries, volume-stating spaces in its descendant tree, and connectors landing on those spaces, each in code-unit id order.
 * @evidence contracts/common.md#clear-and-simple-design Composes the existing envelope, corner, descendant and connector queries rather than re-deriving them, and returns one plain census record per building.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population is declared by the reviewer; spaces that state no volume are left out through `builtSpaceStatesVolume`, the contract's own located-versus-named distinction, and no building id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States that the census is the aggregate a review counts against, why it carries envelope, corners, openings and connectors beside spaces, how each population is derived, and the sort order.
 * @evidence contracts/performance.md#cost-and-resources Defect: envelope faces are computed twice per call, here and again inside `builtEnvironmentEnvelopeCorners`, each face re-derives its building through a full descendant walk, and corners compare facades pairwise; per building it adds linear filters plus one connector scan per owned space, and nothing is cached.
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
