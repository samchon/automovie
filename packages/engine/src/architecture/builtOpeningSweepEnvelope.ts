import { IAutoMovieBuiltEnvironment, IAutoMovieBuiltOpening, IAutoMovieConnectorCarriage, IAutoMovieConnectorState, IAutoMovieMovablePanel, IAutoMovieOperationState, IAutoMovieQuaternion, IAutoMovieTravelMotion, IAutoMovieVector3 } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieOpeningSweep } from "./IAutoMovieOpeningSweep";

/**
 * Slack, in radians, on the full turn a revolute panel may travel.
 *
 * Validation and the swept-envelope solver share this on purpose: the cap is
 * what bounds the solver's critical-angle walk, so a range the validator waved
 * through but the solver could not enumerate would be a hang rather than a
 * disagreement.
 */
const FULL_TURN_EPSILON = 1e-6;

/**
 * The world volume each panel of an opening sweeps across its whole travel.
 *
 * The envelope is solved rather than sampled. Every corner of a turning leaf
 * traces `A + B cos(t) + D sin(t)` under the panel's own placement, and an
 * affine world matrix keeps that form, so each axis is a single cosine whose
 * extremes are its endpoints and the critical angles the travel actually
 * crosses. A sliding leaf is linear and reaches its extremes at its limits.
 * Nothing here judges whether a person can pass the leaf: this is the volume a
 * later clearance or collision analysis reads, not its verdict.
 *
 * The answer is **per panel, and only that panel's own travel**. Ancestors
 * stand where the environment's current state puts them, so an inner folding
 * leaf is measured against the outer leaf as it currently stands. That is the
 * volume this leaf sweeps from where the design has it, not the union over
 * every configuration a chain of leaves could reach between its named states. A
 * caller wanting that union asks for each state in turn and takes the hull
 * itself; inventing it here would quietly report a chain's envelope under one
 * panel's name.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtOpeningSweepEnvelope` produces the world volume each panel of an opening sweeps across its whole travel. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtOpeningSweepEnvelope` derives the world-space volume swept by each panel across the opening's full travel.
 * @evidence requirements/interior/doors-windows-and-openings.md#interior-opening-operable-state `builtOpeningSweepEnvelope` evaluates every declared panel across the opening's named travel states and returns its complete world-space sweep volume.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation `builtOpeningSweepEnvelope` turns the host opening's declared panel operation into a measurable travel envelope.
 * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-operable-state `builtOpeningSweepEnvelope` computes each exterior opening panel's named-state travel as a world-space sweep rather than treating operability as metadata.
 * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-operable-sweep-invariant `builtOpeningSweepEnvelope` measures the validated panel travel and sweep invariant for an operable facade opening.
 * @evidence requirements/interior/clearance-anthropometrics-and-accessibility.md#interior-static-dynamic-clearance `builtOpeningSweepEnvelope` returns the world-space volume occupied across each panel's declared travel for downstream dynamic-clearance checks.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-anthropometric-accessibility-clearance The sweep implements the moving-opening envelope subset without claiming route, reach, jurisdiction, or accessibility compliance.
 */
export const builtOpeningSweepEnvelope = (
  environment: IAutoMovieBuiltEnvironment,
  openingId: string,
): IAutoMovieOpeningSweep[] => {
  const opening = requireOpening(environment, openingId);
  const operation = opening.operation;
  if (operation === undefined) return [];
  const staged = operationDeltas(environment);
  return operation.panels.map((panel) => {
    requireEnumerableTravel(environment, panel);
    // The panel's own travel is what is being measured, so it is the one joint
    // left at rest; every other joint, its ancestors included, stands where the
    // environment's current state puts it.
    const held = new Map(staged);
    held.delete(panel.element);
    const base = requireTravellerMatrix(
      environment,
      worldMatricesOf(environment, held),
      panel,
      "panel",
    );
    const corners: IAutoMovieVector3[] = [
      { x: 0, y: 0, z: 0 },
      { x: panel.width, y: 0, z: 0 },
      { x: panel.width, y: panel.height, z: 0 },
      { x: 0, y: panel.height, z: 0 },
    ];
    const swept = corners.map((corner) =>
      sweptCornerBounds(base, panel.motion, corner),
    );
    return {
      panel: panel.id,
      element: panel.element,
      min: {
        x: Math.min(...swept.map((bound) => bound.min.x)),
        y: Math.min(...swept.map((bound) => bound.min.y)),
        z: Math.min(...swept.map((bound) => bound.min.z)),
      },
      max: {
        x: Math.max(...swept.map((bound) => bound.max.x)),
        y: Math.max(...swept.map((bound) => bound.max.y)),
        z: Math.max(...swept.map((bound) => bound.max.z)),
      },
    };
  });
};

