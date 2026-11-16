import type {
  IAutoMovieJointAxes, IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieResolvedJointAngles } from "../kinematics/IAutoMovieResolvedJointAngles";
import type { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import { prepareFiniteQuaternionDot } from "../math/prepareFiniteQuaternionDot";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toRigAngle } from "../rom/toRigAngle";

/** The inverse owner's three clinical coordinates, with no alternate axis representation. */
type ClinicalAxis = keyof IAutoMovieResolvedJointAngles;

/** One fixed coefficient's four-term dot reader, with its existing finite-input premise. */
type IDot = (target: IAutoMovieQuaternion) => number;

/** Actual fixed-rig inputs, already selected by the projector's box eligibility gate. */
interface IProps {
  /** Original normalized clinical axes. */
  basis: IAutoMovieJointAxes;
  /** Original clinical affine frame, unchanged for this operation. */
  frame: IAutoMovieRestFrame | undefined;
  /** Null-ROM coordinates collected at the projector's original range-read site. */
  immobile: readonly ClinicalAxis[];
  /** Positive-width coordinates in the original F/A/T ordering. */
  mobile: readonly ClinicalAxis[];
  /** Canonical numeric-zero immobile seed, or each numeric fixed range's minimum. */
  fixed: IAutoMovieJointPose;
  /** Original actual quaternion factor order. */
  order: readonly ClinicalAxis[];
  /** Caller-owned rig declarations, extended only with fixed null-rest rig zero. */
  fixedRigAngles: jointToQuaternionOnBasis.IFixedAngles;
}

/** One source-fixed factor and its optional distinct null-rest factor. */
interface IFixed {
  /** Fixed clinical coordinate whose actual reference representation selects the factor. */
  axis: ClinicalAxis;
  /** Original numeric-coordinate factor, composed at its original preparation site. */
  factor: IAutoMovieQuaternion;
  /** Null-mode bit, zero when null has the same exact rig angle or is not admitted. */
  bit: number;
  /** Lazy actual rig-zero factor; never an incoming target or scored result. */
  rest?: IAutoMovieQuaternion;
}

/**
 * Prepare the box objective's fixed-rig coefficients for actual fixed outputs.
 * Numeric immobile outputs mean clinical zero, as the ordinary clamp emits;
 * an explicitly null output instead means rig zero, as joint composition reads.
 * Only null-ROM fixed coordinates can select between these two declared modes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual numeric-zero versus explicit null-rest meanings, unchanged basis/frame/ranges, original factor order and the returned actual-reference mode selector's pure metadata/output ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Each coefficient is the original ordered product of fixed axis-angle factors and mobile cosine/sine factors. A numeric null-ROM output contributes toRigAngle(0,frame), whereas an actual null output contributes rig0. A reference's fixed null mask therefore selects one of at most two modes for two mobile axes or four modes for one mobile axis, with no target-dependent numerical coefficient.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This internal projector companion owns canonical fixed factors and their bounded nullable variants; the existing math owner supplies each quaternion dot. Numeric zero-width ranges always retain their stated minimum and original frame conversion. The projector still owns candidate enumeration, clamp, actual composition and selection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Canonical factors and the first coefficient set keep the original constructor frame-admission/factor/mask/order arithmetic. Additional modes use only declared null rig0 on a null-ROM axis, never a target quaternion, queried angle, projected joint or previous answer. A canonical exact +0 factor is already the null factor and needs no variant. No range, tolerance, candidate, numerical-rank or normalization policy changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two fixed coordinates give at most four lazy four-coefficient sets. Only the canonical set is built initially; a distinct null mode builds its pure rig algebra once when actually requested. Actual targets keep four dot reads and every actual score. Fixed rig declarations retain at most two angles per axis; work/storage are bounded independently of query count and runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only immutable rig factors and coefficients cross queries. Numeric and null rig-angle constants are predeclared for the existing composer, and fixed-mode dots reuse the same factor/mask arithmetic and finite-dot owner. The selector inspects only fixed-coordinate null flags; it never retains the reference or any target/result value.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One operation owns at most two fixed-factor rows/their lazy null factors, one axis lookup, at most four dot-reader arrays and their sixteen coefficient quaternions. Caller-owned fixed-angle declarations hold at most two numbers per axis. The selector retains no incoming reference, target, score, candidate, output, handle or task and releases with the projector.
 */
export function prepareJointRotationCoefficientDots(
  props: IProps,
): (reference: IAutoMovieJointPose) => readonly IDot[] {
  const fixed: Partial<Record<ClinicalAxis, IFixed>> = {};
  const nullable: IFixed[] = [];
  for (const axis of props.order)
    if (!props.mobile.includes(axis)) {
      const direction: IAutoMovieJointAxes[ClinicalAxis] = props.basis[axis];
      const angle: number = toRigAngle(props.fixed[axis], props.frame?.[axis]) ?? 0;
      const factor: IAutoMovieQuaternion = Quaternion.fromAxisAngle(direction, angle);
      const mayRest: boolean = props.immobile.includes(axis);
      const bit: number = mayRest && !Object.is(angle, 0) ? 1 << nullable.length : 0;
      const row: IFixed = { axis, factor, bit };
      fixed[axis] = row;
      if (bit !== 0) nullable.push(row);
      if (Number.isFinite(angle))
        props.fixedRigAngles[axis] = bit === 0 ? [angle] : [angle, 0];
    }
  const variants: Array<readonly IDot[] | undefined> = [];

  /** Original four coefficient masks, with only fixed rig representation varying. */
  const build: (mode: number) => readonly IDot[] = (mode: number): readonly IDot[] => {
    const coefficients: IAutoMovieQuaternion[] = [0, 1, 2, 3].map(
      (mask: number): IAutoMovieQuaternion => {
        if (props.mobile.length === 1 && mask >= 2)
          return { x: 0, y: 0, z: 0, w: 0 };
        let product: IAutoMovieQuaternion = Quaternion.identity();
        for (const axis of props.order) {
          const index: number = props.mobile.indexOf(axis);
          const row: IFixed | undefined = fixed[axis];
          const factor: IAutoMovieQuaternion = index < 0
            ? (mode & row!.bit) === 0 ? row!.factor
              : (row!.rest ??= Quaternion.fromAxisAngle(props.basis[axis], 0))
            : (mask & (1 << index)) === 0 ? Quaternion.identity() : { ...props.basis[axis], w: 0 };
          product = Quaternion.multiply(product, factor);
        }
        return product;
      },
    );
    return coefficients.map(prepareFiniteQuaternionDot);
  };
  const canonical: readonly IDot[] = build(0);
  variants[0] = canonical;
  if (nullable.length === 0) return (): readonly IDot[] => canonical;
  return (reference: IAutoMovieJointPose): readonly IDot[] => {
    let mode: number = 0;
    for (const row of nullable)
      if (reference[row.axis] === null) mode |= row.bit;
    const dots: readonly IDot[] = variants[mode] ??= build(mode);
    return dots;
  };
}
