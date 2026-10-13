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
 * @evidence contracts/common.md#principled-implementation Each side's span is the min/max hull over the role's resolved layers, and `overlap` is the interval intersection length `min(max) - max(min)`, negative when the spans are apart; `aligned` is `overlap >= -tolerance`.
 * @evidence contracts/common.md#clear-and-simple-design Keeps both raw spans beside the derived overlap and flag, so a caller can re-judge alignment at another tolerance without resolving the assemblies again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every role is judged against the one caller tolerance; the hull premise means a role interrupted by another layer reads as one span, and this record does not flag that case.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the signed measuring-line frame, the overlap sign convention, where the tolerance comes from, and the hull and shared-line limitations.
 * @evidenceExclude contracts/performance.md#cost-and-resources Two fresh span objects and three scalars computed in constant time from spans the matcher already folded; nothing is cached across junction queries.
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
