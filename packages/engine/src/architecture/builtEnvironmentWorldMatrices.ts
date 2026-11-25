import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieCarriageValue,
  IAutoMovieConnectorCarriage,
  IAutoMovieConnectorState,
  IAutoMovieMovablePanel,
  IAutoMovieOperationState,
  IAutoMoviePanelValue,
  IAutoMovieQuaternion,
  IAutoMovieTravelMotion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * The column-major world matrix of every element, displaced by its selected
 * operating state.
 *
 * The local matrix is rest transform times joint displacement; the world matrix
 * is parent world times local. Travel consequently carries descendants, and
 * {@link lowerBuiltEnvironment} and element measurements share this staging.
 *
 * Omitting stateId selects each operation's current state. A string selects
 * that name wherever declared; an operation without it, or a member without a
 * value, stays at rest. A selector chooses a name or null per operation. State
 * and value lookup preserve the first matching entry. Validated records require
 * every member value and prohibit multiple members driving one element;
 * otherwise later operation iteration overwrites a shared driven element's
 * displacement.
 *
 * Parents must resolve and be acyclic: an unresolved parent throws a TypeError
 * and a cycle or sufficiently deep chain can exhaust the call stack. Returned
 * keys are element ids, with one world matrix per id under the validated
 * unique-id premise.
 */
export const builtEnvironmentWorldMatrices: (
  environment: IAutoMovieBuiltEnvironment,
  stateId?:
    | string
    | ((
        member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector,
      ) => string | null),
) => Map<string, number[]> = (
  environment: IAutoMovieBuiltEnvironment,
  stateId?:
    | string
    | ((
        member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector,
      ) => string | null),
): Map<string, number[]> => {
  const joints: Map<string, number[]> = operationDeltas(environment, stateId);
  const byId: Map<string, IAutoMovieBuiltElement> = new Map(
    environment.elements.map(
      (element: IAutoMovieBuiltElement): [string, IAutoMovieBuiltElement] => [
        element.id,
        element,
      ],
    ),
  );
  const matrices: Map<string, number[]> = new Map();
  const read: (id: string) => number[] = (id: string): number[] => {
    const cached: number[] | undefined = matrices.get(id);
    if (cached !== undefined) return cached;
    const element: IAutoMovieBuiltElement = byId.get(id)!;
    const rest: number[] = Matrix4.compose(
      element.transform.translation,
      element.transform.rotation,
      element.transform.scale,
    );
    const joint: number[] | undefined = joints.get(id);
    const local: number[] =
      joint === undefined ? rest : Matrix4.multiply(rest, joint);
    const world: number[] =
      element.parent === null
        ? local
        : Matrix4.multiply(read(element.parent), local);
    matrices.set(id, world);
    return world;
  };
  for (const element of environment.elements) read(element.id);
  return matrices;
};

/** The element-local displacement every moving member carries in one state. */
const operationDeltas: (
  environment: IAutoMovieBuiltEnvironment,
  stateId: [
    IAutoMovieBuiltEnvironment,
    (
      | string
      | ((
          member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector,
        ) => string | null)
      | undefined
    ),
  ][1],
) => Map<string, number[]> = (
  environment: IAutoMovieBuiltEnvironment,
  stateId: [
    IAutoMovieBuiltEnvironment,
    (
      | string
      | ((
          member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector,
        ) => string | null)
      | undefined
    ),
  ][1],
): Map<string, number[]> => {
  const choose: (
    member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector,
    current: string,
  ) => string | null = (
    member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector,
    current: string,
  ): string | null =>
    typeof stateId === "function" ? stateId(member) : (stateId ?? current);
  const deltas: Map<string, number[]> = new Map();
  for (const opening of environment.openings) {
    const operation: IAutoMovieBuiltOpening["operation"] = opening.operation;
    if (operation === undefined) continue;
    const wanted: string | null = choose(opening, operation.state);
    const state: IAutoMovieOperationState | undefined = operation.states.find(
      (candidate: IAutoMovieOperationState): boolean => candidate.id === wanted,
    );
    if (state !== undefined) applyPanelState(operation.panels, state, deltas);
  }
  for (const connector of environment.connectors) {
    const operation: IAutoMovieBuiltConnector["operation"] =
      connector.operation;
    if (operation === undefined) continue;
    const wanted: string | null = choose(connector, operation.state);
    const state: IAutoMovieConnectorState | undefined = operation.states.find(
      (candidate: IAutoMovieConnectorState): boolean => candidate.id === wanted,
    );
    if (state !== undefined)
      applyCarriageState(operation.carriages, state, deltas);
  }
  return deltas;
};

/** Place every panel of one opening at the travel a state gives it. */
const applyPanelState: (
  panels: readonly IAutoMovieMovablePanel[],
  state: IAutoMovieOperationState,
  deltas: Map<string, number[]>,
) => void = (
  panels: readonly IAutoMovieMovablePanel[],
  state: IAutoMovieOperationState,
  deltas: Map<string, number[]>,
): void => {
  const values: Map<string, IAutoMoviePanelValue> = new Map();
  for (const entry of state.panels)
    if (!values.has(entry.panel)) values.set(entry.panel, entry);
  for (const panel of panels) {
    const entry: IAutoMoviePanelValue | undefined = values.get(panel.id);
    if (entry !== undefined)
      deltas.set(panel.element, travelDelta(panel.motion, entry.value));
  }
};

/** Place every carriage of one run at the travel a state gives it. */
const applyCarriageState: (
  carriages: readonly IAutoMovieConnectorCarriage[],
  state: IAutoMovieConnectorState,
  deltas: Map<string, number[]>,
) => void = (
  carriages: readonly IAutoMovieConnectorCarriage[],
  state: IAutoMovieConnectorState,
  deltas: Map<string, number[]>,
): void => {
  const values: Map<string, IAutoMovieCarriageValue> = new Map();
  for (const entry of state.carriages)
    if (!values.has(entry.carriage)) values.set(entry.carriage, entry);
  for (const carriage of carriages) {
    const entry: IAutoMovieCarriageValue | undefined = values.get(carriage.id);
    if (entry !== undefined)
      deltas.set(carriage.element, travelDelta(carriage.motion, entry.value));
  }
};

/** The element-local displacement one moving member carries at one value. */
const travelDelta: (
  motion: IAutoMovieTravelMotion,
  value: number,
) => number[] = (motion: IAutoMovieTravelMotion, value: number): number[] => {
  const axis: IAutoMovieVector3 = Vector3.normalize(motion.axis);
  const unit: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };
  if (motion.kind === "prismatic")
    return Matrix4.compose(
      Vector3.scale(axis, value),
      { x: 0, y: 0, z: 0, w: 1 },
      unit,
    );
  const sine: number = Math.sin(value / 2);
  const rotation: IAutoMovieQuaternion = {
    x: axis.x * sine,
    y: axis.y * sine,
    z: axis.z * sine,
    w: Math.cos(value / 2),
  };
  // Turning about a pivot is a turn about the origin plus the offset that puts
  // the pivot back where it was.
  return Matrix4.compose(
    Vector3.subtract(
      motion.pivot,
      Quaternion.rotateVector(rotation, motion.pivot),
    ),
    rotation,
    unit,
  );
};
