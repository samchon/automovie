import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * One observable acceptance obligation, addressed to current compiled work.
 *
 * @evidence contracts/common.md#principled-implementation The kind selects frame evidence, realized event evidence, a runtime comparison or pinned story-clock simultaneity; design validation resolves the cited shot, frame, pass and event before review can discharge the obligation.
 * @evidence contracts/common.md#clear-and-simple-design Each criterion carries only its measurement operands, while scenario identity, target and requiredness belong to the enclosing acceptance record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A film-level frame or event must identify its owning shot, and cut adjacency cannot stand in for chronology; story-sync uses explicit pins and a finite nonnegative tolerance.
 * @evidence contracts/common.md#meaningful-documentation Describes observable expectations, frame passes, event identity, finite second thresholds, film-level shot disambiguation and the distinct refusal cases for story simultaneity.
 * @author Samchon
 */
export type IAutoMovieAcceptanceCriterion =
  | {
      /** Visual frame criterion. */
      kind: "frame";

      /** Owning shot id; required when the acceptance target is the film. */
      shot?: string;

      /** Review-frame id in the target shot. */
      frame: string;

      /** Render pass to inspect. */
      pass: AutoMovieGuidePass;

      /** Non-blank observable expectation for the cited current frame. */
      expectation: string;
    }
  | {
      /** Semantic event criterion. */
      kind: "event";

      /** Owning shot id; required when the acceptance target is the film. */
      shot?: string;

      /** Event id in the target shot or film. */
      event: string;

      /** Non-blank observable expectation for the cited compiled event. */
      expectation: string;
    }
  | {
      /** Numeric metric criterion. */
      kind: "metric";

      /**
       * Supported builder-owned metric.
       *
       * Physics and occlusion metrics remain geometry/frame review concerns until their operands and measurement protocols are explicit.
       */
      metric: "runtime-seconds";

      /** Numeric comparison. */
      operator: "<=" | ">=" | "==";

      /** Finite threshold value, in seconds for `runtime-seconds`. */
      value: number;
    }
  | {
      /**
       * Cross-shot simultaneity criterion measured on the production story clock.
       *
       * Adjacency in the cut proves nothing about chronology, so this is the only way a production can state that separate shots show one moment. Each named event is realized by its own shot, mapped through that shot's pin, and the widest resulting gap is compared against the tolerance. The claim is refusable: an unpinned shot, an absent realization, declared windows that cannot possibly land inside the tolerance, or realized times that in fact land outside it all fail it.
       */
      kind: "story-sync";

      /**
       * Two or more realized events, each named with the shot that owns it. Every shot must be pinned; each shot-and-event pair appears once.
       */
      events: Array<{
        /** Owning shot id. */
        shot: string;

        /** Event id declared by that shot. */
        event: string;
      }>;

      /**
       * Finite non-negative tolerance in story seconds. The claim holds when the earliest and latest realized story times differ by no more.
       */
      toleranceSeconds: number;

      /** Non-blank observable expectation for the asserted shared moment. */
      expectation: string;
    };
