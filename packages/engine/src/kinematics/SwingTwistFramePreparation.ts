import type { IAutoMovieJointAxes } from "@automovie/interface";

import { normalizeJointAxes } from "./normalizeJointAxes";
import { swingTwistBasis } from "./swingTwistBasis";
import type { swingTwistRange } from "./swingTwistRange";

/** The private reader carried only by frames this module explicitly prepares. */
const READ_BASIS: unique symbol = Symbol("prepared swing-twist basis");

/** The private normalized-axis reader owned by the same explicit wrapper. */
const READ_AXES: unique symbol = Symbol("prepared normalized joint axes");

/** An ordinary joint frame plus its operation-owned lazy axis and swing readers. */
interface IPrepared extends swingTwistRange.IJoint {
  /** Admit the unchanged axes on first use, retaining only successful preparation. */
  readonly [READ_BASIS]: (
    receiver: swingTwistRange.IJoint,
  ) => swingTwistBasis.IBasis;

  /** Admit at the first actual caller's diagnostic path; ordinary receivers opt out. */
  readonly [READ_AXES]: (
    receiver: swingTwistRange.IJoint,
    path: string,
  ) => IAutoMovieJointAxes | undefined;
}

/** Whether the frame carries this module's private operation-owned reader. */
function prepared(joint: swingTwistRange.IJoint): joint is IPrepared {
  return READ_BASIS in joint;
}

/**
 * Explicit one-operation swing-twist frame preparation. Ordinary joint frames
 * keep their live basis admission, while a prepared wrapper owns its reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the explicit wrapper, unchanged-axis/frame lifetime, lazy diagnostic preservation and ordinary-frame admission behavior.
 * @evidence contracts/development/design.md#principled-representation A frame wrapper borrows the same axes/rest frame and carries private lazy normalized-axis and swing-basis readers, separating operation-invariant metadata from each actual rotation computation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The swingTwistRange preparation entry, actual clamp and swing readers share wrapper construction and the two metadata reads; no skeleton, pose, target, constraint or projected result is keyed here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only explicitly prepared wrappers opt into the unchanged-input premise; ordinary frames retain their existing live admission, and failed basis preparation is not retained.
 */
export namespace SwingTwistFramePreparation {
  /**
   * Borrow a joint's axes and rest frame for one unchanged operation.
   * Creating the frozen wrapper performs no numerical admission; its first
   * numerical reader keeps its original diagnostic path.
   *
   * @param joint Frame whose axis and rest-frame records remain unchanged until release.
   * @returns A fresh wrapper carrying private lazy metadata readers; release it when the operation ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed members, frozen wrapper, lazy original-path admission and unchanged-input ownership boundary.
   * @evidence contracts/development/implementation.md#principled-implementation Private readers retain the successful normalized axes and swing basis of one unchanged clinical frame; the first numerical caller still admits the axes through normalizeJointAxes at its original diagnostic path, then swingTwistBasis owns the original cross-product assembly.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrapper and its two private readers share one lazy normalization owner without a registry or changes to the ordinary joint-frame contract.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Performs no eager validation, tolerance change, axis repair or cached rotation; an exception leaves the lazy basis unset.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant wrapper creation owns three closures and two nonenumerable readers; one normalization and at most one swing-basis assembly serve the operation. Later composition/inverse reads avoid repeated raw-axis comparisons, and swing reads avoid repeated frame/cross-vector allocation; runtime speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only the basis proven invariant by the caller's unchanged axes/frame scope; every incoming rotation and chart coordinate is still computed by its numerical owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One wrapper owns three closures, at most one borrowed admitted-axis record and one swing basis plus borrowed raw axes/frame records; releasing the wrapper releases all preparation, including after failure, with no global operation collection or resource handle.
   */
  export function of(joint: swingTwistRange.IJoint): swingTwistRange.IJoint {
    const axes: IAutoMovieJointAxes = joint.axes;
    let normal: IAutoMovieJointAxes | undefined;
    let basis: swingTwistBasis.IBasis | undefined;
    const readAxes: (path: string) => IAutoMovieJointAxes = (
      path: string,
    ): IAutoMovieJointAxes => {
      if (normal === undefined) normal = normalizeJointAxes(axes, path);
      return normal;
    };
    const frame: IPrepared = {
      axes,
      frame: joint.frame,
      [READ_AXES]: (
        receiver: swingTwistRange.IJoint,
        path: string,
      ): IAutoMovieJointAxes | undefined =>
        receiver === frame ? readAxes(path) : undefined,
      [READ_BASIS]: (
        receiver: swingTwistRange.IJoint,
      ): swingTwistBasis.IBasis => {
        if (receiver !== frame) return swingTwistBasis.of(receiver.axes);
        if (basis === undefined) {
          const admitted: swingTwistBasis.IBasis =
            swingTwistBasis.fromNormalized(readAxes("swingTwistRange axes"));
          Object.freeze(admitted.e2);
          basis = Object.freeze(admitted);
        }
        return basis;
      },
    };
    Object.defineProperty(frame, READ_BASIS, { enumerable: false });
    Object.defineProperty(frame, READ_AXES, { enumerable: false });
    return Object.freeze(frame);
  }

