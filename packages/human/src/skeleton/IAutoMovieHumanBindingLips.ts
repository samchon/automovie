/**
 * The lips' contact line the jaw's skin is cut along, metres.
 *
 * @evidence contracts/common.md#meaningful-documentation States each field's unit and frame.
 */
export interface IAutoMovieHumanBindingLips {
  /** Contact line's height at shares 0, 1/16 .. 1 of the half width. */
  contact: number[];

  /** Half width, midline to cheilion. */
  width: number;

  /** Height away from the contact line over which a crossing share fades, over the cheek. */
  wide: number;
}
