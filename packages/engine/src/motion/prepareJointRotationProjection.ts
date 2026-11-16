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

  /** Actual unnormalized joint composition, before the score's normalization. */
  quaternion: IAutoMovieQuaternion;
}

/** One general-search composition, retained only while it is the incumbent. */
interface IComposed {
  /** Exact clinical coordinates from this query. */
  joint: IAutoMovieJointPose;

  /** Original joint composition, with its multiplication order unchanged. */
  quaternion: IAutoMovieQuaternion;

  /** Existing general-search objective, one minus the absolute dot. */
  error: number;
}

/** Query-local joint and an optional already completed raw composition. */
interface IEvaluation {
  /** Selected joint, owned by this query. */
  joint: IAutoMovieJointPose;

  /** Present when already evaluated or requested by withQuaternion. */
  quaternion: IAutoMovieQuaternion | undefined;
}

/** Exact composition key; null and signed zero remain different coordinates. */
function sameJoint(a: IAutoMovieJointPose, b: IAutoMovieJointPose): boolean {
  return a.bone === b.bone && Object.is(a.flexion, b.flexion) &&
    Object.is(a.abduction, b.abduction) && Object.is(a.twist, b.twist);
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
 * clinical degrees and clamped before its actual composed dot is compared.
 * Within one query, exactly equal admitted clinical records share that
 * composition and score; every candidate and its reference distance remain.
 * Full-turn aliases, neutral/sign maps and a fixed middle coordinate remain
 * in that path. withQuaternion additionally returns the selected joint's
 * already completed raw composition for a caller that will compose it again.
 *
 * Coupled swing/swing-twist gates, three mobile axes and unrepresentable alias
 * arithmetic retain the previous four-sweep, forty-step coordinate refinement.
 * That fallback is a bounded local search, not a global-optimum guarantee.
 * The analytic comparison identifies dots only within their summation error;
 * it does not declare an unreachable rotation reached or change a ROM limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines local target frame, normalized-basis and matching-clamp premises, closure lifetime, reference, analytic eligibility, actual-composition scoring and the retained fallback's limitation.
 * @evidence contracts/development/implementation.md#principled-implementation Quaternion products are linear in each mobile factor's cosine and sine. A box optimum is a feasible top singular pair or boundary sinusoid optimum (Eberly, Constrained Quaternions, sections 2.3 and 3); four actual factor coefficients include clinical placement and fixed axes. Only score intervals overlapping the largest measured four-term dot use squared clinical distance to the initial reading as a tie-break; comparison never chains approximate ties.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Rig-invariant factors and coefficients precede one query evaluator; the callable and paired-result reader share it. The math owner enumerates candidates and this owner alone converts, clamps and scores actual articulations. The prior general refinement remains here, with only exact incumbent-composition reuse.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixture, synthetic motion axis, grid, ROM relaxation or fitted result replaces the objective. Top-SVD and boundary candidates are never excluded by a numerical-rank classifier. The retained generic fallback still clips its probe spans to principal angles and has no global guarantee.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation composes each fixed-axis factor once, then at most four three-factor quaternion coefficients and the fixed dot-roundoff factor in constant work. An eligible query retains the reference plus at most eighteen angle pairs, comparing at most nineteen actual scores with a bounded exact-key reuse scan. General refinement keeps four sweeps over at most three axes and forty golden probes, at most 528 error reads, but reuses the unchanged incumbent's composition. withQuaternion reuses the selected raw composition, or composes once when a zero-axis/unchanged fallback query did not score it. Probe clipping and all clamp calls remain; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One unchanged workspace shares basis, fixed coefficients, intervals and dot-roundoff factor. Each scoring query owns a new OnBasis prepared composer, sharing Object.is-equal rig-angle factors and an inner product only when both private factor operands match; every joint still runs F/A/T angle/frame checks and its outer product is fresh. Equal clinical records share full composition/score; general search keeps incumbent/latest readings. Raw winners are reused before original caller normalization/world composition. All candidates, clamps and ties remain, and no factor/answer crosses into another query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the projector and its borrowed rig/clamp and constant coefficients until release. Analytic queries retain at most nineteen local readings; general queries retain an incumbent and latest reading. A paired result owns its wrapper/raw quaternion and keeps the callable's joint ownership. No target history, global cache, handle or task is retained.
 */
export function prepareJointRotationProjection(props: {
  domain: IAutoMovieJointRotationDomain;
  basis: IAutoMovieJointAxes;
  frame?: IAutoMovieRestFrame | undefined;
  clamp: (joint: IAutoMovieJointPose) => IAutoMovieJointPose;
}): prepareJointRotationProjection.IProjector {
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
  const fixedFactors: Partial<Record<ClinicalAxis, IAutoMovieQuaternion>> = {};
  if (box && mobile.length > 0)
    for (const axis of order)
      if (!mobile.includes(axis))
        fixedFactors[axis] = Quaternion.fromAxisAngle(
          props.basis[axis], toRigAngle(fixed[axis], props.frame?.[axis]) ?? 0,
        );
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
                ? fixedFactors[axis]!
                : (mask & (1 << index)) === 0
                  ? Quaternion.identity()
                  : { ...props.basis[axis], w: 0 };
            product = Quaternion.multiply(product, factor);
          }
          return product;
        })
      : [];
  const unitRoundoff: number = Number.EPSILON / 2;
  const gamma: number = (4 * unitRoundoff) / (1 - 4 * unitRoundoff);
  const candidateRanges: readonly [IAutoMovieAngleRange, IAutoMovieAngleRange] | null =
    box && mobile.length > 0 ? [ranges[0]!, ranges[1] ?? { min: 0, max: 0 }] : null;

  /** Compose only if the caller needs a quaternion not already evaluated. */
  const finish: (joint: IAutoMovieJointPose, requested: boolean,
    quaternion?: IAutoMovieQuaternion) => IEvaluation = (
    joint: IAutoMovieJointPose, requested: boolean, quaternion?: IAutoMovieQuaternion,
  ): IEvaluation => ({
    joint,
    quaternion: quaternion ?? (requested
      ? jointToQuaternionOnBasis(joint, props.basis, props.frame) : undefined),
  });

  /** Preserve the existing bounded coordinate search for a non-box domain. */
  const general: (
    local: IAutoMovieQuaternion,
    raw: IAutoMovieJointPose,
    reference: IAutoMovieJointPose,
    requested: boolean,
  ) => IEvaluation = (
    local: IAutoMovieQuaternion,
    raw: IAutoMovieJointPose,
    reference: IAutoMovieJointPose,
    requested: boolean,
  ): IEvaluation => {
    let effector: IAutoMovieJointPose = reference;
    let incumbent: IComposed | undefined;
    let last: IComposed | undefined;
    if (
      !AXES.some(
        (axis: ClinicalAxis): boolean =>
          Math.abs((effector[axis] ?? 0) - (raw[axis] ?? 0)) > 1e-9,
      )
    )
      return finish(effector, requested);
    const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> =
      jointToQuaternionOnBasis.prepare(props.basis, props.frame);
    const error: (joint: IAutoMovieJointPose) => number = (
      joint: IAutoMovieJointPose,
    ): number => {
      if (last !== undefined && sameJoint(last.joint, joint)) return last.error;
      if (incumbent !== undefined && sameJoint(incumbent.joint, joint)) {
        last = incumbent;
        return incumbent.error;
      }
      const quaternion: IAutoMovieQuaternion = compose(joint);
      const q: IAutoMovieQuaternion = Quaternion.normalize(
        quaternion,
      );
      const value: number = 1 -
        Math.abs(q.x * local.x + q.y * local.y + q.z * local.z + q.w * local.w);
      last = { joint, quaternion, error: value };
      if (sameJoint(effector, joint)) incumbent = last;
      return value;
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
        const candidateError: number = error(candidate);
        const candidateReading: IComposed = last!;
        if (candidateError < error(effector)) {
          effector = candidate;
          incumbent = candidateReading;
        }
      }
    return finish(effector, requested, incumbent?.quaternion);
  };

  /** Every target owns its references, candidates and completed compositions. */
  const evaluate: (rotation: IAutoMovieQuaternion, requested: boolean) => IEvaluation = (
    rotation: IAutoMovieQuaternion, requested: boolean,
  ): IEvaluation => {
    const local: IAutoMovieQuaternion = Quaternion.normalize(rotation);
    const raw: IAutoMovieJointPose = {
      bone: props.domain.bone,
      ...decomposeJointRotationOnBasis(local, props.basis, props.frame),
    };
    const reference: IAutoMovieJointPose = props.clamp(raw);
    if (!box) return general(local, raw, reference, requested);
    if (mobile.length === 0) return finish(reference, requested);
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
      candidateRanges!,
      [
        toRigAngle(reference[first], props.frame?.[first]) ?? 0,
        second === undefined
          ? 0
          : (toRigAngle(reference[second], props.frame?.[second]) ?? 0),
      ],
    );
    if (pairs === null) return general(local, raw, reference, requested);

    // Four rounded products followed by three additions give gamma(4):
    // Higham, Accuracy and Stability of Numerical Algorithms, section 3.1;
    // https://epubs.siam.org/doi/10.1137/18M1226312 recalls gamma(n).
    // Four least-subnormal units cover gradual-underflow product errors.
    const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> =
      jointToQuaternionOnBasis.prepare(props.basis, props.frame);
    const score: (joint: IAutoMovieJointPose) => IScore = (
      joint: IAutoMovieJointPose,
    ): IScore => {
      const quaternion: IAutoMovieQuaternion = compose(joint);
      const q: IAutoMovieQuaternion = Quaternion.normalize(
        quaternion,
      );
      const x: number = local.x * q.x;
      const y: number = local.y * q.y;
      const z: number = local.z * q.z;
      const w: number = local.w * q.w;
      let value: number = 0;
      value += x;
      value += y;
      value += z;
      value += w;
      let magnitude: number = 0;
      magnitude += Math.abs(x);
      magnitude += Math.abs(y);
      magnitude += Math.abs(z);
      magnitude += Math.abs(w);
      return {
        value: Math.abs(value),
        error: (gamma * magnitude) / (1 - gamma) + 4 * Number.MIN_VALUE,
        quaternion,
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

      // The same admitted coordinates under this query's unchanged target,
      // basis and frame compose the same quaternion, including null/-0.
      let known: (typeof evaluated)[number] | undefined;
      for (const entry of evaluated)
        if (sameJoint(entry.joint, admitted)) {
          known = entry;
          break;
        }
      const next: IScore = known?.score ?? score(admitted);
      let distance: number = 0;
      for (const axis of mobile)
        distance += ((admitted[axis] ?? 0) - (reference[axis] ?? 0)) ** 2;
      evaluated.push({ joint: admitted, score: next, distance });
      if (next.value > maximum.value) maximum = next;
    }
    let best: (typeof evaluated)[number] = evaluated[0]!;
    let bestDistance: number = Infinity;
    const maximumLow: number = maximum.value - maximum.error;
    const maximumHigh: number = maximum.value + maximum.error;
    for (const candidate of evaluated)
      if (
        candidate.score.value + candidate.score.error >=
          maximumLow &&
        maximumHigh >=
          candidate.score.value - candidate.score.error &&
        candidate.distance < bestDistance
      ) {
        best = candidate;
        bestDistance = candidate.distance;
      }
    return finish(best.joint, requested, best.score.quaternion);
  };
  return Object.assign(
    (rotation: IAutoMovieQuaternion): IAutoMovieJointPose => evaluate(rotation, false).joint,
    { withQuaternion: (rotation: IAutoMovieQuaternion): prepareJointRotationProjection.IProjection => {
      const result: IEvaluation = evaluate(rotation, true);
      return { joint: result.joint, quaternion: result.quaternion! };
    } },
  );
}

