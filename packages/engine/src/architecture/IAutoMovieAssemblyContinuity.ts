/**
 * One construction role carried through a junction by both build-ups.
 *
 * Produced by `matchAutoMovieAssemblyJunction`. Each span is the hull of every
 * layer of the role on that side's signed measuring line, so a role split over
 * non-adjacent layers spans the layers between them too and can read aligned
 * where its own layers leave a gap. The two spans are comparable only when the
 * caller resolved both assemblies on one measuring line; the matcher does not
 * check their axes.
 *
 * @author Samchon
 */
export interface IAutoMovieAssemblyContinuity {
  /** The role both sides declare. */
  role: string;

  /** Signed span the role occupies on the left build-up. */
  left: {
    /** Lowest signed coordinate. */
    min: number;

    /** Highest signed coordinate. */
    max: number;
  };

  /** Signed span the role occupies on the right build-up. */
  right: {
    /** Lowest signed coordinate. */
    min: number;

    /** Highest signed coordinate. */
    max: number;
  };

  /** Shared signed length in metres; negative states the gap between spans. */
  overlap: number;

  /** Whether the two spans meet or overlap within the caller's tolerance. */
  aligned: boolean;
}