  /**
   * Read normalized axes only from an explicitly prepared frame. Ordinary,
   * copied and inherited receivers return undefined without admitting axes;
   * their numerical caller keeps its existing live admission path.
   *
   * @param joint The frame whose exact wrapper identity owns any preparation.
   * @param path The actual numerical caller's unchanged admission diagnostic prefix.
   * @returns Its successful admitted basis, or undefined for an ordinary receiver.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the explicit-wrapper-only result, lazy admission at the caller's path and ordinary/copy/inherited opt-out behavior.
   * @evidence contracts/development/implementation.md#principled-implementation Shares only normalizeJointAxes's successful result for the explicit wrapper's unchanged axes; its private reader verifies exact receiver identity before using operation metadata.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ownership dispatch lends the same admitted axes to actual composition and inverse callers; the existing normalizer remains the sole admission owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An ordinary frame is neither normalized nor trusted here, and an admission exception leaves the prepared slot unset for retry. No joint angle, projection or failed result is cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant dispatch with one normalizer call at first successful prepared use and a borrowed reference thereafter, avoiding repeated ten-field admission comparisons within that unchanged operation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit unchanged-axis ownership proves equivalence; actual angle/frame checks, quaternion composition, projection and inverse extraction remain with their existing numerical owners.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; the supplied wrapper owns its optional admitted-axis reference and releases it with the operation.
   */
  export function normalized(
    joint: swingTwistRange.IJoint,
    path: string,
  ): IAutoMovieJointAxes | undefined {
    return prepared(joint) ? joint[READ_AXES](joint, path) : undefined;
  }

  /**
   * Read the explicit wrapper's prepared basis, or admit an ordinary frame's
   * current axes exactly as the original numerical reader did.
   *
   * @param joint An ordinary frame or an explicit unchanged-operation wrapper.
   * @returns Its admitted basis, frozen for an explicit wrapper, with the existing diagnostic path.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States prepared and ordinary paths and the unchanged diagnostic behavior.
   * @evidence contracts/development/implementation.md#principled-implementation A nonenumerable private reader also checks its exact receiver identity, so even a copied or inherited reader cannot claim another frame's prepared basis; ordinary records delegate to the original live admission.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private ownership check chooses the existing basis calculation or the operation's same completed calculation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Arbitrary ordinary IJoint records cannot opt in through a public optional field, and every failed preparation is retried by the actual admission owner rather than treated as a result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant dispatch; ordinary frames retain one admission/cross-product calculation and prepared frames perform that work only on first successful use.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads only explicitly operation-owned completed basis work; changes to ordinary frames still reach the original live normalizer.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This dispatcher retains nothing; a supplied prepared wrapper owns its optional normalized-axis and swing-basis metadata and the numerical caller owns returned computations.
   */
  export function basis(joint: swingTwistRange.IJoint): swingTwistBasis.IBasis {
    return prepared(joint)
      ? joint[READ_BASIS](joint)
      : swingTwistBasis.of(joint.axes);
  }
}
