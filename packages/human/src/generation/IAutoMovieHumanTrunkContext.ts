import type { AutoMovieHumanTrunkNeckSeat } from "./AutoMovieHumanTrunkNeckSeat";
import type { AutoMovieHumanTrunkSolver } from "./AutoMovieHumanTrunkSolver";

/**
 * What stays fixed through a solve of the trunk: the fixed inputs and the
 * landmark heights that no course moves, in calibration millimetres.
 */
export interface IAutoMovieHumanTrunkContext {
  /** The fixed inputs. */
  fixed: AutoMovieHumanTrunkSolver.IFixed;

  /** The neck's bottom ring. */
  seat: AutoMovieHumanTrunkNeckSeat.ISeat;

  /** The back neck point `[x, y, 0]`. */
  cervicale: [number, number, number];

  /** Crotch-to-cervicale span, mm. */
  span: number;

  /** Buttock point height, mm. */
  buttock: number;

  /** Iliocristale height, mm. */
  iliocristale: number;

  /** Omphalion height, mm. */
  omphalion: number;

  /** Axilla height, mm. */
  axilla: number;

  /** Shoulder point height, mm. */
  shoulderY: number;

  /** The inguinal fold's softness, mm. */
  soft: number;
}
