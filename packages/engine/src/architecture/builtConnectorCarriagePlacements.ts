import { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { IAutoMovieConnectorCarriagePlacement } from "./IAutoMovieConnectorCarriagePlacement";

/**
 * Where a run's carriages stand, in world space, at one named state.
 *
 * Omitting the state answers for the state the record itself stands in, which
 * is the placement {@link lowerBuiltEnvironment} stages. Naming another one
 * answers for that state without editing the record, so a shot can ask where
 * the car would be at the top landing while the design still holds it at the
 * bottom. The space each carriage serves is handed back beside its placement,
 * because "where the car is" and "which floor that is" are one answer and
 * making a caller rejoin them invites two.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtConnectorCarriagePlacements` returns where a run's carriages stand, in world space, at one named state. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtConnectorCarriagePlacements` resolves every connector carriage to its world-space placement at the requested state.
 * @evidence requirements/interior/connections-and-circulation.md#interior-access-state `builtConnectorCarriagePlacements` resolves each declared carriage through the connector's named access state and drive onto its served world-space route position.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology `builtConnectorCarriagePlacements` materializes the connector's named operational access state on its declared route topology.
 */
export const builtConnectorCarriagePlacements = (
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
  stateId?: string,
): IAutoMovieConnectorCarriagePlacement[] => {
  const connector = requireConnector(environment, connectorId);
  const operation = connector.operation;
  if (operation === undefined) return [];
  if (
    stateId !== undefined &&
    !operation.states.some((state) => state.id === stateId)
  )
    throw new Error(
      `connector "${connectorId}" of built environment "${environment.id}" has no operating state "${stateId}"`,
    );
  const wanted = stateId ?? operation.state;
  const state = operation.states.find((candidate) => candidate.id === wanted);
  const matrices = worldMatricesOf(
    environment,
    operationDeltas(environment, stateId),
  );
  return operation.carriages.map((carriage) => {
    const world = Matrix4.decompose(
      requireTravellerMatrix(environment, matrices, carriage, "carriage"),
    );
    return {
      carriage: carriage.id,
      element: carriage.element,
      node: `${environment.id}/${carriage.element}`,
      position: world.position,
      rotation: Quaternion.normalize(world.rotation),
      scale: world.scale,
      serves:
        state?.carriages.find((entry) => entry.carriage === carriage.id)
          ?.serves ?? null,
    };
  });
};
