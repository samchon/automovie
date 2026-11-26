import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieCollisionComparisonCounts } from "./IAutoMovieCollisionComparisonCounts";
import type { IAutoMovieUnavailableCollisionPair } from "./IAutoMovieUnavailableCollisionPair";
import type { IAutoMoviePreparePhysicalGeometry } from "../physics/IAutoMoviePreparePhysicalGeometry";
import type { IAutoMovieSubjectBox } from "../production/IAutoMovieSubjectBox";

/** Collision evidence for one evaluated scene layer, in world metres. */
export namespace IAutoMovieSceneCollision {
  /**
   * An assembly, admitted formation or segmented deformable body whose parts
   * share external collision ownership.
   */
  export interface IGroup {
    /** Stable group identity within the evaluated scene layer. */
    id: string;
    /**
     * Explicit source-owned exclusion policy. A rigid assembly moves as one
     * owner, a managed formation keeps its own member spacing, and a deformable
     * body is one solver-owned surface split into segments whose self-contact
     * belongs to that solver.
     */
    kind: "rigid-assembly" | "managed-formation" | "deformable-body";
  }

  /** One collision leaf supplied by the evaluated scene owner. */
  export interface IPart {
    /** Unique, stable source path for this physical part. */
    id: string;
    /** An explicit managed group. An omitted value makes the part independent. */
    group?: IGroup;
    /** Stable region inside the supplied group, used only for broad refinement. */
    region?: string;
    /** Null when available inputs cannot prove even an enclosing world box. */
    geometry:
      | {
          /** A supported solid with current world placement. */
          kind: "shape";
          /** The current collider with admitted dimensions and unit poses. */
          collider: IAutoMoviePreparePhysicalGeometry.ICollider;
          /**
           * Displayed means the producer can account for the displayed solid
           * with this exact shape. Enclosing means the shape contains the whole
           * displayed solid, so separation proves clearance while overlap stays
           * a candidate. Proxy carries neither guarantee.
           */
          basis: "displayed" | "enclosing" | "proxy";
        }
      | {
          /**
           * A finite conservative world envelope for a part with unsupported
           * narrow geometry.
           */
          kind: "envelope";
          /** Closed enclosing bounds in world metres. */
          bounds: IAutoMovieSubjectBox;
        }
      | null;
  }

  /**
   * Authored allowed penetration for one exact pair in a half-open local time
   * interval.
   */
  export interface IAllowance {
    /** First part path. Pair orientation is immaterial. */
    first: string;
    /** Second part path, distinct from first. */
    second: string;
    /** Included start second. */
    startSeconds: number;
    /** Excluded end second. */
    endSeconds: number;
    /**
     * Nonnegative allowed penetration in metres. The tightest active allowance
     * wins.
     */
    maxPenetration: number;
    /**
     * Skin joints of the first part whose drawn surface the window covers, such
     * as the fingers of a grip. Omitted covers the whole part. A scoped window
     * applies only to a surface witness labelled with one of these joints, so a
     * forearm crossing the gripped prop still counts.
     */
    firstJoints?: readonly string[];
    /** Skin joints of the second part, with the same meaning as `firstJoints`. */
    secondJoints?: readonly string[];
  }

  /** One evaluated layer and the finite traversal workload it permits. */
  export interface IProps {
    /** Fresh geometry for one scene layer before applying inspection marks. */
    parts: readonly IPart[];
    /**
     * Finite layer-local second used by the parts and permitted contact
     * windows.
     */
    seconds: number;
    /** Existing initialized convex query, borrowed for this call. */
    geometry: Pick<IAutoMoviePreparePhysicalGeometry.IQueries, "contact">;
    /** Authored windows with exact part paths. */
    allowances?: readonly IAllowance[];
    /**
     * Refine overlapping groups by their admitted regions before comparing part
     * bounds. Region bounds are built only for groups that overlap another
     * group.
     */
    refinement?: "group" | "region";
    /** Maximum sum of group, region, part and narrow shape comparisons. */
    maxComparisons: number;
  }

  /** One observation for a canonically ordered external part pair. */
  export interface IFinding {
    /** Lexicographically earlier part path. */
    first: string;
    /** Lexicographically later part path. */
    second: string;
    /** Observed layer-local second. */
    seconds: number;
    /**
     * Geometry supporting this finding. Envelope takes precedence over proxy in
     * a bounds-only pair, and an enclosing solid reports as proxy.
     */
    basis: "displayed" | "proxy" | "envelope";
    /**
     * Candidate means uncertain separation. Confirmed and permitted require
     * displayed geometry.
     */
    status: "candidate" | "proxy" | "confirmed" | "permitted";
    /**
     * Measured signed gap in metres, negative inside. Null when only bounds are
     * available.
     */
    separation: number | null;
    /** Native query's world-metre contact point, absent for bounds alone. */
    point: IAutoMovieVector3 | null;
    /**
     * Tightest active named allowance in metres, or null for an undeclared
     * pair.
     */
    allowance: number | null;
  }

  /** Current measured results and the explicit remaining scope. */
  export interface IResult {
    /** Findings in lexicographic pair order, independent of input order. */
    findings: readonly IFinding[];
    /** Parts without usable conservative bounds, in stable path order. */
    unboundedParts: readonly string[];
    /**
     * Parts read via proxy geometry. Their displayed solids are unverified even
     * if the proxies are disjoint.
     */
    proxyParts: readonly string[];
    /**
     * Candidate pairs whose supported shape query refused to return a
     * measurement.
     */
    unavailablePairs: readonly IAutoMovieUnavailableCollisionPair[];
    /**
     * Groups whose internal pairs follow their declared source-owned exclusion
     * policy.
     */
    internalGroups: readonly IGroup[];
    /** True when the next comparison could not be attempted within the budget. */
    budgetExhausted: boolean;
    /**
     * Completed comparisons at each resolution, including cheap rejection
     * checks.
     */
    compared: IAutoMovieCollisionComparisonCounts;
  }
}
