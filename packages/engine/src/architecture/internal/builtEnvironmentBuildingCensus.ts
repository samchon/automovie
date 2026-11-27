import {
  type IAutoMovieBuildingObservationCensus,
  IAutoMovieBuildingUnit,
  IAutoMovieBuiltConnector,
  type IAutoMovieBuiltEnvelopeCorner,
  type IAutoMovieBuiltEnvelopeFace,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

import { compareRenderIds } from "../../render/internal/compareRenderIds";
import { builtConnectorStops } from "./builtConnectorStops";
import { builtEnvelopeFaceCorners } from "./builtEnvelopeFaceCorners";
import { builtEnvironmentEnvelopeFaces } from "./builtEnvironmentEnvelopeFaces";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/*
 * The complete observation topology of every building unit in one environment.
 *
 * This is the building aggregate a review counts against. A building is not the
 * sum of the rooms a space tree happens to index, so the census carries the
 * envelope, its corners, the openings cut through it, and the connectors that
 * cross it beside the spaces, and every one of those populations is derived
 * from the record rather than declared by whoever writes the review.
 *
 * Faces and corners are those of builtEnvironmentEnvelopeFaces and
 * builtEnvironmentEnvelopeCorners owned by the building. Entrances are
 * the openings on the building's exposed boundaries, spaces are the descendants
 * of its root that state a volume, and connectors are those stopping at any
 * descendant space, volume or not, each listed once. Every id list and the
 * census itself are sorted in code-unit order. Throws when a building's root
 * space is undeclared or an exposed face's space belongs to no building unit.
 */
export function builtEnvironmentBuildingCensus(
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuildingObservationCensus[] {
  const faces: IAutoMovieBuiltEnvelopeFace[] =
    builtEnvironmentEnvelopeFaces(environment);
  const corners: IAutoMovieBuiltEnvelopeCorner[] =
    builtEnvelopeFaceCorners(faces);
  return environment.buildings
    .map(
      (
        building: IAutoMovieBuildingUnit,
      ): IAutoMovieBuildingObservationCensus => {
        const owned: Set<string> = builtSpaceSubtree(
          environment.spaces,
          requireBuiltSpace(environment, building.space).id,
        );
        const mine: IAutoMovieBuiltEnvelopeFace[] = faces.filter(
          (face: IAutoMovieBuiltEnvelopeFace): boolean =>
            face.building === building.id,
        );
        const envelope: Set<string> = new Set(
          mine.map(
            (face: IAutoMovieBuiltEnvelopeFace): string => face.boundary,
          ),
        );
        return {
          building: building.id,
          facades: mine.filter(
            (face: IAutoMovieBuiltEnvelopeFace): boolean =>
              face.aspect === "facade",
          ),
          roofs: mine.filter(
            (face: IAutoMovieBuiltEnvelopeFace): boolean =>
              face.aspect === "roof",
          ),
          undersides: mine.filter(
            (face: IAutoMovieBuiltEnvelopeFace): boolean =>
              face.aspect === "underside",
          ),
          corners: corners.filter(
            (corner: IAutoMovieBuiltEnvelopeCorner): boolean =>
              corner.building === building.id,
          ),
          entrances: environment.openings
            .filter((opening: IAutoMovieBuiltOpening): boolean =>
              envelope.has(opening.boundary),
            )
            .map((opening: IAutoMovieBuiltOpening): string => opening.id)
            .sort(compareRenderIds),
          spaces: environment.spaces
            .filter(
              (space: IAutoMovieBuiltSpace): boolean =>
                owned.has(space.id) && builtSpaceStatesVolume(space),
            )
            .map((space: IAutoMovieBuiltSpace): string => space.id)
            .sort(compareRenderIds),
          connectors: [
            ...new Set(
              environment.connectors
                .filter((connector: IAutoMovieBuiltConnector): boolean =>
                  builtConnectorStops(connector).some((stop: string): boolean =>
                    owned.has(stop),
                  ),
                )
                .map(
                  (connector: IAutoMovieBuiltConnector): string => connector.id,
                ),
            ),
          ].sort(compareRenderIds),
        };
      },
    )
    .sort(
      (
        left: IAutoMovieBuildingObservationCensus,
        right: IAutoMovieBuildingObservationCensus,
      ): number => compareRenderIds(left.building, right.building),
    );
}
