import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Compute the unchanged reach-sphere root-lowering request without running
 * endpoint IK whose poses would be discarded.
 */
export namespace IAutoMoviePhysicalSupportRootDrop {
  /**
   * Compute the unchanged reach-sphere root-lowering request without running
   * endpoint IK whose poses would be discarded. This is a bounded motor intent,
   * never a correction to an actual root.
   */
  export type IInput = {
    /** Actual provider joint frames. */ profile: IAutoMoviePhysicalProfile;
    /** Declared support paths and optional reach landmarks. */ pattern: IAutoMovieFootfallPattern;
    /** Root-intent frame and coherent articulated placements. */ targets: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Explicit world endpoint intent. */ goals: Readonly<
      Record<string, IAutoMovieVector3>
    >;
    /** Nonnegative lowering cap in metres. */ maximumRootDrop: number;
  };
}
