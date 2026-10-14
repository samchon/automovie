import { advanceAutoMovieProjectRevision } from "../project/advanceAutoMovieProjectRevision";
import type { AutoMovieProjectRevisionAdvance } from "../project/AutoMovieProjectRevisionAdvance";

/**
 * Require the next publishable project generation before applying any bytes.
 *
 * @evidence contracts/common.md#principled-implementation Delegates safe-integer successor admission and returns only the next decision; commits supply already-decoded generations, so maximum-safe exhaustion refuses before mutation effects.
 * @evidence contracts/common.md#clear-and-simple-design Translates the shared successor result into project publication policy without duplicating integer/range rules; the transaction owns guard and write ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exhausted or otherwise invalid input cannot wrap, reset or reuse a generation; no stored project ID selects a different counter limit.
 * @evidence contracts/common.md#meaningful-documentation States decoded-input premise and pre-write refusal, with the actual shared decision state in its correction message.
 * @evidence contracts/performance.md#efficient-algorithms One successor decision performs constant-size integer comparisons/addition and allocates no collection or file buffer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computing one successor is cheaper than tracking a mutable generation cache and cannot authorize reuse of a previous transaction's decision.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one number or throws one occurrence error; no revision store, lock handle or task is acquired.
 */
export function requireAutoMovieProductionProjectNextRevision(revision: number): number {
  const decision: AutoMovieProjectRevisionAdvance = advanceAutoMovieProjectRevision(revision);
  if (decision.state === "next") return decision.revision;
  throw new Error(`Production revision is ${decision.state}. No production bytes were written because the store cannot publish another safe-integer revision.`);
}
