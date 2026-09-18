import { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace, IAutoMovieConnectorCarriage, IAutoMovieConnectorState, IAutoMovieModel, IAutoMovieMovablePanel, IAutoMovieOperationState, IAutoMovieQuaternion, IAutoMovieTravelMotion, IAutoMovieVector3 } from "@automovie/interface";
import { tessellate } from "../geometry/tessellate";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { builtInstanceSetPlacementBounds } from "./builtInstanceSetPlacementBounds";

/**
 * The world box the contents of a logical space and its descendants fill.
 *
 * A declared space and the thing standing in it are two different extents, and
 * reading the first as the second is what puts a review camera in an empty
 * corner. In the medieval-residence experiment the space `stair-ground` is
 * declared over x 3.5..14.5, z 5.5..11.5 while the stair tower filling it
 * occupies x 8.93..14.13, z 5.90..11.10, so three of four cameras placed at the
 * declared cell's corners stood outside the tower and framed a wall. The cell
 * answers how far the room reaches; this answers where its content is, which is
 * the question a reviewer placing an eye actually asks.
 *
 * What is measured is exactly what {@link builtEnvironmentSpaceNodes} names: the
 * staged set pieces and the compact populations of this space and every space
 * below it. Each element stands where the environment's current operating state
 * puts it, which is where {@link lowerBuiltEnvironment} stages it, so a leaf
 * authored open widens the box by the leaf where it actually rests. Geometry is
 * read through {@link tessellate} for a primitive and from the stated mesh
 * otherwise, the same vertices the renderer draws, so the box cannot drift from
 * the picture.
 *
 * **A population widens this box, and that is the intended change rather than a
 * regression.** Before populations existed the answer counted elements alone,
 * and in the medieval-residence experiment that meant a room whose slate, ashlar
 * and flagging were four instance sets reported the box of whatever few elements
 * were left over: not `null`, which would have been noticed, but a plausibly
 * small box a review camera then aimed into a corner. A caller that stored the
 * old answer is holding a narrower box than the room's contents, so an eye
 * derived from it frames less than it did. A population contributes through
 * {@link builtInstanceSetPlacementBounds}, which measures the region its
 * declared placement law spans after folding the population's authored
 * prototype-local box through every scale and rotation that law permits. The
 * building cannot inspect the recipe's mesh, so the local box is the explicit
 * geometry fact that keeps a one-member table from collapsing to its origin.
 *
 * An element citing a runtime model reference, whose bytes this record never
 * holds, contributes its own world origin rather than nothing, exactly as one
 * whose parts draw no vertices does. A space furnished entirely by referenced
 * models therefore still reports where its content stands, and the horizontal
 * degeneracy is deliberate: a width the record never stated is a number that
 * would frame geometry nobody wrote down.
 *
 * `null` is a space with nothing placed in it at any depth. That is an ordinary
 * answer, not a fault: an undressed room and a purely semantic container ("the
 * west wing") are both legitimately empty, so refusing would make every caller
 * guard a normal case, and this file keeps refusal for an undeclared space id,
 * which is the caller's own mistake. A degenerate box would be worse than null,
 * because nothing distinguishes it from one real element standing at the
 * origin.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentSpaceContentBounds` reports the world box the placed contents of a logical space and its descendants fill. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentSpaceContentBounds` resolves the element hierarchy, ownership, and geometry of one logical-space subtree into its world extent inside one building-interior boundary.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group `builtEnvironmentSpaceContentBounds` includes every compact population owned by the queried space subtree instead of losing it behind instance compression.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-compression-individuality `builtEnvironmentSpaceContentBounds` measures a compressed population from its stable placement law rather than treating omitted expansion as empty content.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality `builtEnvironmentSpaceContentBounds` folds the compact population record itself, so a spatial query remains proportional to populations rather than procedural members.
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-declared-measured-bounds `builtEnvironmentSpaceContentBounds` keeps the authored prototype-local extent separate from the world-space content box it derives.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-bounds-inputs `builtEnvironmentSpaceContentBounds` derives the current world extent from the population's declared local bound and placement law without persisting a second placement box.
 * @author Samchon
 */
export const builtEnvironmentSpaceContentBounds = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } | null => {
  requireSpace(environment, spaceId);
  const included = descendantSpaces(environment.spaces, spaceId);
  const matrices = worldMatricesOf(environment, operationDeltas(environment));
  const models = new Map(
    environment.models.map((model) => [model.id, model] as const),
  );
  const points = environment.elements
    .filter(
      (element) =>
        element.model !== null &&
        element.space !== null &&
        included.has(element.space),
    )
    .flatMap((element) =>
      placedElementPoints(
        models.get(element.model!),
        matrices.get(element.id)!,
      ),
    );
  for (const population of environment.populations ?? [])
    if (included.has(population.space)) {
      const bounds = builtInstanceSetPlacementBounds(
        population.set,
        population.prototypeBounds,
      );
      points.push(bounds.min, bounds.max);
    }
  return points.length === 0 ? null : boundsOf(points);
};

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

const requireSpace = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): void => {
  if (!environment.spaces.some((space) => space.id === spaceId))
    throw new Error(
      `built environment "${environment.id}" has no logical space "${spaceId}"`,
    );
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

const descendantSpaces = (
  spaces: readonly IAutoMovieBuiltSpace[],
  root: string,
): Set<string> => {
  const included = new Set([root]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const space of spaces)
      if (
        space.parent !== null &&
        included.has(space.parent) &&
        !included.has(space.id)
      ) {
        included.add(space.id);
        changed = true;
      }
  }
  return included;
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
