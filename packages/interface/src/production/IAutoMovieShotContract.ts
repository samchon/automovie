import { AutoMovieGrammarStyleIntent } from "./AutoMovieGrammarStyleIntent";
import { IAutoMovieNamedState } from "./IAutoMovieNamedState";
import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";
import { IAutoMovieShotEventContract } from "./IAutoMovieShotEventContract";
import { IAutoMovieShotParticipant } from "./IAutoMovieShotParticipant";
import { IAutoMovieShotReviewFrame } from "./IAutoMovieShotReviewFrame";
import { IAutoMovieShotStoryTime } from "./IAutoMovieShotStoryTime";

/**
 * Source-bound shot obligations measured against compiled performance, camera and event output.
 *
 * @evidence contracts/common.md#principled-implementation Explicit participants, boundary-state predicates, event windows and required review samples describe one shot; realizeShotContract grades those obligations from supplied artifacts. Valid contract clocks and source attribution are caller premises, while direct compileDefinedShot uses its registered declaration and a synthetic source address without a resident project loader.
 * @evidence contracts/common.md#clear-and-simple-design Separates narrative identity and source binding from measurable opening, closing, camera and event obligations, leaving dense motion and scene construction to the source and engine pipeline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Echoed ids and camera intent prose do not prove realization; occlusion ratio remains an external current-frame review requirement rather than a builder-measured mask statistic, and style intent suppresses only its named heuristic.
 * @evidence contracts/common.md#meaningful-documentation Defines source path admission, shot seconds and frame clock, independent story pin, participant and predicate obligations, camera limits and required visual evidence.
 */
export interface IAutoMovieShotContract {
  /** Non-blank stable shot id, unique under portable case folding. */
  id: string;

  /** Non-blank narrative beat id owned by the coding-agent treatment. */
  beat: string;

  /** Coding-agent-owned source export. */
  source: {
    /**
     * Intended canonical project-relative POSIX TypeScript path. The production path resolver is retired; direct compileDefinedShot uses a synthetic source address and does not load this path.
     */
    module: string;

    /** Named exported builder. */
    export: string;
  };

  /**
   * Screenplay scenes and optional canon claims this shot intends to realize.
   *
   * Retains optional screenplay attribution; the production screenplay/project lint gate is retired.
   */
  evidence?: IAutoMovieSceneEvidence[];

  /**
   * Finite shot runtime in seconds, strictly above zero and on the production frame clock.
   */
  durationSeconds: number;

  /**
   * Where this shot's local time zero lands on the production story clock.
   *
   * Omitted means the shot asserts nothing about story time, which is the default. A pin is legal only once the production declares `storyClock`, and a cross-shot criterion may only compare events in pinned shots. Pinning is independent of the edit: the pin says when the shot happened, never where it is cut.
   */
  storyTime?: IAutoMovieShotStoryTime;

  /**
   * Unique deliberate film-grammar exceptions. Each value suppresses only its corresponding heuristic diagnostic; unrelated facts remain visible.
   */
  styleIntent?: AutoMovieGrammarStyleIntent[];

  /** Unique required actor and formation ids; formations must already exist. */
  participants: IAutoMovieShotParticipant[];

  /** Required opening states. */
  opening: IAutoMovieNamedState[];

  /** Required closing states. */
  closing: IAutoMovieNamedState[];

  /** Camera readability constraints. */
  camera: {
    /** Non-blank creative camera intent. */
    intent: string;

    /**
     * Non-empty unique compiled scene-node or formation ids that must remain readable.
     */
    requiredSubjects: string[];

    /**
     * Finite maximum allowed pixel-occlusion ratio, inclusive from zero to one.
     *
     * realizeShotContract tests sampled subject boxes against the cropped camera frustum and declared depth precision; it does not measure this pixel-occlusion ratio. External review must compare current mask, depth, outline or beauty frames against the authored threshold.
     */
    maxOcclusionRatio: number;
  };

  /** Timed semantic events. */
  events: IAutoMovieShotEventContract[];

  /** At least one required visual-review frame. */
  reviewFrames: IAutoMovieShotReviewFrame[];
}
