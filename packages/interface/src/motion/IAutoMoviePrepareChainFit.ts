import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieClinicalAxis } from "../pose/AutoMovieClinicalAxis";
import type { IAutoMovieHingedArmSwivel } from "../pose/IAutoMovieHingedArmSwivel";
import type { IAutoMovieJointPose } from "../pose/IAutoMovieJointPose";
import type { IAutoMovieJointRotationDomain } from "../pose/IAutoMovieJointRotationDomain";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieBone } from "../skeleton/IAutoMovieBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMoviePrepareJointRotationProjection } from "./IAutoMoviePrepareJointRotationProjection";
import type { IAutoMovieSolveDistalTwist } from "./IAutoMovieSolveDistalTwist";

/**
 * Contracts of `prepareChainFit`: the fixed per-rig readers a chain fit borrows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each reader states the bone it reads, its clinical degrees or quaternion result and what it shares across one unchanged rig.
 * @evidence contracts/development/design.md#principled-representation One record of fixed rig readers (bones, domains, bases, clamps, overshoot, projections, held and reference rotations, hinge range and geometry) over canonical joint and pose contracts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainFit` produces it; the engine's chain fits and the prepared chain constants the motions body keeps read it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reader returns actual rig facts or fresh results; no pose, target or solve answer is retained by the shape.
 */
export namespace IAutoMoviePrepareChainFit {
  /** Lazy immutable-rig preparation; loaders are the existing pure hinge functions, not target scores or user callbacks. */
  export interface IRig {
    /** Exact gate overshoot scorer for this bone's fixed domain under the original canonical scoring frame; the optional rotation is the one the angles were read from on that frame (`scanJointRom.prepare`). */
    overshoot(bone: AutoMovieHumanoidBone): (joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number;

    /** The same scorer of a bone gated by swing and twist, read from the rotation alone (`scanJointRom.prepareRotated`); null for a bone the gate does not hold. */
    rotatedOvershoot(bone: AutoMovieHumanoidBone): ((rotation: IAutoMovieQuaternion) => number) | null;

    /** Actual skeleton record; an absent bone is remembered too. */
    bone(bone: AutoMovieHumanoidBone): IAutoMovieBone | undefined;

    /** Effective ROM, sharing the geometry's already prepared upper/lower domains. */
    domain(bone: AutoMovieHumanoidBone): IAutoMovieJointRotationDomain;

    /** Existing basisOf/orientation nullish default at the original diagnostic path; failures are not cached. */
    basis(bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes;

    /** Direct clinical conversion's undefined-only default; runtime null must still fail even after a lenient default read. */
    jointBasis(bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes;

    /** A bone's prepared record composer on its `jointBasis` and the given rest frame (`jointToQuaternionOnBasis.prepare`), kept while the frame record is the same: the chain's records of every read of a fit composed by one composer a bone. */
    composer(
      bone: AutoMovieHumanoidBone,
      frame: IAutoMovieRestFrame | undefined,
    ): (joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>) => IAutoMovieQuaternion;

    /** Resolve the actual rig clamp once, while every candidate is still clamped. */
    clamp(
      bone: AutoMovieHumanoidBone,
    ): (joint: IAutoMovieJointPose) => IAutoMovieJointPose;

    /** Fixed effector coefficients; every query retains its own Euler reference and returned joint. */
    effectorProjection(): IAutoMoviePrepareJointRotationProjection.IProjector;

    /** Inverse of the unchanged fixed lower-to-effector frame. */
    effectorRestInverse(): IAutoMovieQuaternion;

    /** Last original source end record, or null angles; this never forces authored FK. */
    held(): IAutoMovieJointPose;

    /** Raw fixed effector frame times its last source articulation; borrowed and independent of targets. */
    heldRotation(): IAutoMovieQuaternion;

    /** Inverse of that same raw source-held rotation, read lazily after its original articulation admission. */
    heldRotationInverse(): IAutoMovieQuaternion;

    /** Lazy fixed effector-axis and clinical-zero preparation, independent of all twist targets and candidates. */
    distalTwist(): IAutoMovieSolveDistalTwist.IPrepared;

    /** Hinged scoring's first reference record, distinct from free-bend/FK last-record semantics. */
    reference(bone: AutoMovieHumanoidBone): IAutoMovieQuaternion | null;

    /** Admit the fixed non-negative weight at its original first-use point. */
    referenceWeight(): number;

    /** Original target-independent pure hinge range, including a cached null result. */
    hingeRange(
      read: () => { min: number; max: number } | null,
    ): { min: number; max: number } | null;

    /** Original no-hint source-hinge displacement, read only at that branch's first use. */
    posedSwing(read: () => IAutoMovieVector3): IAutoMovieVector3;

    /** Lazy hinge-span/source-frame geometry; null only when chain preparation failed. */
    hingedGeometry(): IAutoMovieHingedArmSwivel.IPrepared | null;
  }
}
