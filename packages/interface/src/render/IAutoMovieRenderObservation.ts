/**
 * Renderer-observed cost of one already drawn frame.
 *
 * This record carries measurements only. It does not choose a budget, infer a
 * renderer, or decide whether a production passes. A `null` field means that
 * the renderer cannot report that dimension for this frame; it must remain
 * unchecked instead of being approximated from scene membership.
 */
export interface IAutoMovieRenderObservation {
  /** Rendered mesh count. */
  meshes: number | null;

  /** Submitted draw-call count. */
  drawCalls: number | null;

  /**
   * Submitted triangle count, including repeated source, shadow or composite
   * work recorded during the observed draw scope.
   */
  triangles: number | null;

  /** Distinct material count. */
  materials: number | null;

  /** Distinct texture count. */
  textures: number | null;

  /** Active light count. */
  lights: number | null;

  /** Active shadow-map count. */
  shadowMaps: number | null;

  /** Addressed instance-slot count. */
  instanceSlots: number | null;
}
