import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";
import type { IAutoMoviePhysicalSegment } from "./IAutoMoviePhysicalSegment";

/**
 * Carry the previous local support correction through an authored change
 * instead of selecting a fresh straight-chain bend branch, then return its
 * support-task null space to the authored posture so unconstrained swivel or
 * patch yaw cannot accumulate across steps.
 */
export namespace IAutoMovieWarmPhysicalSupportTargets {
  /**
   * Carry the previous local support correction through an authored change
   * instead of selecting a fresh straight-chain bend branch, then return its
   * support-task null space to the authored posture so unconstrained swivel or
   * patch yaw cannot accumulate across steps. The original world endpoints,
   * root intent and ROM remain the fitting constraints.
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
    /**
     * The support fit's metre residual tolerance, bounding how far returning
     * posture may move the task.
     */ tolerance: number;
  };
}
