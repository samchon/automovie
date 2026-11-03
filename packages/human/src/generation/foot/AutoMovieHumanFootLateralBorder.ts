import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The lateral border's plantar piece of a body section: from the lateral
 * border's point down round the border onto the floor at the contact's
 * lateral edge (behind the heel, onto the narrow posterior sector's lateral
 * edge). The quintic of the two jets.
 */
export namespace AutoMovieHumanFootLateralBorder {
  /** The piece from the lateral border's jet to the contact's lateral edge. */
  export function of(border: AutoMovieHumanFootArc.IJet, edge: AutoMovieHumanFootArc.IJet, count: number): G.Vec2[] {
    return AutoMovieHumanFootArc.quintic(border, edge, count);
  }
}
