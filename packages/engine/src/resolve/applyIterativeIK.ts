import {
  IAutoMovieIKDriver,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { rotationBetween } from "../math/rotationBetween";
import { blendVec } from "./blendVec";
import { readWorld } from "./readWorld";
import { recompose } from "./recompose";
import { validateInfluence } from "./validateInfluence";

/**
 * Default finite iteration budget when the driver leaves iterations null.
 * It bounds solver work without promising convergence for every chain.
 */
const DEFAULT_ITERATIONS: number = 10;

/**
 * Tip-to-goal early-out tolerance in metres; this numeric residual does not
 * certify a visual threshold or joint range of motion.
 */
const CONVERGENCE_EPSILON: number = 1e-6;

/**
 * Deterministic fallback direction for the measure-zero degenerate where a
 * FABRIK pass lands two adjacent joints on the same point (the segment
 * direction is undefined). Any fixed unit vector restores totality without
 * hurting determinism.
 */
const FALLBACK_DIR: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * Solve an admitted world-space chain by CCD or FABRIK with a positive safe-integer iteration budget, default 10, and a 1e-6 metre residual early-out. Blend positions and shortest-arc rotations by influence, then recompose the tip subtree. Iterative solvers ignore pole and apply no anatomical ROM; failed later writes may follow earlier mutations.
 *
 * @evidence contracts/common.md#principled-implementation Solve finite nondegenerate world-space chains by deterministic CCD or FABRIK, then write shortest-arc rotations and influence-blended positions under a positive safe-integer iteration budget; TRS decomposition remains a supported-input premise.
 * @evidence contracts/common.md#clear-and-simple-design One world-driver owner handles solver choice, influence and descendant recomposition; iterative solvers ignore pole as their driver contract states, while analytic twoBone owns it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Degenerate directions use deterministic numerical fallbacks, not fixture goals; this solver does not apply anatomical ROM, and extreme overflow/deep recursion remain unsupported numerical/stack limits.
 * @evidence contracts/common.md#meaningful-documentation Docs give chain/goal roles, metre residual threshold, fixed default budget and in-place world-map effects; partial mutation on later failure is not transactional rollback.
 * @evidence contracts/performance.md#efficient-algorithms For C chain nodes and I iterations, CCD can rotate suffixes in O(I*C*C), FABRIK uses O(I*C), plus descendant recomposition; snapshots and solver positions use O(C) temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Read chain positions once per solve and reuse them during iteration; changed goals/world transforms require a fresh solve, with no persistent convergence cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns mutated world/local maps; iteration arrays and rotations are call-local, with no solver worker, native handle or future task retained.
 */
export const applyIterativeIK: (
  d: IAutoMovieIKDriver,
  world: Map<string, number[]>,
  localById: Map<string, IAutoMovieTransform>,
  childrenById: Map<string, string[]>,
) => void = (
  d: IAutoMovieIKDriver,
  world: Map<string, number[]>,
  localById: Map<string, IAutoMovieTransform>,
  childrenById: Map<string, string[]>,
): void => {
  validateInfluence("iterative IK", d.influence);
  const iterations: number = readIterations(d.iterations);
  if (d.chain.length < 2)
    throw new Error(
      `world driver iterative IK chain needs at least 2 nodes, but had ${d.chain.length}`,
    );

  const matrices: number[][] = d.chain.map((id: string): number[] =>
    readWorld(world, id, "iterative IK chain"),
  );
  const before: IAutoMovieVector3[] = matrices.map(
    (m: number[]): IAutoMovieVector3 => Matrix4.position(m),
  );
  const lengths: number[] = [];
  for (let i: number = 0; i + 1 < before.length; ++i) {
    const length: number = Vector3.length(
      Vector3.subtract(before[i + 1]!, before[i]!),
    );
    if (!(length > 0))
      throw new Error(
        `world driver iterative IK segment ${i} length must be > 0, but was ${length}`,
      );
    lengths.push(length);
  }
  const goal: IAutoMovieVector3 = Matrix4.position(
    readWorld(world, d.goal, "iterative IK goal"),
  );

  const after: IAutoMovieVector3[] =
    d.solver === "ccd"
      ? solveCcd(before, goal, iterations)
      : solveFabrik(before, lengths, goal, iterations);

  writeChain(d, world, matrices, before, after, childrenById, localById);
};

const readIterations: (iterations: number | null) => number = (
  iterations: number | null,
): number => {
  if (iterations === null) return DEFAULT_ITERATIONS;
  if (!Number.isSafeInteger(iterations) || iterations <= 0)
    throw new Error(
      `world driver iterative IK iterations must be a positive integer within the safe-integer range, but was ${iterations}`,
    );
  return iterations;
};

/**
 * Cyclic coordinate descent: back-to-front, rotate each joint so the tip swings
 * toward the goal, positions only (rotations are lowered afterward).
 */
const solveCcd: (
  before: readonly IAutoMovieVector3[],
  goal: IAutoMovieVector3,
  iterations: number,
) => IAutoMovieVector3[] = (
  before: readonly IAutoMovieVector3[],
  goal: IAutoMovieVector3,
  iterations: number,
): IAutoMovieVector3[] => {
  const p: { x: number; y: number; z: number }[] = before.map(
    (v: IAutoMovieVector3): { x: number; y: number; z: number } => ({ ...v }),
  );
  const tip: number = p.length - 1;
  for (let it: number = 0; it < iterations; ++it) {
    if (Vector3.length(Vector3.subtract(p[tip]!, goal)) <= CONVERGENCE_EPSILON)
      break;
    for (let j: number = tip - 1; j >= 0; --j) {
      // A degenerate direction (tip or goal exactly on the pivot) normalizes to
      // the zero vector, and rotationBetween of a zero vector is the identity.
      // The pivot simply contributes nothing that sweep, no guard needed.
      const rot: IAutoMovieQuaternion = rotationBetween(
        Vector3.normalize(Vector3.subtract(p[tip]!, p[j]!)),
        Vector3.normalize(Vector3.subtract(goal, p[j]!)),
      );
      for (let k: number = j + 1; k <= tip; ++k)
        p[k] = Vector3.add(
          p[j]!,
          Quaternion.rotateVector(rot, Vector3.subtract(p[k]!, p[j]!)),
        );
    }
  }
  return p;
};

/**
 * FABRIK: alternate backward (tip pinned to the goal) and forward (root pinned
 * home) passes that re-place each joint at its exact segment length. A goal
 * beyond total reach resolves directly as full extension toward it: FABRIK's
 * canonical unreachable handling, and exactly "the chain points at what it
 * cannot touch".
 */
const solveFabrik: (
  before: readonly IAutoMovieVector3[],
  lengths: readonly number[],
  goal: IAutoMovieVector3,
  iterations: number,
) => IAutoMovieVector3[] = (
  before: readonly IAutoMovieVector3[],
  lengths: readonly number[],
  goal: IAutoMovieVector3,
  iterations: number,
): IAutoMovieVector3[] => {
  const p: { x: number; y: number; z: number }[] = before.map(
    (v: IAutoMovieVector3): { x: number; y: number; z: number } => ({ ...v }),
  );
  const tip: number = p.length - 1;
  const root: { x: number; y: number; z: number } = { ...p[0]! };
  const total: number = lengths.reduce(
    (sum: number, l: number): number => sum + l,
    0,
  );
  const toGoal: IAutoMovieVector3 = Vector3.subtract(goal, root);
  const goalDistance: number = Vector3.length(toGoal);

  if (goalDistance >= total) {
    // Segment lengths are validated strictly positive, so total > 0 and the
    // division below is always safe here.
    const dir: IAutoMovieVector3 = Vector3.scale(toGoal, 1 / goalDistance);
    let cumulative: number = 0;
    for (let i: number = 1; i <= tip; ++i) {
      cumulative += lengths[i - 1]!;
      p[i] = Vector3.add(root, Vector3.scale(dir, cumulative));
    }
    return p;
  }

  for (let it: number = 0; it < iterations; ++it) {
    if (Vector3.length(Vector3.subtract(p[tip]!, goal)) <= CONVERGENCE_EPSILON)
      break;
    // backward: pin the tip on the goal, walk to the root
    p[tip] = { ...goal };
    for (let j: number = tip - 1; j >= 0; --j)
      p[j] = Vector3.add(
        p[j + 1]!,
        Vector3.scale(unitOr(Vector3.subtract(p[j]!, p[j + 1]!)), lengths[j]!),
      );
    // forward: pin the root home, walk to the tip
    p[0] = { ...root };
    for (let j: number = 1; j <= tip; ++j)
      p[j] = Vector3.add(
        p[j - 1]!,
        Vector3.scale(
          unitOr(Vector3.subtract(p[j]!, p[j - 1]!)),
          lengths[j - 1]!,
        ),
      );
  }
  return p;
};

/** Unit vector of `v`, or the deterministic fallback when `v` is degenerate. */
const unitOr: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
  v: IAutoMovieVector3,
): IAutoMovieVector3 =>
  Vector3.length(v) < 1e-12 ? FALLBACK_DIR : Vector3.normalize(v);

