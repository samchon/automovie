import type { IAutoMovieRecoveryInput } from "@automovie/interface/recovery";

import { AutoMovieRecoveryMeshSections } from "./internal/AutoMovieRecoveryMeshSections";
import type { IAutoMovieRecoveryOperation } from "./IAutoMovieRecoveryOperation";

/**
 * Observe a registered mesh and return source-free cubic coefficients and incidence.
 * Inputs are borrowed and remain unchanged. Numerical fitting failures are reported
 * by the observation owner; unsupported local components retain their diagnostics.
 * No original position, triangle, normal or rig array enters the returned bundle.
 *
 * @evidence contracts/common.md#principled-implementation Existing plane cuts, PL links and physical cubic fitting supply the sole observation result.
 * @evidence contracts/common.md#clear-and-simple-design The memory boundary owns terminal states while recovery owns observation and fitting; existing engine operations retain their shared curve and surface responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no source replacement, specimen branch, retry or automatic tolerance change.
 * @evidence contracts/common.md#meaningful-documentation States source lifetime, source-free output and declared coverage rather than fidelity.
 * @evidence contracts/performance.md#efficient-algorithms The delegated observation costs O(V+T+P) storage with indexed cut traversal and adaptive fitting; this wrapper adds only diagnostic scans.
 * @evidence contracts/performance.md#reuse-equivalent-work One extraction result supplies both value and coverage; no cross-call cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed source arrays live for the call, outputs transfer to the caller, and cancellation acquires no listener or handle.

 */
export function observeAutoMovieRecovery(
  input: IAutoMovieRecoveryInput,
  options: IAutoMovieRecoveryOperation.Options = {},
): IAutoMovieRecoveryOperation.Result<AutoMovieRecoveryMeshSections.Bundle> {
  const schema: IAutoMovieRecoveryOperation.Result<never>["schema"] = "automovie-recovery-operation-v1";
  const operator: IAutoMovieRecoveryOperation.Result<never>["operator"] = "legacy-contour-v1";
  if (options.signal?.aborted)
    return { schema, operator, status: "cancelled", diagnostics: ["Cancelled before observation"] };
  if (!input || !Array.isArray(input.verticesMm) || !Array.isArray(input.triangles))
    return { schema, operator, status: "refused", diagnostics: ["Registered millimetre vertices and oriented triangle arrays are required"] };
  try {
    const value: AutoMovieRecoveryMeshSections.Bundle = AutoMovieRecoveryMeshSections.extract(input,
      (phase: string, completed: number, total: number): void => {
        if (options.signal?.aborted) throw new Error("Observation cancelled");
        options.onProgress?.(phase, completed, total);
      }, options.sectionLimit);
    if (options.signal?.aborted)
      return { schema, operator, status: "cancelled", diagnostics: ["Cancelled before publication"] };
    const partial: boolean = value.coverage?.complete === false || value.topologyGaps.length > 0 || value.unconsumedEvents.length > 0 || value.reports.some((report: AutoMovieRecoveryMeshSections.Bundle["reports"][number]): boolean => report.open.length > 0 || report.isolatedContactsMm.length > 0 || report.diagnostics.length > 0);
    return { schema, operator, status: partial ? "partial" : "complete", value, diagnostics: value.diagnostics.slice() };
  } catch (failure: unknown) {
    return { schema, operator, status: options.signal?.aborted ? "cancelled" : "failed", diagnostics: [failure instanceof Error ? failure.message : String(failure)] };
  }
}
