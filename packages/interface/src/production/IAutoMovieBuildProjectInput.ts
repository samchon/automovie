/**
 * A compile request with progressively stricter gates.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-input-finding Exposes `IAutoMovieBuildProjectInput` as the portable data boundary for the diagnostics input finding requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-input-finding Types `IAutoMovieBuildProjectInput` for the validation input finding system contract.
 */
export interface IAutoMovieBuildProjectInput {
  /**
   * Highest atomic gate to enforce. `design` validates the tracked graph only;
   * `source` additionally compiles sandboxed TypeScript and materializes owned
   * generated artifacts; `review` additionally requires every current review
   * target complete; `final` additionally verifies required renderer-owned
   * deliverables, byte receipts and parsed media facts.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-input-finding Exposes `scope` as the portable data boundary for the diagnostics input finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-input-finding Types `scope` for the validation input finding system contract.
   */
  scope: "design" | "source" | "review" | "final";
}
