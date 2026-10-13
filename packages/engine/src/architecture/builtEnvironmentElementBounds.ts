import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConnectorCarriage,
  IAutoMovieConnectorState,
  IAutoMovieModel,
  IAutoMovieMovablePanel,
  IAutoMovieOperationState,
  IAutoMovieQuaternion,
  IAutoMovieTravelMotion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { tessellate } from "../geometry/tessellate";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Every world point one drawn part contributes. */
const placedPartPoints = (
  part: IAutoMovieModel["parts"][number],
  world: number[],
): IAutoMovieVector3[] => {
  const points: IAutoMovieVector3[] = [];
  const positions =
    part.geometry.type === "primitive"
      ? tessellate(part.geometry.shape).positions
      : part.geometry.mesh.positions;
  const matrix =
    part.transform === null
      ? world
      : Matrix4.multiply(
          world,
          Matrix4.compose(
            part.transform.translation,
            part.transform.rotation,
            part.transform.scale,
          ),
        );
  for (let index = 0; index + 2 < positions.length; index += 3)
    points.push(
      applyMatrix(matrix, {
        x: positions[index]!,
        y: positions[index + 1]!,
        z: positions[index + 2]!,
      }),
    );
  return points;
};

/**
 * The world points one placed element draws, or its origin when it draws none.
 *
 * Parts are placed the way the renderer places them, each under its own
 * transform and then under the element's world matrix. A model the environment
 * does not own is `undefined` here rather than an error, because a runtime
 * model reference is a legal way to furnish a building and the record simply
 * does not carry its vertices.
 */
const placedElementPoints = (
  model: IAutoMovieModel | undefined,
  world: number[],
): IAutoMovieVector3[] => {
  const points = (model === undefined ? [] : model.parts).flatMap((part) =>
    placedPartPoints(part, world),
  );
  return points.length === 0
    ? [applyMatrix(world, { x: 0, y: 0, z: 0 })]
    : points;
};

/**
 * The world box one named element's placed geometry fills.
 *
 * Placement resolution ({@link builtEnvironmentPlacementBounds}) and subject
 * description answer "where is this element" through this query rather than a
 * probe of their own; the medieval-residence campaign built its own
 * element-bounds probe by hand and used it more than the viewer, which is how a
 * second answer to one question gets written.
 * {@link builtEnvironmentElementPartBounds}, {@link builtEnvironmentPartBoxes},
 * and {@link builtEnvironmentSpaceContentBounds} measure with private copies of
 * the same placement and tessellation code, so a change to how an element is
 * placed has to reach all four files.
 *
 * The element stands where the environment's current operating state puts it,
 * so a leaf authored open is measured where it rests. Geometry is read through
 * {@link tessellate} for a primitive and from the stated mesh otherwise, the
 * same vertices the renderer draws.
 *
 * `null` has two ordinary readings, and neither is a fault. An id this record
 * never declared resolves to nothing, because the caller is usually resolving a
 * locator that project source authored and an unresolved locator is a finding
 * for that caller to report rather than an engine refusal — which is why this
 * answers `null` where the space queries such as
 * {@link builtEnvironmentSpaceContentBounds} throw. A transform-only
 * element draws nothing, so it has no geometry box either, and it is left out
 * here for exactly the reason {@link builtEnvironmentSpaceContentBounds} leaves
 * it out of a room's contents: a grouping node standing eight metres up is not
 * something a camera can be aimed at.
 *
 * An element citing a runtime model reference, whose bytes this record never
 * holds, contributes its own world origin rather than nothing, so the answer is
 * a degenerate box at the place the record does state.
 *
 * One call stages the whole work's transform hierarchy, because an element's
 * world matrix is its ancestors' product. A caller resolving many locators over
 * one environment pays that once per locator, which is worth knowing before
 * putting this inside a loop over thousands of placements.
 *
 * @evidence contracts/common.md#principled-implementation Places each part under its own TRS and then the element's world matrix (parent chain times rest times current-state joint), reads vertices from `tessellate` or the stated mesh, and folds an axis-aligned box; an element without vertices yields its world origin as a degenerate box.
 * @evidence contracts/common.md#clear-and-simple-design Defect: the world-matrix, operation-delta, travel-delta, part-placement, matrix-apply and box-fold helpers are verbatim copies shared with `builtEnvironmentElementPartBounds`, `builtEnvironmentPartBoxes` and `builtEnvironmentSpaceContentBounds`, so one placement rule lives in four files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An undeclared or transform-only element answers null instead of throwing because an unresolved locator is the caller's finding, and a runtime model reference contributes its origin point, which the placement-bounds layer labels `element-origin-point`.
 * @evidence contracts/common.md#meaningful-documentation States which callers rely on it and which files copy its code, the current-operating-state frame, the two null readings and why they are not refusals, the origin fallback, and the per-call cost of staging the whole hierarchy.
 * @evidence contracts/performance.md#cost-and-resources Defect: each call stages every element's world matrix and every operation delta, `O(E + members)`, plus linear element and model searches, to measure one element whose ancestor chain is all it needs; nothing is cached, so the overlap and support sweeps and the subject describers, calling it once per element, become quadratic in element count.
 * @author Samchon
 */
export const builtEnvironmentElementBounds = (
  environment: IAutoMovieBuiltEnvironment,
  elementId: string,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } | null => {
  const element = environment.elements.find(
    (candidate) => candidate.id === elementId,
  );
  if (element === undefined || element.model === null) return null;
  const matrices = worldMatricesOf(environment, operationDeltas(environment));
  const model = environment.models.find(
    (candidate) => candidate.id === element.model,
  );
  return boundsOf(placedElementPoints(model, matrices.get(element.id)!));
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
