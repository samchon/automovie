/**
 * What one attempted reading of a frame actually produced.
 *
 * `observed` is the only outcome that carries readings. An analysis this host
 * cannot perform is `unsupported`, and one that was simply never executed is
 * `not-run`; both carry a reason and no candidates, so an absent reading is
 * never mistaken for a clean sheet.
 *
 * @evidence contracts/common.md#principled-implementation The typed union separates observed candidates from unsupported/not-run reasons. Engine domain validation checks known status, nonempty resolving unique observed claims and nonblank non-observed reasons, but does not inspect extra runtime properties on a non-observed object or prove that the declared execution status is true. Arbitrary nested container shapes remain caller-admitted.
 * @evidence contracts/common.md#clear-and-simple-design Three variants avoid optional payloads; domain admission refuses an empty observed list even though string[] can express one. Non-observed attempts go to skipped by status; an observed attempt's candidates still pass their separate ordered promotion gates, so observed does not itself imply promoted geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The three status literals are the contract's discriminants, and `promoteDesignObservations` copies a non-observed reason verbatim into `skipped` instead of rewording or dropping it.
 * @evidence contracts/common.md#meaningful-documentation States which variant carries readings, how unsupported differs from not-run, that candidates come from the analysed frame only and are named once, and that reasons are non-blank.
 */
export type IAutoMovieDesignAnalysisOutcome =
  | {
      /** The reading ran and produced candidates. */
      status: "observed";

      /**
       * Candidate ids this analysis produced; at least one, each resolving in
       * the document and named once.
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
