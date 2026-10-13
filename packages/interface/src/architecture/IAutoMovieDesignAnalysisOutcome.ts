/**
 * What one attempted reading of a frame actually produced.
 *
 * `observed` is the only outcome that carries readings. An analysis this host
 * cannot perform is `unsupported`, and one that was simply never executed is
 * `not-run`; both carry a reason and no candidates, so an absent reading is
 * never mistaken for a clean sheet.
 */
export type IAutoMovieDesignAnalysisOutcome =
  | {
      /** The reading ran and produced candidates. */
      status: "observed";

      /**
       * Candidate ids this analysis produced; at least one, each named once.
       *
       * An analysis reads one frame, so every candidate here is built from
       * marks on that same frame. Correlating two sheets is the authored
       * building's job through {@link IAutoMovieDesignEvidence}, which may cite
       * candidates from any frame of any document.
       */
      candidates: string[];
    }
  | {
      /** This host cannot perform the reading at all. */
      status: "unsupported";

      /** Non-blank statement of what is missing. */
      reason: string;
    }
  | {
      /** The reading is possible but was not executed. */
      status: "not-run";

      /** Non-blank statement of why it was skipped. */
      reason: string;
    };
