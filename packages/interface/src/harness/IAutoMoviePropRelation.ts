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
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-depth-of-field-boundary Exposes `IAutoMoviePropRelation` as the portable data boundary for the camera depth of field boundary requirement.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `IAutoMoviePropRelation` for the clv focus intent appearance boundary system contract.
 * @author Samchon
 */
export interface IAutoMoviePropRelation {
  /**
   * Which contact semantics this relation asserts.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-depth-of-field-boundary Exposes `kind` as the portable data boundary for the camera depth of field boundary requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `kind` for the clv focus intent appearance boundary system contract.
   */
  kind: AutoMoviePropRelationKind;

  /**
   * The stable spatial, element, or affordance id the relation cites.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-depth-of-field-boundary Exposes `target` as the portable data boundary for the camera depth of field boundary requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `target` for the clv focus intent appearance boundary system contract.
   */
  target: IAutoMoviePropRelationTarget;
}
