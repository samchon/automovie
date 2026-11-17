/**
 * The lips' contact line the jaw's skin is cut along, metres.
 *
 * @evidence contracts/common.md#meaningful-documentation States each field's unit and frame.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The lips' contact line the jaw's skin is cut along, metres.
 * @evidence contracts/development/design.md#principled-representation `contact`: Contact line's height at shares 0, 1/16 .. `width`: Half width, midline to cheilion. `wide`: Height away from the contact line over which a crossing share fades, over the cheek.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBindingLips is the canonical exchange used by IAutoMovieHumanBindingInputs.IInputs, IAutoMovieHumanBindingLimb.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `contact`, `width`, `wide`; callers supply the complete record.
 */
export interface IAutoMovieHumanBindingLips {
  /** Contact line's height at shares 0, 1/16 .. 1 of the half width. */
  contact: number[];

  /** Half width, midline to cheilion. */
  width: number;

  /** Height away from the contact line over which a crossing share fades, over the cheek. */
  wide: number;
}
