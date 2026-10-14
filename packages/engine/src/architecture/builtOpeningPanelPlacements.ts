import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieMovablePanel,
  IAutoMovieOperationState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { IAutoMovieOpeningPanelPlacement } from "./IAutoMovieOpeningPanelPlacement";
import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { requireBuiltOpening } from "./requireBuiltOpening";

/**
 * Where an opening's panels stand, in world space, at one named state.
 *
 * Omitting the state answers for the state the record itself stands in, which is the placement {@link lowerBuiltEnvironment} stages. Naming another one answers for that state without editing the record, so a shot can ask where the leaf would be when open without a second building.
 *
 * A state is a configuration rather than a moment. A door that swings on screen is a shot `objectMotions` clip over the {@link IAutoMovieOpeningPanelPlacement.node} ids this answers with, so the architecture record never grows a second clock beside the shot's own.
 *
 * Entries follow the opening's panel order, each with the decomposed world transform of the element the panel drives and a normalized rotation. Naming a state applies it to every opening and run that declares a state with that id, through {@link builtEnvironmentWorldMatrices}, so an ancestor leaf of another opening moves too. An opening without an operation answers an empty list. Throws an `Error` when the opening does not exist, the named state is not one of its states, or a panel's element is missing from the record.
 *
 * @param environment Building record holding the opening.
 * @param openingId Id of the opening whose panels are placed.
 * @param stateId Operating state to answer for; the record's own when omitted.
 * @returns One placement per panel, in panel order.
 *
 * @evidence contracts/common.md#principled-implementation Reads the shared world matrix and decomposes it with a normalized rotation. Finite, unsheared TRS representability is a premise beyond an acyclic parent tree: `validateBuiltEnvironment` checks named configurations, but this query does not validate input and decomposition does not preserve arbitrary shear.
 * @evidence contracts/common.md#clear-and-simple-design The query owns only the state check and the per-panel answer; staging under a state lives in `builtEnvironmentWorldMatrices` and the opening lookup in `requireBuiltOpening`, replacing a private copy of each.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no opening, state or element; an unknown state and a missing panel element are refused by name rather than answered at rest.
 * @evidence contracts/common.md#meaningful-documentation States what an omitted state means, that a named state applies building-wide, the entry order and content, the empty answer for an inoperable opening, and each thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms One opening lookup and requested-state scan, the shared world staging cost O(E + O + S + M + V) for elements, opening/connector records, scanned states, moving members and selected values, then one constant-size decomposition per panel.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one opening and state per call from the caller's mutable record, so no staging is cached across calls; within a call the one staging serves every panel.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the staged matrix map only for the call and returns new placement records; nothing is retained.
 */
export const builtOpeningPanelPlacements: (environment: IAutoMovieBuiltEnvironment, openingId: string, stateId?: string) => IAutoMovieOpeningPanelPlacement[] = (
  environment: IAutoMovieBuiltEnvironment,
  openingId: string,
  stateId?: string,
): IAutoMovieOpeningPanelPlacement[] => {
  const opening: IAutoMovieBuiltOpening = requireBuiltOpening(
    environment,
    openingId,
  );
  const operation: IAutoMovieBuiltOpening["operation"] = opening.operation;
  if (operation === undefined) return [];
  if (
    stateId !== undefined &&
    !operation.states.some(
      (state: IAutoMovieOperationState): boolean => state.id === stateId,
    )
  )
    throw new Error(
      `opening "${openingId}" of built environment "${environment.id}" has no operating state "${stateId}"`,
    );
  const matrices: Map<string, number[]> = builtEnvironmentWorldMatrices(
    environment,
    stateId,
  );
  return operation.panels.map(
    (panel: IAutoMovieMovablePanel): IAutoMovieOpeningPanelPlacement => {
      const matrix: number[] | undefined = matrices.get(panel.element);
      if (matrix === undefined)
        throw new Error(
          `built environment "${environment.id}" has no element "${panel.element}" for panel "${panel.id}"`,
        );
      const world: {
        position: IAutoMovieVector3;
        rotation: IAutoMovieQuaternion;
        scale: IAutoMovieVector3;
      } = Matrix4.decompose(matrix);
      return {
        panel: panel.id,
        element: panel.element,
        node: `${environment.id}/${panel.element}`,
        position: world.position,
        rotation: Quaternion.normalize(world.rotation),
        scale: world.scale,
      };
    },
  );
};
