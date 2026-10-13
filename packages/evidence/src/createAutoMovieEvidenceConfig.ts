import type { IAutoMovieEvidenceBranchClaim } from "./IAutoMovieEvidenceBranchClaim";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { ITtscEvidenceGraphClaim, ITtscEvidenceGraphConfig } from "@ttsc/evidence";

import { projectAutoMovieNativeClaims } from "./projectAutoMovieNativeClaims";
import { sharedClaimBindings } from "./sharedClaimBindings";
import { validateProductionGraph } from "./validateProductionGraph";

/**
 * Validate the shared graph and append production-owned native claims.
 *
 * @evidence contracts/common.md#principled-implementation Validate current physical populations and stage dependencies, then append admitted project claims after the shared native graph.
 * @evidence contracts/common.md#clear-and-simple-design One factory owns graph admission; pure claim helpers preserve the authored and source relationship policies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Local claims extend shared duties and cannot replace them; there is no claim of rendered correctness from acknowledgment presence alone.
 * @evidence contracts/common.md#meaningful-documentation Construction throws on invalid declarations or populations and returns fresh graph arrays without deep freezing nested records.
 * @evidence contracts/performance.md#efficient-algorithms The dominant cost is synchronous filesystem and Markdown or TypeScript admission; shared assembly is bounded by supported branches plus local claims and selected files.
 * @evidence contracts/performance.md#reuse-equivalent-work Graph and manifest reuse the same constructors but independent calls reread mutable project content; equivalent filesystem work is not cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned graph is caller-owned, with shallowly reused nested local data; synchronous reads close their handles and no background tasks remain.
 */
export function createAutoMovieEvidenceConfig(graph: IAutoMovieEvidenceConfigProps): ITtscEvidenceGraphConfig {
  validateProductionGraph(graph);
  const shared: ITtscEvidenceGraphClaim[] = sharedClaimBindings(graph).map((binding: IAutoMovieEvidenceBranchClaim): ITtscEvidenceGraphClaim => binding.claim);
  return {
    claims: [...shared, ...projectAutoMovieNativeClaims(graph.claims ?? [])],
  };
}
