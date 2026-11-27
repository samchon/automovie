import { AutoMovieEngineMotionSampling } from "@automovie/engine";

/*
 * The signals a gesture's stroke rides, each a function of the stroke's share
 * in [0, 1] that starts at rest: a windowed oscillation for the repeated
 * strokes, a single rise and fall, and a rise held to the end.
 */
export namespace gestureSignal {
  /*
   * A periodic stroke signal that starts and ends at rest: `sin(2 pi n u)`
   * under a window easing in over the first and out over the last 15 % of the
   * stroke, so the hand leaves and rejoins its held goal smoothly.
   * Parameter u: Stroke share.
   * Parameter cycles: Cycles.
   * Returns: The signal in [-1, 1]; 0 at and outside the stroke's ends.
   */
  export function oscillation(u: number, cycles: number): number {
    if (!(u > 0 && u < 1)) return 0;
    return (
      Math.sin(2 * Math.PI * cycles * u) *
      Math.min(AutoMovieEngineMotionSampling.minimumJerkShare(u / 0.15), AutoMovieEngineMotionSampling.minimumJerkShare((1 - u) / 0.15))
    );
  }

  /*
   * A single rise and fall over the stroke, `sin^2(pi u)`.
   * Parameter u: Stroke share.
   * Returns: The signal in [0, 1]; 0 at and outside the stroke's ends.
   */
  export function bump(u: number): number {
    return u > 0 && u < 1 ? Math.sin(Math.PI * u) ** 2 : 0;
  }

  /*
   * A rise held to the end, for a push: minimum-jerk over the first 60 % of the
   * stroke.
   * Parameter u: Stroke share.
   * Returns: The signal in [0, 1]; 1 from 60 % of the stroke on.
   */
  export function rise(u: number): number {
    return AutoMovieEngineMotionSampling.minimumJerkShare(u / 0.6);
  }
}
