import { AutoMovieEngineGravity } from "@automovie/engine";
import type { IAutoMovieMotionHumanJuggle } from "@automovie/interface";

/*
 * A juggling pattern's times by Shannon's theorem `(F + D) H = (V + D) N` for
 * two hands, the dwell ratio `k = D / (D + V)` held fixed (Beek and Lewbel, The
 * Science of Juggling, 1995): the flight to a height `h` between hands level
 * with each other, `F = sqrt(8 h / g)`; the cascade's dwell `2 k F / (N − 2 k)`
 * and the two-ball shower's `(2 k / 3) F / (1 − k)`, its low pass flying a
 * third of the high throw; the vacancy `(1 − k) / k` of the dwell; and the
 * least height whose vacancy is the hand's least.
 * Parameter props: The pattern, its balls, the height, the dwell ratio and the
 * least vacancy.
 * Returns: The flight, the dwell, the vacancy and the least height, seconds and
 * metres.
 */
export function juggleTiming(props: juggleTiming.IProps): juggleTiming.ITiming {
  const g: number = AutoMovieEngineGravity.STANDARD;
  const k: number = props.ratio;
  const n: number = props.balls;
  const flight: number = Math.sqrt((8 * props.height) / g);
  const dwell: number =
    props.pattern === "cascade"
      ? (2 * k * flight) / (n - 2 * k)
      : (((2 * k) / 3) * flight) / (1 - k);
  const needed: number =
    props.pattern === "cascade"
      ? (props.vacancy * (n - 2 * k)) / (2 * (1 - k))
      : (props.vacancy * 3 * (1 - k)) / (2 * (1 - k));
  return {
    flight,
    dwell,
    vacancy: ((1 - k) / k) * dwell,
    least: (g * needed * needed) / 8,
  };
}

/*
 * Companion types of juggleTiming.
 */
export namespace juggleTiming {
  /*
   * What a pattern's times are solved from.
   */
  export interface IProps {
    /*
     * The pattern.
     */
    pattern: IAutoMovieMotionHumanJuggle.Pattern;
    /*
     * How many balls it juggles.
     */
    balls: number;
    /*
     * The throw's height, metres.
     */
    height: number;
    /*
     * The dwell ratio, `D / (D + V)`.
     */
    ratio: number;
    /*
     * The least vacancy a hand needs to reach its catch, seconds.
     */
    vacancy: number;
  }

  /*
   * A pattern's times.
   */
  export interface ITiming {
    /*
     * The throw's flight, seconds.
     */
    flight: number;
    /*
     * How long a hand holds a ball, seconds.
     */
    dwell: number;
    /*
     * How long a hand is empty, seconds.
     */
    vacancy: number;
    /*
     * The least height whose vacancy is the least asked, metres.
     */
    least: number;
  }
}
