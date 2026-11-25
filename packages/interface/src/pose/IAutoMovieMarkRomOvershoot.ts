import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Joint diagnostics read by markAutoMovieRomOvershoot without retaining or
 * modifying the input. Empty input yields no marks.
 */
export namespace IAutoMovieMarkRomOvershoot {
  /**
   * Turn joints' range-of-motion overshoot at one instant into flagged
   * inspection marks at the joints that exceed their range.
   *
   * Each entry is a joint's path, its world position in metres and its
   * overshoot in degrees, as `jointRomOvershoot` measures it. A joint with a
   * positive overshoot, or an unmeasurable one (`Infinity`), becomes one
   * flagged point of kind `rom`, label `range overshoot`, colour olive drab
   * `556b2f`, at path `<path>/rom`; a joint within its range draws nothing. The
   * mark is in world metres and unanchored.
   *
   * It throws for a position that is not finite or an overshoot that is
   * negative or NaN.
   */
  export type IEntries = readonly {
    /** Joint path prefix; /rom is appended to identify its inspection mark. */
    path: string;
    /**
     * World joint position in metres; the mark producer rejects nonfinite
     * components.
     */
    at: IAutoMovieVector3;
    /**
     * ROM excess in degrees, nonnegative or positive Infinity for unmeasurable
     * ROM. Zero draws nothing; negative values and NaN throw.
     */
    overshoot: number;
  }[];
}
