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
  /**
   * Lazy immutable-rig preparation; loaders are the existing pure hinge functions, not target scores or user callbacks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig: Lazy immutable-rig preparation.
   * @evidence contracts/development/design.md#principled-representation One record of overshoot, rotatedOvershoot, bone, domain, basis, jointBasis, composer, clamp, effectorProjection, effectorRestInverse, held, heldRotation, heldRotationInverse, distalTwist, reference, referenceWeight, hingeRange, posedSwing, hingedGeometry over the canonical AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieQuaternion, IAutoMovieBone, IAutoMovieJointRotationDomain, IAutoMovieJointAxes, IAutoMovieRestFrame, AutoMovieClinicalAxis, IAutoMoviePrepareJointRotationProjection, IAutoMovieSolveDistalTwist, IAutoMovieVector3, IAutoMovieHingedArmSwivel contracts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainFit` fills it and the enclosing IAutoMoviePrepareChainFit contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareChainFit`.
   */
  export interface IRig {
    /**
     * Exact gate overshoot scorer for this bone's fixed domain under the original canonical scoring frame; the optional rotation is the one the angles were read from on that frame (`scanJointRom.prepare`).
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.overshoot: Exact gate overshoot scorer for this bone's fixed domain under the original canonical scoring frame.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies overshoot and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    overshoot(
      bone: AutoMovieHumanoidBone,
    ): (joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number;

    /**
     * The same scorer of a bone gated by swing and twist, read from the rotation alone (`scanJointRom.prepareRotated`); null for a bone the gate does not hold.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.rotatedOvershoot: The same scorer of a bone gated by swing and twist, read from the rotation alone (`scanJointRom.prepareRotated`).
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies rotatedOvershoot and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    rotatedOvershoot(
      bone: AutoMovieHumanoidBone,
    ): ((rotation: IAutoMovieQuaternion) => number) | null;

    /**
     * Actual skeleton record; an absent bone is remembered too.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.bone: Actual skeleton record.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies bone and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    bone(bone: AutoMovieHumanoidBone): IAutoMovieBone | undefined;

    /**
     * Effective ROM, sharing the geometry's already prepared upper/lower domains.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.domain: Effective ROM, sharing the geometry's already prepared upper/lower domains.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies domain and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    domain(bone: AutoMovieHumanoidBone): IAutoMovieJointRotationDomain;

    /**
     * Existing basisOf/orientation nullish default at the original diagnostic path; failures are not cached.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.basis: Existing basisOf/orientation nullish default at the original diagnostic path.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies basis and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    basis(bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes;

    /**
     * Direct clinical conversion's undefined-only default; runtime null must still fail even after a lenient default read.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.jointBasis: Direct clinical conversion's undefined-only default.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies jointBasis and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    jointBasis(bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes;

    /**
     * A bone's prepared record composer on its `jointBasis` and the given rest frame (`jointToQuaternionOnBasis.prepare`), kept while the frame record is the same: the chain's records of every read of a fit composed by one composer a bone.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.composer: A bone's prepared record composer on its `jointBasis` and the given rest frame (`jointToQuaternionOnBasis.prepare`), kept while the frame record is the same.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies composer and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    composer(
      bone: AutoMovieHumanoidBone,
      frame: IAutoMovieRestFrame | undefined,
    ): (
      joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
    ) => IAutoMovieQuaternion;

    /**
     * Resolve the actual rig clamp once, while every candidate is still clamped.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.clamp: Resolve the actual rig clamp once, while every candidate is still clamped.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies clamp and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    clamp(
      bone: AutoMovieHumanoidBone,
    ): (joint: IAutoMovieJointPose) => IAutoMovieJointPose;

    /**
     * Fixed effector coefficients; every query retains its own Euler reference and returned joint.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.effectorProjection: Fixed effector coefficients.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies effectorProjection and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    effectorProjection(): IAutoMoviePrepareJointRotationProjection.IProjector;

    /**
     * Inverse of the unchanged fixed lower-to-effector frame.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.effectorRestInverse: Inverse of the unchanged fixed lower-to-effector frame.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies effectorRestInverse and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    effectorRestInverse(): IAutoMovieQuaternion;

    /**
     * Last original source end record, or null angles; this never forces authored FK.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.held: Last original source end record, or null angles.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies held and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    held(): IAutoMovieJointPose;

    /**
     * Raw fixed effector frame times its last source articulation; borrowed and independent of targets.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.heldRotation: Raw fixed effector frame times its last source articulation.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies heldRotation and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    heldRotation(): IAutoMovieQuaternion;

    /**
     * Inverse of that same raw source-held rotation, read lazily after its original articulation admission.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.heldRotationInverse: Inverse of that same raw source-held rotation, read lazily after its original articulation admission.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies heldRotationInverse and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    heldRotationInverse(): IAutoMovieQuaternion;

    /**
     * Lazy fixed effector-axis and clinical-zero preparation, independent of all twist targets and candidates.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.distalTwist: Lazy fixed effector-axis and clinical-zero preparation, independent of all twist targets and candidates.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies distalTwist and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    distalTwist(): IAutoMovieSolveDistalTwist.IPrepared;

    /**
     * Hinged scoring's first reference record, distinct from free-bend/FK last-record semantics.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.reference: Hinged scoring's first reference record, distinct from free-bend/FK last-record semantics.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies reference and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    reference(bone: AutoMovieHumanoidBone): IAutoMovieQuaternion | null;

    /**
     * Admit the fixed non-negative weight at its original first-use point.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.referenceWeight: Admit the fixed non-negative weight at its original first-use point.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies referenceWeight and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    referenceWeight(): number;

    /**
     * Original target-independent pure hinge range, including a cached null result.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.hingeRange: Original target-independent pure hinge range, including a cached null result.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies hingeRange and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    hingeRange(
      read: () => { min: number; max: number } | null,
    ): { min: number; max: number } | null;

    /**
     * Original no-hint source-hinge displacement, read only at that branch's first use.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.posedSwing: Original no-hint source-hinge displacement, read only at that branch's first use.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies posedSwing and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    posedSwing(read: () => IAutoMovieVector3): IAutoMovieVector3;

    /**
     * Lazy hinge-span/source-frame geometry; null only when chain preparation failed.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareChainFit.IRig.hingedGeometry: Lazy hinge-span/source-frame geometry.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `prepareChainFit` supplies hingedGeometry and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `prepareChainFit`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `prepareChainFit` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `prepareChainFit` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `prepareChainFit` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `prepareChainFit` owns what it retains and releases.
     */
    hingedGeometry(): IAutoMovieHingedArmSwivel.IPrepared | null;
  }
}
