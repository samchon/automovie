import type { ITtscEvidenceGraphMarkdownReference } from "@ttsc/evidence";

/**
 * A generated source family whose authored realization has a review policy.
 *
 * @evidence requirements/production-evidence/README.md#production-evidence-requirements Names the generated source families governed by the production graph.
 * @evidence requirements/production-evidence/graph.md#agent-production-evidence-shape-stage Keeps rendered realization policy attached to the actual source branch.
 * @evidence specifications/production-evidence/README.md#production-evidence-specifications Defines the source-family input used by the graph reference builder.
 * @evidence specifications/production-evidence/graph.md#spec-authoring-production-evidence-shape-stage Uses the same closed source population as the staged production declaration.
 */
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
 *
 * @evidence requirements/production-evidence/README.md#production-evidence-requirements Separates initial construction from the rendered evidence a completed production owes.
 * @evidence requirements/production-evidence/graph.md#agent-production-evidence-shape-stage Keeps realization structural enforcement active without companion-row authoring at any stage.
 * @evidence specifications/production-evidence/README.md#production-evidence-specifications Constructs native references without replacing their evaluator.
 * @evidence specifications/production-evidence/graph.md#spec-authoring-production-evidence-shape-stage Emits one error-level structural reference with the same complete population and cardinality for every source family.
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
