import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Per-contact displacement measurements converted to world inspection marks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Per-contact displacement measurements converted to world inspection marks. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation World metre endpoint pairs and horizontal limits define contact displacement at one instant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Slip-mark conversion shares the canonical mark representation with inspection consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The measured XZ threshold is caller data and does not repair the contact motion.
 */
export namespace IAutoMovieMarkSlip {
  /**
   * Borrowed contacts at one instant for markAutoMovieSlip. Horizontal XZ displacement above zero yields one unanchored steel-blue (0x4682b4) segment mark in entry order, with kind/label "slip" and path ending "/slip". Displacement strictly greater than limit is flagged; purely vertical motion yields no mark.
   *
   * Every point component must be finite and each limit finite and nonnegative or the producer throws. Coordinates are copied into fresh numeric segment arrays, so successful output retains no point records and inputs stay unchanged. Finite endpoints do not independently guarantee finite subtraction at extreme magnitudes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines frame/plane, thresholds, mark encoding, ownership and refusal.
   * @evidence contracts/development/design.md#principled-representation Planted/current world metre points and a metre threshold express the same horizontal quantity that planted-foot skate validation bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Inspection callers supply measured contacts and reuse canonical marks instead of a second contact visualization representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each authored limit decides its own flag; no named contact, guessed tolerance or automatic correction changes the measurement.
   */
  export type IEntries = readonly {
    /** Contact's diagnostic identity; "/slip" is appended literally, without validation or normalization. */
    path: string;

    /** World point in metres where the contact was planted, copied into the segment start. */
    planted: IAutoMovieVector3;

    /** Current world point in metres, copied into the segment end. */
    at: IAutoMovieVector3;

    /** Finite nonnegative allowed XZ displacement in metres; equality remains unflagged. */
    limit: number;
  }[];
}
