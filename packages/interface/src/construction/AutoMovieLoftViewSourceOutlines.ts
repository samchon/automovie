import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";

/**
 * Four prepared scalar outlines in the caller's declared cyclic quarter or guide order.
 *
 * View-source extent and fullness owners use +u, +v, -u, -v order. A containing field determines whether values are chart millimetres or dimensionless shoulder shares; this tuple alone performs no admission. Preparations are reused by station readers and must remain unchanged during that lifetime.
 *
 * @evidence contracts/development/design.md#principled-representation Fixed four-entry order preserves correspondence between the signed guides and quarter laws.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Extents, shoulders, departures and touch owners reuse one ordered preparation container while retaining their distinct units at the containing field.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Four matching element types do not make these values interchangeable with split tuples, whose four positions mean different quantities.
 * @evidence contracts/development/common.md#meaningful-documentation States cyclic order, field-owned units and borrowed immutable preparation lifetime.
 */
export type AutoMovieLoftViewSourceOutlines = readonly [
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
];
