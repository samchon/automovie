/**
 * A smooth displacement along one coordinate whose rate of stretch is set
 * per interval: `D(y) = integral of (lambda(t) - 1) dt` from a fixed start,
 * `lambda` piecewise constant between breakpoints with every step blended
 * by a smoothstep of half-width {@link IStretch.blend}, so `D` is C1 and
 * the stretched coordinate `y + D(y)` has the continuous rate `lambda`.
 *
 * The shape law uses it for lengths measured along a column: the neck and
 * the lower face along the height, and the upper and lower arm along the
 * arm's own stations. The integral is tabulated at {@link STEP} mm by the
 * trapezoid rule, exact for the linear pieces and within `STEP^2 / 12`
 * times the blend's second derivative elsewhere.
 */
export namespace AutoMovieHumanStretchProfile {
  /** One stretched interval. */
  export interface IPiece {
    /** Interval start, the lower coordinate. */
    from: number;

    /** Interval end, the higher coordinate. */
    to: number;

    /** Stretch rate inside the interval; 1 leaves it unchanged. */
    rate: number;
  }

  /** A stretch along one coordinate. */
  export interface IStretch {
    /** Coordinate where the displacement is zero. */
    anchor: number;

    /** Stretched intervals; outside them the rate is 1. */
    pieces: IPiece[];

    /** Half-width of every rate step's blend, mm. */
    blend: number;
  }

  /** An evaluated stretch. */
  export interface IProfile {
    /** Displacement at a coordinate, mm. */
    displacement: (y: number) => number;

    /** Stretch rate at a coordinate, `1 + dD/dy`. */
    rate: (y: number) => number;
  }

  /**
   * Tabulate a stretch over a range.
   *
   * @param stretch Pieces, anchor and blend.
   * @param lo Lowest coordinate evaluated; below it the displacement is held.
   * @param hi Highest coordinate evaluated; above it the displacement is held.
   */
  export function create(stretch: IStretch, lo: number, hi: number): IProfile {
    const rate: (y: number) => number = (y: number): number => {
      let r: number = 1;
      for (const p of stretch.pieces)
        r +=
          (p.rate - 1) *
          step((y - p.from) / stretch.blend) *
          step((p.to - y) / stretch.blend);
      return r;
    };
    const n: number = Math.max(1, Math.ceil((hi - lo) / STEP));
    const h: number = (hi - lo) / n;
    const table: number[] = [0];
    for (let i: number = 1; i <= n; i++) {
      const a: number = lo + (i - 1) * h;
      table.push(table[i - 1]! + (h * (rate(a) - 1 + rate(a + h) - 1)) / 2);
    }
    const raw: (y: number) => number = (y: number): number => {
      const t: number = Math.min(n, Math.max(0, (y - lo) / h));
      const i: number = Math.min(n - 1, Math.floor(t));
      return table[i]! + (t - i) * (table[i + 1]! - table[i]!);
    };
    const offset: number = raw(stretch.anchor);
    return {
      displacement: (y: number): number => raw(y) - offset,
      rate: (y: number): number => (y < lo || y > hi ? 1 : rate(y)),
    };
  }
}

/** Tabulation step, mm. */
const STEP: number = 0.25;

/** Smoothstep from 0 at x = -1 to 1 at x = 1. */
function step(x: number): number {
  const t: number = Math.min(1, Math.max(0, (x + 1) / 2));
  return t * t * (3 - 2 * t);
}
