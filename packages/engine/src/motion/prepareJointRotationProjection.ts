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
import { readNormalizedQuaternion } from "../math/readNormalizedQuaternion";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { prepareJointRotationCoefficientDots } from "./prepareJointRotationCoefficientDots";

/** The three named clinical coordinates, all measured in degrees. */
type ClinicalAxis = "flexion" | "abduction" | "twist";

/** Fixed coordinate order used only for stable reference and tie bookkeeping. */
const AXES: readonly ClinicalAxis[] = ["flexion", "abduction", "twist"];

/** Four numeric cells for each ordered analytic candidate; links use -1 as absent. */
const enum ScoreField {
  /** Absolute normalized actual-target dot. */
  VALUE = 0,
  /** Existing four-product roundoff radius. */
  ERROR = 1,
  /** Squared clinical distance from the unchanged query reference. */
  DISTANCE = 2,
  /** Previous candidate index in this first-coordinate row, or -1. */
  PREVIOUS = 3,
  /** Fixed cells per candidate, independent of the query's numerical inputs. */
  STRIDE = 4,
}

/** One of two reusable general-query readings, with a separately owned raw rotation. */
interface IComposed {
  /** Exact clinical coordinates from this query. */
  joint: IAutoMovieJointPose;

  /** Original joint composition, with its multiplication order unchanged. */
  quaternion: IAutoMovieQuaternion;

  /** Existing general-search objective, one minus the absolute dot. */
  error: number;
}

