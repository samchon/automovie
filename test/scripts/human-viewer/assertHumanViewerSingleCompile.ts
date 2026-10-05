import { HumanViewerMixedCompileError } from "./HumanViewerMixedCompileError";

/**
 * Refuse a candidate whose page and numerical worker did not run human
 * modules of one compile generation. A page loads its modules, and its worker
 * loads its own, over seconds; a source edit in between makes the later
 * requests wait for the next compile, so one realm can hold validators of one
 * compile and callers of another, which fails with type errors that belong to
 * no source state. Such a candidate is refused with
 * `HumanViewerMixedCompileError`, and the host starts a fresh candidate at
 * once, whose modules all come from the newest compile.
 *
 * @evidence contracts/common.md#principled-implementation A generation is published only when every human module it runs came from one compile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Detects the mix from the served modules themselves instead of from timing.
 * @evidence contracts/common.md#meaningful-documentation States why a mix arises and what happens to the refused candidate.
 */
export function assertHumanViewerSingleCompile(page: readonly string[], worker: readonly string[]): void {
  const all = new Set([...page, ...worker]);
  if (all.size > 1)
    throw new HumanViewerMixedCompileError("The source generation was replaced during display: the page ran compiles " +
      page.join(", ") + " and its worker " + worker.join(", "));
}
