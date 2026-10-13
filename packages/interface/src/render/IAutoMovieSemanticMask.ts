import { IAutoMovieSemanticMaskEntry } from "./IAutoMovieSemanticMaskEntry";
import { IAutoMovieSemanticMaskGap } from "./IAutoMovieSemanticMaskGap";

/**
 * A segmentation palette keyed by stable semantic identity, plus the sidecar that reads a rendered color back to the thing it named.
 *
 * The mask pass this replaces coloured the Nth top-level scene child with the Nth colour of a golden-angle ramp. Two things were wrong with that, and both are why a mask could not be used as evidence. A whole building collapsed into one colour, so a room, a wall, an opening and a repeated window slot were indistinguishable in the very image that exists to distinguish them. And the colour was an ARRAY INDEX, so inserting an unrelated node ahead of a building repainted the building: two masks of the same design disagreed about what they had segmented, and neither was wrong.
 *
 * Here a colour is a pure function of the entity's stable semantic id. Scene order, insertion order, and the presence of unrelated entities do not enter the derivation, so reordering the scene reproduces a byte-identical mask and adding a non-colliding node leaves every existing colour untouched. Two ids that hash to the same colour are separated deterministically by comparing the ids themselves rather than by scene position. A newly added colliding earlier id can shift existing colors along the probe chain.
 *
 * The palette is exact 8-bit-per-channel RGB, so a PNG readback recovers the authored value with no tolerance, and `#000000` is reserved for background and never assigned.
 *
 * @evidence contracts/common.md#principled-implementation Semantic palette derives non-background RGB24 colors from stable ids, processes collision claims in code-unit id order with deterministic forward probing and seals the full entries and bounded-gap payload by digest.
 * @evidence contracts/common.md#clear-and-simple-design Entries join semantic hierarchy to drawable node or slot identity while unaddressed records expose bounded per-slot gaps rather than silently losing the logical instance-set address.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Scene reordering preserves palette identity, but adding a genuinely colliding earlier id can shift an existing color; allocation is not universally insertion-invariant, and capacity overflow or duplicate semantic claims refuse.
 * @evidence contracts/common.md#meaningful-documentation Defines versioned palette, reserved black background, exact RGB representation, sorted entries, bounded slot gaps and complete canonical digest coverage.
 * @author Samchon
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
