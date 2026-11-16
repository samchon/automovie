import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieJointRotationDomain } from "../kinematics/IAutoMovieJointRotationDomain";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import { bilinearAngleBoxCandidates } from "../math/bilinearAngleBoxCandidates";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";

/** The three named clinical coordinates, all measured in degrees. */
type ClinicalAxis = "flexion" | "abduction" | "twist";

/** Fixed coordinate order used only for stable reference and tie bookkeeping. */
const AXES: readonly ClinicalAxis[] = ["flexion", "abduction", "twist"];

/** A sign-insensitive quaternion dot and its four-term summation uncertainty. */
interface IScore {
  /** Absolute dot of normalized actual and requested rotations. */
  value: number;

  /** Binary64 dot-product roundoff, with no physical angular tolerance. */
  error: number;
}

/**
 * Prepare the nearest effector articulation under one unchanged clinical rig.
 * The admitted normalized basis, rest frame, domain and clamp must describe the
 * same joint and remain unchanged until the owning fit releases this closure.
 * Targets are bone-local articulations after parent and fixed rest frames have
 * been removed. The initial reference is the existing Euler reading clamped
 * through the caller's actual clamp, so numerical ties keep that reading.
 *
 * A plain box with at most two positive-width coordinates has a bilinear
 * quaternion objective. Actual Euler factor order and fixed-axis quaternions
 * give four coefficients once; a finite SVD/boundary candidate list then
 * contains its mathematical maximum. Every candidate is converted back to
 * clinical degrees, clamped and recomposed before its dot is compared. Full-turn
 * aliases, neutral/sign maps and a fixed middle coordinate remain in that path.
 *
 * Coupled swing/swing-twist gates, three mobile axes and unrepresentable alias
 * arithmetic retain the previous four-sweep, forty-step coordinate refinement.
 * That fallback is a bounded local search, not a global-optimum guarantee.
 * The analytic comparison identifies dots only within their summation error;
 * it does not declare an unreachable rotation reached or change a ROM limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines local target frame, normalized-basis and matching-clamp premises, closure lifetime, reference, analytic eligibility, actual-composition scoring and the retained fallback's limitation.
 * @evidence contracts/development/implementation.md#principled-implementation Quaternion products are linear in each mobile factor's cosine and sine. A box optimum is a feasible top singular pair or boundary sinusoid optimum (Eberly, Constrained Quaternions, sections 2.3 and 3); four actual factor coefficients include clinical placement and fixed axes. Only score intervals overlapping the largest measured four-term dot use squared clinical distance to the initial reading as a tie-break; comparison never chains approximate ties.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Rig-invariant coefficient preparation precedes one query closure; the math owner enumerates candidates and this owner alone converts, clamps and scores the shown articulations. The prior general refinement is kept here so all callers see the same fallback too.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixture, synthetic motion axis, grid, ROM relaxation or fitted result replaces the objective. Top-SVD and boundary candidates are never excluded by a numerical-rank classifier. The retained generic fallback still clips its probe spans to principal angles and has no global guarantee.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation builds at most four three-factor quaternion coefficients in constant work. An eligible query scores the reference plus at most eighteen angle pairs, at most nineteen actual joint recompositions, independently of interval width. An unsupported query whose clamp moves the reading retains four sweeps over at most three axes: two initial probes, forty golden-section probes and two comparison scores per axis, at most 528 joint recompositions, with principal-angle probe clipping unchanged. No runtime speedup has been measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All queries of one fit share its admitted basis, fixed-factor coefficients and rig intervals; targets, Euler references and actual candidate scores are query-local. Changed rig/frame/clamp semantics require another preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller's fit owns the closure and releases it with that fit; it retains the supplied rig/clamp and constant-size coefficients only, with no query history, global cache or external handle. Each returned joint belongs to that query.
 */
