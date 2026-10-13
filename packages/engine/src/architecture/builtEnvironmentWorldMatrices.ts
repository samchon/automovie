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
 * The column-major world matrix of every element, with each moving member
 * displaced to the travel one operating state gives it.
 *
 * An element's local matrix is its rest transform followed by its joint
 * displacement, and its world matrix is its parent's world matrix times that
 * local one, so a displacement rides down the hierarchy: an element parented to
 * a folding leaf is carried by the leaf's travel without a second parenting
 * notion. This is the staging {@link lowerBuiltEnvironment} applies, and every
 * element-measuring query reads it here.
 *
 * Without `stateId`, each opening and connector stands in its own current
 * state. Naming a state applies it to every opening and run that declares a
 * state with that id; a member without such a state, or a state that names no
 * value for one of its members, leaves that member at rest. Validation refuses
 * a state missing a member and two members driving one element, so the
 * displacement table never holds two claims for one element.
 *
 * Parents are assumed to resolve and to be acyclic, which validation enforces:
 * a missing parent throws a `TypeError` and a parent cycle overflows the stack.
 * Keys are element ids and every declared element has an entry.
 *
 * @evidence contracts/common.md#principled-implementation Composes TRS matrices with `Matrix4.compose` and `Matrix4.multiply`, the three.js convention the renderer uses, because composing TRS triples directly shears wrong under a scaled rotating parent; a revolute displacement is the rotation about its pivot written as `T(pivot - R·pivot)·R`, and a prismatic one is a translation along the normalized axis.
 * @evidence contracts/common.md#clear-and-simple-design One owner for element staging under operating states, shared by carriage placement and every element, part and space-content bounds query, so a change to how an element is placed reaches all of them at once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element, opening or connector; a member lacking the requested state or a value stays at rest by the stated rule, and unresolved parents are documented as an assumption validation enforces rather than caught and retried.
 * @evidence contracts/common.md#meaningful-documentation States the column-major matrices, the local and world composition order, how `stateId` selects travel and what a missing state or value means, the validation premises, the failure effects when they are broken, and the key set.
 * @evidence contracts/performance.md#efficient-algorithms Memoized depth-first composition computes each element's world matrix once, so time is linear in the element count plus the summed panel and carriage values scanned per member; the full pass is needed because any element's matrix depends on its whole ancestor chain.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one call each ancestor's world matrix is computed once and reused by every descendant; across calls nothing is cached, because the environment is the caller's mutable record and no key could prove an earlier staging still matches it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates the id index, the displacement table and one sixteen-number matrix per element for one call; the caller owns the returned map, bounded by the element count, and nothing else is retained.
 */
export const builtEnvironmentWorldMatrices = (
  environment: IAutoMovieBuiltEnvironment,
  stateId?: string,
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
  const read = (id: string): number[] => {
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
const operationDeltas = (
  environment: IAutoMovieBuiltEnvironment,
  stateId: string | undefined,
): Map<string, number[]> => {
  const deltas: Map<string, number[]> = new Map();
  for (const opening of environment.openings) {
    const operation: IAutoMovieBuiltOpening["operation"] = opening.operation;
    if (operation === undefined) continue;
    const wanted: string = stateId ?? operation.state;
    const state: IAutoMovieOperationState | undefined = operation.states.find(
      (candidate: IAutoMovieOperationState): boolean => candidate.id === wanted,
    );
    if (state !== undefined) applyPanelState(operation.panels, state, deltas);
  }
  for (const connector of environment.connectors) {
    const operation: IAutoMovieBuiltConnector["operation"] =
      connector.operation;
    if (operation === undefined) continue;
    const wanted: string = stateId ?? operation.state;
    const state: IAutoMovieConnectorState | undefined = operation.states.find(
      (candidate: IAutoMovieConnectorState): boolean => candidate.id === wanted,
    );
    if (state !== undefined)
      applyCarriageState(operation.carriages, state, deltas);
  }
  return deltas;
};

/** Place every panel of one opening at the travel a state gives it. */
const applyPanelState = (
  panels: readonly IAutoMovieMovablePanel[],
  state: IAutoMovieOperationState,
  deltas: Map<string, number[]>,
): void => {
  for (const panel of panels) {
    const entry: IAutoMoviePanelValue | undefined = state.panels.find(
      (value: IAutoMoviePanelValue): boolean => value.panel === panel.id,
    );
    if (entry !== undefined)
      deltas.set(panel.element, travelDelta(panel.motion, entry.value));
  }
};

/** Place every carriage of one run at the travel a state gives it. */
const applyCarriageState = (
  carriages: readonly IAutoMovieConnectorCarriage[],
  state: IAutoMovieConnectorState,
  deltas: Map<string, number[]>,
): void => {
  for (const carriage of carriages) {
    const entry: IAutoMovieCarriageValue | undefined = state.carriages.find(
      (value: IAutoMovieCarriageValue): boolean =>
        value.carriage === carriage.id,
    );
    if (entry !== undefined)
      deltas.set(carriage.element, travelDelta(carriage.motion, entry.value));
  }
};

/** The element-local displacement one moving member carries at one value. */
const travelDelta = (
  motion: IAutoMovieTravelMotion,
  value: number,
): number[] => {
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
    Vector3.subtract(motion.pivot, Quaternion.rotateVector(rotation, motion.pivot)),
    rotation,
    unit,
  );
};
