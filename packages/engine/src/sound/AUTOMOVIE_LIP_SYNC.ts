/**
 * Thresholds of the lip-sync lag measurement, `measureAutoMovieLipSyncLag`.
 *
 * `leadMilliseconds` (−45 ms) and `lagMilliseconds` (+125 ms) are ITU-R
 * BT.1359-1's detectability thresholds for sound ahead of and behind the
 * picture. `windowSeconds` (0.25 s) widens the line's span on each side, so a
 * lag up to a quarter second either way is found rather than cut off.
 * `minimumCorrelation` (0.3) is the peak normalized cross-correlation below
 * which the series share too little shape to name a lag; it is this
 * measurement's chosen default, not a value from the recommendation.
 */
export const AUTOMOVIE_LIP_SYNC: Readonly<{
  /** Earliest accepted lag, sound ahead of the picture, in milliseconds. */
  leadMilliseconds: number;

  /** Latest accepted lag, sound behind the picture, in milliseconds. */
  lagMilliseconds: number;

  /** Window widening on each side of the speech span, in seconds. */
  windowSeconds: number;

  /** Peak correlation below which the measurement is inconclusive. */
  minimumCorrelation: number;
}> = {
  leadMilliseconds: -45,
  lagMilliseconds: 125,
  windowSeconds: 0.25,
  minimumCorrelation: 0.3,
};
