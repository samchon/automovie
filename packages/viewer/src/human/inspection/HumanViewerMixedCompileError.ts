/**
 * A candidate's page and worker ran human modules of more than one compile.
 * The candidate is discarded and a fresh one is started at once, because the
 * served modules now all come from the newest compile and no further edit may
 * arrive to start one.
 *
 * @evidence contracts/common.md#principled-implementation The refusal names its own recovery: a fresh candidate, not a wait for an edit.
 * @evidence contracts/common.md#meaningful-documentation States the condition and the recovery.
 * @author Samchon
 * @evidence contracts/common.md#clear-and-simple-design A single named Error carries mixed-generation refusal from admission to the host's candidate replacement path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate replacement responds to an observed browser/Node compile mismatch, not an elapsed deadline or a fabricated successful revision.
 */
export class HumanViewerMixedCompileError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "HumanViewerMixedCompileError";
  }
}
