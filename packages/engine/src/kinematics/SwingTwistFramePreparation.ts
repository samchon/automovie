import type { IAutoMovieJointAxes } from "@automovie/interface";

import { swingTwistBasis } from "./swingTwistBasis";
import type { swingTwistRange } from "./swingTwistRange";

/** The private reader carried only by frames this module explicitly prepares. */
const READ_BASIS: unique symbol = Symbol("prepared swing-twist basis");

/** An ordinary joint frame plus its operation-owned lazy basis reader. */
interface IPrepared extends swingTwistRange.IJoint {
  /** Admit the unchanged axes on first use, retaining only successful preparation. */
  readonly [READ_BASIS]: (
    receiver: swingTwistRange.IJoint,
  ) => swingTwistBasis.IBasis;
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
 * @evidence contracts/development/design.md#principled-representation A frame wrapper borrows the same axes/rest frame and carries one private lazy basis reader, separating operation-invariant metadata from each actual rotation computation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The swingTwistRange preparation entry and its numerical readers share these two operations; no skeleton, pose, target, constraint or projected result is keyed here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only explicitly prepared wrappers opt into the unchanged-input premise; ordinary frames retain their existing live admission, and failed basis preparation is not retained.
 */
export namespace SwingTwistFramePreparation {
  /**
   * Borrow a joint's axes and rest frame for one unchanged operation.
   * Creating the frozen wrapper performs no numerical admission; its first
   * numerical reader does so at swingTwistBasis.of's original path.
   *
   * @param joint Frame whose axis and rest-frame records remain unchanged until release.
   * @returns A fresh wrapper carrying one private lazy reader; release it when the operation ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed members, frozen wrapper, lazy original-path admission and unchanged-input ownership boundary.
   * @evidence contracts/development/implementation.md#principled-implementation A closure retains the successful basis of one unchanged clinical frame; the initial swingTwistBasis.of call remains the existing admission and cross-product calculation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrapper and private reader provide explicit preparation without a registry or changes to the ordinary joint-frame contract.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Performs no eager validation, tolerance change, axis repair or cached rotation; an exception leaves the lazy basis unset.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant wrapper creation and one constant-size basis preparation on first numerical use; later reads avoid repeated basis admission comparisons and basis/cross-vector allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only the basis proven invariant by the caller's unchanged axes/frame scope; every incoming rotation and chart coordinate is still computed by its numerical owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One wrapper owns one closure and at most one basis plus borrowed axes/frame records; releasing the wrapper releases all preparation, including after failure, with no global operation collection or resource handle.
   */
  export function of(joint: swingTwistRange.IJoint): swingTwistRange.IJoint {
    const axes: IAutoMovieJointAxes = joint.axes;
    let basis: swingTwistBasis.IBasis | undefined;
    const frame: IPrepared = {
      axes,
      frame: joint.frame,
      [READ_BASIS]: (
        receiver: swingTwistRange.IJoint,
      ): swingTwistBasis.IBasis => {
        if (receiver !== frame) return swingTwistBasis.of(receiver.axes);
        if (basis === undefined) {
          const admitted: swingTwistBasis.IBasis = swingTwistBasis.of(axes);
          Object.freeze(admitted.e2);
          basis = Object.freeze(admitted);
        }
        return basis;
      },
    };
    Object.defineProperty(frame, READ_BASIS, { enumerable: false });
    return Object.freeze(frame);
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
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This dispatcher retains nothing; a supplied prepared wrapper owns its one optional basis and the numerical caller owns returned computations.
   */
  export function basis(joint: swingTwistRange.IJoint): swingTwistBasis.IBasis {
    return prepared(joint)
      ? joint[READ_BASIS](joint)
      : swingTwistBasis.of(joint.axes);
  }
}
