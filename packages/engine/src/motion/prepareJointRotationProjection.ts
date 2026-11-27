import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieJointRotationDomain,
  IAutoMoviePrepareJointRotationProjection,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import { bilinearAngleBoxCandidates } from "../math/internal/bilinearAngleBoxCandidates";
import { readNormalizedQuaternion } from "../math/internal/readNormalizedQuaternion";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { prepareCardinalWristChord } from "./internal/prepareCardinalWristChord";
import { prepareJointProjectionClamp } from "./internal/prepareJointProjectionClamp";
import { prepareJointProjectionScores } from "./internal/prepareJointProjectionScores";
import { prepareJointRotationCoefficientDots } from "./internal/prepareJointRotationCoefficientDots";

/** The three named clinical coordinates, all measured in degrees. */
type ClinicalAxis = "flexion" | "abduction" | "twist";

/** Fixed coordinate order used only for stable reference and tie bookkeeping. */
const AXES: readonly ClinicalAxis[] = ["flexion", "abduction", "twist"];

/**
 * One of two reusable general-query readings, with a separately owned raw
 * rotation.
 */
interface IComposed {
  /** Exact clinical coordinates from this query. */
  joint: IAutoMovieJointPose;

  /** Original joint composition, with its multiplication order unchanged. */
  quaternion: IAutoMovieQuaternion;

  /** Existing general-search objective, one minus the absolute dot. */
  error: number;
}

/** Direct joint output, or the explicitly requested joint/raw-quaternion pair. */
type IEvaluation =
  | IAutoMovieJointPose
  | prepareJointRotationProjection.IProjection;

