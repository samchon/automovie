import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/**
 * Saved-event admission results consumed by contour document preparation.
 *
 * @evidence contracts/development/design.md#principled-representation Admitted event records stay aligned with optional local reasons in original input order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This namespace owns the admission result used to build the prepared contour document.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Local refusal preserves saved addresses without inventing incidence.
 * @evidence contracts/development/common.md#meaningful-documentation IResult specifies copying, alignment and global versus local refusal.
 */
export namespace IAutoMovieAdmitContourEvents64 {
  /**
   * Copied saved events and aligned local admission failures.
   * A missing saved bracket cannot be located and refuses globally. Within a known
   * bracket, invalid terminals, coordinates, incidence or names remain local reasons;
   * no replacement terminal, contour association or critical coordinate is inferred.
   * Duplicate names quarantine every participant rather than selecting one owner.
   *
   * @evidence contracts/development/design.md#principled-representation The parallel reason array distinguishes locally unsupported records from supported records without discarding their addressable saved brackets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface admitAutoMovieContourEvents64 produces this pair for prepareAutoMovieContourDocument64 to preserve authored events and map working incidence.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Invalid incidence is removed with a reason; no replacement contour or terminal is inferred.
   * @evidence contracts/development/common.md#meaningful-documentation Defines input-order alignment, copied storage, usable incidence and the distinction between local reasons and globally invalid brackets.
   */
  export type IResult = {
    /** New records in input order, including unsupported events. Incidence arrays contain only unique valid local loop ordinals; finite terminal triples are cloned and unusable terminals become null. */
    events: IAutoMovieContourLoft64.IEvent[];

    /** One entry per events record. Undefined means admission found no local defect; a string combines all local reasons and does not imply the event was omitted from events. */
    unsupported: (string | undefined)[];
  };
}