// The exact shortest-arc rotation now lives in worldShared.rotationBetween,
// promoted there (#643) so the iterative solvers, the analytic twoBone
// lowering, and the aim driver all share one deadzone-free implementation.

/**
 * Lower the positional solve into the world map: each non-tip joint's rotation
 * gets its segment's shortest-arc delta, everything blends by `influence`, and
 * the tip's subtree recomposes (the two-bone convention).
 */
const writeChain: (
  d: IAutoMovieIKDriver,
  world: Map<string, number[]>,
  matrices: readonly number[][],
  before: readonly IAutoMovieVector3[],
  after: readonly IAutoMovieVector3[],
  childrenById: Map<string, string[]>,
  localById: Map<string, IAutoMovieTransform>,
) => void = (
  d: IAutoMovieIKDriver,
  world: Map<string, number[]>,
  matrices: readonly number[][],
  before: readonly IAutoMovieVector3[],
  after: readonly IAutoMovieVector3[],
  childrenById: Map<string, string[]>,
  localById: Map<string, IAutoMovieTransform>,
): void => {
  const t: number = d.influence;
  const tip: number = d.chain.length - 1;
  for (let j: number = 0; j <= tip; ++j) {
    const dec: {
      position: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
      scale: IAutoMovieVector3;
    } = Matrix4.decompose(matrices[j]!);
    const rotation: IAutoMovieQuaternion =
      j < tip
        ? Quaternion.slerp(
            dec.rotation,
            Quaternion.multiply(
              rotationBetween(
                unitOr(Vector3.subtract(before[j + 1]!, before[j]!)),
                unitOr(Vector3.subtract(after[j + 1]!, after[j]!)),
              ),
              dec.rotation,
            ),
            t,
          )
        : dec.rotation;
    world.set(
      d.chain[j]!,
      Matrix4.compose(blendVec(before[j]!, after[j]!, t), rotation, dec.scale),
    );
  }
  recompose(d.chain[tip]!, world, localById, childrenById);
};
