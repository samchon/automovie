/**
 * Ordered toe arcs of the foot body's ring, with hallux first in left-side
 * phase coordinates.
 *
 * The interface package owns these declarations; AutoMovieHumanFootWebRing in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootWebRing {
  /** Each toe's arcs of the ring. */
  export interface IWebRing {
    /** Each toe's arcs of the body's ring, left phases, hallux first. */
    arcs: [number, number][][];
  }
}
