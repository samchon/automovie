import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { DESIGN_FOUNDATIONS } from "./DESIGN_FOUNDATIONS";
import { requiresEvidence } from "./requiresEvidence";

/**
 * Select the design foundations whose units a host layer must pay for.
 *
 * A foundation contributes once it completes at `evidence` (or the later `review`); a disabled or draft foundation contributes nothing yet, which is why stage admission refuses to complete a host over an active incomplete foundation. The result keeps the declared foundation order.
 *
 * @evidence contracts/common.md#principled-implementation Filter the declared ordered foundation list to evidence or review providers.
 * @evidence contracts/common.md#clear-and-simple-design Foundation selection uses the same matrix as dependency completion admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Draft or disabled providers contribute no targets; the stage validator separately rejects completion over an active draft provider.
 * @evidence contracts/common.md#meaningful-documentation The returned provider order is the configured foundation order, including the mutual motions and systems relationship.
 * @evidence contracts/performance.md#efficient-algorithms Filtering is linear in the fixed foundation list and allocates only selected provider names.
 * @evidence contracts/performance.md#reuse-equivalent-work The static dependency matrix is shared; selection is recomputed from the caller's current stages.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the result and no provider state or project resources are retained.
 */
export function selectAutoMovieCompletedDesignFoundations(graph: IAutoMovieEvidenceConfigProps, host: AutoMovieAuthoredDocumentLayer): AutoMovieAuthoredDocumentLayer[] {
  return (DESIGN_FOUNDATIONS[host] ?? []).filter((design: "instances" | "maps" | "materials" | "models" | "motions" | "spaces" | "systems"): boolean =>
    requiresEvidence(graph[design]),
  );
}
