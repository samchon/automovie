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
 * @evidence contracts/common.md#principled-implementation Each side's span is the interval hull of every layer carrying the role, taken from each layer's ordered signed faces, and `overlap` is `min(max) - max(min)` of the two hulls, the one-dimensional interval intersection whose sign separates contact from a gap; the shared-axis premise is the caller's and is documented.
 * @evidence contracts/common.md#clear-and-simple-design Keeps both spans beside the derived `overlap` and `aligned`, so a caller can draw the junction or reapply a different tolerance without resolving either build-up again; the spans are inline `{min, max}` records because no other junction field reuses an interval type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The hull's ability to bridge a gap between non-adjacent layers of one role is stated in the comment rather than masked by splitting spans, and mismatched axes are neither detected nor corrected here.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that each span hulls every layer of the role and so can read aligned across an internal gap, that the spans compare only on one measuring line the matcher does not check, the metre unit and negative sign of `overlap`, and that `aligned` uses the caller's tolerance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape with no code; its min, max and overlap arithmetic is constant per role inside the matcher, which answers the traversal over both layer lists.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built fresh for each junction query from two resolved assemblies the caller already holds; no engine layer keys or stores continuity records between queries.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns two small span objects and three scalars by value, reachable only from the `continuous` list the caller receives.
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
