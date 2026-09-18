import { IAutoMovieDesignTarget } from "./IAutoMovieDesignTarget";
import type { IAutoMovieSubjectReviewTarget } from "./IAutoMovieSubjectReviewTarget";

/**
 * Review target forward declaration kept here to avoid requiring callers to
 * import a second module for mutation consequences.
 *
 * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `IAutoMovieReviewTarget` as the portable data boundary for the story time state review scope requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `IAutoMovieReviewTarget` for the narrative intent temporal state handoff system contract.
 */
export type IAutoMovieReviewTarget =
  | {
      /** Consumed compiled model asset. */
      kind: "asset";
      /** Model-recipe id. */
      id: string;
    }
  | {
      /** Typed design target. */
      kind: "design";
      /** Exact design artifact. */
      design: IAutoMovieDesignTarget;
    }
  | {
      /** Coding-agent-owned source file. */
      kind: "source";
      /** Project-relative source path. */
      path: string;
    }
  | {
      /** Compiled shot. */
      kind: "shot";
      /** Shot id. */
      id: string;
    }
  | {
      /** Receipt-bound visual rendition of one compiled shot. */
      kind: "rendition";
      /** Exact compiled shot id. */
      id: string;
    }
  | {
      /** Authored treatment sequence. */
      kind: "sequence";
      /** Stable sequence id. */
      id: string;
    }
  | {
      /** Whole film. */
      kind: "film";
      /** Film id. */
      id: string;
    }
  | ({
      /**
       * One compiled subject observed as itself rather than at a film moment.
       *
       * The address is the compiled artifact plus the stable subject id, not a
       * frame, so a shot that happens to contain the subject never stands in
       * for this target.
       */
      kind: "subject";
    } & IAutoMovieSubjectReviewTarget);
