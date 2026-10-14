import { IAutoMoviePropBox } from "./IAutoMoviePropBox";

/**
 * One axis-aligned model-local volume another prop may not occupy.
 *
 * `validatePropPlacements` refuses a blank or repeated clearance id within the
 * prop and a box that is not finite with `min < max` on every axis. It then
 * transforms the keep-out volume by the prop's staged placement and refuses it
 * when it overlaps the transformed occupancy of any other forged, uniquely
 * staged prop whose footprint is absent or finite. Boxes that only touch on a
 * face do not overlap, and a clearance is tested neither against its own prop
 * nor against building geometry.
 *
 * @evidence contracts/common.md#principled-implementation `propClearanceBounds` encloses the transformed box in a world AABB and `propBoundsOverlap` applies strict interval comparisons on all three axes. This is the separating-axis rule for ordered AABBs, not an oriented-box or mesh intersection test: rotated enclosures can overlap without the original volumes touching. A derived NaN makes the overlap comparisons false; finite local admission does not prove finite transformed arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design A clearance is a prop box plus an id, so it shares the occupancy box's corner rules and transform code and needs no shape of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each violation names the clearance and intruding prop instead of nudging either. This check excludes its own prop and building geometry; separate relation measurements are partial and do not establish that the keep-out box clears every building element. A declared prop contact exempts pairwise occupancy overlap, never a clearance intrusion.
 * @evidence contracts/common.md#meaningful-documentation States the id and corner refusals, how the volume is transformed and against which props it is tested, the face-contact rule, and the two things it is never tested against.
 * @author Samchon
 */
export interface IAutoMovieClearanceBox extends IAutoMoviePropBox {
  /** Stable, non-blank clearance id, unique within the prop. */
  id: string;
}
