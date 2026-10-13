import {
  IAutoMovieBuildingUnit,
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { IAutoMovieBuildingObservationCensus } from "./IAutoMovieBuildingObservationCensus";
import { IAutoMovieBuiltEnvelopeCorner } from "./IAutoMovieBuiltEnvelopeCorner";
import { IAutoMovieBuiltEnvelopeFace } from "./IAutoMovieBuiltEnvelopeFace";
import { builtConnectorStops } from "./builtConnectorStops";
import { builtEnvelopeFaceCorners } from "./builtEnvelopeFaceCorners";
import { builtEnvironmentEnvelopeFaces } from "./builtEnvironmentEnvelopeFaces";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * The complete observation topology of every building unit in one environment.
 *
 * This is the building aggregate a review counts against. A building is not the
 * sum of the rooms a space tree happens to index, so the census carries the
 * envelope, its corners, the openings cut through it, and the connectors that
 * cross it beside the spaces, and every one of those populations is derived
 * from the record rather than declared by whoever writes the review.
 *
 * Faces and corners are those of {@link builtEnvironmentEnvelopeFaces} and
 * {@link builtEnvironmentEnvelopeCorners} owned by the building. Entrances are
 * the openings on the building's exposed boundaries, spaces are the descendants
 * of its root that state a volume, and connectors are those stopping at any
 * descendant space, volume or not, each listed once. Every id list and the
 * census itself are sorted in code-unit order. Throws when a building's root
 * space is undeclared or an exposed face's space belongs to no building unit.
 *
 * @evidence contracts/common.md#principled-implementation Every population is a filter of record-derived sets by ownership: faces and corners by their building field, openings by membership of their boundary in the building's exposed boundaries, and spaces and connectors by membership in the root's subtree, so nothing in the census is declared by its reader.
 * @evidence contracts/common.md#clear-and-simple-design Places the envelope once and derives corners from those same faces through `builtEnvelopeFaceCorners`, reads the subtree and stops through the shared walks, and owns only the grouping per building.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no building, space or production; a connector landing on a volume-less space still counts by the stated rule, an undeclared root space is refused through `requireBuiltSpace`, and the unowned-space refusal passes through from the face query.
 * @evidence contracts/common.md#meaningful-documentation States why the census exists, the source and ownership rule of each population, the volume rule that differs between spaces and connectors, the connector deduplication, the sort, and both throws.
 * @evidence contracts/performance.md#efficient-algorithms One envelope placement and one corner pairing, then per building a linear subtree walk and linear scans of faces, corners, openings, spaces and connector stops, so the total is the envelope cost plus building count times record size; each building's lists are sorted.
 * @evidence contracts/performance.md#reuse-equivalent-work The placed faces feed both the face lists and the corner pairing, so the envelope is placed once per call instead of once for faces and again for corners; nothing persists across calls because the record is the caller's.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Faces, corners and per-building sets live for one call; the caller owns the census, which references the placed faces and corners and is bounded by the record's faces, openings, spaces and connectors.
 */
export const builtEnvironmentBuildingCensus = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuildingObservationCensus[] => {
  const faces: IAutoMovieBuiltEnvelopeFace[] =
    builtEnvironmentEnvelopeFaces(environment);
  const corners: IAutoMovieBuiltEnvelopeCorner[] =
    builtEnvelopeFaceCorners(faces);
  return environment.buildings
    .map(
      (building: IAutoMovieBuildingUnit): IAutoMovieBuildingObservationCensus => {
        const owned: Set<string> = builtSpaceSubtree(
          environment.spaces,
          requireBuiltSpace(environment, building.space).id,
        );
        const mine: IAutoMovieBuiltEnvelopeFace[] = faces.filter(
          (face: IAutoMovieBuiltEnvelopeFace): boolean =>
            face.building === building.id,
        );
        const envelope: Set<string> = new Set(
          mine.map((face: IAutoMovieBuiltEnvelopeFace): string => face.boundary),
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
            .sort(compareAutoMovieRenderIds),
          spaces: environment.spaces
            .filter(
              (space: IAutoMovieBuiltSpace): boolean =>
                owned.has(space.id) && builtSpaceStatesVolume(space),
            )
            .map((space: IAutoMovieBuiltSpace): string => space.id)
            .sort(compareAutoMovieRenderIds),
          connectors: [
            ...new Set(
              environment.connectors
                .filter((connector: IAutoMovieBuiltConnector): boolean =>
                  builtConnectorStops(connector).some(
                    (stop: string): boolean => owned.has(stop),
                  ),
                )
                .map(
                  (connector: IAutoMovieBuiltConnector): string => connector.id,
                ),
            ),
          ].sort(compareAutoMovieRenderIds),
        };
      },
    )
    .sort(
      (
        left: IAutoMovieBuildingObservationCensus,
        right: IAutoMovieBuildingObservationCensus,
      ): number => compareAutoMovieRenderIds(left.building, right.building),
    );
};
