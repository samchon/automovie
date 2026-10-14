import { HumanViewerMixedCompileError } from "./HumanViewerMixedCompileError.js";
import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority.js";

/**
 * Refuse a page that mixed browser compiles or received a checked Node realm from a different current source revision. The guard compares supplied Node revision, loader name and nonempty checked-input witness with browser compile labels. The provider derives the project path from the entry rather than observing the loader's selected config, and this guard does not inspect byte contents or full dependency closure. A typed mixed-source refusal leaves replacement and newest-module checks with the host.
 *
 * @evidence contracts/common.md#principled-implementation Distinct browser compile stamps, mismatched Node revision, a different loader or an empty checked-input witness refuse the candidate with the typed mixed-source error.
 * @evidence contracts/common.md#clear-and-simple-design This publication guard compares supplied authorities without initiating compilation or replacing the last committed generation itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Node checked inputs remain independent loader evidence rather than copying browser stamps; an absent browser Human stamp is permitted when no transformed browser Human module ran.
 * @evidence contracts/common.md#meaningful-documentation The comment describes mixed-source refusal, supplied Node revision/loader/input reporting, provider-derived project path, limited local checks and host-owned candidate replacement.
 * @evidence contracts/performance.md#efficient-algorithms P browser stamps and I checked-input paths require O(P + I) validation bookkeeping; Set cardinality detects mixed compiles without pairwise comparisons.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Candidate publication checks the supplied current authority afresh and stores no cross-generation admission cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The guard borrows stamps and the Node witness without acquiring loader sessions, candidate frames or compile holds.
 */
export function assertHumanViewerSingleCompile(
  page: readonly string[],
  worker: IHumanViewerNodeAuthority,
  revision: string,
): void {
  if (new Set(page).size > 1 || worker.revision !== revision ||
      worker.loader !== "ttsc/register" || Object.keys(worker.inputs).length === 0)
    throw new HumanViewerMixedCompileError(
      "The source generation was replaced during display: the page ran compiles " +
        page.join(", ") +
        " and the Node realm reports source " + worker.revision,
    );
}
