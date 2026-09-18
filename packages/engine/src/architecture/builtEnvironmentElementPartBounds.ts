import { IAutoMovieBuiltEnvironment, IAutoMovieConnectorCarriage, IAutoMovieConnectorState, IAutoMovieModel, IAutoMovieMovablePanel, IAutoMovieOperationState, IAutoMovieQuaternion, IAutoMovieTravelMotion, IAutoMovieVector3 } from "@automovie/interface";
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
 * One world box per drawn part, rather than one box over all of them.
 *
 * A model's union box says where the body is and nothing about how much of that
 * volume it fills. A shelf is a back panel and two boards, so its union spans
 * floor to head height and is mostly air; anything standing on a board is
 * inside that box, and a test written against the union reports an overlap that
 * is true about the boxes and false about the bodies. The same box puts the
 * bearing face at the panel's top rather than at the board the object rests on,
 * which is the paired "floating" answer.
 *
 * Part boxes are contained in the union box, so every answer they give is one
 * the union would also have given or a false positive the union invented. A
 * single-part body yields exactly the union box and behaves as before.
 *
 * An element with no drawn part keeps its degenerate origin box, for the reason
 * {@link builtEnvironmentElementBounds} states.
 */
const placedPartBoxes = (
  model: IAutoMovieModel | undefined,
  world: number[],
): { min: IAutoMovieVector3; max: IAutoMovieVector3 }[] => {
  const boxes: { min: IAutoMovieVector3; max: IAutoMovieVector3 }[] = [];
  for (const part of model === undefined ? [] : model.parts) {
    const points = placedPartPoints(part, world);
    if (points.length !== 0) boxes.push(boundsOf(points));
  }
  return boxes.length === 0
    ? [boundsOf([applyMatrix(world, { x: 0, y: 0, z: 0 })])]
    : boxes;
};

/**
 * The world boxes one element's drawn parts fill, one per part.
 *
 * Answers the question {@link builtEnvironmentElementBounds} cannot: how much of
 * a body's box is body. A caller testing whether two placed things intersect,
 * or which face one rests on, reads these rather than the union, because a
 * multi-part body's union is mostly air and says so nowhere.
 *
 * `null` for the same reasons the union answers `null`: an element that was
 * never declared, or one that draws nothing.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support `builtEnvironmentElementPartBounds` supplies the per-part world extents a support probe needs to name the face an object actually rests on.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Resolves one element's placed geometry into its drawn parts' world boxes while preserving the measurement basis.
 * @author Samchon
 */
export const builtEnvironmentElementPartBounds = (
  environment: IAutoMovieBuiltEnvironment,
  elementId: string,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 }[] | null => {
  const element = environment.elements.find(
    (candidate) => candidate.id === elementId,
  );
  if (element === undefined || element.model === null) return null;
  const matrices = worldMatricesOf(environment, operationDeltas(environment));
  const model = environment.models.find(
    (candidate) => candidate.id === element.model,
  );
  return placedPartBoxes(model, matrices.get(element.id)!);
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
