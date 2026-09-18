/**
 * Exact evidence owner and selector that alone may prove a continuity claim.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `IAutoMovieContinuityProof` as the portable data boundary for the story screenplay index prose requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieContinuityProof` for the narrative intent scene prose index system contract.
 */
export type IAutoMovieContinuityProof =
  | {
      /** Compiler-measured named contract outcome. */
      owner: "geometry";
      /** Exact shot carrying the named outcome. */
      shot: string;
      /** Claim-specific realization selector. */
      outcome: {
        /** Compiler realization family with stable ids. */
        kind: "opening" | "closing" | "event" | "formation";
        /** Exact state, event, or formation id. */
        id: string;
      };
    }
  | {
      /** Actual-frame acceptance observed by a current shot/film review. */
      owner: "frame-review";
      /** Exact frame acceptance scenario. */
      scenario: string;
    }
  | {
      /** Current required acceptance outcome observed by shot/film review. */
      owner: "acceptance";
      /** Exact acceptance scenario. */
      scenario: string;
    };
