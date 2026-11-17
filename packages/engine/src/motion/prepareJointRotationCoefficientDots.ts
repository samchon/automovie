import type {
  IAutoMovieJointAxes, IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieResolvedJointAngles } from "../kinematics/IAutoMovieResolvedJointAngles";
import type { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import { bilinearQuaternionSwivelRoots } from "../math/bilinearQuaternionSwivelRoots";
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

/** One source-fixed coefficient basis and its structured Gram cross term. */
interface IVariant {
  /** Four original coefficient dot readers in mask order. */
  dots: readonly IDot[];
  /** C1 dot C2, equal to minus C0 dot C3 for this product family. */
  cross: number;
}

/**
 * Prepare the box objective's fixed-rig coefficients for actual fixed outputs.
 * Numeric immobile outputs mean clinical zero, as the ordinary clamp emits;
 * an explicitly null output instead means rig zero, as joint composition reads.
 * Only null-ROM fixed coordinates can select between these two declared modes.
 * The explicit two-axis companion also keeps the source-fixed Gram cross
 * term. Its four product columns have unit norm, C1.C2=-C0.C3, and all
 * remaining cross-dots zero. Two actual half-angle quaternion coefficients
 * therefore map through the structured adjugate to the shared rank-one
 * sinusoid solver. Its roots are proposals, not ROM or objective admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual numeric-zero versus explicit null-rest meanings, unchanged basis/frame/ranges, original factor order and the returned actual-reference mode selector's pure metadata/output ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Each coefficient is the original ordered product of fixed axis-angle factors and mobile cosine/sine factors. A numeric null-ROM output contributes toRigAngle(0,frame), whereas an actual null output contributes rig0. A reference's fixed null mask therefore selects one of at most two modes for two mobile axes or four modes for one mobile axis, with no target-dependent numerical coefficient.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns fixed factors, bounded nullable coefficient variants and their Gram cross term; existing math owns dots and rank-one swivel intersections. Numeric zero-width ranges keep their original minimum/frame conversion. Ordinary projection still owns enumeration/clamp/composition/ties; explicit continuation separately verifies proposed roots.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Canonical factors and the first coefficient set keep the original constructor frame-admission/factor/mask/order arithmetic. Additional modes use only declared null rig0 on a null-ROM axis, never a target quaternion, queried angle, projected joint or previous answer. A canonical exact +0 factor is already the null factor and needs no variant. No range, tolerance, candidate, numerical-rank or normalization policy changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four lazy four-coefficient sets retain one additional Gram scalar each. Ordinary targets keep four dot reads and every score. An explicit two-axis circle uses eight fixed dots and constant rank-one root work before independent physical checks; no target search is cached. Fixed declarations retain at most two angles per axis and gains remain unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only immutable rig factors and coefficients cross queries. Numeric and null rig-angle constants are predeclared for the existing composer, and fixed-mode dots reuse the same factor/mask arithmetic and finite-dot owner. The selector inspects only fixed-coordinate null flags; it never retains the reference or any target/result value.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One operation owns at most two fixed-factor rows/their lazy null factors, one axis lookup, at most four dot-reader arrays and their sixteen coefficient quaternions. Caller-owned fixed-angle declarations hold at most two numbers per axis. The selector retains no incoming reference, target, score, candidate, output, handle or task and releases with the projector.
 */
export function prepareJointRotationCoefficientDots(
  props: IProps,
): prepareJointRotationCoefficientDots.IReader {
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
  const variants: Array<IVariant | undefined> = [];

  /** Original four coefficient masks, with only fixed rig representation varying. */
  const build: (mode: number) => IVariant = (mode: number): IVariant => {
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
    const dots: readonly IDot[] = coefficients.map(prepareFiniteQuaternionDot);
    return { dots, cross: dots[1]!(coefficients[2]!) };
  };
  const canonical: IVariant = build(0);
  variants[0] = canonical;
  const read: (reference: IAutoMovieJointPose) => IVariant = (
    reference: IAutoMovieJointPose,
  ): IVariant => {
    if (nullable.length === 0) return canonical;
    let mode: number = 0;
    for (const row of nullable)
      if (reference[row.axis] === null) mode |= row.bit;
    const variant: IVariant = variants[mode] ??= build(mode);
    return variant;
  };
  return Object.assign(
    (reference: IAutoMovieJointPose): readonly IDot[] => read(reference).dots,
    { swivels: (reference: IAutoMovieJointPose,
      cosine: IAutoMovieQuaternion, sine: IAutoMovieQuaternion): ReturnType<typeof bilinearQuaternionSwivelRoots> => {
      if (props.mobile.length !== 2) return null;
      const variant: IVariant = read(reference);
      const dots: readonly IDot[] = variant.dots;
      return bilinearQuaternionSwivelRoots(
        [dots[0]!(cosine), dots[1]!(cosine), dots[2]!(cosine), dots[3]!(cosine)],
        [dots[0]!(sine), dots[1]!(sine), dots[2]!(sine), dots[3]!(sine)],
        variant.cross,
      );
    } },
  );
}

/**
 * Fixed quaternion coefficient dots and explicit orientation-circle proposals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines original reference-null mode selection, coefficient order, half-angle circle and degree-valued proposal/fallback meanings.
 * @evidence contracts/development/design.md#principled-representation The unchanged callable reads four fixed-basis dots. swivels passes two actual half-angle coefficients and the basis's structured Gram term to the shared rank-one intersection owner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The ordinary projector retains the original callable and the explicit two-axis curve dispatcher uses only orientation proposals. No coefficient quaternion, inverse matrix, solver state or fitted answer escapes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Proposals certify neither ROM nor a global weighted optimum. The actual IK consumer must clamp and verify FK/current goals and fall back for unsupported or undecidable inputs.
 */
export namespace prepareJointRotationCoefficientDots {
  /** Fixed-rig readers; query inputs are borrowed only until return. */
  export interface IReader {
    /** Original four coefficient-dot callables for this fixed null/numeric mode. */
    (reference: IAutoMovieJointPose): readonly IDot[];
    /** Propose degree swivels of q=cosine*cos(psi/2)+sine*sin(psi/2), or decline. */
    swivels(reference: IAutoMovieJointPose, cosine: IAutoMovieQuaternion,
      sine: IAutoMovieQuaternion): ReturnType<typeof bilinearQuaternionSwivelRoots>;
  }
}
