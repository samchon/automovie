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
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { prepareJointProjectionClamp } from "./prepareJointProjectionClamp";
import { prepareJointProjectionScores } from "./prepareJointProjectionScores";
import { prepareJointRotationCoefficientDots } from "./prepareJointRotationCoefficientDots";

/** The three named clinical coordinates, all measured in degrees. */
type ClinicalAxis = "flexion" | "abduction" | "twist";

/** Fixed coordinate order used only for stable reference and tie bookkeeping. */
const AXES: readonly ClinicalAxis[] = ["flexion", "abduction", "twist"];

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
 * The actual composer forwards four completed raw scalars into normalization,
 * whose visitor reads the original normalized components directly into the
 * score. Indexed numeric cells retain the raw values; only a selected paired
 * result creates a quaternion record. Query-owned visitors keep every current
 * input on its synchronous call stack. An exclusive projector-owned workspace
 * reuses empty arrays and the row map; nested queries receive separate storage
 * and finally clears all candidate references on return or throw.
 * Unknown clamp outputs own copied bone/F/A/T values, so a callback reusing
 * one mutable result cannot overwrite a retained reference or selected joint.
 * Explicit swivelCandidates proposes intersections of an algebraic quaternion
 * half-angle circle with a native two-axis product surface. Its deferred
 * native-clamp gate leaves ordinary callable observations unchanged; actual
 * angle ranges, clamping, FK and goals still belong to its curve consumer.
 *
 * Coupled swing/swing-twist gates, three mobile axes and unrepresentable alias
 * arithmetic retain the previous four-sweep, forty-step coordinate refinement.
 * That fallback is a bounded local search, not a global-optimum guarantee.
 * The analytic comparison identifies dots only within their summation error;
 * it does not declare an unreachable rotation reached or change a ROM limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines local target frame, normalized-basis and matching-clamp premises, closure lifetime, reference, analytic eligibility, actual-composition scoring and the retained fallback's limitation.
 * @evidence contracts/development/implementation.md#principled-implementation Quaternion products are linear in each mobile factor's cosine and sine. A box optimum is a feasible top singular pair or boundary sinusoid optimum (Eberly, Constrained Quaternions, sections 2.3 and 3); four actual factor coefficients include clinical placement and fixed axes. The ordinary clamp's specified immobile output is numeric clinical0, mapped through its frame. A caller's explicitly null fixed output instead contributes rig0. The actual reference's fixed null flags select the corresponding bounded rig-only coefficient mode; numeric zero-width coordinates always map their stated minimum. Only intervals overlapping the largest measured four-term dot use squared mobile clinical distance to the initial reading; null rest has clinical(rig0) as its coordinate and comparison never chains approximate ties.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The coefficient companion owns rig algebra and math completes flat enumeration before candidate clamps. OnBasis composition feeds shared normalization. prepareJointProjectionClamp owns genuine scratch and stable foreign outputs. prepareJointProjectionScores owns analytic actual-candidate scores, duplicate rows, unchanged tie selection and reentrant-safe empty storage. Domain selection and generic bounds/search stay here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixture, synthetic motion axis, grid, ROM relaxation or fitted result replaces the objective. Numeric immobile outputs retain clinical0/frame conversion; explicit null outputs retain rig0, and only those source-fixed representation flags select a coefficient mode. No queried angle, target or result builds a mode. The generic unchanged gate and analytic clinical distance read null as clinical(rig0), keeping nonnull arithmetic, mobile summation order and the existing 1e-9 gate unchanged. Top-SVD/boundary candidates are never rank-excluded. Indexed scores retain duplicate-first, maximum, interval overlap and strict distance/tie order; -1 changes only absent row-link metadata. General refinement still clips spans to principal angles and has no global guarantee.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed rig factors retain bounded exact-match sharing. Flat enumeration removes up to eighteen pair tuples, and at most nineteen actual analytic compositions omit outer quaternion records. Ordinary analytic queries reuse two empty arrays and a row map under an exclusive lease; recursive calls allocate isolated storage. Genuine clamps reuse one input scratch; foreign callbacks retain fresh inputs. Paired output copies selected raw cells once. General retains four sweeps/three axes/forty probes and at most 528 errors. All candidate/clamp/tie work remains; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One unchanged workspace shares basis, intervals, dot roundoff, box metadata, axis/affine scalars and coefficients derived only from declared fixed numeric/null rig factors. Actual reference null flags choose among at most four rig modes without retaining a reference/target. Its stateless inverse shares three successful clinical frame readings while every quaternion retains finite admission/extraction/principal conversion. Fixed-angle declarations collect original endpoint/numeric factors and source-null rig0. Exact resolved-number matches alone borrow factors; two private declared operands alone share a fixed inner product. Dynamic factors/inner slots and original F/A/T lookups/finite checks stay query-owned. Composition/candidate/rest maps admit actual-used nonnull frames at first use; absent frames need no mapper there. Prepared inverse readers admit no numerical frame until actual conversion. Readers share only unchanged neutral/sign and re-admit replaced axis frames. Outer outputs stay fresh. Exact admitted duplicates share score/distance only here; strict first-distance ties keep their first occurrence. General search preserves incumbent/final rows; raw winners serve world composition. No target/reference/candidate or target-dependent factor crosses queries.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Rig coefficients stay projector-owned. Regular/scalar factories each own at most three axis/affine readers, six fixed factors/four fixed inner products. Queries own dynamic factors, scratch, arguments and visitors. Analytic queries retain at most 36 flat pair cells, nineteen admitted joints, 152 score/raw cells and a row map. finally clears all workspace references; only empty primary capacity stays with the projector. Nested storage releases with its call. General keeps two rows. Only selected independent outputs escape; no target history or handle survives.
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
  const candidateBox: ReturnType<typeof bilinearAngleBoxCandidates.prepare> | null =
    box && mobile.length > 0 ? bilinearAngleBoxCandidates.prepare(
      [ranges[0]!, ranges[1] ?? { min: 0, max: 0 }],
    ) : null;
  const prepareComposition: ReturnType<typeof jointToQuaternionOnBasis.prepareQueries> =
    jointToQuaternionOnBasis.prepareQueries(props.basis, props.frame, box ? fixedRigAngles : undefined);
  const prepareScalarComposition: ReturnType<typeof jointToQuaternionOnBasis.prepareScalarQueries> =
    jointToQuaternionOnBasis.prepareScalarQueries(props.basis, props.frame, box ? fixedRigAngles : undefined);
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
    clamp: (callback: typeof props.clamp, joint: IAutoMovieJointPose) => IAutoMovieJointPose,
  ) => IEvaluation = (
    local: IAutoMovieQuaternion,
    raw: IAutoMovieJointPose,
    reference: IAutoMovieJointPose,
    requested: boolean,
    clamp: (callback: typeof props.clamp, joint: IAutoMovieJointPose) => IAutoMovieJointPose,
  ): IEvaluation => {
    let effector: IAutoMovieJointPose = reference;
    let incumbent: IComposed | undefined;
    let last: IComposed | undefined;
    let firstReading: IComposed | undefined;
    let secondReading: IComposed | undefined;
    if (admitted(effector, raw)) return finish(effector, requested);
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
        ): IAutoMovieJointPose => clamp(props.clamp, { ...effector, [axis]: value });
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

  /** Whether the clamp left the asked reading as it is on every axis, to the general search's own 1e-9 degrees. */
  const admitted: (shown: IAutoMovieJointPose, raw: IAutoMovieJointPose) => boolean = (
    shown: IAutoMovieJointPose, raw: IAutoMovieJointPose,
  ): boolean => !AXES.some((axis: ClinicalAxis): boolean => {
    const held: number | null = shown[axis];
    const asked: number | null = raw[axis];
    return Math.abs((held === null ? clinical(axis, 0) : held) -
      (asked === null ? clinical(axis, 0) : asked)) > 1e-9;
  });

  /** Analytic ranking owns its bounded scratch; generic queries never enter it. */
  const scoreBox: ReturnType<typeof prepareJointProjectionScores> | null =
    box && mobile.length > 0 ? prepareJointProjectionScores({
      mobile, composition: prepareScalarComposition, clinical, sameJoint,
    }) : null;

  /** Every target owns its references, candidates and completed compositions. */
  const evaluate: (rotation: IAutoMovieQuaternion, requested: boolean) => IEvaluation = (
    rotation: IAutoMovieQuaternion, requested: boolean,
  ): IEvaluation => {
    const local: IAutoMovieQuaternion = Quaternion.normalize(rotation);
    const raw: IAutoMovieJointPose = {
      bone: props.domain.bone,
      ...readJointRotation(local),
    };
    const clamp: ReturnType<typeof prepareJointProjectionClamp> = prepareJointProjectionClamp(props, raw);
    const reference: IAutoMovieJointPose = clamp.reference;
    if (!box) return general(local, raw, reference, requested, clamp.project);
    if (mobile.length === 0) return finish(reference, requested);

    // A reading its clamp leaves as it is lies inside the box already: it
    // composes the asked rotation itself, no admitted articulation is
    // nearer than none away, and it is the reference every tie keeps.
    if (admitted(reference, raw)) return finish(reference, requested);
    const first: ClinicalAxis = mobile[0]!;
    const second: ClinicalAxis | undefined = mobile[1];
    const dots: ReturnType<NonNullable<typeof coefficientDots>> = coefficientDots!(reference);
    const pairs: number[] | null = candidateBox!.fromScalarsFlat(
      dots[0]!(local),
      dots[2]!(local),
      dots[1]!(local),
      dots[3]!(local),
      toRigAngle(reference[first], props.frame?.[first]) ?? 0,
      second === undefined
        ? 0
        : (toRigAngle(reference[second], props.frame?.[second]) ?? 0),
    );
    if (pairs === null) return general(local, raw, reference, requested, clamp.project);

    return scoreBox!(local, reference, pairs, clamp, requested);
  };
  return Object.assign(
    (rotation: IAutoMovieQuaternion): IAutoMovieJointPose =>
      evaluate(rotation, false) as IAutoMovieJointPose,
    {
      withQuaternion: (rotation: IAutoMovieQuaternion): prepareJointRotationProjection.IProjection =>
        evaluate(rotation, true) as prepareJointRotationProjection.IProjection,
      swivelCandidates: (cosine: IAutoMovieQuaternion,
        sine: IAutoMovieQuaternion): ReturnType<prepareJointRotationCoefficientDots.IReader["swivels"]> => {
        if (!box || mobile.length !== 2 ||
          clampJointToSkeleton.borrow(props.clamp) === undefined) return null;

        // Genuine box clamps emit numeric fixed coordinates from numeric
        // decomposition, so the canonical fixed mode governs this family.
        // These are orientation proposals, never admitted joint results.
        return coefficientDots!.swivels(fixed, cosine, sine);
      },
    },
  );
}

