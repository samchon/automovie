import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePrepareJointRotationCoefficientDots,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import type { jointToQuaternionOnBasis } from "../../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../../math/Quaternion";
import { bilinearQuaternionSwivelRoots } from "../../math/internal/bilinearQuaternionSwivelRoots";
import { prepareFiniteQuaternionDot } from "../../math/internal/prepareFiniteQuaternionDot";
import { toRigAngle } from "../../rom/toRigAngle";

/**
 * The inverse owner's three clinical coordinates, with no alternate axis
 * representation.
 */
type ClinicalAxis = keyof IAutoMovieResolvedJointAngles;

/**
 * The interface contract
 * (`IAutoMoviePrepareJointRotationCoefficientDots.IDot`).
 */
type IDot = IAutoMoviePrepareJointRotationCoefficientDots.IDot;

/**
 * Actual fixed-rig inputs, already selected by the projector's box eligibility
 * gate.
 */
interface IProps {
  /** Original normalized clinical axes. */
  basis: IAutoMovieJointAxes;
  /** Original clinical affine frame, unchanged for this operation. */
  frame: IAutoMovieRestFrame | undefined;
  /** Null-ROM coordinates collected at the projector's original range-read site. */
  immobile: readonly ClinicalAxis[];
  /** Positive-width coordinates in the original F/A/T ordering. */
  mobile: readonly ClinicalAxis[];
  /**
   * Canonical numeric-zero immobile seed, or each numeric fixed range's
   * minimum.
   */
  fixed: IAutoMovieJointPose;
  /** Original actual quaternion factor order. */
  order: readonly ClinicalAxis[];
  /** Caller-owned rig declarations, extended only with fixed null-rest rig zero. */
  fixedRigAngles: jointToQuaternionOnBasis.IFixedAngles;
}

/** One source-fixed factor and its optional distinct null-rest factor. */
interface IFixed {
  /**
   * Fixed clinical coordinate whose actual reference representation selects the
   * factor.
   */
  axis: ClinicalAxis;
  /**
   * Original numeric-coordinate factor, composed at its original preparation
   * site.
   */
  factor: IAutoMovieQuaternion;
  /**
   * Null-mode bit, zero when null has the same exact rig angle or is not
   * admitted.
   */
  bit: number;
  /** Lazy actual rig-zero factor; never an incoming target or scored result. */
  rest: IAutoMovieQuaternion;
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
 * Numeric immobile outputs mean clinical zero, as the ordinary clamp emits; an
 * explicitly null output instead means rig zero, as joint composition reads.
 * Only null-ROM fixed coordinates can select between these two declared modes.
 * The explicit two-axis companion also keeps the source-fixed Gram cross term.
 * Its four product columns have unit norm, C1.C2=-C0.C3, and all remaining
 * cross-dots zero. Two actual half-angle quaternion coefficients therefore map
 * through the structured adjugate to the shared rank-one sinusoid solver. Its
 * roots are proposals, not ROM or objective admission.
 */
export function prepareJointRotationCoefficientDots(
  props: IProps,
): prepareJointRotationCoefficientDots.IReader {
  const fixed: Partial<Record<ClinicalAxis, IFixed>> = {};
  const nullable: IFixed[] = [];
  for (const axis of props.order)
    if (!props.mobile.includes(axis)) {
      const direction: IAutoMovieJointAxes[ClinicalAxis] = props.basis[axis];
      const angle: number =
        toRigAngle(props.fixed[axis], props.frame?.[axis]) ?? 0;
      const factor: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        direction,
        angle,
      );
      const mayRest: boolean = props.immobile.includes(axis);
      const bit: number =
        mayRest && !Object.is(angle, 0) ? 1 << nullable.length : 0;
      const row: IFixed = {
        axis,
        factor,
        bit,
        rest: Quaternion.fromAxisAngle(props.basis[axis], 0),
      };
      fixed[axis] = row;
      if (bit !== 0) nullable.push(row);
      props.fixedRigAngles[axis] = bit === 0 ? [angle] : [angle, 0];
    }
  const variants: Array<IVariant | undefined> = [];

  /**
   * Original four coefficient masks, with only fixed rig representation
   * varying.
   */
  const build: (mode: number) => IVariant = (mode: number): IVariant => {
    const coefficients: IAutoMovieQuaternion[] = [0, 1, 2, 3].map(
      (mask: number): IAutoMovieQuaternion => {
        if (props.mobile.length === 1 && mask >= 2)
          return { x: 0, y: 0, z: 0, w: 0 };
        let product: IAutoMovieQuaternion = Quaternion.identity();
        for (const axis of props.order) {
          const index: number = props.mobile.indexOf(axis);
          const row: IFixed | undefined = fixed[axis];
          const factor: IAutoMovieQuaternion =
            index < 0
              ? (mode & row!.bit) === 0
                ? row!.factor
                : row!.rest
              : (mask & (1 << index)) === 0
                ? Quaternion.identity()
                : { ...props.basis[axis], w: 0 };
          product = Quaternion.multiply(product, factor);
        }
        return product;
      },
    );
    const dots: readonly IDot[] = coefficients.map(prepareFiniteQuaternionDot);
    return { dots, cross: dots[1]!(coefficients[2]!) };
  };
  for (let mode: number = 0; mode < 1 << nullable.length; ++mode)
    variants[mode] = build(mode);
  const canonical: IVariant = variants[0]!;
  const read: (reference: IAutoMovieJointPose) => IVariant = (
    reference: IAutoMovieJointPose,
  ): IVariant => {
    if (nullable.length === 0) return canonical;
    let mode: number = 0;
    for (const row of nullable)
      if (reference[row.axis] === null) mode |= row.bit;
    return variants[mode]!;
  };
  return Object.assign(
    (reference: IAutoMovieJointPose): readonly IDot[] => read(reference).dots,
    {
      swivels: (
        reference: IAutoMovieJointPose,
        cosine: IAutoMovieQuaternion,
        sine: IAutoMovieQuaternion,
      ): ReturnType<typeof bilinearQuaternionSwivelRoots> => {
        if (props.mobile.length !== 2) return null;
        const variant: IVariant = read(reference);
        const dots: readonly IDot[] = variant.dots;
        return bilinearQuaternionSwivelRoots(
          [
            dots[0]!(cosine),
            dots[1]!(cosine),
            dots[2]!(cosine),
            dots[3]!(cosine),
          ],
          [dots[0]!(sine), dots[1]!(sine), dots[2]!(sine), dots[3]!(sine)],
          variant.cross,
        );
      },
    },
  );
}

/** Fixed quaternion coefficient dots and explicit orientation-circle proposals. */
export namespace prepareJointRotationCoefficientDots {
  /**
   * The interface contract
   * (`IAutoMoviePrepareJointRotationCoefficientDots.IReader`).
   */
  export type IReader = IAutoMoviePrepareJointRotationCoefficientDots.IReader;
}
