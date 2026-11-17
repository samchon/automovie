import type { IAutoMovieRigidTransform } from "../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";
import type { IAutoMovieFitPhysicalWholeBodyTarget } from "../../physics/IAutoMovieFitPhysicalWholeBodyTarget";
import type { IAutoMoviePhysicalProfile } from "../../physics/IAutoMoviePhysicalProfile";
import type { IAutoMovieRelationalGoal } from "./IAutoMovieRelationalGoal";

/**
 * Data and callback contracts shared by the ResolveRelationalGoal operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieResolveRelationalGoal contracts used by packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveRelationalGoal contract belongs to interface; packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieResolveRelationalGoal {
  /**
   * A named point on a body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveRelationalGoal.IRegion keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveRelationalGoal.IRegion contract belongs to interface; packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export interface IRegion {
    /** Segment carrying it. */
    bone: string;

    /** Point in the segment frame, metres. */
    localPoint: IAutoMovieVector3;
  }

  /**
   * A held support at an instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveRelationalGoal.ISupport keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveRelationalGoal.ISupport contract belongs to interface; packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts uses this boundary. Runtime computation remains with those consumers.
   */
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

  /**
   * An engine-level body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveRelationalGoal.IBody keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveRelationalGoal.IBody contract belongs to interface; packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export interface IBody {
    /** Its admitted physical profile. */
    profile: IAutoMoviePhysicalProfile;

    /**
     * Its prior world pose of every segment at an instant.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieResolveRelationalGoal.IBody.pose: Its prior world pose of every segment at an instant.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieResolveRelationalGoal.IBody.pose is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieResolveRelationalGoal.IBody.pose is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieResolveRelationalGoal.IBody.pose is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieResolveRelationalGoal.IBody.pose is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieResolveRelationalGoal.IBody.pose is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieResolveRelationalGoal.IBody.pose is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     */
    pose(seconds: number): Record<string, IAutoMovieRigidTransform>;

    /** Its named regions. */
    regions: Readonly<Record<string, IAutoMovieResolveRelationalGoal.IRegion>>;

    /**
     * Its held support at an instant, for a performer.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieResolveRelationalGoal.IBody.support: Its held support at an instant, for a performer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieResolveRelationalGoal.IBody.support is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieResolveRelationalGoal.IBody.support is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieResolveRelationalGoal.IBody.support is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieResolveRelationalGoal.IBody.support is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieResolveRelationalGoal.IBody.support is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieResolveRelationalGoal.IBody.support is used through packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts.
     */
    support(seconds: number): IAutoMovieResolveRelationalGoal.ISupport;

    /** Segments a fit may move, for a performer. */
    bones: readonly string[];
  }

  /**
   * A realized goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveRelationalGoal.IResult keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveRelationalGoal.IResult contract belongs to interface; packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts uses this boundary. Runtime computation remains with those consumers.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveRelationalGoal.IInput keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Bodies expose admitted physical profiles and named segment-local points in metres; pose readers supply world transforms at film seconds. Support normals are world unit vectors and turn limits are radians. The whole-body solver owns numerical fitting; outside the goal window the result is inactive with no target point. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveRelationalGoal.IInput contract belongs to interface; packages/engine/src/composition/resolveAutoMovieRelationalGoal.ts uses this boundary. Runtime computation remains with those consumers.
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
