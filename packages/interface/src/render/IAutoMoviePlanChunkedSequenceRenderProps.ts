import type { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec.js";
import type { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan.js";

/**
 * Whole-sequence manifest and independent chunk encoding controls. planChunkedSequenceRender validates a positive integer chunkFrames; matching target and output frame format are caller premises, not independently revalidated. Frame intervals are half-open; output timestamps remain global while file indices restart within each chunk. Missing passes omits pass manifests.
 *
 * @evidence contracts/development/design.md#principled-representation Frame intervals are half-open; output timestamps remain global while file indices restart within each chunk.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planChunkedSequenceRender exchanges plan, spec, chunkFrames, passes; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing passes omits pass manifests.
 * @evidence contracts/development/common.md#meaningful-documentation Whole-sequence manifest and independent chunk encoding controls. planChunkedSequenceRender validates a positive integer chunkFrames; matching target and output frame format are caller premises, not independently revalidated. The prose and members document how planChunkedSequenceRender interprets and admits these values.
 */
export interface IAutoMoviePlanChunkedSequenceRenderProps {
  /** The whole-sequence render manifest to split. */
  plan: IAutoMovieSequenceRenderPlan;

  /** Render spec for each chunk's encoder arguments; its target matches the plan. */
  spec: IAutoMovieRenderSpec;

  /** Output frames per chunk, a positive integer. */
  chunkFrames: number;

  /** Guide passes to plan per chunk; omit for a beauty-only render. */
  passes?: readonly string[];
}
