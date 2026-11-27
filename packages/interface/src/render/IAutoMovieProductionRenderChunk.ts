import type { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import type { IAutoMovieProductionRenderFrame } from "../index";

/**
 * One content-addressed planned range of tier output frames for a moving-image
 * deliverable.
 *
 * `planProductionRenderJob` emits `chunkFrames`-sized ranges for feature and
 * guide-pass deliverables. A slot is an operational address while the id
 * derives from supplied content inputs; the type itself neither acquires a lock
 * nor checks a resident output's currentness. `IAutoMovieRenderChunk` instead
 * describes numbered sequence-reassembly ranges without content identity.
 * Retained planner consumers are tests rather than a maintained production
 * scheduler.
 */
export interface IAutoMovieProductionRenderChunk {
  /**
   * `<production>:<tier>:<deliverable>:<pass>:<index>`, where `index` counts
   * this deliverable's ranges from zero; stable across content changes.
   */
  slot: string;

  /**
   * SHA-256 digest over the edit, effects, tier, frame formats, range, pass,
   * runtime identity and source shot digests of this range.
   */
  id: string;

  /** Id of the production deliverable that owns the range. */
  deliverable: string;

  /** Kind of that deliverable; only the moving-image kinds have chunks. */
  kind: "feature" | "guide-pass";

  /** `beauty` for a feature, otherwise the guide deliverable's one pass. */
  pass: AutoMovieGuidePass;

  /** First tier output frame of the range, inclusive and zero-based. */
  frameStart: number;

  /** Tier output frame one past the range's last frame. */
  frameEndExclusive: number;

  /**
   * One resolved frame per output frame in the range, each with its output
   * index, full-rate timeline frame, time and shot layers.
   */
  frames: IAutoMovieProductionRenderFrame[];
}
