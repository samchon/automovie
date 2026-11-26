import type { IAutoMovieRecoveryCriticalBracketsPreparationOperation } from "@automovie/interface";

/** Prepare critical physical brackets and retain explicit unresolvable gaps. */
export function prepareRecoveryCriticalBrackets(
  criticals: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[0],
  heights: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[1],
  stepMm: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[2],
  levels: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[3],
  diagnostics: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[4],
  topologyGaps: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[5],
): ReturnType<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation> {
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
