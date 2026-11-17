import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Compute the unchanged reach-sphere root-lowering request without running endpoint IK whose poses would be discarded.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the coherent support geometry and a bounded lowering request separate from actual body correction.
 * @evidence contracts/development/design.md#principled-representation World-metre goals and target transforms combine with provider-local joint/landmark geometry; maximumRootDrop is nonnegative metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalSupportRootDrop reuses the profile and footfall pattern to derive reach-sphere motor intent without running discarded endpoint IK.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The cap constrains only requested root lowering; it cannot move a native root or certify endpoint feasibility.
 */
export namespace IAutoMoviePhysicalSupportRootDrop {
  /**
   * Compute the unchanged reach-sphere root-lowering request without running endpoint IK whose poses would be discarded. This is a bounded motor intent, never a correction to an actual root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the coherent support geometry and a bounded lowering request separate from actual body correction.
   * @evidence contracts/development/design.md#principled-representation World-metre goals and target transforms combine with provider-local joint/landmark geometry; maximumRootDrop is nonnegative metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalSupportRootDrop reuses the profile and footfall pattern to derive reach-sphere motor intent without running discarded endpoint IK.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The cap constrains only requested root lowering; it cannot move a native root or certify endpoint feasibility.
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
