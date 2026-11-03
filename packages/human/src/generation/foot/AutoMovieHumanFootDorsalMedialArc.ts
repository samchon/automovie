import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The dorsal-medial piece of a body section: from the medial border over the
 * dorsum's medial slope to the instep's crest, the side profile of the foot's
 * medial half (the first ray's dorsum and the arch's flank). The quintic
 * Hermite of the medial border's jet and the crest's, copied by both arcs
 * meeting at each through `AutoMovieHumanSeam.adopt`, so the piece meets its
 * neighbours G2.
 */
export namespace AutoMovieHumanFootDorsalMedialArc {
  /** The piece from the medial border's jet to the crest's. */
  export function of(medial: AutoMovieHumanFootArc.IJet, crest: AutoMovieHumanFootArc.IJet, count: number): G.Vec2[] {
    return AutoMovieHumanFootArc.quintic(medial, crest, count);
  }
}
