/**
 * Options of `createConnectedPersonRuntime` that change what a construction
 * reports, never what it decides.
 *
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
