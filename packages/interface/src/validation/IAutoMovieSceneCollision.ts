import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePreparePhysicalGeometry } from "../physics/IAutoMoviePreparePhysicalGeometry";
import type { IAutoMovieSubjectBox } from "../production/IAutoMovieSubjectBox";

/**
 * Collision evidence for one evaluated scene layer, in world metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes part identity, participation, authority, contact windows, evidence and coverage.
 * @evidence contracts/development/design.md#principled-representation Each part supplies a placed solid, a conservative envelope or unavailable geometry. Findings distinguish measured shape contact from an unresolved bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Engine reads placed shapes through the existing initialized geometry contract. A host can consume the same findings without reconstructing poses or depending on a renderer format.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only explicit assembly and managed formation membership excludes internal pairs. A box overlap alone establishes candidate status. An incomplete search reports its cause.
 */
export namespace IAutoMovieSceneCollision {
  /**
   * An assembly or admitted formation whose parts share external collision ownership.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the stable group identity and the reasons that exempt internal pairs.
   * @evidence contracts/development/design.md#principled-representation A group is a stable identity qualified by its declared assembly or formation owner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Scene evaluation supplies membership, and the scene query consumes it before checking external pairs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Path prefixes and coincident poses imply no group membership or exemption.
   */
  export interface IGroup {
    /** Stable group identity within the evaluated scene layer. */
    id: string;
    /** Explicit source-owned exclusion policy. */
    kind: "rigid-assembly" | "managed-formation";
  }

  /**
   * One collision leaf supplied by the evaluated scene owner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the source path, explicit grouping, optional region and world geometry authority.
   * @evidence contracts/development/design.md#principled-representation A leaf carries a supported closed solid, a conservative envelope or explicit unavailable geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Scene evaluation supplies current world placement. The query consumes it without owning animation or meshes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only exact displayed ownership can certify a displayed collision. Unavailable bounds remain outside the search.
   */
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
          /** Displayed means the producer can account for the displayed solid with this exact shape. */
          basis: "displayed" | "proxy";
        }
      | {
          /** A finite conservative world envelope for a part with unsupported narrow geometry. */
          kind: "envelope";
          /** Closed enclosing bounds in world metres. */
          bounds: IAutoMovieSubjectBox;
        }
      | null;
  }

  /**
   * Authored allowed penetration for one exact pair in a half-open local time interval.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the named pair, included start, excluded end and maximum permitted depth.
   * @evidence contracts/development/design.md#principled-representation The pair is order-independent and its tolerance is a nonnegative world-metre depth.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The production source declares the window, and the scene query resolves overlap by minimum allowance.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A window exempts only the named pair and only within the specified depth and interval.
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
    /** Nonnegative allowed penetration in metres. The tightest active allowance wins. */
    maxPenetration: number;
  }

  /**
   * One evaluated layer and the finite traversal workload it permits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines one layer clock, input geometry, native query and comparison limit.
   * @evidence contracts/development/design.md#principled-representation Placed parts and named allowances are evaluated at the same finite layer-local second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The caller retains the evaluated layer and initialized contact query. The measurement borrows both for one synchronous call.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No geometry is resampled and no cross-layer or temporally sampled pairs enter this interface.
   */
  export interface IProps {
    /** Fresh geometry for one scene layer before applying inspection marks. */
    parts: readonly IPart[];
    /** Finite layer-local second used by the parts and permitted contact windows. */
    seconds: number;
    /** Existing initialized convex query, borrowed for this call. */
    geometry: Pick<IAutoMoviePreparePhysicalGeometry.IQueries, "contact">;
    /** Authored windows with exact part paths. */
    allowances?: readonly IAllowance[];
    /** Refine overlapping groups by their admitted regions before comparing part bounds. */
    refinement?: "group" | "region";
    /** Maximum sum of group, region, part and narrow shape comparisons. */
    maxComparisons: number;
  }

  /**
   * One observation for a canonically ordered external part pair.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the ordered identities, sampled second, authority, witness and active allowance.
   * @evidence contracts/development/design.md#principled-representation Candidate, proxy, confirmed and permitted statuses preserve the scope of the reported geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The query returns world-space evidence that independent consumers can place and group by pair.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A broad overlap supplies no invented point or depth. Native ambiguity stays a candidate.
   */
  export interface IFinding {
    /** Lexicographically earlier part path. */
    first: string;
    /** Lexicographically later part path. */
    second: string;
    /** Observed layer-local second. */
    seconds: number;
    /** Geometry supporting this finding. Envelope takes precedence over proxy in a bounds-only pair. */
    basis: "displayed" | "proxy" | "envelope";
    /** Candidate means uncertain separation. Confirmed and permitted require displayed geometry. */
    status: "candidate" | "proxy" | "confirmed" | "permitted";
    /** Measured signed gap in metres, negative inside. Null when only bounds are available. */
    separation: number | null;
    /** Native query's world-metre contact point, absent for bounds alone. */
    point: IAutoMovieVector3 | null;
    /** Tightest active named allowance in metres, or null for an undeclared pair. */
    allowance: number | null;
  }

  /**
   * Current measured results and the explicit remaining scope.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes findings, skipped ownership, incomplete geometry and completed comparison counts.
   * @evidence contracts/development/design.md#principled-representation Exact findings are returned with explicit proxy, unbounded, unavailable and exhausted scopes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The query owns deterministic ordering and counts. The consumer owns any presentation or aggregation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An empty finding list never hides a proxy, an unavailable part or incomplete traversal.
   */
  export interface IResult {
    /** Findings in lexicographic pair order, independent of input order. */
    findings: readonly IFinding[];
    /** Parts without usable conservative bounds, in stable path order. */
    unboundedParts: readonly string[];
    /** Parts read via proxy geometry. Their displayed solids are unverified even if the proxies are disjoint. */
    proxyParts: readonly string[];
    /** Candidate pairs whose supported shape query refused to return a measurement. */
    unavailablePairs: readonly Readonly<{ first: string; second: string }>[];
    /** Groups whose internal pairs follow their declared source-owned exclusion policy. */
    internalGroups: readonly IGroup[];
    /** True when the next comparison could not be attempted within the budget. */
    budgetExhausted: boolean;
    /** Completed comparisons at each resolution, including cheap rejection checks. */
    compared: Readonly<{
      groups: number;
      regions: number;
      parts: number;
      shapes: number;
    }>;
  }
}
