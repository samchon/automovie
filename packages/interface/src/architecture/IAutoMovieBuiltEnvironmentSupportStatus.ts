import type { IAutoMovieBuiltEnvironment } from "./IAutoMovieBuiltEnvironment";
import type { IAutoMovieBuiltSupportQuery } from "./IAutoMovieBuiltSupportQuery";

/** An authored bearing or suspension relation and the building that resolves its subjects. */
export namespace IAutoMovieBuiltEnvironmentSupportStatus {
  /**
   * An authored bearing or suspension relation and the building that resolves its subjects.
   * 
   * Bearing delegates to the prop placement kernel's two-sided footprint probes, so a small plinth under a wide member and a small member on a wide slab are the same measurement rather than two near-copies. A suspension is accepted only after both named sides resolve. The query is a deterministic visual placement check, not a structural load or safety analysis.
   * 
   * A negative or non-finite tolerance throws a `RangeError` rather than resolving to a default, because it does not narrow or widen what "touching" means, it withdraws the meaning: every distance would be outside a negative band, so the answer would be a confident `floating` or `sunk` for a member that rests exactly. An omitted tolerance is `AUTOMOVIE_SUPPORT_TOLERANCE`, `1e-9` metres.
   * 
   * Both bases travel with the verdict. A subject the record carries no vertices for is probed as its stated origin, so its gap is measured from that point rather than from an underside nobody declared, and `element-origin-point` is how the caller reads a `floating` answer as "the origin sits this high" instead of "this member hangs in the air".
   * 
   * A support surface bears on its footprint polygon and height rule, and one whose footprint encloses no area does not resolve. A support body bears on the top of the drawn part nearest the subject's underside among the parts its footprint covers; a subject over none of the parts is measured against one of them, which answers `not-over-support`, because the body's union box would claim the subject stands over a notch or the air beside a shelf. `gap` is the signed metre distance from that face to the subject's underside, null when unresolved, suspended, or not over the support, and `unresolved` names each side that did not resolve.
   * 
   * The delegated gap uses finite footprint and ring-corner probes. Thin overlaps or deeper relief between probes can be missed; box proxies and a resting verdict do not certify continuous mesh contact.
   *
   * @evidence contracts/development/design.md#principled-representation The shared support query carries its relation discriminant and optional metre tolerance; builtEnvironmentSupportStatus rejects negative or non-finite tolerance and defaults omission to 1e-9 metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The operation borrows existing environment and support-query contracts and reports their resolution bases with the verdict.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Suspension requires both sides to resolve but asserts no load capacity; bearing uses finite footprint probes and cannot certify continuous mesh contact.
   * @evidence contracts/development/common.md#meaningful-documentation An authored bearing or suspension relation and the building that resolves its subjects. The shared support query carries its relation discriminant and optional metre tolerance; builtEnvironmentSupportStatus rejects negative or non-finite tolerance and defaults omission to 1e-9 metres.
   */
  export type IProps = {
    /** Borrowed building world transforms, subject geometry and support surfaces. */
    environment: IAutoMovieBuiltEnvironment;

    /** Authored bearing/suspension relation with optional metre tolerance; unresolved sides remain explicit. */
    query: IAutoMovieBuiltSupportQuery;
  };
}
