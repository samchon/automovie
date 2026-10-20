import { IAutoMovieSemanticMaskEntry } from "./IAutoMovieSemanticMaskEntry";
import { IAutoMovieSemanticMaskGap } from "./IAutoMovieSemanticMaskGap";

/**
 * A segmentation palette keyed by stable semantic identity, plus the sidecar that reads a rendered color back to the thing it named.
 *
 * Allocation hashes semantic ids and processes the complete id population in code-unit order with deterministic forward probing. Scene ordering does not change the palette; adding a colliding earlier id can shift an existing color along the probe chain, so allocation is not a pure function of one id alone.
 *
 * Entries and bounded gaps describe logical hierarchy and drawable ownership. The canonical payload digest seals those supplied records; it does not establish scene visibility or capture provenance.
 *
 * Derivation requires admitted subject ids, references and non-negative integer instance counts. Runtime verification checks the current protocol, exact record keys and collection containers before recomputing the digest; it does not independently validate scalar values, uniqueness, ownership links or the palette allocation algorithm. A self-consistent externally supplied payload therefore needs a trusted derivation owner as well as digest verification.
 *
 * Palette colors are exact RGB24 values with black reserved for background. Actual PNG recovery additionally depends on the rendering pass, color conversion, antialiasing and pixel position; this palette alone guarantees neither exact GPU edges nor byte-identical images across hosts.
 *
 * @evidence contracts/common.md#principled-implementation Semantic palette derives non-background RGB24 colors from stable ids, processes collision claims in code-unit id order with deterministic forward probing and seals the full entries and bounded-gap payload by digest.
 * @evidence contracts/common.md#clear-and-simple-design Entries join semantic hierarchy to drawable node or slot identity while unaddressed records expose bounded per-slot gaps rather than silently losing the logical instance-set address.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Scene reordering preserves palette identity, but adding a genuinely colliding earlier id can shift an existing color; allocation is not universally insertion-invariant, and capacity overflow or duplicate semantic claims refuse.
 * @evidence contracts/common.md#meaningful-documentation Defines versioned palette, reserved black background, exact RGB representation, sorted entries, bounded slot gaps and complete canonical digest coverage.
 */
export interface IAutoMovieSemanticMask {
  /** Mask format. */
  version: 2;

  /** Versioned palette-derivation protocol. */
  protocol: "automovie.semantic-mask.v2";

  /** Reserved background colour, never assigned to an entry. */
  background: "#000000";

  /** Entries in ascending semantic-id order. */
  entries: IAutoMovieSemanticMaskEntry[];

  /**
   * Instance sets whose per-slot colours were not allocated, and why.
   *
   * A mask is bounded evidence: it cannot carry one entry per slot for an arbitrarily large instanced set. A set listed here is still addressable as a whole through its `instance-set` entry; only per-slot identity is absent, and it is reported rather than quietly approximated.
   */
  unaddressed: IAutoMovieSemanticMaskGap[];

  /**
   * Digest over the complete canonical versioned payload except this field. It therefore seals background, every entry field, and every bounded gap.
   */
  digest: string;
}
