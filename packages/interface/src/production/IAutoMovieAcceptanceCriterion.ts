import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * A measurable acceptance criterion.
 *
 * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-art-direction-acceptance Exposes `IAutoMovieAcceptanceCriterion` as the portable data boundary for the production design art direction acceptance requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-acceptance Types `IAutoMovieAcceptanceCriterion` for the narrative intent visual language acceptance system contract.
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
       * Physics and occlusion metrics remain geometry/frame review concerns
       * until their operands and measurement protocols are explicit.
       */
      metric: "runtime-seconds";
      /** Numeric comparison. */
      operator: "<=" | ">=" | "==";
      /** Finite threshold value, in seconds for `runtime-seconds`. */
      value: number;
    }
  | {
      /**
       * Cross-shot simultaneity criterion measured on the production story
       * clock.
       *
       * Adjacency in the cut proves nothing about chronology, so this is the
       * only way a production can state that separate shots show one moment.
       * Each named event is realized by its own shot, mapped through that
       * shot's pin, and the widest resulting gap is compared against the
       * tolerance. The claim is refusable: an unpinned shot, an absent
       * realization, declared windows that cannot possibly land inside the
       * tolerance, or realized times that in fact land outside it all fail it.
       */
      kind: "story-sync";
      /**
       * Two or more realized events, each named with the shot that owns it.
       * Every shot must be pinned; each shot-and-event pair appears once.
       */
      events: Array<{
        /** Owning shot id. */
        shot: string;
        /** Event id declared by that shot. */
        event: string;
      }>;
      /**
       * Finite non-negative tolerance in story seconds. The claim holds when
       * the earliest and latest realized story times differ by no more.
       */
      toleranceSeconds: number;
      /** Non-blank observable expectation for the asserted shared moment. */
      expectation: string;
    };
