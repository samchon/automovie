import type { IAutoMovieBuiltEnvironment } from "./IAutoMovieBuiltEnvironment";
import type { IAutoMovieBuiltSupportQuery } from "./IAutoMovieBuiltSupportQuery";

/**
 * An authored bearing or suspension relation and the building that resolves its
 * subjects.
 */
export namespace IAutoMovieBuiltEnvironmentSupportStatus {
  /**
   * An authored bearing or suspension relation and the building that resolves
   * its subjects.
   *
   * Bearing delegates to the prop placement kernel's two-sided footprint
   * probes, so a small plinth under a wide member and a small member on a wide
   * slab are the same measurement rather than two near-copies. A suspension is
   * accepted only after both named sides resolve. The query is a deterministic
   * visual placement check, not a structural load or safety analysis.
   *
   * A negative or non-finite tolerance throws a `RangeError` rather than
   * resolving to a default, because it does not narrow or widen what "touching"
   * means, it withdraws the meaning: every distance would be outside a negative
   * band, so the answer would be a confident `floating` or `sunk` for a member
   * that rests exactly. An omitted tolerance is `AutoMovieEngineSupportTolerance`,
   * `1e-9` metres.
   *
   * Both bases travel with the verdict. A subject the record carries no
   * vertices for is probed as its stated origin, so its gap is measured from
   * that point rather than from an underside nobody declared, and
   * `element-origin-point` is how the caller reads a `floating` answer as "the
   * origin sits this high" instead of "this member hangs in the air".
   *
   * A support surface bears on its footprint polygon and height rule, and one
   * whose footprint encloses no area does not resolve. A support body bears on
   * the top of the drawn part nearest the subject's underside among the parts
   * its footprint covers; a subject over none of the parts is measured against
   * one of them, which answers `not-over-support`, because the body's union box
   * would claim the subject stands over a notch or the air beside a shelf.
   * `gap` is the signed metre distance from that face to the subject's
   * underside, null when unresolved, suspended, or not over the support, and
   * `unresolved` names each side that did not resolve.
   *
   * The delegated gap uses finite footprint and ring-corner probes. Thin
   * overlaps or deeper relief between probes can be missed; box proxies and a
   * resting verdict do not certify continuous mesh contact.
   */
  export type IProps = {
    /**
     * Borrowed building world transforms, subject geometry and support
     * surfaces.
     */
    environment: IAutoMovieBuiltEnvironment;

    /**
     * Authored bearing/suspension relation with optional metre tolerance;
     * unresolved sides remain explicit.
     */
    query: IAutoMovieBuiltSupportQuery;
  };
}
