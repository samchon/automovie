/** Result of inverting one local coordinate of an original native section. */
export namespace IAutoMovieNativeCoordinate {
  /**
   * Original native section point after inverting a chosen coordinate on its
   * declared monotone half. The point and residual are in local millimetres.
   * The accepted absolute residual is at most 32 × Number.EPSILON × max(1,
   * absolute target, absolute extents). Endpoint matches use zero midpoint
   * queries; interior search uses at most 64. The owner throws when the target
   * is unreachable or its residual fails admission.
   */
  export interface IResult {
    /**
     * Original polar phase in radians on the selected half. When solving
     * component 1, positive and negative halves span [−π/2, π/2] and [π/2,
     * 3π/2]. When solving component 0, they span [0, π] and [π, 2π].
     */
    phase: number;

    /** Fresh local [u, v] point in millimetres at the returned native phase. */
    point: [number, number];

    /** Returned point's selected coordinate minus the target, in millimetres. */
    residual: number;

    /**
     * Number of midpoint evaluations across this search. The endpoint
     * evaluations are excluded, and an exact endpoint result uses zero.
     */
    iterations: number;
  }
}
