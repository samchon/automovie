import { AutoMoviePropRelationKind } from "./AutoMoviePropRelationKind";
import { IAutoMoviePropRelationTarget } from "./IAutoMoviePropRelationTarget";

/**
 * What a prop claims about where it sits, as one typed relation.
 *
 * The six kinds are the contact semantics the architecture graph can answer
 * for, and each one restricts which targets it accepts:
 *
 * - `"in-space"`: the prop is contained by a logical space (`space` target).
 * - `"on-support"`: it rests on a support patch or another prop's `stack-top`
 *   affordance (`surface` or `prop-affordance` target).
 * - `"against-boundary"`: it stands against a wall, floor, or ceiling separation
 *   (`boundary` target).
 * - `"fill-opening"`: it is the leaf, sash, or gate filling a passage cut through
 *   a boundary (`opening` target).
 * - `"attached"`: it is fixed to a building element or plugged into another
 *   prop's `socket` affordance (`element` or `prop-affordance` target).
 * - `"suspended"`: it hangs from a building element or from another prop's `hook`
 *   affordance (`element` or `prop-affordance` target).
 *
 * Three kinds have geometry measurements when usable target geometry exists. `"on-support"` compares the world occupancy underside with finite probes of a support patch or `stack-top`, refusing a measured gap outside +/-1e-9 m or no overlapping probe. `"in-space"` checks eight box corners against the space subtree's union; a subtree without stated volume imposes no restriction, and non-convex gaps between corners can remain unseen. `"fill-opening"` checks occupancy inside the filling element's rest-pose world AABB with 1e-9 m slack; an absent fill/model or unresolved rest transform skips that measurement, so this is not a general reveal-fit proof.
 *
 * `"against-boundary"`, `"attached"` and `"suspended"` currently check citations only. An optional boundary face does not change that path. Even measured support is a finite proxy test: thin edge intersections and relief between probes can remain unread, unresolved or edge-on faces are skipped, and extreme derived nonfinite gaps are not independently refused by the comparisons. These relations do not solve attachment dynamics or continuous collision.
 *
 * `validatePropPlacements` refuses incompatible target kinds, missing targets, ambiguous environment or prop registry identities, self-prop affordances or wrong affordance kinds, building citations outside the occupied environment and prop-contact cycles. Nested building and affordance identity uniqueness depends on their owners' admission; building-list presence and affordance lookup here do not independently reject every duplicate nested id.
 *
 * @evidence contracts/common.md#principled-implementation The closed `RELATION_TARGETS` table admits target kinds; the geometry pass shares staged proxy occupancy, probes support through `propSupportGap`, applies subtree corner containment through `propSpaceContainsBounds` and fits a measurable fill's rest AABB. The stated tolerance, sampling and skipped-geometry cases delimit these judgments; they do not certify full mesh contact or whole-box containment in a non-convex union.
 * @evidence contracts/common.md#clear-and-simple-design A kind and a target id are the whole claim; geometry stays with the building graph and the cited prop, so the relation never restates a face or a volume.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Citation-only kinds remain explicit consumer limitations even when a record has optional face data. Missing target ids are refused separately from unmeasurable existing geometry, which is skipped rather than invented; declared prop-affordance contact exempts the pair's occupancy overlap but never establishes contact by itself or exempts clearances.
 * @evidence contracts/common.md#meaningful-documentation States each kind with the targets it accepts, which kinds are measured and how, why the rest are not, and every refusal made before measuring; members say what each field names.
 */
export interface IAutoMoviePropRelation {
  /** Which contact semantics this relation asserts. */
  kind: AutoMoviePropRelationKind;

  /** The stable spatial, element, or affordance id the relation cites. */
  target: IAutoMoviePropRelationTarget;
}
