/**
 * A candidate's page and worker ran human modules of more than one compile.
 * The candidate is discarded and a fresh one is started at once, because the
 * served modules now all come from the newest compile and no further edit may
 * arrive to start one.
 *
 * @author Samchon
 */
export class HumanViewerMixedCompileError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "HumanViewerMixedCompileError";
  }
}
