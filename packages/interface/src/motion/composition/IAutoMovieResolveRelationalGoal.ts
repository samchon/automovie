import type { IAutoMovieRigidTransform } from "../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";
import type { IAutoMovieFitPhysicalWholeBodyTarget } from "../../physics/IAutoMovieFitPhysicalWholeBodyTarget";
import type { IAutoMoviePhysicalProfile } from "../../physics/IAutoMoviePhysicalProfile";
import type { IAutoMovieRelationalGoal } from "./IAutoMovieRelationalGoal";

/** Data and callback contracts shared by the ResolveRelationalGoal operations. */
export namespace IAutoMovieResolveRelationalGoal {
  /** A named point on a body. */
  export interface IRegion {
    /** Segment carrying it. */
    bone: string;

    /** Point in the segment frame, metres. */
    localPoint: IAutoMovieVector3;
  }

  /** A held support at an instant. */
  export interface ISupport {
    /** Held segment. */
    bone: string;

    /** Contact point in the segment frame, metres. */
    localPoint: IAutoMovieVector3;

    /** Unit world contact normal. */
    normal: IAutoMovieVector3;

    /** Lower turn about the normal, radians. */
    minimum: number;

    /** Upper turn about the normal, radians. */
    maximum: number;
  }

  /** An engine-level body. */
  export interface IBody {
    /** Its admitted physical profile. */
    profile: IAutoMoviePhysicalProfile;

    /** Its prior world pose of every segment at an instant. */
    pose(seconds: number): Record<string, IAutoMovieRigidTransform>;

    /** Its named regions. */
    regions: Readonly<Record<string, IAutoMovieResolveRelationalGoal.IRegion>>;

    /** Its held support at an instant, for a performer. */
    support(seconds: number): IAutoMovieResolveRelationalGoal.ISupport;

    /** Segments a fit may move, for a performer. */
    bones: readonly string[];
  }

  /** A realized goal. */
  export interface IResult
    extends IAutoMovieFitPhysicalWholeBodyTarget.IResult {
    /** The target's world point, or null outside the window. */
    point: IAutoMovieVector3 | null;

    /** Whether the instant lies in the window. */
    active: boolean;
  }

  /**
   * Realize a relational goal at one instant: read the target subject's region
   * from its actual pose (at the window's start for `freeze`, at the instant
   * for `track`), then bend the performer's prior pose toward it by the
   * whole-body fit ({@link fitPhysicalWholeBodyTarget}) from its held support,
   * inside every declared ROM, with an optional approach for the effector.
   * Outside the window the prior is returned unchanged with no residual.
   *
   * Bodies are engine-level: a physical profile, a pose at any instant (the
   * production's shape prior, such as an authored or keyed pose) and named
   * regions; no figure package is needed.
   */
  export type IInput = {
    /** The performing subject's id. */ performer: string;
    /** The goal. */ goal: IAutoMovieRelationalGoal;
    /** Every subject's body. */ bodies: Readonly<
      Record<string, IAutoMovieResolveRelationalGoal.IBody>
    >;
    /** Film seconds. */ seconds: number;
    /** Positive solver budget, at most 64; 32 by default. */ iterations?: number;
    /** Residual early-out, metres; 1e-4 by default. */ tolerance?: number;
    /** Metres of residual per unit approach difference; 0.05 by default. */ approachWeight?: number;
  };
}
