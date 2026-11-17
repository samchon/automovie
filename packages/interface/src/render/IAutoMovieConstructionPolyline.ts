/**
 * Ordered generating polyline in model-local metres, published by support-loft
 * emission and recovery and borrowed by construction display. Closed paths omit
 * the repeated first point. buildAutoMovieConstruction additionally requires
 * unique nonempty ids, finite float32-representable coordinates and at least two
 * open or three closed points within its point budget; it draws supplied samples
 * without refitting. Emitted curves can share point tuples at common stations.
 *
 * @evidence contracts/development/design.md#principled-representation Closed paths omit the repeated first point; the builder draws supplied samples without refitting.
 * @evidence contracts/development/design.md#minimal-and-owned-surface buildAutoMovieConstruction exchanges id, closed, points; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed paths omit the repeated first point; the builder draws supplied samples without refitting.
 * @evidence contracts/development/common.md#meaningful-documentation Ordered generating polyline in model-local metres. buildAutoMovieConstruction requires unique nonempty ids, finite float32-representable coordinates and at least two open or three closed points within the caller's total point budget. The prose and members document how buildAutoMovieConstruction interprets and admits these values.
 */
export interface IAutoMovieConstructionPolyline {
  /** Nonempty unique line identity assigned to its rendered object. */
  id: string;
  /** Whether the final point connects to the first without a repeated endpoint. */
  closed: boolean;
  /** Ordered xyz model-local metre samples; array is borrowed read-only, individual tuples retain their existing mutable type. */
  points: readonly [number, number, number][];
}

/** Producer-owned mutable list view; point tuples may still be shared across curves. */
export namespace IAutoMovieConstructionPolyline {
  /**
   * Mutable construction publication from support-loft or recovery realization.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Preserves producer list mutation and warns that shared tuples need copying before independent edits.
   * @evidence contracts/development/design.md#principled-representation The base's id, implicit closure and model-metre coordinates are unchanged; only list capability is mutable.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Engine and recovery publish this view while render borrows the base contract.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Mutable lists do not promise unique point ownership or renderer-budget admission.
   */
  export interface IMutable extends IAutoMovieConstructionPolyline {
    /** Ordered model-local metre samples; copy shared tuples before independent edits. */
    points: [number, number, number][];
  }
}
