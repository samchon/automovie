import type { IAutoMovieFormationCadence } from "../IAutoMovieFormationCadence.js";

/**
 * Where one member stands in its cycle, in `[0, 1)`.
 *
 * Phase is the slot's compiled `motionPhase`, derived from the formation seed
 * and the slot index, so the member that leads the stride leads it on every
 * machine and in every run. What is added to it is the ground its unit has
 * covered, expressed in cycles. No clock is read, and nothing accumulates
 * between frames: the same cues at the same time always resolve to the same
 * mathematical point under these inputs. That does not establish identical
 * captured bytes across GPU arithmetic or unrelated host state.
 */
export const formationCyclePosition: (
  cadence: Pick<IAutoMovieFormationCadence, "advance" | "turn">,
  phase: number,
  radius?: number,
) => number = (
  cadence: Pick<IAutoMovieFormationCadence, "advance" | "turn">,
  phase: number,
  /** The member's distance from its unit's origin, in meters. */
  radius: number = 0,
): number => {
  const raw: number = phase + cadence.advance + radius * cadence.turn;
  return raw - Math.floor(raw);
};