/** Direct joint output, or the explicitly requested joint/raw-quaternion pair. */
type IEvaluation = IAutoMovieJointPose | prepareJointRotationProjection.IProjection;

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
 * give four coefficients per actual fixed null/numeric mode; a finite SVD/boundary candidate list then
 * contains its mathematical maximum. Every candidate is converted back to
 * clinical degrees and clamped before its actual composed dot is compared.
 * Within one query, exactly equal admitted clinical records share that
 * composition and score. Their first occurrence also wins every later tie,
 * so duplicate occurrences need no retained score or distance record.
 * Full-turn aliases, neutral/sign maps and a fixed middle coordinate remain
 * in that path. withQuaternion additionally returns the selected joint's
 * already completed raw composition for a caller that will compose it again.
 * Scalar visitors read the original normalized components directly into the
 * score, preserving normalization and dot arithmetic without a temporary unit
 * quaternion. Each query owns its visitors and passes current raw/joint inputs
 * as synchronous arguments rather than retained pending state.
 *
 * Coupled swing/swing-twist gates, three mobile axes and unrepresentable alias
 * arithmetic retain the previous four-sweep, forty-step coordinate refinement.
 * That fallback is a bounded local search, not a global-optimum guarantee.
 * The analytic comparison identifies dots only within their summation error;
 * it does not declare an unreachable rotation reached or change a ROM limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines local target frame, normalized-basis and matching-clamp premises, closure lifetime, reference, analytic eligibility, actual-composition scoring and the retained fallback's limitation.
 * @evidence contracts/development/implementation.md#principled-implementation Quaternion products are linear in each mobile factor's cosine and sine. A box optimum is a feasible top singular pair or boundary sinusoid optimum (Eberly, Constrained Quaternions, sections 2.3 and 3); four actual factor coefficients include clinical placement and fixed axes. The ordinary clamp's specified immobile output is numeric clinical0, mapped through its frame. A caller's explicitly null fixed output instead contributes rig0. The actual reference's fixed null flags select the corresponding bounded rig-only coefficient mode; numeric zero-width coordinates always map their stated minimum. Only intervals overlapping the largest measured four-term dot use squared mobile clinical distance to the initial reading; null rest has clinical(rig0) as its coordinate and comparison never chains approximate ties.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The coefficient companion owns canonical factors and bounded fixed null-mode algebra; a lazy box enumerator precedes one query evaluator shared by callable/paired reads. Math owners enumerate candidates and expose original normalization scalars; this owner alone converts, clamps and scores actual articulations. Three query-local arrays keep ordered joints, raw quaternions and four numeric cells per candidate for value/error/distance/previous link, with named offsets and no per-score wrappers. One synchronous visitor receives current joint/raw arguments without per-candidate callbacks or pending-input slots. General refinement stays here with exact incumbent-composition reuse; both clinical comparisons use the same rig-zero conversion owner for null rest.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixture, synthetic motion axis, grid, ROM relaxation or fitted result replaces the objective. Numeric immobile outputs retain clinical0/frame conversion; explicit null outputs retain rig0, and only those source-fixed representation flags select a coefficient mode. No queried angle, target or result builds a mode. The generic unchanged gate and analytic clinical distance read null as clinical(rig0), keeping nonnull arithmetic, mobile summation order and the existing 1e-9 gate unchanged. Top-SVD/boundary candidates are never rank-excluded. Indexed scores retain duplicate-first, maximum, interval overlap and strict distance/tie order; -1 changes only absent row-link metadata. General refinement still clips spans to principal angles and has no global guarantee.
 * @evidence contracts/development/implementation.md#efficient-algorithms Canonical preparation composes four three-factor coefficients; at most two fixed axes allow at most four lazy rig-only null-mode sets. Only requested modes build, and exact +0 numeric/null factors already coincide. Fixed coefficient readers specialize exact one-component nonzero dots after finite target admission; other/zero-product dots keep their formula. Scorers share three axis magnitude preparations and at most two declared endpoint/fixed rig angles per axis, with four fixed inner combinations composed only on actual matches. Every query keeps fresh dynamic slots. At most nineteen unique scores use six scalar enumeration arguments; three bounded arrays replace one evaluated array plus nineteen score records with unchanged lookup/duplicate checks. General refinement keeps four sweeps, three axes, forty probes, at most 528 errors and two reusable rows. Both paths omit temporary normalized quaternions. Joint-only output creates no wrapper; paired output reuses its raw winner or composes once for an unscored result. Every probe/clamp remains; runtime improvement is unmeasured, and a one-score query uses one extra array header.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One unchanged workspace shares basis, intervals, dot roundoff, box metadata, axis/affine scalars and coefficients derived only from declared fixed numeric/null rig factors. Actual reference null flags choose among at most four rig modes without retaining a reference/target. Its stateless inverse shares three successful clinical frame readings while every quaternion retains finite admission/extraction/principal conversion. Fixed-angle declarations collect original endpoint/numeric factors and source-null rig0. Exact resolved-number matches alone borrow factors; two private declared operands alone share a fixed inner product. Dynamic factors/inner slots and original F/A/T lookups/finite checks stay query-owned. Composition/candidate/rest maps admit actual-used nonnull frames at first use; absent frames need no mapper there. Prepared inverse readers admit no numerical frame until actual conversion. Readers share only unchanged neutral/sign and re-admit replaced axis frames. Outer outputs stay fresh. Exact admitted duplicates share score/distance only here; strict first-distance ties keep their first occurrence. General search preserves incumbent/final rows; raw winners serve world composition. No target/reference/candidate or target-dependent factor crosses queries.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns projector/rig/clamp, box metadata, at most two fixed coefficient rows/lazy null factors and four mode arrays/sixteen coefficient-dot readers, three axis/composition-affine readers, three inverse-affine readers and three candidate/rest-clinical readers. Each affine reader holds one frame/two scalars; inverse callables retain no quaternion/angle. Six declared composition factors/their weak identity markers and four fixed inner products release with that operation. Each query owns dynamic factor/inner slots and a synchronous score/error visitor. Analytic queries hold two arrays of nineteen joints/quaternions, one of seventy-six numeric cells and one row-head map at most; duplicate admissions retain no entry/joint. General queries hold two incumbent/latest rows. Only the selected joint/raw quaternion and optional pair wrapper escape; no mode key retains a target, and no workspace/arrays/map/composer/visitor/query history, global cache, handle or task escapes.
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
  const immobile: ClinicalAxis[] = [];
  const fixed: IAutoMovieJointPose = {
    bone: props.domain.bone,
    flexion: 0,
    abduction: 0,
    twist: 0,
  };
  for (const axis of AXES) {
    const range: IAutoMovieAngleRange | null = constraint?.[axis] ?? null;
    if (range === null) {
      immobile.push(axis);
      continue;
    }
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
  const fixedRigAngles: jointToQuaternionOnBasis.IFixedAngles = {};
  const ranges: IAutoMovieAngleRange[] = box
    ? mobile.map((axis: ClinicalAxis): IAutoMovieAngleRange => {
        const range: IAutoMovieAngleRange = constraint![axis]!;
        const a: number = toRigAngle(range.min, props.frame?.[axis])!;
        const b: number = toRigAngle(range.max, props.frame?.[axis])!;
        if (!Number.isFinite(a) || !Number.isFinite(b)) box = false;
        else fixedRigAngles[axis] = [a, b];
        return { min: Math.min(a, b), max: Math.max(a, b) };
      })
    : [];
  const order: readonly ClinicalAxis[] =
    props.basis.twistPlacement === "distal"
      ? ["abduction", "flexion", "twist"]
      : ["twist", "abduction", "flexion"];
  const coefficientDots: ReturnType<typeof prepareJointRotationCoefficientDots> | null =
    box && mobile.length > 0 ? prepareJointRotationCoefficientDots({
      basis: props.basis, frame: props.frame,
      immobile, mobile, fixed, order, fixedRigAngles,
    }) : null;
  const unitRoundoff: number = Number.EPSILON / 2;
  const gamma: number = (4 * unitRoundoff) / (1 - 4 * unitRoundoff);
  const candidateBox: ReturnType<typeof bilinearAngleBoxCandidates.prepare> | null =
    box && mobile.length > 0 ? bilinearAngleBoxCandidates.prepare(
      [ranges[0]!, ranges[1] ?? { min: 0, max: 0 }],
    ) : null;
  const prepareComposition: ReturnType<typeof jointToQuaternionOnBasis.prepareQueries> =
    jointToQuaternionOnBasis.prepareQueries(props.basis, props.frame, box ? fixedRigAngles : undefined);
  const readJointRotation: ReturnType<ReturnType<typeof decomposeJointRotationOnBasis.prepareQueries>> =
    decomposeJointRotationOnBasis.prepareQueries(props.basis, props.frame)();
  let clinicalReaders: Partial<Record<ClinicalAxis, ReturnType<typeof toClinicalAngle.prepare>>> | undefined;

  /** Prepare only actual used nonnull affine frames, never candidate answers. */
  const clinical: (axis: ClinicalAxis, angle: number) => number = (
    axis: ClinicalAxis, angle: number,
  ): number => {
    const frame: IAutoMovieRestFrame[ClinicalAxis] = props.frame?.[axis];
    if (frame === undefined) return angle;
    const readers: NonNullable<typeof clinicalReaders> = clinicalReaders ??= {};
    const read: ReturnType<typeof toClinicalAngle.prepare> =
      readers[axis] ??= toClinicalAngle.prepare();
    return read(angle, frame)!;
  };

  /** Compose only if the caller needs a quaternion not already evaluated. */
  const finish: (joint: IAutoMovieJointPose, requested: boolean,
    quaternion?: IAutoMovieQuaternion) => IEvaluation = (
    joint: IAutoMovieJointPose, requested: boolean, quaternion?: IAutoMovieQuaternion,
  ): IEvaluation => requested ? {
    joint,
    quaternion: quaternion ?? jointToQuaternionOnBasis(joint, props.basis, props.frame),
  } : joint;

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
    let firstReading: IComposed | undefined;
    let secondReading: IComposed | undefined;
    if (
      !AXES.some(
        (axis: ClinicalAxis): boolean => {
          const shown: number | null = effector[axis];
          const shownClinical: number = shown === null ? clinical(axis, 0) : shown;
          const asked: number | null = raw[axis];
          return Math.abs(shownClinical - (asked === null ? clinical(axis, 0) : asked)) > 1e-9;
        },
      )
    )
      return finish(effector, requested);
    const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> =
      prepareComposition();
    const normalizedError: (x: number, y: number, z: number, w: number) => number = (
      x: number, y: number, z: number, w: number,
    ): number => 1 - Math.abs(x * local.x + y * local.y + z * local.z + w * local.w);
    const error: (joint: IAutoMovieJointPose) => number = (
      joint: IAutoMovieJointPose,
    ): number => {
      if (last !== undefined && sameJoint(last.joint, joint)) return last.error;
      if (incumbent !== undefined && sameJoint(incumbent.joint, joint)) {
        last = incumbent;
        return incumbent.error;
      }
      const quaternion: IAutoMovieQuaternion = compose(joint);
      const value: number = readNormalizedQuaternion(quaternion, normalizedError, undefined);
      const isEffector: boolean = sameJoint(effector, joint);

      // Preserve the incumbent, and preserve the just-scored candidate when
      // the first effector score is read for its final acceptance comparison.
      const useSecond: boolean = firstReading !== undefined &&
        (incumbent === firstReading ||
          (incumbent === undefined && isEffector && last === firstReading));
      let reading: IComposed | undefined = useSecond ? secondReading : firstReading;
      if (reading === undefined) {
        reading = { joint, quaternion, error: value };
        if (useSecond) secondReading = reading;
        else firstReading = reading;
      } else {
        reading.joint = joint;
        reading.quaternion = quaternion;
        reading.error = value;
      }
      last = reading;
      if (isEffector) incumbent = reading;
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
      ...readJointRotation(local),
    };
    const reference: IAutoMovieJointPose = props.clamp(raw);
    if (!box) return general(local, raw, reference, requested);
    if (mobile.length === 0) return finish(reference, requested);
    const first: ClinicalAxis = mobile[0]!;
    const second: ClinicalAxis | undefined = mobile[1];
    const dots: ReturnType<NonNullable<typeof coefficientDots>> = coefficientDots!(reference);
    const pairs: [number, number][] | null = candidateBox!.fromScalars(
      dots[0]!(local),
      dots[2]!(local),
      dots[1]!(local),
      dots[3]!(local),
      toRigAngle(reference[first], props.frame?.[first]) ?? 0,
      second === undefined
        ? 0
        : (toRigAngle(reference[second], props.frame?.[second]) ?? 0),
    );
    if (pairs === null) return general(local, raw, reference, requested);

    // Four rounded products followed by three additions give gamma(4):
    // Higham, Accuracy and Stability of Numerical Algorithms, section 3.1;
    // https://epubs.siam.org/doi/10.1137/18M1226312 recalls gamma(n).
    // Four least-subnormal units cover gradual-underflow product errors.
    const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> =
      prepareComposition();
    const joints: IAutoMovieJointPose[] = [];
    const quaternions: IAutoMovieQuaternion[] = [];
    const scores: number[] = [];
    /** One synchronous visitor per query, never one closure per candidate. */
    const normalizedScore: (
      x: number, y: number, z: number, w: number,
      quaternion: IAutoMovieQuaternion, joint: IAutoMovieJointPose,
    ) => number = (
      normalizedX: number, normalizedY: number, normalizedZ: number, normalizedW: number,
      quaternion: IAutoMovieQuaternion, joint: IAutoMovieJointPose,
    ): number => {
      const x: number = local.x * normalizedX;
      const y: number = local.y * normalizedY;
      const z: number = local.z * normalizedZ;
      const w: number = local.w * normalizedW;
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
      const index: number = joints.length;
      joints.push(joint);
      quaternions.push(quaternion);
      scores.push(Math.abs(value), (gamma * magnitude) / (1 - gamma) + 4 * Number.MIN_VALUE, 0, -1);
      return index;
    };
    const score: (joint: IAutoMovieJointPose) => number = (
      joint: IAutoMovieJointPose,
    ): number => {
      const quaternion: IAutoMovieQuaternion = compose(joint);
      return readNormalizedQuaternion(quaternion, normalizedScore, joint);
    };
    score(reference);
    const buckets: Map<number | null, number> = new Map();
    buckets.set(reference[first], 0);
    let maximum: number = 0;
    for (const pair of pairs) {
      const candidate: IAutoMovieJointPose = { ...reference };
      candidate[first] = clinical(first, pair[0]);
      if (second !== undefined)
        candidate[second] = clinical(second, pair[1]);
      const admitted: IAutoMovieJointPose = props.clamp(candidate);

      // The same admitted coordinates under this query's unchanged target,
      // basis and frame compose the same quaternion, including null/-0.
      // Numeric membership only narrows the scan; sameJoint below still
      // distinguishes signed zeros, every other coordinate and bone.
      const coordinate: number | null = admitted[first];
      const head: number | undefined = buckets.get(coordinate);
      let index: number = head ?? -1;
      let known: number | undefined;
      while (index >= 0) {
        if (sameJoint(joints[index]!, admitted)) {
          known = index;
          break;
        }
        index = scores[index * ScoreField.STRIDE + ScoreField.PREVIOUS]!;
      }
      if (known !== undefined) continue;
      const next: number = score(admitted);
      const offset: number = next * ScoreField.STRIDE;
      for (const axis of mobile) {
        const value: number | null = admitted[axis];
        const coordinate: number = value === null ? clinical(axis, 0) : value;
        const origin: number | null = reference[axis];
        scores[offset + ScoreField.DISTANCE]! +=
          (coordinate - (origin === null ? clinical(axis, 0) : origin)) ** 2;
      }
      scores[offset + ScoreField.PREVIOUS] = head ?? -1;
      buckets.set(coordinate, next);
      if (scores[offset + ScoreField.VALUE]! > scores[maximum * ScoreField.STRIDE + ScoreField.VALUE]!)
        maximum = next;
    }
    let best: number = 0;
    let bestDistance: number = Infinity;
    const maximumOffset: number = maximum * ScoreField.STRIDE;
    const maximumLow: number = scores[maximumOffset + ScoreField.VALUE]! - scores[maximumOffset + ScoreField.ERROR]!;
    const maximumHigh: number = scores[maximumOffset + ScoreField.VALUE]! + scores[maximumOffset + ScoreField.ERROR]!;
    for (let candidate: number = 0; candidate < joints.length; candidate++) {
      const offset: number = candidate * ScoreField.STRIDE;
      if (
        scores[offset + ScoreField.VALUE]! + scores[offset + ScoreField.ERROR]! >=
          maximumLow &&
        maximumHigh >=
          scores[offset + ScoreField.VALUE]! - scores[offset + ScoreField.ERROR]! &&
        scores[offset + ScoreField.DISTANCE]! < bestDistance
      ) {
        best = candidate;
        bestDistance = scores[offset + ScoreField.DISTANCE]!;
      }
    }
    return finish(joints[best]!, requested, quaternions[best]!);
  };
  return Object.assign(
    (rotation: IAutoMovieQuaternion): IAutoMovieJointPose =>
      evaluate(rotation, false) as IAutoMovieJointPose,
    { withQuaternion: (rotation: IAutoMovieQuaternion): prepareJointRotationProjection.IProjection =>
      evaluate(rotation, true) as prepareJointRotationProjection.IProjection },
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
