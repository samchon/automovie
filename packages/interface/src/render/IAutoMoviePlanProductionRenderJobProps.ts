import type { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import type { IAutoMovieCompiledFilmEffect } from "../production/IAutoMovieCompiledFilmEffect";
import type { IAutoMovieFilmTimeline } from "../production/IAutoMovieFilmTimeline";
import type { IAutoMovieProductionDesign } from "../production/IAutoMovieProductionDesign";
import type { IAutoMovieProductionAudioAssetIdentity } from "./IAutoMovieProductionAudioAssetIdentity";
import type { IAutoMovieProductionRenderRuntimeIdentity } from "./IAutoMovieProductionRenderRuntimeIdentity";
import type { IAutoMovieProductionRenderTier } from "./IAutoMovieProductionRenderTier";

/**
 * Content identities and compiled timeline for one deterministic tier plan.
 * planProductionRenderJob admits fingerprints, audio source/processing
 * consistency, chunk size and tier projection, then computes range identities.
 * Supplied runtime identities describe the caller's capture environment; the
 * planner does not observe that environment or execute jobs.
 */
export interface IAutoMoviePlanProductionRenderJobProps {
  /** The builder-owned film edit. */
  timeline: IAutoMovieFilmTimeline;

  /** The compiled film-global effect runtimes for that edit. */
  effects: readonly IAutoMovieCompiledFilmEffect[];

  /** The production design the edit was compiled for. */
  production: IAutoMovieProductionDesign;

  /** Capture and encoder identity every chunk renders under. */
  runtimeIdentity: IAutoMovieProductionRenderRuntimeIdentity;

  /** SHA-256 source digest of every shot the edit shows, by shot id. */
  sourceFingerprints: Readonly<Record<string, string>>;

  /** Identity of every audio asset the edit's cues reference. */
  audioAssets: readonly IAutoMovieProductionAudioAssetIdentity[];

  /** Maximum output frames per chunk; a positive safe integer. */
  chunkFrames: number;

  /**
   * The one pass of a legacy guide deliverable that declares none; omitted is
   * `pose`.
   */
  guidePasses?: readonly Exclude<AutoMovieGuidePass, "beauty">[];

  /** Proxy or final tier; omitted is the exact final tier. */
  tier?: IAutoMovieProductionRenderTier;
}
