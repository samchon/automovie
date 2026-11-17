

/**
 * Ordered generating polyline in model-local metres. buildAutoMovieConstruction requires unique nonempty ids, finite float32-representable coordinates and at least two open or three closed points within the caller's total point budget. Closed paths omit the repeated first point; the builder draws supplied samples without refitting.
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
