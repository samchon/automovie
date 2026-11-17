import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMoviePhysicalSimulationInput } from "./IAutoMoviePhysicalSimulationInput";

/**
 * Support correction for actual-root tracking error, preserving original endpoints.
 *
 * @evidence contracts/development/design.md#principled-representation Rebase authored world poses to the actual root and fit eligible chains back toward their original world support points.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Existing body support policy supplies budgets; excluded joint ids express concurrent task ownership without adding another scheduler contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Overlapping or shorter-than-two-bone chains are excluded, and root lowering is disabled; no eligible chain or zero iterations returns the original target record unchanged.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify the measured root frame, authored world target ownership and the meaning of excluded coordinates.
 */
export namespace IAutoMoviePlanPhysicalRootSupportTargets {
  /**
   * Correct support joint goals for the root's actual placement, so root tracking error does not become foot sliding.
   */
  export type IInput = {
    /** Provider and finite support-feedback budget. */ body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Interpolated authored world targets. */ targets: Record<
      string,
      IAutoMoviePhysicalProfile.ITransform
    >;
    /** Actual root body frame. */ root: {
      /** Root segment bone used as the rebasing anchor. */
      bone: string;
      /** Measured root world position in metres and rotation. */
      pose: IAutoMoviePhysicalProfile.ITransform;
    };
    /** Joint coordinates already owned by a simultaneous balance posture task. Only disjoint endpoint chains are fitted here. */ excluded?: ReadonlySet<string>;
  };
}
