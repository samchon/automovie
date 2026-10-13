import type { IAutoMovieProductionRenderFrame } from "@automovie/engine";
import type {
  AutoMovieContentDigest,
  AutoMovieGuidePass,
} from "@automovie/interface";

/**
 * One content-addressed range of tier output frames that one moving-image
 * deliverable renders and encodes as an independently lockable unit.
 *
 * `planProductionRenderJob` emits one chunk per `chunkFrames`-sized range for
 * each feature and guide-pass deliverable. The `slot` stays fixed while the
 * edit, runtime or sources change and the `id` does not, so an output stored
 * under the slot with another id is recognized as stale. This differs from
 * `IAutoMovieRenderChunk`, which numbers sequence-render ranges for
 * reassembly and carries no content identity.
 *
 * @evidence contracts/common.md#principled-implementation The id is a SHA-256 digest over the canonical JSON of every input that decides the range's pixels, so equal ids mean equal work and any changed input yields a new id, while the slot is a readable key built from production, tier, deliverable, pass and range index.
 * @evidence contracts/common.md#clear-and-simple-design The chunk carries its resolved frames so a renderer needs no timeline to know which shot frames to draw, and it stays separate from `IAutoMovieRenderChunk` because lockable, resumable production work and sequence reassembly are different contracts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `kind` union admits only the two moving-image deliverable kinds and `pass` is `beauty` exactly for a feature; no deliverable id or range is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc names the producer, what one chunk covers, how slot and id differ in stability and why, and how it differs from the sequence-render chunk; each member states its unit or derivation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface runs no algorithm; the planning and digest cost is answered on `planProductionRenderJob`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates nothing itself; its `id` is the key by which status checks reuse a completed encode, which `productionRenderChunkStatuses` answers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds no handle or task; its frame array lives as long as the plan that holds it.
 * @author Samchon
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
  id: AutoMovieContentDigest;

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
