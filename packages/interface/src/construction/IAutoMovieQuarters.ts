import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * The four ordered support directions and their corresponding source-quarter records.
 *
 * @evidence contracts/development/design.md#principled-representation The alias preserves ViewPart's four-tuple ordered +u,+v,-u,-v, with T representing the existing per-quarter scalar or guide value.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ViewPart owns quarter ordering; ViewSection reuses it for extents, shoulders and guide jets.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Tuple arity fixes four directions, while each value's physical validity belongs to its native source admission.
 * @evidence contracts/development/common.md#meaningful-documentation Names the canonical quarter order and per-entry ownership.
 */
export type IAutoMovieQuarters<T> = IAutoMovieViewPart.IQuarters<T>;
