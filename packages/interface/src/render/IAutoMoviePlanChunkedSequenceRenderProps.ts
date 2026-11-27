import type { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec";
import type { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan";

/**
 * Whole-sequence manifest and independent chunk encoding controls.
 * planChunkedSequenceRender validates a positive integer chunkFrames; matching
 * target and output frame format are caller premises, not independently
 * revalidated. Frame intervals are half-open; output timestamps remain global
 * while file indices restart within each chunk. Missing passes omits pass
 * manifests.
 */
export interface IAutoMoviePlanChunkedSequenceRenderProps {
  /** The whole-sequence render manifest to split. */
  plan: IAutoMovieSequenceRenderPlan;

  /**
   * Render spec for each chunk's encoder arguments; its target matches the
   * plan.
   */
  spec: IAutoMovieRenderSpec;

  /** Output frames per chunk, a positive integer. */
  chunkFrames: number;

  /** Guide passes to plan per chunk; omit for a beauty-only render. */
  passes?: readonly string[];
}
