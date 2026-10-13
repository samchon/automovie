import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic broad-phase answer for two named building bodies.
 *
 * An element operand is tested as its drawn part boxes, or as its resolved box
 * when it draws one part or none; a population is tested as its one placement
 * envelope. Boxes that only touch on a face do not overlap.
 *
 * @evidence contracts/common.md#principled-implementation `builtEnvironmentPlacementOverlap` resolves both locators and then tests every part box of one operand against every part box of the other with a strict positive-volume axis-aligned test.
 * @evidence contracts/common.md#clear-and-simple-design The basis fields use the full basis union although a body locator can never yield `surface-height-rule`; the `Exclude` the bounds type uses would state that more precisely.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No body kind is special-cased in the verdict, but the part-box selection rule is copied into this function and both sweeps instead of shared, the duplication the engine's own comment warns against.
 * @evidence contracts/common.md#meaningful-documentation States what each operand is tested as, that face contact is not overlap, which operands were unresolved, and what a null basis means.
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementOverlapResult {
  /** Whether the resolved operands share positive volume. */
  status: "overlapping" | "separate" | "unresolved";

  /** Unresolved operands, empty when overlap was measured. */
  unresolved: ("left" | "right")[];

  /** Left operand's measurement basis, or null when unresolved. */
  leftBasis: AutoMovieBuiltPlacementBasis | null;

  /** Right operand's measurement basis, or null when unresolved. */
  rightBasis: AutoMovieBuiltPlacementBasis | null;
}
