import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";
import type { IAutoMoviePhysicalSegment } from "./IAutoMoviePhysicalSegment";

/**
 * Carry the previous local support correction through an authored change instead of selecting a fresh straight-chain bend branch, then return its support-task null space to the authored posture so unconstrained swivel or patch yaw cannot accumulate across steps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes current authored, prior authored and completed fitted poses for transporting a support correction.
 * @evidence contracts/development/design.md#principled-representation World transforms share the same admitted tree indexes; selected/planted sets identify owned coordinates and metre tolerance bounds task changes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface warmPhysicalSupportTargets reuses run-owned order, joints and descendants and delegates null-space posture return to resolvePhysicalSupportRedundancy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The warm seed retains original goals, root intent and ROM; it cannot turn accumulated free swivel into a new authored requirement.
 */
export namespace IAutoMovieWarmPhysicalSupportTargets {
  /**
   * Carry the previous local support correction through an authored change instead of selecting a fresh straight-chain bend branch, then return its support-task null space to the authored posture so unconstrained swivel or patch yaw cannot accumulate across steps. The original world endpoints, root intent and ROM remain the fitting constraints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes current authored, prior authored and completed fitted poses for transporting a support correction.
   * @evidence contracts/development/design.md#principled-representation World transforms share the same admitted tree indexes; selected/planted sets identify owned coordinates and metre tolerance bounds task changes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface warmPhysicalSupportTargets reuses run-owned order, joints and descendants and delegates null-space posture return to resolvePhysicalSupportRedundancy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The warm seed retains original goals, root intent and ROM; it cannot turn accumulated free swivel into a new authored requirement.
   */
  export type IInput = {
    /** Parent-first, run-owned tree order. */ order: readonly IAutoMoviePhysicalSegment[];
    /** Declared parent joints, indexed once. */ joints: ReadonlyMap<
      string,
      IAutoMoviePhysicalJoint
    >;
    /** Run-owned exact descendant sets. */ descendants: ReadonlyMap<
      string,
      readonly string[]
    >;
    /** Coordinates actually owned by this support fit. */ selected: ReadonlySet<string>;
    /** Current authored placements before fitting. */ targets: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Authored placements at the preceding completed reference boundary. */ before: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** The fitted reference at that same boundary. */ previous: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Support endpoints and witnesses defining the fit task. */ pattern: IAutoMovieFootfallPattern;
    /** Endpoints whose floor witnesses are planted in this fit. */ planted: ReadonlySet<string>;
    /** The support fit's metre residual tolerance, bounding how far returning posture may move the task. */ tolerance: number;
  };
}
