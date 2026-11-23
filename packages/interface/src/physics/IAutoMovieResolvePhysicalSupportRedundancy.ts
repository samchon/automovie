import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";
import type { IAutoMoviePhysicalSegment } from "./IAutoMoviePhysicalSegment";

/** Return a warm support seed's redundant coordinates to the authored posture. */
export namespace IAutoMovieResolvePhysicalSupportRedundancy {
  /**
   * Return a warm support seed's redundant coordinates to the authored posture.
   *
   * A warm seed keeps the previous fit's task-space choice, such as which way a
   * near-straight chain bends. The support task constrains only each endpoint
   * and its planted floor witnesses, so a coordinate change in that task's null
   * space (a limb swivel or patch yaw) has no restoring term in the
   * least-squares fit, whose steps never leave the row space. Carried forward
   * from step to step, such a change accumulates under root sway. This applies
   * Liégeois's redundancy resolution once to the seed: the coordinate
   * difference to the admitted authored posture is split along the right
   * singular directions of the support-task Jacobian. Directions are returned
   * to authored from the smallest linearized task effect upward while the
   * root-sum-square of those effects stays within the fit's own residual
   * tolerance; the remaining directions keep the warm task-space choice. The
   * null space therefore always returns, and a near-singular row (whose
   * singular value is small but whose task effect is second order) does not
   * hold a first-order posture offset. The subsequent bounded fit corrects the
   * task within the same tolerance.
   *
   * Coordinates are the native independent twist coordinates θ = 2 atan(q_axis
   * / w) owned by {@link projectPhysicalJointRotation}. The Jacobian uses
   * central differences with the error-optimal step ε^(1/3); its truncation and
   * rounding noise is of relative order ε^(2/3), far below the tolerance
   * budget, so numerically null directions always return. ROM projection
   * follows the update.
   */
  export type IInput = {
    /** Parent-first, run-owned tree order. */ order: readonly IAutoMoviePhysicalSegment[];
    /** Declared parent joints, indexed by child bone. */ joints: ReadonlyMap<
      string,
      IAutoMoviePhysicalJoint
    >;
    /** Exact descendant lists, indexed by subtree root bone. */ descendants: ReadonlyMap<
      string,
      readonly string[]
    >;
    /** Coordinates owned by the support fit. */ selected: ReadonlySet<string>;
    /** Support endpoints and their optional planted witnesses. */ pattern: IAutoMovieFootfallPattern;
    /** Endpoints whose declared floor witnesses join the task. */ planted: ReadonlySet<string>;
    /** Current authored placements, the null-space anchor. */ authored: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /**
     * The fit's own metre residual early-out; returned directions may move the
     * task by at most this much.
     */ tolerance: number;
    /** Warm seed placements; borrowed, never mutated. */ seed: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
  };
}
