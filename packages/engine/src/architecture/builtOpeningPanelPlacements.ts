import { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { IAutoMovieOpeningPanelPlacement } from "./IAutoMovieOpeningPanelPlacement";

/**
 * Where an opening's panels stand, in world space, at one named state.
 *
 * Omitting the state answers for the state the record itself stands in, which
 * is the placement {@link lowerBuiltEnvironment} stages. Naming another one
 * answers for that state without editing the record, so a shot can ask where
 * the leaf would be when open without a second building.
 *
 * A state is a configuration rather than a moment. A door that swings on screen
 * is a shot `objectMotions` clip over the
 * {@link IAutoMovieOpeningPanelPlacement.node} ids this answers with, so the
 * architecture record never grows a second clock beside the shot's own.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtOpeningPanelPlacements` returns where an opening's panels stand, in world space, at one named state. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtOpeningPanelPlacements` resolves every opening panel to its world-space placement at the requested state.
 * @evidence requirements/interior/doors-windows-and-openings.md#interior-opening-components `builtOpeningPanelPlacements` materializes the declared movable fill panels at their named-state world placements without claiming unmodeled frame or hardware components.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation `builtOpeningPanelPlacements` resolves the movable panel subset of the host opening's declared operation state.
 */
export const builtOpeningPanelPlacements = (
  environment: IAutoMovieBuiltEnvironment,
  openingId: string,
  stateId?: string,
): IAutoMovieOpeningPanelPlacement[] => {
  const opening = requireOpening(environment, openingId);
  const operation = opening.operation;
  if (operation === undefined) return [];
  if (
    stateId !== undefined &&
    !operation.states.some((state) => state.id === stateId)
  )
    throw new Error(
      `opening "${openingId}" of built environment "${environment.id}" has no operating state "${stateId}"`,
    );
  const matrices = worldMatricesOf(
    environment,
    operationDeltas(environment, stateId),
  );
  return operation.panels.map((panel) => {
    const world = Matrix4.decompose(
      requireTravellerMatrix(environment, matrices, panel, "panel"),
    );
    return {
      panel: panel.id,
      element: panel.element,
      node: `${environment.id}/${panel.element}`,
      position: world.position,
      rotation: Quaternion.normalize(world.rotation),
      scale: world.scale,
    };
  });
};
