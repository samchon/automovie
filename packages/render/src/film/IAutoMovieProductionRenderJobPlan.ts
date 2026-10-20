import type {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionDesign,
} from "@automovie/interface";

import type { IAutoMovieProductionAudioAssetIdentity } from "./IAutoMovieProductionAudioAssetIdentity";
import type { IAutoMovieProductionRenderChunk } from "./IAutoMovieProductionRenderChunk";
import type { IAutoMovieProductionRenderRuntimeIdentity } from "./IAutoMovieProductionRenderRuntimeIdentity";
import type { IAutoMovieProductionRenderTier } from "./IAutoMovieProductionRenderTier";

/**
 * One tier's render plan, containing its output frame ranges and non-video tracks.
 *
 * `planProductionRenderJob` builds it from supplied timeline and runtime inputs. Proxy and final plans share `editFingerprint` and differ in tier, projected frame format, frame count and chunks. Current repository callers are planner tests; a maintained application does not acquire, validate or execute stored plans through this record.
 *
 * @evidence contracts/common.md#principled-implementation The planner derives this version-four record deterministically from admitted supplied inputs; a stored record alone proves neither current input identity nor resident output bytes. The type executes no currentness check.
 * @evidence contracts/common.md#clear-and-simple-design Identities, tier, projected raster, resolved chunks and tracks occupy one planning result. The planner's existing tests consume the shape; no removed render subcommand or replacement application consumer is claimed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is a cached measurement or special case; every value is copied or derived from the edit and declared inputs, and `version` is the one contract-defined constant.
 * @evidence contracts/common.md#meaningful-documentation The doc names the retained planner, current test-only consumption and lack of stored-plan admission, plus the relationship between tiers. Members state their source, units and ordering, with frame counts expressed as tier output frames.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The plan record is the output of planning rather than a procedure, and the cost of filling its chunks, frames and tracks is counted on `planProductionRenderJob`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates nothing itself; reuse of completed chunks is decided by their ids, which `IAutoMovieProductionRenderChunk` documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds no handle or task; its size grows with chunk and frame count and it lives as long as its holder keeps it.
 */
export interface IAutoMovieProductionRenderJobPlan {
  /** Plan schema version. */
  version: 4;

  /** Production id, which namespaces every slot and output path. */
  productionId: string;

  /** The timeline's compiler input fingerprint, shared by every capture. */
  compileFingerprint: string;

  /** Digest of the builder-owned film edit, equal for proxy and final. */
  editFingerprint: string;

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

  /** Planned non-video tracks; this value does not publish or execute them. */
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
