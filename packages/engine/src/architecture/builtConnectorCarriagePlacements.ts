import { IAutoMovieBuiltConnector, IAutoMovieBuiltEnvironment, IAutoMovieConnectorCarriage, IAutoMovieConnectorState, IAutoMovieMovablePanel, IAutoMovieOperationState, IAutoMovieQuaternion, IAutoMovieTravelMotion } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
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

const requireConnector = (
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
): IAutoMovieBuiltConnector => {
  const connector = environment.connectors.find(
    (candidate) => candidate.id === connectorId,
  );
  if (connector === undefined)
    throw new Error(
      `built environment "${environment.id}" has no connector "${connectorId}"`,
    );
  return connector;
};

const requireTravellerMatrix = (
  environment: IAutoMovieBuiltEnvironment,
  matrices: ReadonlyMap<string, number[]>,
  traveller: { id: string; element: string },
  label: string,
): number[] => {
  const world = matrices.get(traveller.element);
  if (world === undefined)
    throw new Error(
      `built environment "${environment.id}" has no element "${traveller.element}" for ${label} "${traveller.id}"`,
    );
  return world;
};

/**
 * World matrices for every element, optionally displaced by panel travel.
 *
 * A joint displacement is applied after the element's own local transform and
 * therefore rides down the hierarchy, which is what makes a folding leaf work
 * without a second parenting notion: parent its element to the leaf it folds
 * against and the outer leaf's travel carries it.
 */
const worldMatricesOf = (
  environment: IAutoMovieBuiltEnvironment,
  joints: ReadonlyMap<string, number[]> = new Map(),
): Map<string, number[]> => {
  const byId = new Map(
    environment.elements.map((element) => [element.id, element]),
  );
  const matrices = new Map<string, number[]>();
  const read = (id: string): number[] => {
    const cached = matrices.get(id);
    if (cached !== undefined) return cached;
    const element = byId.get(id)!;
    const rest = Matrix4.compose(
      element.transform.translation,
      element.transform.rotation,
      element.transform.scale,
    );
    const joint = joints.get(id);
    const local = joint === undefined ? rest : Matrix4.multiply(rest, joint);
    const world =
      element.parent === null
        ? local
        : Matrix4.multiply(read(element.parent), local);
    matrices.set(id, world);
    return world;
  };
  environment.elements.forEach((element) => read(element.id));
  return matrices;
};

/** The element-local displacement one moving member carries at one value. */
const travelDelta = (
  motion: IAutoMovieTravelMotion,
  value: number,
): number[] => {
  const axis = Vector3.normalize(motion.axis);
  if (motion.kind === "prismatic")
    return Matrix4.compose(
      Vector3.scale(axis, value),
      { x: 0, y: 0, z: 0, w: 1 },
      { x: 1, y: 1, z: 1 },
    );
  const half = value / 2;
  const sine = Math.sin(half);
  const rotation: IAutoMovieQuaternion = {
    x: axis.x * sine,
    y: axis.y * sine,
    z: axis.z * sine,
    w: Math.cos(half),
  };
  // Turning about a pivot is a turn about the origin plus the offset that puts
  // the pivot back where it was.
  return Matrix4.compose(
    Vector3.subtract(
      motion.pivot,
      Quaternion.rotateVector(rotation, motion.pivot),
    ),
    rotation,
    { x: 1, y: 1, z: 1 },
  );
};

/**
 * The element-local displacement every moving member carries in a named state.
 *
 * The default is the environment's own current state; a caller asking for
 * another state gets that one instead, which is how a shot stages the same
 * building with its doors open without editing the record. An opening or run
 * that has no such state simply does not move, so asking for `open` swings the
 * doors that can open and leaves every other opening, and every lift, exactly
 * where it was.
 *
 * Openings and runs share one table because they share one rule: an element
 * carries one displacement. Validation refuses a work where two members claim
 * the same element, so the table is a merge of disjoint keys rather than a
 * race, and whichever member owns the element owns it everywhere.
 *
 * A state that names no value for a member leaves that member at rest.
 * `validateBuiltEnvironment` refuses such a record by name, and answering at
 * rest is what keeps a query over an unvalidated one from failing on a value it
 * was never given.
 */
const operationDeltas = (
  environment: IAutoMovieBuiltEnvironment,
  stateId?: string,
): Map<string, number[]> => {
  const deltas = new Map<string, number[]>();
  for (const opening of environment.openings) {
    const operation = opening.operation;
    if (operation === undefined) continue;
    const wanted = stateId ?? operation.state;
    const state = operation.states.find((candidate) => candidate.id === wanted);
    if (state === undefined) continue;
    applyPanelState(operation.panels, state, deltas);
  }
  for (const connector of environment.connectors) {
    const operation = connector.operation;
    if (operation === undefined) continue;
    const wanted = stateId ?? operation.state;
    const state = operation.states.find((candidate) => candidate.id === wanted);
    if (state === undefined) continue;
    applyCarriageState(operation.carriages, state, deltas);
  }
  return deltas;
};

/** Place every panel of one opening at the travel a named state gives it. */
const applyPanelState = (
  panels: readonly IAutoMovieMovablePanel[],
  state: IAutoMovieOperationState,
  deltas: Map<string, number[]>,
): void => {
  for (const panel of panels) {
    const entry = state.panels.find((value) => value.panel === panel.id);
    if (entry === undefined) continue;
    deltas.set(panel.element, travelDelta(panel.motion, entry.value));
  }
};

/** Place every carriage of one run at the travel a named state gives it. */
const applyCarriageState = (
  carriages: readonly IAutoMovieConnectorCarriage[],
  state: IAutoMovieConnectorState,
  deltas: Map<string, number[]>,
): void => {
  for (const carriage of carriages) {
    const entry = state.carriages.find(
      (value) => value.carriage === carriage.id,
    );
    if (entry === undefined) continue;
    deltas.set(carriage.element, travelDelta(carriage.motion, entry.value));
  }
};