/** Exact composition key; null and signed zero remain different coordinates. */
function sameJoint(a: IAutoMovieJointPose, b: IAutoMovieJointPose): boolean {
  return (
    a.bone === b.bone &&
    Object.is(a.flexion, b.flexion) &&
    Object.is(a.abduction, b.abduction) &&
    Object.is(a.twist, b.twist)
  );
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
 * give four coefficients per actual fixed null/numeric mode; a finite
 * SVD/boundary candidate list then contains its mathematical maximum. Every
 * candidate is converted back to clinical degrees and clamped before its actual
 * composed dot is compared. Within one query, exactly equal admitted clinical
 * records share that composition and score. Their first occurrence also wins
 * every later tie, so duplicate occurrences need no retained score or distance
 * record. Full-turn aliases, neutral/sign maps and a fixed middle coordinate
 * remain in that path. withQuaternion additionally returns the selected joint's
 * already completed raw composition for a caller that will compose it again.
 * The actual composer forwards four completed raw scalars into normalization,
 * whose visitor reads the original normalized components directly into the
 * score. Indexed numeric cells retain the raw values; only a selected paired
 * result creates a quaternion record. Query-owned visitors keep every current
 * input on its synchronous call stack. An exclusive projector-owned workspace
 * reuses empty arrays and the row map; nested queries receive separate storage
 * and finally clears all candidate references on return or throw. Unknown clamp
 * outputs own copied bone/F/A/T values, so a callback reusing one mutable
 * result cannot overwrite a retained reference or selected joint. Explicit
 * swivelCandidates proposes intersections of an algebraic quaternion half-angle
 * circle with a native two-axis product surface. Its deferred native-clamp gate
 * leaves ordinary callable observations unchanged; actual angle ranges,
 * clamping, FK and goals still belong to its curve consumer.
 *
 * Coupled swing/swing-twist gates, three mobile axes and unrepresentable alias
 * arithmetic are refined one clinical coordinate at a time, at most four sweeps
 * and none after a sweep that moves nothing. Along one coordinate the composed
 * rotation's signed dot with the target is a sinusoid of half that coordinate's
 * rig angle, so where the clamp returns the line's candidates as asked (a box's
 * own coordinates) the line's least error is read at the sinusoid's stationary
 * value inside the span or at the span's ends, with no search. Where the clamp
 * moves a candidate off the line (a coupled gate or a foreign callback),
 * nothing states what it composes there, and that line keeps its forty-step
 * bracketed search. That fallback is a bounded local search, not a
 * global-optimum guarantee. The analytic comparison identifies dots only within
 * their summation error; it does not declare an unreachable rotation reached or
 * change a ROM limit.
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
    if (range.min > range.max) box = false;
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
        fixedRigAngles[axis] = [a, b];
        return { min: Math.min(a, b), max: Math.max(a, b) };
      })
    : [];
  const order: readonly ClinicalAxis[] =
    props.basis.rotationOrder === "flexion-abduction-twist"
      ? ["flexion", "abduction", "twist"]
      : props.basis.twistPlacement === "distal"
        ? ["abduction", "flexion", "twist"]
        : ["twist", "abduction", "flexion"];
  const coefficientDots: ReturnType<
    typeof prepareJointRotationCoefficientDots
  > | null =
    box && mobile.length > 0
      ? prepareJointRotationCoefficientDots({
          basis: props.basis,
          frame: props.frame,
          immobile,
          mobile,
          fixed,
          order,
          fixedRigAngles,
        })
      : null;
  const candidateBox: ReturnType<
    typeof bilinearAngleBoxCandidates.prepare
  > | null =
    box && mobile.length > 0
      ? bilinearAngleBoxCandidates.prepare([
          ranges[0]!,
          ranges[1] ?? { min: 0, max: 0 },
        ])
      : null;
  const prepareComposition: ReturnType<
    typeof jointToQuaternionOnBasis.prepareQueries
  > = jointToQuaternionOnBasis.prepareQueries(
    props.basis,
    props.frame,
    box ? fixedRigAngles : undefined,
  );
  const prepareScalarComposition: ReturnType<
    typeof jointToQuaternionOnBasis.prepareScalarQueries
  > = jointToQuaternionOnBasis.prepareScalarQueries(
    props.basis,
    props.frame,
    box ? fixedRigAngles : undefined,
  );
  const readJointRotation: ReturnType<
    ReturnType<typeof decomposeJointRotationOnBasis.prepareQueries>
  > = decomposeJointRotationOnBasis.prepareQueries(props.basis, props.frame)();
  const clinicalReaders: Record<
    ClinicalAxis,
    ReturnType<typeof toClinicalAngle.prepare>
  > = {
    flexion: toClinicalAngle.prepare(),
    abduction: toClinicalAngle.prepare(),
    twist: toClinicalAngle.prepare(),
  };

  /** Read the used nonnull affine frames, never candidate answers. */
  const clinical: (axis: ClinicalAxis, angle: number) => number = (
    axis: ClinicalAxis,
    angle: number,
  ): number => {
    const frame: IAutoMovieRestFrame[ClinicalAxis] = props.frame?.[axis];
    if (frame === undefined) return angle;
    return clinicalReaders[axis](angle, frame)!;
  };

  /** Compose only if the caller needs a quaternion not already evaluated. */
  const finish: (
    joint: IAutoMovieJointPose,
    requested: boolean,
    quaternion?: IAutoMovieQuaternion,
  ) => IEvaluation = (
    joint: IAutoMovieJointPose,
    requested: boolean,
    quaternion?: IAutoMovieQuaternion,
  ): IEvaluation =>
    requested
      ? {
          joint,
          quaternion:
            quaternion ??
            jointToQuaternionOnBasis(joint, props.basis, props.frame),
        }
      : joint;

  /** Preserve the existing bounded coordinate search for a non-box domain. */
  const general: (
    local: IAutoMovieQuaternion,
    raw: IAutoMovieJointPose,
    reference: IAutoMovieJointPose,
    requested: boolean,
    clamp: (
      callback: typeof props.clamp,
      joint: IAutoMovieJointPose,
    ) => IAutoMovieJointPose,
  ) => IEvaluation = (
    local: IAutoMovieQuaternion,
    raw: IAutoMovieJointPose,
    reference: IAutoMovieJointPose,
    requested: boolean,
    clamp: (
      callback: typeof props.clamp,
      joint: IAutoMovieJointPose,
    ) => IAutoMovieJointPose,
  ): IEvaluation => {
    let effector: IAutoMovieJointPose = reference;
    let incumbent: IComposed | undefined;
    let last: IComposed | undefined;
    let firstReading: IComposed | undefined;
    let secondReading: IComposed | undefined;
    if (admitted(effector, raw)) return finish(effector, requested);
    const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> =
      prepareComposition();
    const normalizedError: (
      x: number,
      y: number,
      z: number,
      w: number,
    ) => number = (x: number, y: number, z: number, w: number): number =>
      1 - Math.abs(x * local.x + y * local.y + z * local.z + w * local.w);
    const error: (joint: IAutoMovieJointPose) => number = (
      joint: IAutoMovieJointPose,
    ): number => {
      if (last !== undefined && sameJoint(last.joint, joint)) return last.error;
      if (incumbent !== undefined && sameJoint(incumbent.joint, joint)) {
        last = incumbent;
        return incumbent.error;
      }
      const quaternion: IAutoMovieQuaternion = compose(joint);
      const value: number = readNormalizedQuaternion(
        quaternion,
        normalizedError,
        undefined,
      );
      const isEffector: boolean = sameJoint(effector, joint);

      // Preserve the incumbent, and preserve the just-scored candidate when
      // the first effector score is read for its final acceptance comparison.
      const useSecond: boolean =
        firstReading !== undefined &&
        (incumbent === firstReading ||
          (incumbent === undefined && isEffector && last === firstReading));
      let reading: IComposed | undefined = useSecond
        ? secondReading
        : firstReading;
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
    const signed: (x: number, y: number, z: number, w: number) => number = (
      x: number,
      y: number,
      z: number,
      w: number,
    ): number => x * local.x + y * local.y + z * local.z + w * local.w;

    // Along one clinical coordinate, the others held, the composition is a
    // product of axis rotations of which one turns, so its signed dot with
    // the target is `A cos(r / 2) + B sin(r / 2)` in that coordinate's rig
    // angle `r`: `A` is the dot at a rig angle of 0 and `B` at half a turn.
    // Its size is greatest where `r / 2 = atan2(B, A)`, half a turn of `r / 2`
    // apart, and the error has no other minimum between the span's ends. So
    // where the clamp leaves the line's candidates as asked (a box's own
    // coordinates), the line's least error is at a stationary value inside
    // the span or at one of its ends: read there, with no search. A clamp
    // that moves a candidate off the line (a coupled gate, a foreign
    // callback) composes something else there, and the line keeps its
    // bracketed search.
    const lined: (
      axis: ClinicalAxis,
      lo: number,
      hi: number,
      at: (value: number) => IAutoMovieJointPose,
    ) => IAutoMovieJointPose | null = (
      axis: ClinicalAxis,
      lo: number,
      hi: number,
      at: (value: number) => IAutoMovieJointPose,
    ): IAutoMovieJointPose | null => {
      const zero: number = clinical(axis, 0);
      const half: number = clinical(axis, 180);
      const a: number = readNormalizedQuaternion(
        compose({ ...effector, [axis]: zero }),
        signed,
        undefined,
      );
      const b: number = readNormalizedQuaternion(
        compose({ ...effector, [axis]: half }),
        signed,
        undefined,
      );
      const values: number[] = [];
      if (a !== 0 || b !== 0) {
        // The clinical reading of the stationary rig angle, and its aliases
        // a full turn apart inside the span, the nearest the held value first.
        const peak: number = clinical(
          axis,
          (2 * Math.atan2(b, a) * 180) / Math.PI,
        );
        const held: number = effector[axis] ?? zero;
        const nearest: number = peak + 360 * Math.round((held - peak) / 360);
        for (const value of [nearest, nearest - 360, nearest + 360])
          if (value >= lo && value <= hi) values.push(value);
      }
      values.push(lo, hi);
      let best: IAutoMovieJointPose | null = null;
      let least: number = Infinity;
      for (const value of values) {
        const joint: IAutoMovieJointPose = at(value);
        for (const other of AXES)
          if (
            !Object.is(joint[other], other === axis ? value : effector[other])
          )
            return null;
        const reached: number = error(joint);
        if (reached < least) {
          least = reached;
          best = joint;
        }
      }
      return best;
    };
    const ratio: number = (Math.sqrt(5) - 1) / 2;
    for (let sweep: number = 0; sweep < 4; sweep++) {
      // A sweep that moves nothing leaves every later sweep the same lines
      // to read, with the same answers.
      let moved: boolean = false;
      for (const axis of AXES) {
        const range: [number, number] | null = span(axis);
        if (range === null) continue;
        const at: (value: number) => IAutoMovieJointPose = (
          value: number,
        ): IAutoMovieJointPose =>
          clamp(props.clamp, { ...effector, [axis]: value });
        let [lo, hi]: [number, number] = range;
        let candidate: IAutoMovieJointPose | null = lined(axis, lo, hi, at);
        if (candidate === null) {
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
          candidate = at((lo + hi) / 2);
        }
        const candidateError: number = error(candidate);
        const candidateReading: IComposed = last!;
        if (candidateError < error(effector)) {
          effector = candidate;
          incumbent = candidateReading;
          moved = true;
        }
      }
      if (!moved) break;
    }
    return finish(effector, requested, incumbent?.quaternion);
  };

  /**
   * Whether the clamp left the asked reading as it is on every axis, to the
   * general search's own 1e-9 degrees.
   */
  const admitted: (
    shown: IAutoMovieJointPose,
    raw: IAutoMovieJointPose,
  ) => boolean = (
    shown: IAutoMovieJointPose,
    raw: IAutoMovieJointPose,
  ): boolean =>
    !AXES.some((axis: ClinicalAxis): boolean => {
      const held: number | null = shown[axis];
      const asked: number | null = raw[axis];
      return (
        Math.abs(
          (held === null ? clinical(axis, 0) : held) -
            (asked === null ? clinical(axis, 0) : asked),
        ) > 1e-9
      );
    });

  /** Analytic ranking owns its bounded scratch; generic queries never enter it. */
  const scoreBox: ReturnType<typeof prepareJointProjectionScores> | null =
    box && mobile.length > 0
      ? prepareJointProjectionScores({
          mobile,
          composition: prepareScalarComposition,
          clinical,
          sameJoint,
        })
      : null;

  /** Every target owns its references, candidates and completed compositions. */
  const evaluate: (
    rotation: IAutoMovieQuaternion,
    requested: boolean,
  ) => IEvaluation = (
    rotation: IAutoMovieQuaternion,
    requested: boolean,
  ): IEvaluation => {
    const local: IAutoMovieQuaternion = Quaternion.normalize(rotation);
    const raw: IAutoMovieJointPose = {
      bone: props.domain.bone,
      ...readJointRotation(local),
    };
    const clamp: ReturnType<typeof prepareJointProjectionClamp> =
      prepareJointProjectionClamp(props, raw);
    const reference: IAutoMovieJointPose = clamp.reference;
    if (!box) return general(local, raw, reference, requested, clamp.project);
    if (mobile.length === 0) return finish(reference, requested);

    // A reading its clamp leaves as it is lies inside the box already: it
    // composes the asked rotation itself, no admitted articulation is
    // nearer than none away, and it is the reference every tie keeps.
    if (admitted(reference, raw)) return finish(reference, requested);
    const first: ClinicalAxis = mobile[0]!;
    const second: ClinicalAxis | undefined = mobile[1];
    const dots: ReturnType<NonNullable<typeof coefficientDots>> =
      coefficientDots!(reference);
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
    if (pairs === null)
      return general(local, raw, reference, requested, clamp.project);

    return scoreBox!(local, reference, pairs, clamp, requested);
  };
  /** The original paired projection and its independently admitted bound. */
  const withQuaternion: prepareJointRotationProjection.IProjector["withQuaternion"] &
    prepareJointRotationProjection.IChorded = Object.assign(
    (
      rotation: IAutoMovieQuaternion,
    ): prepareJointRotationProjection.IProjection =>
      evaluate(rotation, true) as prepareJointRotationProjection.IProjection,
    {
      chord:
        box &&
        constraint !== null &&
        constraint.twist === null &&
        mobile.length === 2 &&
        mobile[0] === "flexion" &&
        mobile[1] === "abduction" &&
        (props.frame?.twist?.neutral ?? 0) === 0 &&
        clampJointToSkeleton.ownsConstraint(props.clamp, constraint)
          ? prepareCardinalWristChord(props.basis, ranges[0]!, ranges[1]!)
          : undefined,
    },
  );
  return Object.assign(
    (rotation: IAutoMovieQuaternion): IAutoMovieJointPose =>
      evaluate(rotation, false) as IAutoMovieJointPose,
    {
      withQuaternion,
      swivelCandidates: (
        cosine: IAutoMovieQuaternion,
        sine: IAutoMovieQuaternion,
      ): ReturnType<prepareJointRotationCoefficientDots.IReader["swivels"]> => {
        if (
          !box ||
          mobile.length !== 2 ||
          clampJointToSkeleton.borrow(props.clamp) === undefined
        )
          return null;

        // Genuine box clamps emit numeric fixed coordinates from numeric
        // decomposition, so the canonical fixed mode governs this family.
        // These are orientation proposals, never admitted joint results.
        return coefficientDots!.swivels(fixed, cosine, sine);
      },
    },
  );
}

