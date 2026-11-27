import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/** Bounded viewer accounting for one general instance set. */
export interface IAutoMovieRenderInstanceSetViewerStats {
  /**
   * Slots assigned to currently visible batches by automatic LOD tier, without
   * measuring native submissions or pixels.
   */
  visible: Record<IAutoMovieCompiledFormationLod["tier"], number>;

  /** Slots rejected by chunk-frustum culling. */
  culled: number;

  /** Slots intentionally hidden by authored or seeded visibility. */
  hidden: number;
}
