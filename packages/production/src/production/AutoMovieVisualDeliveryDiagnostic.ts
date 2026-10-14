

/**
 * Metadata refusal categories before final mux. A malformed population returns only its root cause; after a valid ordered join, source, observation and policy/transition causes can accumulate. This vocabulary does not classify media-byte or encoder errors.
 *
 * @evidence contracts/common.md#principled-implementation Distinct population/source/observation/mixed-policy/transition codes identify the exact metadata condition that prevented a delivery plan.
 * @evidence contracts/common.md#clear-and-simple-design The closed union exposes planner refusals without carrying provider payloads or media-processing errors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Population failure is not followed by misleading crossing consequences, and these categories certify no physical output.
 * @evidence contracts/common.md#meaningful-documentation Prose explains root population refusal versus accumulated independent metadata causes and excluded encoder errors.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The union performs no planning or metadata traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Diagnostic spelling creates no result cache or equivalence coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no retained diagnostic list, media bytes or task.
 * @author Samchon
 */
export type AutoMovieVisualDeliveryDiagnostic =
  | "visual-lane-population-invalid"
  | "visual-lane-source-invalid"
  | "visual-lane-observation-invalid"
  | "visual-lane-policy-missing"
  | "visual-lane-transition-invalid";
