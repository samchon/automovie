import type { AutoMovieBernsteinPolynomial64 } from "./AutoMovieBernsteinPolynomial64";

/**
   * Tensor coefficient rows used only to derive curve courses and first variations.
   *
   * @evidence contracts/development/design.md#principled-representation An outer-parameter array of corresponding vector Bernstein rows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   */
  export type AutoMovieBernsteinGrid64 = AutoMovieBernsteinPolynomial64[];
