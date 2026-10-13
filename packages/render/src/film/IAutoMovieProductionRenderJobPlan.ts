import type {
  AutoMovieContentDigest,
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionDesign,
} from "@automovie/interface";

import type { IAutoMovieProductionAudioAssetIdentity } from "./IAutoMovieProductionAudioAssetIdentity";
import type { IAutoMovieProductionRenderChunk } from "./IAutoMovieProductionRenderChunk";
import type { IAutoMovieProductionRenderRuntimeIdentity } from "./IAutoMovieProductionRenderRuntimeIdentity";
import type { IAutoMovieProductionRenderTier } from "./IAutoMovieProductionRenderTier";

/**
 * The persisted render job for one production edit at one tier: every chunk to
 * render and every non-video track publication needs.
 *
 * `planProductionRenderJob` builds it from the builder-owned timeline and
 * inputs, and production's `verifyProductionRenderJobPlan` proves a stored
 * plan current by rebuilding it and comparing canonical JSON. Proxy and final
 * plans of one edit share `editFingerprint` and differ in `tier`,
 * `frameFormat`, `totalFrames` and their chunks.
 *
 * @evidence contracts/common.md#principled-implementation The plan is a pure function of its inputs, so currentness is decided by recomputation and canonical-JSON equality rather than by trusting stored fields, and the version literal changes whenever that function's output shape changes.
 * @evidence contracts/common.md#clear-and-simple-design The plan holds the identities, the tier and its projected frame format, the chunks, and the non-video tracks publication needs, so a render subcommand reads one record instead of recompiling the timeline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is a cached measurement or special case; every value is copied or derived from the edit and declared inputs, and `version` is the one contract-defined constant.
 * @evidence contracts/common.md#meaningful-documentation The doc names the producer and the verifier, how proxy and final plans relate, and each member states its source, unit or ordering, including that frame counts are tier output frames.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The plan record is the output of planning rather than a procedure, and the cost of filling its chunks, frames and tracks is counted on `planProductionRenderJob`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates nothing itself; reuse of completed chunks is decided by their ids, which `IAutoMovieProductionRenderChunk` documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds no handle or task; its size grows with chunk and frame count and it lives as long as its holder keeps it.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderJobPlan {
  /** Plan schema version. */
  version: 4;

  /** Production id, which namespaces every slot and output path. */
  productionId: string;

  /** The timeline's compiler input fingerprint, shared by every capture. */
  compileFingerprint: AutoMovieContentDigest;

  /** Digest of the builder-owned film edit, equal for proxy and final. */
  editFingerprint: AutoMovieContentDigest;

  /** Capture and encoder identity every chunk renders under. */
  runtimeIdentity: IAutoMovieProductionRenderRuntimeIdentity;

  /** Proxy or final tier; final is scale one and step one. */
  tier: IAutoMovieProductionRenderTier;

  /** The production's own full-quality raster and frame clock. */
  sourceFrameFormat: IAutoMovieProductionDesign["frameFormat"];

  /** Raster and frame clock of the tier output, projected from the source. */
  frameFormat: IAutoMovieProductionDesign["frameFormat"];

  /** Number of tier output frames, the timeline length divided by the step. */
  totalFrames: number;

  /** Maximum number of output frames in one chunk; a positive safe integer. */
  chunkFrames: number;

  /**
   * Chunks in deliverable declaration order, each deliverable's ranges in
   * frame order.
   */
  chunks: IAutoMovieProductionRenderChunk[];

  /** Non-video tracks that terminal publication writes beside the video. */
  tracks: {
    /** Canonical WebVTT text of the timeline's caption placements. */
    captions: string;

    /** The timeline's audio placements, copied unchanged. */
    audio: IAutoMovieFilmTimeline["tracks"]["audio"];

    /** Validated identity of every supplied audio asset, sorted by path. */
    audioAssets: IAutoMovieProductionAudioAssetIdentity[];

    /** The current film-global effect runtimes, copied unchanged. */
    effects: IAutoMovieCompiledFilmEffect[];
  };
}
