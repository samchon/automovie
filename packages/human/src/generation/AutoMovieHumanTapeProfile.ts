/** Positive tape keys joined without introducing another extremum. */
export namespace AutoMovieHumanTapeProfile {
  /** A physical station and its taut circumference, in millimetres. */
  export interface IKey {
    /** Distance along the part's station coordinate. */
    station: number;

    /** Positive convex-hull perimeter at the named station. */
    girth: number;
  }

  /**
   * A C2 monotone interpolation of each adjacent pair, held beyond its keys.
   * The quintic has zero first and second derivatives at both ends, so its
   * derivative has the sign of the keys' difference throughout an interval.
   */
  export function evaluate(keys: readonly IKey[], station: number): number {
    if (keys.length === 0) throw new Error("A tape profile needs a key");
    if (station <= keys[0]!.station) return keys[0]!.girth;
    for (let i: number = 1; i < keys.length; i++) {
      const b: IKey = keys[i]!;
      if (station > b.station) continue;
      const a: IKey = keys[i - 1]!;
      const t: number = (station - a.station) / (b.station - a.station);
      const w: number = t * t * t * (10 + t * (-15 + 6 * t));
      return a.girth + w * (b.girth - a.girth);
    }
    return keys[keys.length - 1]!.girth;
  }
}
