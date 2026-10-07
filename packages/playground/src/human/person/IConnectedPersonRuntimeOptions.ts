/**
 * Options of `createConnectedPersonRuntime` that change what a construction
 * reports, never what it decides.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Lets an inspection consumer ask the same person runtime for the report-only census the editor does not need.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps the editor's construction on the judged relations so an edit is not delayed by report-only readings.
 * @author Samchon
 */
export interface IConnectedPersonRuntimeOptions {
  /**
   * True also evaluates the person builder's report-only assembly census in
   * every construction: each unjudged spatial relation and the census of each
   * part. It adds evaluation time and changes no judged relation, failure or
   * acceptance. Omission and false report the judged relations only.
   */
  census?: boolean;

  /** Actual construction completions during initial evaluator preparation; observer exceptions propagate. */
  progress?: (stage: string) => void;
}
