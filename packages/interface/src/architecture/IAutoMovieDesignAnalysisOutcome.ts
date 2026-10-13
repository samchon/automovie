/**
 * What one attempted reading of a frame actually produced.
 *
 * `observed` is the only outcome that carries readings. An analysis this host
 * cannot perform is `unsupported`, and one that was simply never executed is
 * `not-run`; both carry a reason and no candidates, so an absent reading is
 * never mistaken for a clean sheet.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `status` makes only `observed` able to hold candidates and only `unsupported` or `not-run` able to hold a reason; validation also refuses an observed outcome with no candidate, a blank reason, and any other status string.
 * @evidence contracts/common.md#clear-and-simple-design Three variants share no optional field, so an empty reading cannot be spelled as `observed` with an empty list, and `promoteDesignObservations` sorts each variant into promotion or `skipped` by its status alone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The three status literals are the contract's discriminants, and `promoteDesignObservations` copies a non-observed reason verbatim into `skipped` instead of rewording or dropping it.
 * @evidence contracts/common.md#meaningful-documentation States which variant carries readings, how unsupported differs from not-run, that candidates come from the analysed frame only and are named once, and that reasons are non-blank.
 * @author Samchon
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
