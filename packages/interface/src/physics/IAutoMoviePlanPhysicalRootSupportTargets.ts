import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalSimulationInput } from "./IAutoMoviePhysicalSimulationInput";

/**
 * Support correction for actual-root tracking error, preserving original
 * endpoints.
 */
export namespace IAutoMoviePlanPhysicalRootSupportTargets {
  /**
   * Correct support joint goals for the root's actual placement, so root
   * tracking error does not become foot sliding.
   */
  export type IInput = {
    /** Provider and finite support-feedback budget. */ body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Interpolated authored world targets. */ targets: Record<
      string,
      IAutoMovieRigidTransform
    >;
    /** Actual root body frame. */ root: {
      /** Root segment bone used as the rebasing anchor. */
      bone: string;
      /** Measured root world position in metres and rotation. */
      pose: IAutoMovieRigidTransform;
    };
    /**
     * Joint coordinates already owned by a simultaneous balance posture task.
     * Only disjoint endpoint chains are fitted here.
     */ excluded?: ReadonlySet<string>;
  };
}
