import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieMovablePanel,
  IAutoMovieSubjectBox,
  IAutoMovieTravelMotion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { unionSubjectBoxes } from "../film/unionSubjectBoxes";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieOpeningSweep } from "./IAutoMovieOpeningSweep";
import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { builtPointBounds } from "./builtPointBounds";
import { AUTOMOVIE_FULL_TURN_EPSILON } from "./constants/AUTOMOVIE_FULL_TURN_EPSILON";
import { requireBuiltOpening } from "./requireBuiltOpening";

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
 * The answer is per panel, and only that panel's own travel. Ancestors stand
 * where the environment's current state puts them, so an inner folding leaf is
 * measured against the outer leaf as it currently stands. That is the volume
 * this leaf sweeps from where the design has it, not the union over every
 * configuration a chain of leaves could reach between its named states. A
 * caller wanting that union asks for each state in turn and takes the hull
 * itself; inventing it here would quietly report a chain's envelope under one
 * panel's name.
 *
 * Each entry is a world-space axis-aligned box over the four corners of the
 * panel's `width` by `height` leaf, in panel order. An opening without an
 * operation answers an empty list. Throws an `Error` when the opening does not
 * exist, a panel's element is missing, or a travel has an infinite limit or a
 * revolute travel spans more than a full turn plus
 * `AUTOMOVIE_FULL_TURN_EPSILON`, the cap `validateBuiltEnvironment` applies.
 *
 * @param environment Building record holding the opening.
 * @param openingId Id of the opening whose panels are swept.
 * @returns One swept box per panel, in panel order.
 *
 * @evidence contracts/common.md#principled-implementation A revolute corner's world coordinate is `c + b cos t + d sin t`, whose extremes over `[min, max]` are the endpoints plus every `phase + kπ` inside the range, so the box is exact rather than sampled; a prismatic corner is linear in its travel and extreme at its limits. The premise is a finite travel of at most one turn, which validation enforces and this function refuses by name otherwise.
 * @evidence contracts/common.md#clear-and-simple-design Staging comes from `builtEnvironmentWorldMatrices` and the opening lookup from `requireBuiltOpening`; the panel's base frame is its parent's staged matrix times its rest transform, which removes only its own travel without restaging the building per panel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no opening or panel; the full-turn cap is the shared contract constant rather than a private copy, and an unenumerable travel is refused instead of truncated.
 * @evidence contracts/common.md#meaningful-documentation States the exact solve, that ancestors stand at the current state and only the panel's own travel is swept, why no chain union is formed, the box's corners and order, and every refusal with the cap it uses.
 * @evidence contracts/performance.md#efficient-algorithms One staging pass linear in the element count, then constant work per panel corner, at most a handful of critical angles per axis because travel is capped at one turn; this replaces restaging the whole building once per panel.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one opening per call from the caller's mutable record; within the call one staging and one element index serve every panel.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the staged matrices and element index only for the call and returns new sweep records; nothing is retained.
 */
export const builtOpeningSweepEnvelope = (
  environment: IAutoMovieBuiltEnvironment,
  openingId: string,
): IAutoMovieOpeningSweep[] => {
  const opening: IAutoMovieBuiltOpening = requireBuiltOpening(
    environment,
    openingId,
  );
  const operation: IAutoMovieBuiltOpening["operation"] = opening.operation;
  if (operation === undefined) return [];
  const staged: Map<string, number[]> =
    builtEnvironmentWorldMatrices(environment);
  const elements: Map<string, IAutoMovieBuiltElement> = new Map(
    environment.elements.map(
      (element: IAutoMovieBuiltElement): [string, IAutoMovieBuiltElement] => [
        element.id,
        element,
      ],
    ),
  );
  return operation.panels.map(
    (panel: IAutoMovieMovablePanel): IAutoMovieOpeningSweep => {
      requireEnumerableTravel(environment, panel);
      const base: number[] = restingFrame(environment, elements, staged, panel);
      const corners: IAutoMovieVector3[] = [
        { x: 0, y: 0, z: 0 },
        { x: panel.width, y: 0, z: 0 },
        { x: panel.width, y: panel.height, z: 0 },
        { x: 0, y: panel.height, z: 0 },
      ];
      const swept: IAutoMovieSubjectBox = unionSubjectBoxes(
        corners.map(
          (corner: IAutoMovieVector3): IAutoMovieSubjectBox =>
            sweptCornerBounds(base, panel.motion, corner),
        ),
      )!;
      return {
        panel: panel.id,
        element: panel.element,
        min: swept.min,
        max: swept.max,
      };
    },
  );
};

