import { Quaternion, Vector3, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieChainBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";
import { prepareHumanLimbFit } from "./prepareHumanLimbFit";

/*
 * Fit the ankle/wrist and preserve its actual authored offset contact through
 * the existing Anderson-mixed re-aim and actual best-contact selection.
 */
export function fitHumanLimbContact(
  fitter: ReturnType<typeof prepareHumanLimbFit>,
  goal: IAutoMovieHumanLimbGoal,
  side: AutoMovieHumanSide,
  leg: boolean,
  fit: (
    point: IAutoMovieVector3,
    continued?: IAutoMovieSwivelNear,
    capture?: fitHumanLimbContact.ICapture,
  ) => IAutoMovieSeededChainFit,
): IAutoMovieSeededChainFit {
  if (goal.contact === undefined || goal.rotation === undefined)
    return fit(goal.point);
  let frame: IContactPrefix | undefined;
  let chosen: IContactPrefix | undefined;
  const capture: fitHumanLimbContact.ICapture = (rotation, position): void => {
    frame = { rotation, position };
  };
  let fitted: IAutoMovieSeededChainFit = fit(goal.point, undefined, capture);
  const anchor: IAutoMovieVector3 = Vector3.add(
    goal.point,
    Quaternion.rotateVector(goal.rotation, goal.contact),
  );

  // Every re-aim of the instant continues the seed its own first fit chose,
  // refined to the cold sweep's resolution: a continued fit moves its swivel
  // at most one step from its seed (`hingedSwivelNear`), so the wrist-target
  // map the iteration solves is one function of the target. Continuing each
  // pass's own result instead moved the map with every pass, and the swivel
  // crept a step a pass with the fixed point never reached (measured on a
  // coat's sleeve: 116 of 16,148 re-aims ran all 16 passes, the swivel 30
  // degrees from its seed and the contact still millimetres off).
  const seed: IAutoMovieSwivelNear | undefined =
    fitted.seed === null
      ? undefined
      : { ...fitted.seed, tolerance: hingedArmSwivel.RESOLUTION };
  let point: IAutoMovieVector3 = goal.point;
  const history: IReaimIteration[] = [];
  let nearestRotation: IAutoMovieQuaternion | undefined;
  let nearest: IAutoMovieSeededChainFit = fitted;
  let nearestMiss: number = Infinity;
  let nearestPoint: IAutoMovieVector3 = point;

  // A current orientation changes the offset point; keep its best actual contact if mixing does not close.
  for (let i: number = 0; i < REAIM_PASSES; ++i) {
    const reached: IAutoMovieQuaternion =
      frame?.rotation ?? fitter.rotation(fitted.pose);
    const aim: IAutoMovieVector3 = Vector3.subtract(
      anchor,
      Quaternion.rotateVector(reached, goal.contact),
    );
    const miss: IAutoMovieVector3 = Vector3.subtract(aim, point);
    const missSize: number = Vector3.length(miss);
    if (missSize < nearestMiss) {
      nearest = fitted;
      nearestPoint = point;
      chosen = frame;
      nearestMiss = missSize;
      if (leg) nearestRotation = reached;
    }
    if (missSize < REAIM_TOLERANCE || i === REAIM_PASSES - 1) break;
    const next: IAutoMovieVector3 = mixed(aim, miss, history);
    history.unshift({ image: aim, miss });
    if (history.length > REAIM_DEPTH) history.pop();
    point = next;
    frame = undefined;
    fitted = fit(point, seed, capture);
  }
  if (!leg) {
    // A projected wrist can miss the requested centre even when its orientation
    // has converged. Close the residual in the actual socket frame.
    fitted = nearest;
    point = nearestPoint;
    frame = chosen;
    nearestMiss = Infinity;
    for (let i: number = 0; i < REAIM_PASSES; ++i) {
      const achieved: IAutoMovieChainBone =
        frame === undefined
          ? fitter.effector(fitted.pose)
          : {
              worldPosition: frame.position(),
              worldRotation: frame.rotation,
            };
      const contact: IAutoMovieVector3 = Vector3.add(
        achieved.worldPosition,
        Quaternion.rotateVector(achieved.worldRotation, goal.contact),
      );
      const residual: IAutoMovieVector3 = Vector3.subtract(anchor, contact);
      const error: number = Vector3.length(residual);
      if (error >= nearestMiss) break;
      nearest = fitted;
      nearestMiss = error;
      if (error < REAIM_TOLERANCE || i === REAIM_PASSES - 1) break;
      point = Vector3.add(point, residual);
      frame = undefined;
      fitted = fit(point, seed, capture);
    }
    return nearest;
  }
  fitted = nearest;
  if (nearestRotation === undefined) return fitted;
  const toes: number = Math.max(
    0,
    HumanFoot.pitch(goal.rotation) - HumanFoot.pitch(nearestRotation),
  );
  if (toes === 0) return fitted;

  const bone: AutoMovieHumanoidBone = `${side}Toes`;
  return {
    pose: {
      ...fitted.pose,
      joints: fitted.pose.joints.map(
        (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
          joint.bone === bone
            ? { ...joint, flexion: (joint.flexion ?? 0) + toes }
            : joint,
      ),
    },
    seed: fitted.seed,
    ...(fitted.value === undefined ? {} : { value: fitted.value }),
  };
}

/*
 * The reading offered by a native ordinary fit during this operation.
 */
export namespace fitHumanLimbContact {
  /*
   * The solver may supply the final prefix for the exact requested fit.
   */
  export type ICapture = NonNullable<
    Parameters<ReturnType<typeof prepareHumanLimbFit>["fit"]>[3]
  >;
}

/*
 * The next target of the re-aim's fixed point `p = g(p)`, `g` the aim a fit at
 * `p` gives, by Anderson acceleration over the iterations kept, most recent
 * first (Walker and Ni 2011, "Anderson acceleration for fixed-point
 * iterations", SIAM J Numer Anal 49:1715, eq. 2.1): the residual `f = g(p) - p`
 * is taken least-squares onto the differences `f - f_j` of the kept residuals,
 * and the same combination of the images' differences `g - g_j` is taken from
 * the aim. On a three-dimensional map whose kept differences span the space
 * this is the secant (Newton) step of the map's affine model, so a map near
 * affine closes in a few passes; one kept iteration is the one-step mixing this
 * re-aim used before. The differences are orthogonalised in order (modified
 * Gram-Schmidt) and one that adds no direction is dropped; a combination that
 * is not finite or exceeds `MIXING` in any coefficient falls back to the most
 * recent difference alone, its coefficient bounded by `MIXING` as before, and
 * no kept iteration gives the plain fixed-point step, the aim.
 */
function mixed(
  aim: IAutoMovieVector3,
  miss: IAutoMovieVector3,
  history: readonly IReaimIteration[],
): IAutoMovieVector3 {
  if (history.length === 0) return aim;
  const differences: IReaimDifference[] = history.map(
    (kept: IReaimIteration): IReaimDifference => ({
      residual: Vector3.subtract(miss, kept.miss),
      image: Vector3.subtract(aim, kept.image),
    }),
  );
  const single = (): IAutoMovieVector3 => {
    const first: IReaimDifference = differences[0]!;
    const size: number = Vector3.dot(first.residual, first.residual);
    if (!(size > 1e-18)) return aim;
    const mixing: number = Math.max(
      -MIXING,
      Math.min(MIXING, Vector3.dot(first.residual, miss) / size),
    );
    return Vector3.subtract(aim, Vector3.scale(first.image, mixing));
  };
  if (differences.length === 1) return single();

  // Modified Gram-Schmidt on the residual differences: q_k orthonormal, r the
  // upper-triangular coefficients, a difference adding no direction dropped.
  const basis: IAutoMovieVector3[] = [];
  const kept: IReaimDifference[] = [];
  const r: number[][] = [];
  for (const difference of differences) {
    let v: IAutoMovieVector3 = difference.residual;
    const column: number[] = [];
    for (const q of basis) {
      const c: number = Vector3.dot(q, v);
      column.push(c);
      v = Vector3.subtract(v, Vector3.scale(q, c));
    }
    const norm: number = Vector3.length(v);
    if (!(norm > 1e-9 * Math.max(1e-12, Vector3.length(difference.residual))))
      continue;
    column.push(norm);
    basis.push(Vector3.scale(v, 1 / norm));
    kept.push(difference);
    r.push(column);
  }
  if (kept.length <= 1) return single();

  // Back substitution of R γ = Qᵀ f.
  const n: number = kept.length;
  const gamma: number[] = new Array<number>(n).fill(0);
  for (let k: number = n - 1; k >= 0; --k) {
    let s: number = Vector3.dot(basis[k]!, miss);
    for (let j: number = k + 1; j < n; ++j) s -= r[j]![k]! * gamma[j]!;
    gamma[k] = s / r[k]![k]!;
  }
  if (
    gamma.some(
      (g: number): boolean => Math.abs(g) > MIXING,
    )
  )
    return single();
  let next: IAutoMovieVector3 = aim;
  kept.forEach((difference: IReaimDifference, k: number): void => {
    next = Vector3.subtract(next, Vector3.scale(difference.image, gamma[k]!));
  });
  return next;
}

/*
 * The iterations Anderson mixing keeps: three, the map's dimension, so its kept
 * differences can span the space (provisional).
 */
const REAIM_DEPTH: number = 3;

/*
 * The largest magnitude of a mixing coefficient, the bound the one-step mixing
 * kept (provisional).
 */
const MIXING: number = 20;

/*
 * Original provisional 20-micrometre re-aim resolution, finer than every
 * contact verdict.
 */
const REAIM_TOLERANCE: number = 2e-5;

/*
 * Maximum fits per correction phase. Prior measured near-limit heel-off needs
 * up to eleven orientation fits.
 */
const REAIM_PASSES: number = 16;

/*
 * A preceding target image and its fixed-point residual for Anderson mixing.
 */
interface IReaimIteration {
  image: IAutoMovieVector3;
  miss: IAutoMovieVector3;
}

/*
 * One kept iteration's differences from the current one: of the residuals and
 * of the images.
 */
interface IReaimDifference {
  residual: IAutoMovieVector3;
  image: IAutoMovieVector3;
}

/*
 * Geometry supplied by the fit that made this candidate.
 */
interface IContactPrefix {
  position: () => IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
}
