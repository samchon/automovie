import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";

/**
 * The inguinal fold: where the thighs part from the trunk's midline, the
 * front of the lowest sections stands back toward the body, so the crotch
 * ring is two lobes the legs each take.
 *
 * The midline stands back by `PULL` of the front depth at the ring, the pull
 * falling exponentially with the height over the ring and with the distance
 * from a flat core as wide as that height, so the fold runs out from the
 * pubis toward the hip at 45 degrees while the pull further out stays. It is
 * as soft as the sampling needs (the larger of the ring's control pitch and
 * the rows' spacing, `SAMPLES` of it): a fold narrower than the ring's pitch
 * printed teeth along it. A smootherstep window ends it between the bust
 * guide and the anterior axillary guide, so the sectors past it carry none.
 */
export namespace AutoMovieHumanTrunkInguinalFold {
  /**
   * The pull at the ring, a share of the front depth. Measured on f1 the
   * midline's pull reads 1.07, 0.88, 0.70, 0.45 and 0.32 at 0, 5, 10, 20 and
   * 30 mm above the ring (generalization.md, Trunk). Fitted, flagged.
   */
  export const PULL: number = 1.07;

  /**
   * Decay length of the pull across the body and up it, mm: the front stands
   * back 1.07, 0.55, 0.27 and 0.13 of its depth at 0, 20, 40 and 60 mm
   * (f1), a length of 29 mm; 27 mm gives the measured 0.70 at 10 mm. Fitted,
   * flagged.
   */
  export const DECAY: number = 27;

  /** The fold's softness in sampling pitches: a band about two and a half samples wide, so each ring and each row carries it whole. Conventional. */
  export const SAMPLES: number = 1.25;

  /**
   * The fold's softness.
   *
   * @param pitch The ring's control pitch at the crotch, mm.
   * @param gap The rows' spacing where the fold runs, mm.
   * @returns The softness, mm.
   */
  export function softness(pitch: number, gap: number): number {
    return SAMPLES * Math.max(pitch, gap);
  }

  /**
   * The front's displacement toward the back at a height over the ring.
   *
   * @param rise Height over the crotch ring, mm.
   * @param depth The front depth from the widest point, mm.
   * @param soft The fold's softness, mm.
   * @param cut Lateral places where the window starts to fall and has ended, mm.
   * @returns The displacement and its first and second derivatives in z, mm.
   */
  export function at(
    rise: number,
    depth: number,
    soft: number,
    cut: readonly [number, number],
  ): (z: number) => [number, number, number] {
    const up: number = Math.max(0, rise);

    return AutoMovieHumanTrunkSolve.jet((z: number): number => {
      // The flat core's edge runs out at 45 degrees as the height rises.
      const away: number = Math.hypot(z, soft) - soft - up;
      const across: number = (Math.hypot(away, soft) + away) / 2;

      return (
        PULL *
        depth *
        Math.exp(-up / DECAY) *
        Math.exp(-across / DECAY) *
        AutoMovieHumanTrunkSolve.window(z, cut[0], cut[1])
      );
    });
  }
}
