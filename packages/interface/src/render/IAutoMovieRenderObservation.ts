/**
 * Renderer-observed cost of one already drawn frame.
 *
 * This record carries measurements only. It does not choose a budget, infer a renderer, or decide whether a production passes. A `null` field means that the renderer cannot report that dimension for this frame; it must remain unchecked instead of being approximated from scene membership.
 *
 * @evidence contracts/common.md#principled-implementation The viewer frame observer brackets complete drawing with renderer.info reset disabled and reports renderer-confirmed calls and triangles after culling, layers, groups and draw ranges; other dimensions currently remain null.
 * @evidence contracts/common.md#clear-and-simple-design Nullable measurements distinguish observed facts from unsupported per-frame statistics, leaving budget selection and inventory-bound comparison to the render audit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Scene membership and process-wide allocation counts cannot substitute for post-culling frame observations; null is unchecked rather than zero agreement.
 * @evidence contracts/common.md#meaningful-documentation Defines already-drawn-frame measurements, nullable unreported dimensions and separation from budget verdicts and preflight estimates.
 * @author Samchon
 */
export interface IAutoMovieRenderObservation {
  /** Rendered mesh count. */
  meshes: number | null;

  /** Submitted draw-call count. */
  drawCalls: number | null;

  /** Rendered triangle count. */
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