const requireOpening = (
  environment: IAutoMovieBuiltEnvironment,
  openingId: string,
): IAutoMovieBuiltOpening => {
  const opening = environment.openings.find(
    (candidate) => candidate.id === openingId,
  );
  if (opening === undefined)
    throw new Error(
      `built environment "${environment.id}" has no opening "${openingId}"`,
    );
  return opening;
};

/**
 * Refuse a panel whose travel the swept envelope could not enumerate.
 *
 * The solver walks the critical angles the travel actually crosses, so an
 * infinite limit or a range spanning more than a full turn is not a wrong
 * answer waiting to happen: it is a walk that never reaches its end.
 * {@link validateBuiltEnvironment} refuses both by name and shares the very same
 * cap, so this only ever fires on a record that was never validated — and on
 * one of those, a named refusal is the only acceptable outcome.
 */
const requireEnumerableTravel = (
  environment: IAutoMovieBuiltEnvironment,
  panel: IAutoMovieMovablePanel,
): void => {
  const { min, max } = panel.motion;
  if (
    Number.isFinite(min) === false ||
    Number.isFinite(max) === false ||
    (panel.motion.kind === "revolute" &&
      max - min > 2 * Math.PI + FULL_TURN_EPSILON)
  )
    throw new Error(
      `panel "${panel.id}" of built environment "${environment.id}" travels [${min}, ${max}], which no swept envelope can enumerate`,
    );
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

/** Apply a column-major matrix to a point. */
const applyMatrix = (
  matrix: readonly number[],
  point: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x:
    matrix[0]! * point.x +
    matrix[4]! * point.y +
    matrix[8]! * point.z +
    matrix[12]!,
  y:
    matrix[1]! * point.x +
    matrix[5]! * point.y +
    matrix[9]! * point.z +
    matrix[13]!,
  z:
    matrix[2]! * point.x +
    matrix[6]! * point.y +
    matrix[10]! * point.z +
    matrix[14]!,
});

/** Apply a column-major matrix's linear part to a direction. */
const applyDirection = (
  matrix: readonly number[],
  vector: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: matrix[0]! * vector.x + matrix[4]! * vector.y + matrix[8]! * vector.z,
  y: matrix[1]! * vector.x + matrix[5]! * vector.y + matrix[9]! * vector.z,
  z: matrix[2]! * vector.x + matrix[6]! * vector.y + matrix[10]! * vector.z,
});

/** The world bounds one leaf corner reaches across a panel's whole travel. */
const sweptCornerBounds = (
  base: readonly number[],
  motion: IAutoMovieTravelMotion,
  corner: IAutoMovieVector3,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
  const axis = Vector3.normalize(motion.axis);
  if (motion.kind === "prismatic") {
    const ends = [motion.min, motion.max].map((value) =>
      applyMatrix(base, Vector3.add(corner, Vector3.scale(axis, value))),
    );
    return boundsOf(ends);
  }
  const offset = Vector3.subtract(corner, motion.pivot);
  const along = Vector3.scale(axis, Vector3.dot(axis, offset));
  const center = applyMatrix(base, Vector3.add(motion.pivot, along));
  const cosine = applyDirection(base, Vector3.subtract(offset, along));
  const sine = applyDirection(base, Vector3.cross(axis, offset));
  const reach = (component: "x" | "y" | "z"): { low: number; high: number } => {
    const phase = Math.atan2(sine[component], cosine[component]);
    const angles = [motion.min, motion.max];
    const first = Math.ceil((motion.min - phase) / Math.PI);
    const last = Math.floor((motion.max - phase) / Math.PI);
    for (let step = first; step <= last; ++step)
      angles.push(phase + step * Math.PI);
    const values = angles.map(
      (angle) =>
        center[component] +
        cosine[component] * Math.cos(angle) +
        sine[component] * Math.sin(angle),
    );
    return { low: Math.min(...values), high: Math.max(...values) };
  };
  const x = reach("x");
  const y = reach("y");
  const z = reach("z");
  return {
    min: { x: x.low, y: y.low, z: z.low },
    max: { x: x.high, y: y.high, z: z.high },
  };
};

/**
 * The axis-aligned box containing every given point.
 *
 * Folded rather than spread through `Math.min`, because the callers are no
 * longer only the four corners of a leaf: measuring a space's contents hands
 * this every vertex the space draws, and a spread of that many arguments is a
 * stack overflow rather than a slow answer.
 */
const boundsOf = (
  points: readonly IAutoMovieVector3[],
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const point of points) {
    min.x = Math.min(min.x, point.x);
    min.y = Math.min(min.y, point.y);
    min.z = Math.min(min.z, point.z);
    max.x = Math.max(max.x, point.x);
    max.y = Math.max(max.y, point.y);
    max.z = Math.max(max.z, point.z);
  }
  return { min, max };
};