/**
 * The world frame a panel's leaf stands in with its own travel at rest.
 *
 * The panel's own displacement is the last factor of its local matrix and
 * moves nothing above it, so its parent's staged matrix times its rest
 * transform is exactly the staging with that one joint removed.
 */
const restingFrame = (
  environment: IAutoMovieBuiltEnvironment,
  elements: ReadonlyMap<string, IAutoMovieBuiltElement>,
  staged: ReadonlyMap<string, number[]>,
  panel: IAutoMovieMovablePanel,
): number[] => {
  const element: IAutoMovieBuiltElement | undefined = elements.get(
    panel.element,
  );
  if (element === undefined)
    throw new Error(
      `built environment "${environment.id}" has no element "${panel.element}" for panel "${panel.id}"`,
    );
  const rest: number[] = Matrix4.compose(
    element.transform.translation,
    element.transform.rotation,
    element.transform.scale,
  );
  return element.parent === null
    ? rest
    : Matrix4.multiply(staged.get(element.parent)!, rest);
};

/**
 * Refuse a panel whose travel the swept envelope could not enumerate.
 *
 * The solver walks the critical angles the travel actually crosses, so an
 * infinite limit or a range spanning more than a full turn is not a wrong
 * answer waiting to happen: it is a walk that never reaches its end.
 * `validateBuiltEnvironment` refuses both by name with the same cap, so this
 * only fires on a record that was never validated, and on one of those a named
 * refusal is the only acceptable outcome.
 */
const requireEnumerableTravel = (
  environment: IAutoMovieBuiltEnvironment,
  panel: IAutoMovieMovablePanel,
): void => {
  const { min, max }: IAutoMovieTravelMotion = panel.motion;
  if (
    Number.isFinite(min) === false ||
    Number.isFinite(max) === false ||
    (panel.motion.kind === "revolute" &&
      max - min > 2 * Math.PI + AUTOMOVIE_FULL_TURN_EPSILON)
  )
    throw new Error(
      `panel "${panel.id}" of built environment "${environment.id}" travels [${min}, ${max}], which no swept envelope can enumerate`,
    );
};

/** Apply a column-major matrix to a point. */
const applyMatrix = (
  matrix: readonly number[],
  point: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const moved: IAutoMovieVector3 = applyDirection(matrix, point);
  return {
    x: moved.x + matrix[12]!,
    y: moved.y + matrix[13]!,
    z: moved.z + matrix[14]!,
  };
};

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
): IAutoMovieSubjectBox => {
  const axis: IAutoMovieVector3 = Vector3.normalize(motion.axis);
  if (motion.kind === "prismatic")
    return builtPointBounds(
      [motion.min, motion.max].map(
        (value: number): IAutoMovieVector3 =>
          applyMatrix(base, Vector3.add(corner, Vector3.scale(axis, value))),
      ),
    )!;
  const offset: IAutoMovieVector3 = Vector3.subtract(corner, motion.pivot);
  const along: IAutoMovieVector3 = Vector3.scale(
    axis,
    Vector3.dot(axis, offset),
  );
  const center: IAutoMovieVector3 = applyMatrix(
    base,
    Vector3.add(motion.pivot, along),
  );
  const cosine: IAutoMovieVector3 = applyDirection(
    base,
    Vector3.subtract(offset, along),
  );
  const sine: IAutoMovieVector3 = applyDirection(
    base,
    Vector3.cross(axis, offset),
  );
  const reach = (component: "x" | "y" | "z"): { low: number; high: number } => {
    const phase: number = Math.atan2(sine[component], cosine[component]);
    const angles: number[] = [motion.min, motion.max];
    const first: number = Math.ceil((motion.min - phase) / Math.PI);
    const last: number = Math.floor((motion.max - phase) / Math.PI);
    for (let step: number = first; step <= last; ++step)
      angles.push(phase + step * Math.PI);
    const values: number[] = angles.map(
      (angle: number): number =>
        center[component] +
        cosine[component] * Math.cos(angle) +
        sine[component] * Math.sin(angle),
    );
    return { low: Math.min(...values), high: Math.max(...values) };
  };
  const x: { low: number; high: number } = reach("x");
  const y: { low: number; high: number } = reach("y");
  const z: { low: number; high: number } = reach("z");
  return {
    min: { x: x.low, y: y.low, z: z.low },
    max: { x: x.high, y: y.high, z: z.high },
  };
};
