import type { ITtscEvidenceGraphMarkdownReference } from "@ttsc/evidence";

/** A generated source family whose authored realization has a review policy. */
export type AutoMovieSourceRealizationBranch =
  | "filmSources"
  | "instanceSources"
  | "mapSources"
  | "materialSources"
  | "modelSources"
  | "motionSources"
  | "productionSources"
  | "shots"
  | "spaceSources"
  | "systemSources";

/**
 * Keep exact realization coverage and cardinality blocking for every source.
 *
 * The native relationship requires its actual acknowledgement, never an
 * evidenceReview companion or target fingerprint. `branch` and `requireReview`
 * remain accepted input fields for existing callers. Actual observations are
 * authored and authenticated through the separate physical review/final gates.
 */
export const createAutoMovieSourceRealizationReferences = (props: {
  branch: AutoMovieSourceRealizationBranch;
  reference: Omit<
    ITtscEvidenceGraphMarkdownReference,
    "severity" | "requireReview"
  >;
  requireReview: boolean;
}): ITtscEvidenceGraphMarkdownReference[] => {
  return [{ ...props.reference, severity: "error", requireReview: false }];
};
