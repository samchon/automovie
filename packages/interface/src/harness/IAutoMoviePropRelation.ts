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
 * Three of the six are measured, not merely resolved. `"on-support"` is
 * measured as contact: a support patch and a `stack-top` both state a face, so
 * a prop claiming to rest on one is refused when it floats above it, sinks into
 * it, or does not stand over it at all. `"in-space"` and `"fill-opening"` are
 * measured as containment, inside the occupied space's own cells and inside the
 * reveal of the element filling the passage. The remaining three cite records
 * that state no contact geometry of their own, a boundary, a building element,
 * a socket or a hook, so they are checked as citations and left unmeasured
 * rather than judged against a frame that never said where the contact is.
 *
 * Before measuring, `validatePropPlacements` refuses a target kind the
 * relation kind does not accept, a target that does not resolve or resolves
 * twice, a prop affordance on the prop itself or of the wrong kind, a building
 * relation outside the environment of the prop's occupied space, and contact
 * relations that form a support cycle.
 *
 * @evidence contracts/common.md#principled-implementation Well-formedness is a lookup in the closed `RELATION_TARGETS` table, and the three measured kinds are axis-aligned box predicates on the staged occupancy: a support gap within a nanometre, corner containment in the space's cells, and fit within the fill element's rest-pose box.
 * @evidence contracts/common.md#clear-and-simple-design A kind and a target id are the whole claim; geometry stays with the building graph and the cited prop, so the relation never restates a face or a volume.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The three citation-only kinds are left unmeasured because their targets state no contact geometry, which the documentation states instead of implying a contact test, and no prop or building is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States each kind with the targets it accepts, which kinds are measured and how, why the rest are not, and every refusal made before measuring; members say what each field names.
 * @author Samchon
 */
export interface IAutoMoviePropRelation {
  /** Which contact semantics this relation asserts. */
  kind: AutoMoviePropRelationKind;

  /** The stable spatial, element, or affordance id the relation cites. */
  target: IAutoMoviePropRelationTarget;
}
