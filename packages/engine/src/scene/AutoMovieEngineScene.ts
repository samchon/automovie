import { type IAutoMovieRoomVisibility, type IAutoMovieRoomVisibilityQuery, type IAutoMovieFog } from "@automovie/interface";
import { autoMovieRoomVisibility as autoMovieRoomVisibilityImplementation } from "../render/internal/autoMovieRoomVisibility";
import { sceneFogTransmittance as sceneFogTransmittanceImplementation } from "./internal/sceneFogTransmittance";

/** Public operations for Auto Movie Engine Scene. */
export namespace AutoMovieEngineScene {
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
   */
  export function autoMovieRoomVisibility(props: IAutoMovieRoomVisibilityQuery): IAutoMovieRoomVisibility {
    return autoMovieRoomVisibilityImplementation(props);
  }

  /**
   * FogExp2 transmittance at axial camera depth in metres: T(d) = exp(-(density *
   * d)^2). Consumers blend subject * T with fog.color * (1 - T), following the
   * same atmosphere law selected by viewer fog setup.
   *
   * Depth is camera-forward distance rather than radial range. The squared law is
   * even in depth, so a behind-camera point has the same attenuation as its
   * positive-depth counterpart; consumers own visibility separately. Binary64
   * evaluation is a prediction of the shader law, not exact pixel agreement with
   * GPU precision, lighting, compositing or tone mapping.
   *
   * Null or absent fog returns one. Scene-admitted density and finite depth are
   * caller premises; nonfinite direct inputs follow ordinary exponential
   * arithmetic.
   */
  export function sceneFogTransmittance(fog: IAutoMovieFog | null | undefined, depthMeters: number): number {
    return sceneFogTransmittanceImplementation(fog, depthMeters);
  }
}
