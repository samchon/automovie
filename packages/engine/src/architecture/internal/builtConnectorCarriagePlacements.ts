import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
  IAutoMovieCarriageValue,
  IAutoMovieConnectorCarriage,
  type IAutoMovieConnectorCarriagePlacement,
  IAutoMovieConnectorState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Matrix4 } from "../../math/Matrix4";
import { Quaternion } from "../../math/Quaternion";
import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { requireBuiltConnector } from "./requireBuiltConnector";

/**
 * Where a run's carriages stand, in world space, at one named state.
 *
 * Omitting the state answers for the state the record itself stands in, which
 * is the placement {@link lowerBuiltEnvironment} stages. Naming another one
 * answers for that state without editing the record, so a shot can ask where
 * the car would be at the top landing while the design still holds it at the
 * bottom. Naming a state applies it to every opening and run that declares a
 * state with that id, and a member without such a state stands at rest, as
 * {@link builtEnvironmentWorldMatrices} states. The space each carriage serves
 * is handed back beside its placement, because "where the car is" and "which
 * floor that is" are one answer and making a caller rejoin them invites two.
 *
 * One placement per carriage in authored order. A connector without an
 * operation answers an empty list, and `serves` is null when the state names no
 * served space for that carriage. Throws when the connector does not exist, the
 * named state is not one of its states, or a carriage's element is missing from
 * the record.
 */
export function builtConnectorCarriagePlacements(
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
  stateId?: string,
): IAutoMovieConnectorCarriagePlacement[] {
  const connector: IAutoMovieBuiltConnector = requireBuiltConnector(
    environment,
    connectorId,
  );
  const operation: IAutoMovieBuiltConnector["operation"] = connector.operation;
  if (operation === undefined) return [];
  const wanted: string = stateId ?? operation.state;
  const state: IAutoMovieConnectorState | undefined = operation.states.find(
    (candidate: IAutoMovieConnectorState): boolean => candidate.id === wanted,
  );
  if (stateId !== undefined && state === undefined)
    throw new Error(
      `connector "${connectorId}" of built environment "${environment.id}" has no operating state "${stateId}"`,
    );
  const matrices: Map<string, number[]> = builtEnvironmentWorldMatrices(
    environment,
    stateId,
  );
  const values: Map<string, IAutoMovieCarriageValue> = new Map();
  for (const entry of state?.carriages ?? [])
    if (!values.has(entry.carriage)) values.set(entry.carriage, entry);
  return operation.carriages.map(
    (
      carriage: IAutoMovieConnectorCarriage,
    ): IAutoMovieConnectorCarriagePlacement => {
      const matrix: number[] | undefined = matrices.get(carriage.element);
      if (matrix === undefined)
        throw new Error(
          `built environment "${environment.id}" has no element "${carriage.element}" for carriage "${carriage.id}"`,
        );
      const world: {
        position: IAutoMovieVector3;
        rotation: IAutoMovieQuaternion;
        scale: IAutoMovieVector3;
      } = Matrix4.decompose(matrix);
      return {
        carriage: carriage.id,
        element: carriage.element,
        node: `${environment.id}/${carriage.element}`,
        position: world.position,
        rotation: Quaternion.normalize(world.rotation),
        scale: world.scale,
        serves: values.get(carriage.id)?.serves ?? null,
      };
    },
  );
}
