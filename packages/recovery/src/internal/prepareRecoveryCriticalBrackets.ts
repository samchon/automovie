import type { IAutoMovieRecoveryMeshSections } from "../structures/mesh/IAutoMovieRecoveryMeshSections";
import type { critical } from "./mesh-observations/critical";

/**
 * Prepare critical physical brackets and retain explicit unresolvable gaps.
 *
 * @evidence contracts/common.md#principled-implementation The original ordered critical events, scalar-height binary search and physical epsilon arithmetic populate saved bracket levels; unsupported topology remains diagnosed without inferred closure.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns the extracted stage while the existing caller retains orchestration and its public contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original arithmetic, iteration order, identities and failure messages are retained without new fallback geometry or inferred correspondence.
 * @evidence contracts/common.md#meaningful-documentation States physical units, admitted authority and the stage's output responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Each event performs one logarithmic height lookup and the original saved-level removal traversal; all populations remain bounded by extraction admission.
 * @evidence contracts/performance.md#reuse-equivalent-work The same bracket records drive both station replacement and later exact event incidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Levels and diagnostic arrays are caller-owned and updated in their original order; returned sets and bracket records live for one extraction.
 */
export function prepareRecoveryCriticalBrackets(
  criticals: ReturnType<typeof critical>,
  heights: readonly number[],
  stepMm: number,
  levels: Set<number>,
  diagnostics: string[],
  topologyGaps: IAutoMovieRecoveryMeshSections["topologyGaps"],
): {
  unsupportedVertices: Set<number>;
  bracketed: {
    event: ReturnType<typeof critical>[number];
    before: number;
    after: number;
  }[];
} {
  const unsupportedVertices: Set<number> = new Set();
  const bracketed: {
    event: (typeof criticals)[number];
    before: number;
    after: number;
  }[] = [];
  for (const event of criticals) {
    let lo: number = 0,
      hi: number = heights.length;
    while (lo < hi) {
      const mid: number = (lo + hi) >> 1;
      if (heights[mid]! < event.level) lo = mid + 1;
      else hi = mid;
    }
    const epsilon: number = Math.min(
      stepMm / 100,
      (event.level - (heights[lo - 1] ?? event.level - stepMm)) / 4,
      ((heights[lo + 1] ?? event.level + stepMm) - event.level) / 4,
    );
    if (!(epsilon > 4e-9)) {
      const reason: string = `Unresolved critical precision at ${event.level} mm`;
      diagnostics.push(reason);
      unsupportedVertices.add(event.vertex);
      topologyGaps.push({
        beforeMm: event.level - stepMm / 100,
        afterMm: event.level + stepMm / 100,
        reason,
      });
      continue;
    }
    const before: number = event.level - epsilon,
      after: number = event.level + epsilon;
    levels.add(before);
    levels.add(after);
    bracketed.push({ event, before, after });
    const simple: boolean =
      (event.lower === 0 && event.upper === 1) ||
      (event.lower === 1 && event.upper === 0) ||
      (event.lower === 2 && event.upper === 2);
    if (event.flat || !event.manifold || !simple) {
      const reason: string = `Unresolved ${event.flat ? "plateau" : !event.manifold ? "unqualified non-cycle link" : "higher-order critical link"} at ${event.level} mm`;
      diagnostics.push(reason);
      topologyGaps.push({ beforeMm: before, afterMm: after, reason });
      unsupportedVertices.add(event.vertex);
    }
  }
  // Critical bracket cuts replace nominal stations inside their physical interval.
  // Their incident loop numbers therefore address the actual adjacent saved pair.
  for (const bracket of bracketed)
    for (const level of levels)
      if (level > bracket.before && level < bracket.after) levels.delete(level);
  return { unsupportedVertices, bracketed };
}