/**
 * Same-query access to the selected joint's already completed composition.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the original callable, the paired-result method, raw-quaternion normalization boundary and query-local ownership.
 * @evidence contracts/development/design.md#principled-representation A selected clinical articulation and its exact raw quaternion describe the same result; pairing them lets actual rotation consumers reuse completed composition without substituting a normalized or approximate rotation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The callable serves pose authoring and withQuaternion serves the existing distal-score and final-world-score consumers; no last-result getter, score cache or target-history control is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both reads run the same candidates, clamps and reference/tie policy; the result retains no solver, source pose or prior query and introduces no alternate projection method.
 */
export namespace prepareJointRotationProjection {
  /** The original callable plus an explicit paired-result read; neither caches targets. */
  export interface IProjector {
    /** Project one local target, retaining the callable's existing joint ownership. */
    (rotation: IAutoMovieQuaternion): IAutoMovieJointPose;

    /** Project once and return its joint with the exact unnormalized composition. */
    withQuaternion(rotation: IAutoMovieQuaternion): IProjection;
  }

  /** Fresh result wrapper and raw quaternion of one query, with the callable's joint ownership. */
  export interface IProjection {
    /** Selected clinical record, with the same reference/tie policy as the callable. */
    joint: IAutoMovieJointPose;

    /** Raw jointToQuaternionOnBasis result, before any caller normalization/world composition. */
    quaternion: IAutoMovieQuaternion;
  }
}
