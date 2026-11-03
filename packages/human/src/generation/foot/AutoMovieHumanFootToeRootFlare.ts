import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * A toe's root flare: the proximal phalanx's base is broader than its shaft and
 * the web's soft tissue fills toward the neighbour, so the toe flares by
 * {@link FLARE} over the shaft's breadth at its metatarsal head, fading to
 * nothing over the first {@link FADE} of the line by a smoothstep. A toe
 * narrowed to its shaft at the web read as a neck.
 */
export namespace AutoMovieHumanFootToeRootFlare {
  /**
   * The flare's factor at a length along the line.
   *
   * @param s Length along the line from the metatarsal head, mm.
   * @param length The line's length, mm.
   */
  export function factor(s: number, length: number): number {
    return 1 + FLARE * (1 - G.smooth(s / (FADE * length)));
  }
}

/** The root's flare over the shaft's breadth. Convention, awaiting a published value. */
const FLARE: number = 0.3;

/** The share of the toe's line, from its metatarsal head, the flare fades over. Convention. */
const FADE: number = 0.45;
