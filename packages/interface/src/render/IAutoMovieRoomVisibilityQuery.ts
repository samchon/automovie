import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Decide which logical spaces a camera cannot possibly see.
 *
 * Cell-and-portal culling, run conservatively. Two spaces are joined when
 * anything the design declares lets sight pass between them: an opening cut
 * through a shared boundary, a connector such as a stair, lift, ramp or
 * skybridge at every space it stops at rather than only at its two ends, or,
 * for a space whose envelope carries an opening, the exterior itself. A space
 * is hidden only when no such chain reaches it from the space the camera
 * occupies.
 *
 * The exterior is a graph node, which is what makes the answer right in the
 * case that motivates the whole hint: from a sealed interior room, the other
 * windowed rooms of the same building are hidden, while from a windowed room
 * they are kept, because sight can leave one window and enter another. A culler
 * that treated "outside" as nothing would have hidden the second case and
 * produced a frame the film does not contain.
 *
 * Containment is decided over LEAF spaces. A storey containing a room contains
 * the camera too, and reading that as two candidate cells would make every
 * ordinary building ambiguous; the storeys and building spaces above the
 * camera's room are containers, and they are always kept.
 *
 * The cases that hide nothing are as important as the ones that hide something,
 * and each states its reason:
 *
 * - The camera is outside every declared leaf space, so it may see any facade;
 * - The camera lies in more than one leaf space, so which cell it occupies is not
 *   a fact the design settled;
 * - Some leaf space declares no cells, so its extent is unknown and a sight line
 *   through it cannot be ruled out. Placement and proof stay separate facts
 *   here: an unknown extent leaves the camera's own room reported when it is
 *   settled, and refuses to call the camera exterior when it is not, because a
 *   camera standing inside the one space nobody measured is exactly the case
 *   "outside every space" would get wrong;
 * - A boundary carrying an opening is a portal even when a door leaf fills it,
 *   because whether that leaf is shut is movable state this issue does not own.
 *   Proving a closed door would hide more, and proving it belongs to the
 *   openings issue rather than to a guess made here.
 *
 * @evidence contracts/development/design.md#principled-representation A canonical built environment and camera position in world metres supply cell/portal reachability for one building.
 * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieRoomVisibility reads the environment's own spaces, boundaries, openings and connector graph rather than a parallel visibility scene.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown or ambiguous camera containment keeps all spaces; openable portals remain conservative regardless of movable door state.
 * @evidence contracts/development/common.md#meaningful-documentation Documents leaf-space containment, exterior connectivity and cases that cannot prove hiding.
 */
export type IAutoMovieRoomVisibilityQuery = {
  /** Building whose spaces are being culled. */
  environment: IAutoMovieBuiltEnvironment;
  /** World-space camera position. */
  camera: IAutoMovieVector3;
};