export function prepareJointRotationProjection(props: {
  domain: IAutoMovieJointRotationDomain;
  basis: IAutoMovieJointAxes;
  frame?: IAutoMovieRestFrame | undefined;
  clamp: (joint: IAutoMovieJointPose) => IAutoMovieJointPose;
}): (rotation: IAutoMovieQuaternion) => IAutoMovieJointPose {
  const constraint: IAutoMovieJointRotationDomain["constraint"] =
    props.domain.constraint;
  let box: boolean =
    constraint !== null &&
    (constraint.swingTwist === undefined || constraint.swingTwist === null) &&
    (constraint.swingDeg === undefined || constraint.swingDeg === null);
  const mobile: ClinicalAxis[] = [];
  const fixed: IAutoMovieJointPose = {
    bone: props.domain.bone,
    flexion: 0,
    abduction: 0,
    twist: 0,
  };
  for (const axis of AXES) {
    const range: IAutoMovieAngleRange | null = constraint?.[axis] ?? null;
    if (range === null) continue;
    if (
      !Number.isFinite(range.min) ||
      !Number.isFinite(range.max) ||
      range.min > range.max
    )
      box = false;
    fixed[axis] = range.min;
    if (range.max > range.min) mobile.push(axis);
  }
  if (mobile.length > 2) box = false;
  const ranges: IAutoMovieAngleRange[] = box
    ? mobile.map((axis: ClinicalAxis): IAutoMovieAngleRange => {
        const range: IAutoMovieAngleRange = constraint![axis]!;
        const a: number = toRigAngle(range.min, props.frame?.[axis])!;
        const b: number = toRigAngle(range.max, props.frame?.[axis])!;
        if (!Number.isFinite(a) || !Number.isFinite(b)) box = false;
        return { min: Math.min(a, b), max: Math.max(a, b) };
      })
    : [];
  const order: readonly ClinicalAxis[] =
    props.basis.twistPlacement === "distal"
      ? ["abduction", "flexion", "twist"]
      : ["twist", "abduction", "flexion"];
  const coefficients: IAutoMovieQuaternion[] =
    box && mobile.length > 0
      ? [0, 1, 2, 3].map((mask: number): IAutoMovieQuaternion => {
          if (mobile.length === 1 && mask >= 2)
            return { x: 0, y: 0, z: 0, w: 0 };
          let product: IAutoMovieQuaternion = Quaternion.identity();
          for (const axis of order) {
            const index: number = mobile.indexOf(axis);
            const factor: IAutoMovieQuaternion =
              index < 0
                ? Quaternion.fromAxisAngle(
                    props.basis[axis],
                    toRigAngle(fixed[axis], props.frame?.[axis]) ?? 0,
                  )
                : (mask & (1 << index)) === 0
                  ? Quaternion.identity()
                  : { ...props.basis[axis], w: 0 };
            product = Quaternion.multiply(product, factor);
          }
          return product;
        })
      : [];

  /** Preserve the existing bounded coordinate search for a non-box domain. */
  const general: (
    local: IAutoMovieQuaternion,
    raw: IAutoMovieJointPose,
    reference: IAutoMovieJointPose,
  ) => IAutoMovieJointPose = (
    local: IAutoMovieQuaternion,
    raw: IAutoMovieJointPose,
    reference: IAutoMovieJointPose,
  ): IAutoMovieJointPose => {
    let effector: IAutoMovieJointPose = reference;
    if (
      !AXES.some(
        (axis: ClinicalAxis): boolean =>
          Math.abs((effector[axis] ?? 0) - (raw[axis] ?? 0)) > 1e-9,
      )
    )
      return effector;
    const error: (joint: IAutoMovieJointPose) => number = (
      joint: IAutoMovieJointPose,
    ): number => {
      const q: IAutoMovieQuaternion = Quaternion.normalize(
        jointToQuaternionOnBasis(joint, props.basis, props.frame),
      );
      return (
        1 -
        Math.abs(q.x * local.x + q.y * local.y + q.z * local.z + q.w * local.w)
      );
    };
    const span: (axis: ClinicalAxis) => [number, number] | null = (
      axis: ClinicalAxis,
    ): [number, number] | null => {
      const low: number | null = props.clamp({ ...effector, [axis]: -1e6 })[
        axis
      ];
      const high: number | null = props.clamp({ ...effector, [axis]: 1e6 })[
        axis
      ];
      return low === null || high === null || !(high - low > 1e-9)
        ? null
        : [Math.max(low, -180), Math.min(high, 180)];
    };
    const ratio: number = (Math.sqrt(5) - 1) / 2;
    for (let sweep: number = 0; sweep < 4; sweep++)
      for (const axis of AXES) {
        const range: [number, number] | null = span(axis);
        if (range === null) continue;
        const at: (value: number) => IAutoMovieJointPose = (
          value: number,
        ): IAutoMovieJointPose => props.clamp({ ...effector, [axis]: value });
        let [lo, hi]: [number, number] = range;
        let c: number = hi - ratio * (hi - lo);
        let d: number = lo + ratio * (hi - lo);
        let fc: number = error(at(c));
        let fd: number = error(at(d));
        for (let i: number = 0; i < 40; i++) {
          if (fc <= fd) {
            hi = d;
            d = c;
            fd = fc;
            c = hi - ratio * (hi - lo);
            fc = error(at(c));
          } else {
            lo = c;
            c = d;
            fc = fd;
            d = lo + ratio * (hi - lo);
            fd = error(at(d));
          }
        }
        const candidate: IAutoMovieJointPose = at((lo + hi) / 2);
        if (error(candidate) < error(effector)) effector = candidate;
      }
    return effector;
  };

  return (rotation: IAutoMovieQuaternion): IAutoMovieJointPose => {
    const local: IAutoMovieQuaternion = Quaternion.normalize(rotation);
    const raw: IAutoMovieJointPose = {
      bone: props.domain.bone,
      ...decomposeJointRotationOnBasis(local, props.basis, props.frame),
    };
    const reference: IAutoMovieJointPose = props.clamp(raw);
    if (!box) return general(local, raw, reference);
    if (mobile.length === 0) return reference;
    const dot: (q: IAutoMovieQuaternion) => number = (
      q: IAutoMovieQuaternion,
    ): number => local.x * q.x + local.y * q.y + local.z * q.z + local.w * q.w;
    const first: ClinicalAxis = mobile[0]!;
    const second: ClinicalAxis | undefined = mobile[1];
    const pairs: [number, number][] | null = bilinearAngleBoxCandidates(
      [
        dot(coefficients[0]!),
        dot(coefficients[2]!),
        dot(coefficients[1]!),
        dot(coefficients[3]!),
      ],
      [ranges[0]!, ranges[1] ?? { min: 0, max: 0 }],
      [
        toRigAngle(reference[first], props.frame?.[first]) ?? 0,
        second === undefined
          ? 0
          : (toRigAngle(reference[second], props.frame?.[second]) ?? 0),
      ],
    );
    if (pairs === null) return general(local, raw, reference);

    // Four rounded products followed by three additions give gamma(4):
    // Higham, Accuracy and Stability of Numerical Algorithms, section 3.1;
    // https://epubs.siam.org/doi/10.1137/18M1226312 recalls gamma(n).
    // Four least-subnormal units cover gradual-underflow product errors.
    const unitRoundoff: number = Number.EPSILON / 2;
    const gamma: number = (4 * unitRoundoff) / (1 - 4 * unitRoundoff);
    const score: (joint: IAutoMovieJointPose) => IScore = (
      joint: IAutoMovieJointPose,
    ): IScore => {
      const q: IAutoMovieQuaternion = Quaternion.normalize(
        jointToQuaternionOnBasis(joint, props.basis, props.frame),
      );
      const terms: number[] = [
        local.x * q.x,
        local.y * q.y,
        local.z * q.z,
        local.w * q.w,
      ];
      const value: number = terms.reduce(
        (sum: number, term: number): number => sum + term,
        0,
      );
      const magnitude: number = terms.reduce(
        (sum: number, term: number): number => sum + Math.abs(term),
        0,
      );
      return {
        value: Math.abs(value),
        error: (gamma * magnitude) / (1 - gamma) + 4 * Number.MIN_VALUE,
      };
    };
    const evaluated: {
      joint: IAutoMovieJointPose;
      score: IScore;
      distance: number;
    }[] = [{ joint: reference, score: score(reference), distance: 0 }];
    let maximum: IScore = evaluated[0]!.score;
    for (const pair of pairs) {
      const candidate: IAutoMovieJointPose = { ...reference };
      candidate[first] = toClinicalAngle(pair[0], props.frame?.[first]);
      if (second !== undefined)
        candidate[second] = toClinicalAngle(pair[1], props.frame?.[second]);
      const admitted: IAutoMovieJointPose = props.clamp(candidate);
      const next: IScore = score(admitted);
      const distance: number = mobile.reduce(
        (sum: number, axis: ClinicalAxis): number =>
          sum + ((admitted[axis] ?? 0) - (reference[axis] ?? 0)) ** 2,
        0,
      );
      evaluated.push({ joint: admitted, score: next, distance });
      if (next.value > maximum.value) maximum = next;
    }
    let best: IAutoMovieJointPose = reference;
    let bestDistance: number = Infinity;
    for (const candidate of evaluated)
      if (
        candidate.score.value + candidate.score.error >=
          maximum.value - maximum.error &&
        maximum.value + maximum.error >=
          candidate.score.value - candidate.score.error &&
        candidate.distance < bestDistance
      ) {
        best = candidate.joint;
        bestDistance = candidate.distance;
      }
    return best;
  };
}
