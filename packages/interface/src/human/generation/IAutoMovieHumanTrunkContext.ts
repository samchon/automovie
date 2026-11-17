import type { IAutoMovieHumanTrunkNeckSeat } from "./IAutoMovieHumanTrunkNeckSeat";
import type { IAutoMovieHumanTrunkSolver } from "./IAutoMovieHumanTrunkSolver";

/**
 * What stays fixed through a solve of the trunk: the fixed inputs and the
 * landmark heights that no course moves, in calibration millimetres.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation What stays fixed through a solve of the trunk: the fixed inputs and the landmark heights that no course moves, in calibration millimetres.
 * @evidence contracts/development/design.md#principled-representation `fixed`: The fixed inputs. `seat`: The neck's bottom ring. `cervicale`: The back neck point `[x, y, 0]`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkSolver.context. Read by AutoMovieHumanTrunkClosure.girthAt, AutoMovieHumanTrunkClosure.tapes, AutoMovieHumanTrunkClosure.courses. Also types AutoMovieHumanTrunkSolver.ctx.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `fixed`, `seat`, `cervicale`, `span`, `buttock`, `iliocristale`, `omphalion`, `axilla`, `shoulderY`, `soft`; callers supply the complete record.
 */
export interface IAutoMovieHumanTrunkContext {
  /** The fixed inputs. */
  fixed: IAutoMovieHumanTrunkSolver.IFixed;

  /** The neck's bottom ring. */
  seat: IAutoMovieHumanTrunkNeckSeat.ISeat;

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
