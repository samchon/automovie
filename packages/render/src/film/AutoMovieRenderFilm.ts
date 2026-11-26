import { type IAutoMovieProductionRenderJobPlan, type IAutoMoviePlanProductionRenderJobProps, type IAutoMovieProductionDesign, type IAutoMovieProductionRenderTier, type AutoMovieOrderedScalar } from "@automovie/interface";
import { planProductionRenderJob as planProductionRenderJobImplementation } from "./internal/planProductionRenderJob.js";
import { resolveProductionRenderTierFrameFormat as resolveProductionRenderTierFrameFormatImplementation } from "./internal/resolveProductionRenderTierFrameFormat.js";
import { equalOrderedScalarRows as equalOrderedScalarRowsImplementation } from "./internal/equalOrderedScalarRows.js";
import { equalOrderedScalars as equalOrderedScalarsImplementation } from "./internal/equalOrderedScalars.js";

/** Public operations for Auto Movie Render Film. */
export namespace AutoMovieRenderFilm {
  /**
   * Plan the content-addressed render chunks and publication tracks of one
   * production edit at one tier.
   *
   * The tier, which defaults to final, decimates the timeline by `frameStep` and
   * projects the raster; output frames are partitioned into ranges of at most
   * `chunkFrames`, and every feature and guide-pass deliverable gets one chunk
   * per range, in declaration order. A feature renders `beauty`; a guide-pass
   * deliverable renders its declared `pass`, or, for a legacy record without one,
   * the single pass in `guidePasses`, which defaults to `pose`. Each chunk id
   * digests the edit, effect digests, tier, frame formats, range, pass, runtime
   * identity and the source digest of every shot the range shows.
   *
   * Throws when `chunkFrames` is not a positive safe integer; a runtime, compile
   * or source digest is malformed or missing; the tier is inadmissible or its
   * raster is odd; the timeline's id, frame rate or runtime differs from the
   * production's, or its length is not a multiple of `frameStep`; the effect
   * runtimes are not exactly the timeline's current population for this
   * production, as an `AutoMovieFilmEffectRuntimeError`; an audio asset is
   * invalid or a cue's asset is missing or holds another sample count; or a guide
   * pass is unknown or not single. The inputs are not changed.
   *
   * Current maintained callers are planner tests. This function does not execute
   * a render, authenticate supplied runtime or source digests, or establish
   * stored-plan currentness for an application scheduler.
   */
  export function planProductionJob(props: IAutoMoviePlanProductionRenderJobProps): IAutoMovieProductionRenderJobPlan {
    return planProductionRenderJobImplementation(props);
  }

  /**
   * Project a production's frame format through a render tier.
   *
   * The final tier returns a copy of the source unchanged. A proxy scales width
   * and height by `resolutionScale`, rounding each down to an even pixel count of
   * at least 2, divides the exact frame rate by `frameStep` and reduces it, sets
   * `fps` to that rate's decimal value, and keeps the color space and crop.
   * Throws when the tier is not admissible under `normalizeRenderTier` or the
   * source frame rate is invalid on the proxy branch. Final returns the source
   * copy before rate resolution and performs no raster or rate admission.
   */
  export function resolveTierFrameFormat(source: IAutoMovieProductionDesign["frameFormat"], tier: IAutoMovieProductionRenderTier): IAutoMovieProductionDesign["frameFormat"] {
    return resolveProductionRenderTierFrameFormatImplementation(source, tier);
  }

  /**
   * Compare two ordered lists of scalar rows by value, such as a downmix matrix
   * `[[0.5, 0.5]]`: equal when they have as many rows and each row pair is equal
   * by {@link equalOrderedScalars}.
   *
   * @param left One list of rows.
   * @param right The other.
   * @returns Whether they hold equal rows in the same order.
   */
  export function equalOrderedScalarRows(left: readonly (readonly AutoMovieOrderedScalar[])[], right: readonly (readonly AutoMovieOrderedScalar[])[]): boolean {
    return equalOrderedScalarRowsImplementation(left, right);
  }

  /**
   * Compare two ordered lists of scalars by value, such as speaker-label lists
   * `["front-left", "front-right"]`: equal when they have the same length and
   * every position holds the same scalar by `Object.is`, so the scalar's type
   * counts, `NaN` equals `NaN` and `+0` differs from `-0`.
   *
   * @param left One list.
   * @param right The other.
   * @returns Whether they hold the same scalars in the same order.
   */
  export function equalOrderedScalars(left: readonly AutoMovieOrderedScalar[], right: readonly AutoMovieOrderedScalar[]): boolean {
    return equalOrderedScalarsImplementation(left, right);
  }
}
