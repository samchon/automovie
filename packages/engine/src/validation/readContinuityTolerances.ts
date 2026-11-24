import type {
  IAutoMovieContinuityTolerances,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/** Default world-space position drift tolerated across a cut (metres). */
const DEFAULT_POSITION_TOLERANCE: number = 0.05;

/** Default facing drift tolerated across a cut (degrees). */
const DEFAULT_FACING_TOLERANCE_DEG: number = 5;

/**
 * Default position/facing tolerance to0.05m/5deg and admit finite nonnegative
 * values, with facing<=180.
 */
export const readContinuityTolerances: (
  position: number | undefined,
  facingDeg: number | undefined,
  root: string,
  collector: IAutoMovieViolationCollector,
) => IAutoMovieContinuityTolerances | null = (
  position: number | undefined,
  facingDeg: number | undefined,
  root: string,
  collector: IAutoMovieViolationCollector,
): IAutoMovieContinuityTolerances | null => {
  const pos: number = position ?? DEFAULT_POSITION_TOLERANCE;
  const facing: number = facingDeg ?? DEFAULT_FACING_TOLERANCE_DEG;
  const badPos: boolean = pos < 0;
  const badFacing: boolean =
    facing < 0 || facing > 180;
  if (badPos)
    collector.push(
      "range",
      `${root}.positionTolerance`,
      "a finite position tolerance >= 0 metres",
      position,
    );
  if (badFacing)
    collector.push(
      "range",
      `${root}.facingToleranceDeg`,
      "a finite facing tolerance in [0, 180] degrees",
      facingDeg,
    );
  if (badPos || badFacing) return null;
  return { position: pos, facingDeg: facing };
};