/** Same-query access to the selected joint's already completed composition. */
export namespace prepareJointRotationProjection {
  /**
   * The interface contract
   * (`IAutoMoviePrepareJointRotationProjection.IProjector`).
   */
  export type IProjector = IAutoMoviePrepareJointRotationProjection.IProjector;

  /**
   * The interface contract
   * (`IAutoMoviePrepareJointRotationProjection.IProjection`).
   */
  export type IProjection =
    IAutoMoviePrepareJointRotationProjection.IProjection;

  /**
   * Read a squared angular lower bound owned by the exact paired callback.
   * Native box ownership, zero rig twist and cardinal arcs are checked at
   * construction. A foreign, wrapped or unsupported callback has no bound.
   *
   * A constant-time weak lookup borrows the original proof reader without
   * invoking the callback. The fixed arc metadata releases with that callback.
   */
  export function wristChord(
    projector: (IProjector["withQuaternion"] & IChorded) | undefined,
  ): ReturnType<typeof prepareCardinalWristChord> {
    return projector?.chord;
  }

  /** A paired projection carries its wrist chord bound. */
  export interface IChorded {
    /** The cardinal wrist bound, made with the projection; absent when none. */
    readonly chord?: ReturnType<typeof prepareCardinalWristChord>;
  }
}
