/** A finite saddle chart owned by its parent and child boundary rows. */
export namespace AutoMovieHumanWebDomain {
  /** Direct parameters of the crest-to-child curve and the pinch-to-crest lip. */
  export interface IPoint {
    /** Crest-to-child parameter in [0,1]. */
    own: number;
    /** Crest-to-pinch parameter in [0,1]. */
    lip: number;
  }

  /**
   * Map a saddle level x in [-1,1] and ring distance y>=0 onto finite boundary
   * curves. The square root of x+i*y gives u,v. Its values on the two boundary
   * rows are a,b in opposite order, so (u-a)/(b-a), (v-a)/(b-a) stay in [0,1].
   * Rationalized roots retain tiny distances without subtracting nearby values.
   */
  export function point(x: number, y: number): IPoint {
    const radius: number = Math.hypot(x, y);
    const border: number = Math.hypot(1, y);
    const a: number = y / Math.sqrt(2 * (border + 1));
    const b: number = Math.sqrt((border + 1) / 2);
    const u: number =
      x >= 0 ? Math.sqrt((radius + x) / 2) : y / Math.sqrt(2 * (radius - x));
    const v: number =
      x <= 0 ? Math.sqrt((radius - x) / 2) : y / Math.sqrt(2 * (radius + x));
    return { own: (u - a) / (b - a), lip: (v - a) / (b - a) };
  }
}
