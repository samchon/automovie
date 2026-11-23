import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Bounded chain fitting of horizontal endpoint intent and real patch-plane
 * constraints.
 */
export namespace IAutoMovieSolvePhysicalFloorChainTarget {
  /**
   * Fit world endpoint coordinates and floor constraints with bounded joint
   * coordinates. The residual retains the remaining error at the returned
   * pose.
   */
  export type IInput = {
    /** Actual fixed-pivot tree. */ profile: IAutoMoviePhysicalProfile;
    /** Proximal-to-distal joints ending at the support endpoint. */ chain: readonly string[];
    /** Segment owners of the complete support patch. */ contacts: readonly string[];
    /** Admitted working motor goals to copy. */ targets: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Requested world endpoint; Y is determined by the patch plane. */ goal: IAutoMovieVector3;
    /** Optional bone-local endpoint. */ localPoint?: IAutoMovieVector3;
    /**
     * Optional endpoint inside the chain; the terminal bone remains the
     * default.
     */ endpointBone?: string;
    /** Actual surface points which should share the requested plane. */ floorPoints?: readonly {
      /** Carrier bone included in contacts; an unlisted carrier is refused. */
      bone: string;
      /**
       * Finite carrier-local point in metres; the transformed world Y should
       * equal floor.
       */
      localPoint: IAutoMovieVector3;
    }[];
    /** Optional world endpoint Y goal in metres. */ endpointHeight?: number;
    /**
     * Fit the patch minimum to the floor even with an endpoint height if no
     * surface witnesses are supplied. When omitted, an endpoint height or
     * explicit surface witnesses make the floor a lower bound.
     */
    fitPatchMinimum?: boolean;
    /** Requested patch plane height, metres. */ floor: number;
    /** Positive update budget, at most 64. */ iterations: number;
    /** Positive metre residual early-out. */ tolerance: number;
  };
}
