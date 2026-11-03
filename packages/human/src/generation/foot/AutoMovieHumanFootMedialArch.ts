import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The medial arch piece of a body section: from the contact's medial edge on
 * the floor up under the navicular region to the medial border's point. Its
 * clearance follows from where the contact's medial edge stands across the
 * sole (lateral of the midfoot's midline in the references) and how high the
 * medial border runs; behind the heel's contact it is the posterior sector's
 * medial side. The quintic of the two jets.
 */
export namespace AutoMovieHumanFootMedialArch {
  /** The piece from the contact's medial edge to the medial border. */
  export function of(edge: AutoMovieHumanFootArc.IJet, border: AutoMovieHumanFootArc.IJet, count: number): G.Vec2[] {
    return AutoMovieHumanFootArc.quintic(edge, border, count);
  }
}
