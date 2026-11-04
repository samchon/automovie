import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";

/**
 * The gluteal cleft: between the buttocks the back midline stands forward,
 * deepening into the crotch ring, as a Gaussian across the midline that
 * decays up the trunk. A smootherstep window ends it between the scapular and
 * the posterior axillary guides, so the sectors past it carry none.
 */
export namespace AutoMovieHumanTrunkGlutealCleft {
  /** The pull at the ring, a share of the back depth: the former trunk's ring value, read on the four references. Fitted, flagged. */
  export const PULL: number = 0.574;

  /** Half width of the cleft across the midline, mm: the former trunk's back groove at the ring. Fitted, flagged. */
  export const GROOVE: number = 17.5;

  /**
   * Decay length of the pull up the trunk, mm: the former trunk's back pull
   * fell from 0.574 at the ring to 0.155 at 64 mm above it (stations 0 and
   * 0.09825 of its 654 mm column), so `exp(-64 / L) = 0.155 / 0.574` gives
   * 49 mm. Fitted, flagged.
   */
  export const DECAY: number = 49;

  /**
   * The back's displacement toward the front at a height over the ring.
   *
   * @param rise Height over the crotch ring, mm.
   * @param depth The back depth from the widest point, mm.
   * @param cut Lateral places where the window starts to fall and has ended, mm.
   * @returns The displacement and its first and second derivatives in z, mm.
   */
  export function at(
    rise: number,
    depth: number,
    cut: readonly [number, number],
  ): (z: number) => [number, number, number] {
    const up: number = Math.max(0, rise);

    return AutoMovieHumanTrunkSolve.jet(
      (z: number): number =>
        PULL *
        depth *
        Math.exp(-up / DECAY) *
        Math.exp(-((z / GROOVE) ** 2)) *
        AutoMovieHumanTrunkSolve.window(z, cut[0], cut[1]),
    );
  }
}
