import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import { isAutoMovieSourceOwnerBindingComplete } from "./isAutoMovieSourceOwnerBindingComplete";

/**
 * Admit one source export against its exact graph owner, bytes and completion.
 *
 * @evidence contracts/common.md#principled-implementation Branch/path/export identify exactly one edge before optional runtime owner and source digest equality; review/final additionally require enforced declaration completion, with stable typed refusal categories.
 * @evidence contracts/common.md#clear-and-simple-design Shot and library source evaluators share this edge admission, and downstream attribution records only its selected successful binding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/ambiguous edges never choose by insertion order, another graph target cannot authorize a runtime claim and prose review metadata cannot replace stage completion. Observed digest identity does not prove Node executed a buffer or had deterministic effects.
 * @evidence contracts/common.md#meaningful-documentation States exact candidate join, owner/digest authentication, completion choice and stable review refusal compatibility.
 * @evidence contracts/performance.md#efficient-algorithms Filtering B edges costs O(B) plus identity text and retains at most B candidates; the remaining address/completion checks are scalar, with no source reread or hash here.
 * @evidence contracts/performance.md#reuse-equivalent-work A single candidate population serves owner/digest/completion checks in one call; every admission uses current supplied edges and caches no successful result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate references are local and one selected binding or refusal transfers to the caller; the resolver stores no bytes, handles or scheduled work.
 */
export function resolveAutoMovieSourceOwnerBinding(props: {
  bindings:
    | readonly IAutoMovieProductionEvidenceSourceOwnerBinding[]
    | undefined;
  branch: string;
  sourcePath: string;
  exportName: string;
  /** Runtime owner claim, when this entry protocol carries one. */
  owner?: string;
  sourceDigest: IAutoMovieProductionEvidenceSourceOwnerBinding["sourceDigest"];
  /** Compatibility name for requiring evidence completion at admission. */
  requireReviewed: boolean;
}): { success: false; binding: null; reason: "missing" | "ambiguous" | "owner" | "digest" | "review"; message: string } | { success: true; binding: IAutoMovieProductionEvidenceSourceOwnerBinding; reason: null; message: null } {
  const candidates: IAutoMovieProductionEvidenceSourceOwnerBinding[] = (props.bindings ?? []).filter(
    (binding: IAutoMovieProductionEvidenceSourceOwnerBinding): boolean =>
      binding.branch === props.branch &&
      binding.sourcePath === props.sourcePath &&
      binding.exportName === props.exportName,
  );
  const address: string = `${props.sourcePath}#${props.exportName}`;
  if (candidates.length === 0)
    return {
      success: false as const,
      binding: null,
      reason: "missing" as const,
      message: `Source export "${address}" has no graph-selected owner edge in branch "${props.branch}".`,
    };
  if (candidates.length !== 1)
    return {
      success: false as const,
      binding: null,
      reason: "ambiguous" as const,
      message: `Source export "${address}" has ${candidates.length} graph-selected owner edges in branch "${props.branch}". Keep one exact authored target on the executed export.`,
    };
  const binding: IAutoMovieProductionEvidenceSourceOwnerBinding = candidates[0]!;
  const selectedOwner: string = `${binding.targetPath}#${binding.targetAnchor}`;
  if (props.owner !== undefined && selectedOwner !== props.owner)
    return {
      success: false as const,
      binding: null,
      reason: "owner" as const,
      message: `Source export "${address}" is graph-bound to "${selectedOwner}", not runtime owner "${props.owner}".`,
    };
  if (binding.sourceDigest !== props.sourceDigest)
    return {
      success: false as const,
      binding: null,
      reason: "digest" as const,
      message: `Source export "${address}" is bound at source digest ${binding.sourceDigest}, but execution supplied ${props.sourceDigest}.`,
    };
  if (props.requireReviewed && !isAutoMovieSourceOwnerBindingComplete(binding))
    return {
      success: false as const,
      binding: null,
      // Preserve the public refusal category used by existing consumers.
      reason: "review" as const,
      message: `Source export "${address}" has no completed enforced owner edge for "${selectedOwner}".`,
    };
  return {
    success: true as const,
    binding,
    reason: null,
    message: null,
  };
}