/**
 * Same-query access to the selected joint's already completed composition.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines original callable/paired output, raw-quaternion ownership and explicit degree-valued two-axis circle proposals with independent physical acceptance obligations.
 * @evidence contracts/development/design.md#principled-representation A selected articulation/raw quaternion pair describes one completed projection. The separate half-angle-circle proposal uses the same fixed coefficient basis but returns only geometric roots, never an admitted pose or global score.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Pose authoring uses callable projection, distal/final scoring uses withQuaternion, and explicit owned continuation uses optional swivelCandidates. No coefficient state, last-result getter, pose cache or target history is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both projection reads retain original clamp/candidate/tie policy. Native-only root proposals retain no query and certify no constraint; foreign/coupled/non-two-axis cases decline and actual curve checks/fallback remain mandatory.
 */
export namespace prepareJointRotationProjection {
  /** The original callable plus an explicit paired-result read; neither caches targets. */
  export interface IProjector {
    /** Project one local target with the same numerical candidate and tie policy. */
    (rotation: IAutoMovieQuaternion): IAutoMovieJointPose;

    /** Project once and return its joint with the exact unnormalized composition. */
    withQuaternion(rotation: IAutoMovieQuaternion): IProjection;

    /**
     * Propose degree-valued swivels where the algebraic quaternion half-angle
     * circle lies on this native two-axis box's unrestricted product surface.
     * Angle ranges, actual clamp/FK, goals and continuity must still be checked.
     * Unknown/coupled/non-two-axis projectors decline; public callable scoring
     * and its callback order are unaffected. Foreign projectors may omit it.
     */
    swivelCandidates?(cosine: IAutoMovieQuaternion,
      sine: IAutoMovieQuaternion): ReturnType<prepareJointRotationCoefficientDots.IReader["swivels"]>;
  }

  /** Fresh result wrapper and raw quaternion of one query, with the callable's joint ownership. */
  export interface IProjection {
    /** Selected clinical record; unknown clamp outputs are stable four-field snapshots. */
    joint: IAutoMovieJointPose;

    /** Raw jointToQuaternionOnBasis result, before any caller normalization/world composition. */
    quaternion: IAutoMovieQuaternion;
  }
}
