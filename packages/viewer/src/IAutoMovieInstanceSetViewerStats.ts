import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * Bounded viewer accounting for one general instance set.
 *
 * @author Samchon
 */
export interface IAutoMovieInstanceSetViewerStats {
  /** Slots currently drawn by automatic LOD tier. */
  visible: Record<IAutoMovieCompiledFormationLod["tier"], number>;

  /** Slots rejected by chunk-frustum culling. */
  culled: number;

  /** Slots intentionally hidden by authored or seeded visibility. */
  hidden: number;
}
