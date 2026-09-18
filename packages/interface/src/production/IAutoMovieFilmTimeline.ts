import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";
import { IAutoMovieAudioCue } from "./IAutoMovieAudioCue";
import { IAutoMovieEffectCue } from "./IAutoMovieEffectCue";
import { IAutoMovieFilmOmission } from "./IAutoMovieFilmOmission";
import { IAutoMovieFilmTimelineSegment } from "./IAutoMovieFilmTimelineSegment";

/**
 * Canonical global timeline consumed by review, oracle and render layers.
 *
 * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `IAutoMovieFilmTimeline` as the portable data boundary for the story time state review scope requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `IAutoMovieFilmTimeline` for the narrative intent temporal state handoff system contract.
 */
export interface IAutoMovieFilmTimeline {
  /**
   * Generated timeline format.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `version` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `version` for the narrative intent temporal state handoff system contract.
   */
  version: 1;
  /**
   * Compiler protocol that derived the timeline.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `builder` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `builder` for the narrative intent temporal state handoff system contract.
   */
  builder: string;
  /**
   * Exact aggregate compile input.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `inputFingerprint` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `inputFingerprint` for the narrative intent temporal state handoff system contract.
   */
  inputFingerprint: AutoMovieContentDigest;
  /**
   * Digest of normalized `src/film.ts` bytes.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `sourceDigest` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `sourceDigest` for the narrative intent temporal state handoff system contract.
   */
  sourceDigest: AutoMovieContentDigest;
  /**
   * Stable finished-film id.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `id` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `id` for the narrative intent temporal state handoff system contract.
   */
  id: string;
  /**
   * Production frame rate.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `fps` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `fps` for the narrative intent temporal state handoff system contract.
   */
  fps: number;
  /**
   * Exact reduced production frame rate.
   *
   * Integer legacy timelines may omit this field and are interpreted as
   * `fps/1`; fractional timelines must preserve their explicit identity.
   *
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time Preserves the builder-owned frame clock as one canonical rational identity without a decimal reconstruction.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline Supplies the canonical rational clock to caption, sound, and delivery consumers.
   */
  frameRate?: IAutoMovieProductionFrameRate;
  /**
   * Exact target and derived timeline duration.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `totalFrames` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `totalFrames` for the narrative intent temporal state handoff system contract.
   */
  totalFrames: number;
  /**
   * Ordered global-to-shot mapping.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `segments` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `segments` for the narrative intent temporal state handoff system contract.
   */
  segments: IAutoMovieFilmTimelineSegment[];
  /**
   * Explicitly omitted current narrative shots.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `omissions` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `omissions` for the narrative intent temporal state handoff system contract.
   */
  omissions: IAutoMovieFilmOmission[];
  /**
   * Frame-normalized non-video tracks.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `tracks` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `tracks` for the narrative intent temporal state handoff system contract.
   */
  tracks: {
    /** Ordered audio placements. */
    audio: Array<{
      id: string;
      asset: string;
      sourceDurationFrames: number;
      sourceOffsetFrame: number;
      startFrame: number;
      durationFrames: number;
      gain: number;
      fadeInFrames: number;
      fadeOutFrames: number;
      bus: IAutoMovieAudioCue["bus"];
    }>;
    /** Ordered caption placements. */
    captions: Array<{
      id: string;
      text: string;
      language: string;
      speaker?: string;
      startFrame: number;
      endFrame: number;
    }>;
    /** Ordered effect placements. */
    effects: Array<{
      id: string;
      recipe: IAutoMovieEffectCue["recipe"];
      zone: string;
      startFrame: number;
      durationFrames: number;
      intensity: number;
    }>;
  };
}
