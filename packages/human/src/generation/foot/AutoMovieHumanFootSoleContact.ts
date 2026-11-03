import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The sole's contact piece of a body section: between the contact's lateral
 * and medial edges. On the floor both edges are level with zero curvature, so
 * the piece is the flat contact plane; behind the heel's contact, where the
 * edges leave the floor and run round the heel's posterior corner, the edges'
 * tangent and curvature are handed over from the floor's to their neighbours'
 * by `AutoMovieHumanFootEdgeHandover` and the piece is the quintic of the two
 * edges' jets.
 */
export namespace AutoMovieHumanFootSoleContact {
  /** The piece from the lateral edge's jet to the medial edge's. */
  export function of(lateral: AutoMovieHumanFootArc.IJet, medial: AutoMovieHumanFootArc.IJet, count: number): G.Vec2[] {
    return AutoMovieHumanFootArc.quintic(lateral, medial, count);
  }
}
