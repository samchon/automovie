import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";
import { AutoMovieGrammarStyleIntent } from "./AutoMovieGrammarStyleIntent";
import { IAutoMovieNamedState } from "./IAutoMovieNamedState";
import { IAutoMovieShotEventContract } from "./IAutoMovieShotEventContract";
import { IAutoMovieShotParticipant } from "./IAutoMovieShotParticipant";
import { IAutoMovieShotReviewFrame } from "./IAutoMovieShotReviewFrame";
import { IAutoMovieShotStoryTime } from "./IAutoMovieShotStoryTime";

/**
 * A code-bound shot contract, not a dense keyframe list.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieShotContract` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieShotContract` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieShotContract {
  /**
   * Non-blank stable shot id, unique under portable case folding.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `id` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `id` for the narrative intent story design ownership system contract.
   */
  id: string;
  /**
   * Non-blank narrative beat id owned by the coding-agent treatment.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `beat` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `beat` for the narrative intent story design ownership system contract.
   */
  beat: string;
  /**
   * Coding-agent-owned source export.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `source` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `source` for the narrative intent story design ownership system contract.
   */
  source: {
    /**
     * Canonical project-relative POSIX TypeScript path. Backslashes, absolute
     * paths, dot segments and case-variant aliases are refused.
     */
    module: string;
    /** Named exported builder. */
    export: string;
  };
  /**
   * Screenplay scenes and optional canon claims this shot intends to realize.
   *
   * Project lint requires this field once a screenplay index is resident.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `evidence` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `evidence` for the narrative intent story design ownership system contract.
   */
  evidence?: IAutoMovieSceneEvidence[];
  /**
   * Finite shot runtime in seconds, strictly above zero and on the production
   * frame clock.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `durationSeconds` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `durationSeconds` for the narrative intent story design ownership system contract.
   */
  durationSeconds: number;
  /**
   * Where this shot's local time zero lands on the production story clock.
   *
   * Omitted means the shot asserts nothing about story time, which is the
   * default. A pin is legal only once the production declares `storyClock`, and
   * a cross-shot criterion may only compare events in pinned shots. Pinning is
   * independent of the edit: the pin says when the shot happened, never where
   * it is cut.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `storyTime` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `storyTime` for the narrative intent story design ownership system contract.
   */
  storyTime?: IAutoMovieShotStoryTime;
  /**
   * Unique deliberate film-grammar exceptions. Each value suppresses only its
   * corresponding heuristic diagnostic; unrelated facts remain visible.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `styleIntent` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `styleIntent` for the narrative intent story design ownership system contract.
   */
  styleIntent?: AutoMovieGrammarStyleIntent[];
  /**
   * Unique required actor and formation ids; formations must already exist.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `participants` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `participants` for the narrative intent story design ownership system contract.
   */
  participants: IAutoMovieShotParticipant[];
  /**
   * Required opening states.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `opening` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `opening` for the narrative intent story design ownership system contract.
   */
  opening: IAutoMovieNamedState[];
  /**
   * Required closing states.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `closing` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `closing` for the narrative intent story design ownership system contract.
   */
  closing: IAutoMovieNamedState[];
  /**
   * Camera readability constraints.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `camera` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `camera` for the narrative intent story design ownership system contract.
   */
  camera: {
    /** Non-blank creative camera intent. */
    intent: string;
    /**
     * Non-empty unique compiled scene-node or formation ids that must remain
     * readable.
     */
    requiredSubjects: string[];
    /**
     * Finite maximum allowed pixel-occlusion ratio, inclusive from zero to one.
     *
     * The builder projects subject root points but does not measure this
     * ratio. The external reviewer must compare current mask, depth, outline or
     * beauty frames against it.
     */
    maxOcclusionRatio: number;
  };
  /**
   * Timed semantic events.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `events` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `events` for the narrative intent story design ownership system contract.
   */
  events: IAutoMovieShotEventContract[];
  /**
   * At least one required visual-review frame.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `reviewFrames` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `reviewFrames` for the narrative intent story design ownership system contract.
   */
  reviewFrames: IAutoMovieShotReviewFrame[];
}
