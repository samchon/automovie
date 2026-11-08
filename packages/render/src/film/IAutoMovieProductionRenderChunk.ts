import type { IAutoMovieProductionRenderFrame } from "@automovie/engine";
import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * One content-addressed planned range of tier output frames for a moving-image deliverable.
 *
 * `planProductionRenderJob` emits `chunkFrames`-sized ranges for feature and guide-pass deliverables. A slot is an operational address while the id derives from supplied content inputs; the type itself neither acquires a lock nor checks a resident output's currentness. `IAutoMovieRenderChunk` instead describes numbered sequence-reassembly ranges without content identity. Retained planner consumers are tests rather than a maintained production scheduler.
 *
 * @evidence contracts/development/design.md#principled-representation The planner hashes canonical declared edit, effect, tier, raster, range, pass, runtime and source identity inputs and builds a readable operational slot. Matching claimed digests alone cannot prove equal resident media or truthful host identities; this record performs no execution or output admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Resolved frames keep planned shot/time/layer facts with the range while the sequence-reassembly contract remains separate. The retained planner and its tests construct these records; no application scheduler or encoder is wired by the type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The `kind` union admits only the two moving-image deliverable kinds and `pass` is `beauty` exactly for a feature; no deliverable id or range is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation The doc names the producer, what one chunk covers, how slot and id differ in stability and why, and how it differs from the sequence-render chunk; each member states its unit or derivation.
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
