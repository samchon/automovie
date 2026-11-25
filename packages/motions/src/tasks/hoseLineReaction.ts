import type { IAutoMovieMotionClock } from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";

/**
 * A hose team member's stand against the stream: the hands and the lean set
 * over `SET`, the stream swept `sweeps` times of `SWEEP` each and shut over
 * another `SET`, a slower tempo lengthening each; the nozzle reaction
 * `REACTION`, shared by the two members, tips each member's trunk forward by
 * `atan(REACTION / 2 / (m g))`, the lean that brings the body's weight to
 * balance its share.
 *
 * @param mass The member's mass, kilograms.
 * @param sweeps The sweeps asked; `SWEEPS` when absent.
 * @param tempo The member's tempo factor.
 * @returns The stand's clock and lean.
 */
export function hoseLineReaction(
  mass: number,
  sweeps: number | undefined,
  tempo: number,
): hoseLineReaction.IStand {
  const count: number = sweeps ?? hoseLineReaction.SWEEPS;
  return {
    sweeps: count,
    clock: AutoMovieMotionClock.phrase({
      prepare: tempo * hoseLineReaction.SET,
      attack: tempo * hoseLineReaction.SWEEP * count,
      retract: tempo * hoseLineReaction.SET,
    }),
    lean:
      (Math.atan(hoseLineReaction.REACTION / 2 / (mass * hoseLineReaction.G)) *
        180) /
      Math.PI,
  };
}

/** The hose team's stand. */
export namespace hoseLineReaction {
  /**
   * The nozzle reaction of a 150 gpm fog stream at 100 psi, newtons: the IFSTA
   * fog-nozzle formula NR = 0.0505 Q sqrt(P) gives 75.75 lbf, 337 N. The flow
   * and pressure are a common hand line's, provisional for a scene.
   */
  export const REACTION: number = 0.0505 * 150 * Math.sqrt(100) * 4.448;

  /** Gravity, metres per second squared. */
  export const G: number = 9.81;

  /** Seconds of one full sweep of the stream: provisional. */
  export const SWEEP: number = 1.2;

  /** Sweeps when none are asked. */
  export const SWEEPS: number = 3;

  /** Seconds to set the hands and the lean: provisional. */
  export const SET: number = 0.6;

  /** A member's stand. */
  export interface IStand {
    /** The sweeps. */
    sweeps: number;

    /** The set, the sweeps and the shut-off. */
    clock: IAutoMovieMotionClock;

    /** The trunk's forward lean, degrees. */
    lean: number;
  }
}
