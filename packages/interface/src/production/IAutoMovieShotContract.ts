import type { AutoMovieGrammarStyleIntent } from "./AutoMovieGrammarStyleIntent";
import type { IAutoMovieNamedState } from "./IAutoMovieNamedState";
import type { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";
import type { IAutoMovieShotEventContract } from "./IAutoMovieShotEventContract";
import type { IAutoMovieShotParticipant } from "./IAutoMovieShotParticipant";
import type { IAutoMovieShotReviewFrame } from "./IAutoMovieShotReviewFrame";
import type { IAutoMovieShotStoryTime } from "./IAutoMovieShotStoryTime";

/**
 * Source-bound shot obligations measured against compiled performance, camera
 * and event output.
 */
export interface IAutoMovieShotContract {
  /** Non-blank stable shot id, unique under portable case folding. */
  id: string;

  /** Non-blank narrative beat id owned by the coding-agent treatment. */
  beat: string;

  /** Coding-agent-owned source export. */
  source: {
    /**
     * Intended canonical project-relative POSIX TypeScript path. The production
     * path resolver is retired; direct compileDefinedShot uses a synthetic
     * source address and does not load this path.
     */
    module: string;

    /** Named exported builder. */
    export: string;
  };

  /**
   * Screenplay scenes and optional canon claims this shot intends to realize.
   *
   * Retains optional screenplay attribution; the production screenplay/project
   * lint gate is retired.
   */
  evidence?: IAutoMovieSceneEvidence[];

  /**
   * Finite shot runtime in seconds, strictly above zero and on the production
   * frame clock.
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
   */
  storyTime?: IAutoMovieShotStoryTime;

  /**
   * Unique deliberate film-grammar exceptions. Each value suppresses only its
   * corresponding heuristic diagnostic; unrelated facts remain visible.
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
     * Non-empty unique compiled scene-node or formation ids that must remain
     * readable.
     */
    requiredSubjects: string[];

    /**
     * Finite maximum allowed pixel-occlusion ratio, inclusive from zero to one.
     *
     * RealizeShotContract tests sampled subject boxes against the cropped
     * camera frustum and declared depth precision; it does not measure this
     * pixel-occlusion ratio. External review must compare current mask, depth,
     * outline or beauty frames against the authored threshold.
     */
    maxOcclusionRatio: number;
  };

  /** Timed semantic events. */
  events: IAutoMovieShotEventContract[];

  /** At least one required visual-review frame. */
  reviewFrames: IAutoMovieShotReviewFrame[];
}
