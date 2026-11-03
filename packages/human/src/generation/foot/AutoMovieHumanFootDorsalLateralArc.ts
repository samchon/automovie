import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The dorsal-lateral piece of a body section: from the instep's crest over the
 * dorsum's lateral slope to the lateral border, the side profile of the foot's
 * lateral half. The quintic Hermite of the crest's jet and the lateral
 * border's, which both arcs meeting at each copy through
 * `AutoMovieHumanSeam.adopt`, so the piece meets its neighbours G2.
 */
export namespace AutoMovieHumanFootDorsalLateralArc {
  /** The piece from the crest's jet to the lateral border's. */
  export function of(crest: AutoMovieHumanFootArc.IJet, lateral: AutoMovieHumanFootArc.IJet, count: number): G.Vec2[] {
    return AutoMovieHumanFootArc.quintic(crest, lateral, count);
  }
}
