import { type IAutoMovieSequenceRenderPlan, type IAutoMoviePlanSequenceRenderProps, type IAutoMovieSequenceRenderResult, type IAutoMovieSequenceRenderAdapters, type IAutoMovieSequenceRenderAndSeeResult, type IAutoMovieSequenceRenderAndSeeRequest, type IAutoMovieRenderChunkPlan, type IAutoMoviePlanChunkedSequenceRenderProps } from "@automovie/interface";
import { planSequenceRender as planSequenceRenderImplementation } from "../internal/planSequenceRender.js";
import { renderSequenceVideo as renderSequenceVideoImplementation } from "../internal/renderSequenceVideo.js";
import { renderSequenceAndSee as renderSequenceAndSeeImplementation } from "../internal/renderSequenceAndSee.js";
import { planChunkedSequenceRender as planChunkedSequenceRenderImplementation } from "../internal/planChunkedSequenceRender.js";

/** Public operations for Auto Movie Render Sequence. */
export namespace AutoMovieRenderSequence {
  /**
   * Build the render-layer manifest for a committed sequence. The output FPS is
   * controlled by the render spec; the cut's fps is preserved as editorial
   * metadata. Trim, playback-rate and transition arithmetic is delegated to the
   * engine playback timeline, then copied into the manifest so the capture host
   * has no hidden timing rules.
   */
  export function plan(props: IAutoMoviePlanSequenceRenderProps): IAutoMovieSequenceRenderPlan {
    return planSequenceRenderImplementation(props);
  }

  /**
   * Render a prepared sequence manifest: capture each resolved frame sample in
   * order, then encode the planned frame sequence with the planned ffmpeg args.
   * This is the sequence-level analogue of `renderVideo`, but the capture host
   * gets sequence semantics rather than only a clip-local second.
   */
  export function render(plan: IAutoMovieSequenceRenderPlan, adapters: IAutoMovieSequenceRenderAdapters): Promise<IAutoMovieSequenceRenderResult> {
    return renderSequenceVideoImplementation(plan, adapters);
  }

  /**
   * Build a sequence render manifest, execute it through host adapters, and
   * return an artifact an agent can inspect without recomputing the cut.
   */
  export function renderAndSee(request: IAutoMovieSequenceRenderAndSeeRequest): Promise<IAutoMovieSequenceRenderAndSeeResult> {
    return renderSequenceAndSeeImplementation(request);
  }

  /**
   * Split a `planSequenceRender` manifest into `chunkFrames`-sized, independently
   * renderable chunks and the plan to concatenate them.
   *
   * Chunks are frame-atomic: chunk `i` holds the whole plan's frames `[i *
   * chunkFrames, (i + 1) * chunkFrames)`, the last one clipped to the total. A
   * transition's blend is already baked into each frame's `blend`, so a
   * transition that straddles a boundary is split between frames with each frame
   * keeping its blend, and concatenating the chunks reproduces the whole render
   * frame for frame. Running chunks in parallel or on a farm is a host concern.
   * The plan holds every frame of the render; only capture and encoding are
   * bounded per chunk.
   *
   * When `passes` is given, every chunk also plans its per-pass frame paths
   * through `planGuidePassOutputs`, with chunk-local indices, and the plan gains
   * one {@link IAutoMovieRenderPassManifest} per pass. Omitting `passes` omits
   * every pass field; an empty list plans empty pass sets; an unknown pass name
   * throws before any chunk is built. Throws when `chunkFrames` is not a positive
   * integer.
   *
   * `planProductionRenderJob` partitions frames with the same arithmetic but a
   * different contract, restarting its index per deliverable and admitting only
   * safe integers, so the two do not share a helper.
   */
  export function planChunked(props: IAutoMoviePlanChunkedSequenceRenderProps): IAutoMovieRenderChunkPlan {
    return planChunkedSequenceRenderImplementation(props);
  }
}
