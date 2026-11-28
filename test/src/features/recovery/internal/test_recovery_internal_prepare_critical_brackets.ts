import { AutoMovieRecoveryShape } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

type Critical = Parameters<typeof AutoMovieRecoveryShape.prepareCriticalBrackets>[0][number];

/**
 * `prepareRecoveryCriticalBrackets` brackets each critical level by
 * min(step / 100, a quarter of the gap to each neighbouring height), swaps the
 * level for the bracket, and marks flat, non-manifold or higher-order critical
 * links as unsupported.
 *
 * Scenarios:
 *
 * 1. A simple critical (no lower and one upper component) at 1.5 between
 *    heights 0, 1, 2, 3 with step 1 is bracketed by 0.01 at 1.49 and 1.51; the
 *    critical level 1.5 leaves the set and the vertex stays supported.
 * 2. A flat critical at the same level is bracketed too, but its vertex is
 *    unsupported and a "plateau" diagnostic and a topology gap are recorded.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names bounded physical brackets and unsupported plateau reports.
 * @evidence contracts/development/testing.md#behavioral-verification Applies the helper to a simple link and flat critical at the same level and checks swapped levels and diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations One hundredth of the unit step is smaller than either quarter-neighbor distance. The bracket around 1.5 is therefore [1.49, 1.51].
 */
export function test_recovery_internal_prepare_critical_brackets(): void {
  const event = (flat: boolean): Critical => ({
    level: 1.5,
    vertex: 7,
    p: [0, 0, 1.5],
    lower: 0,
    upper: 1,
    flat,
    manifold: true,
  });
  const heights: number[] = [0, 1, 2, 3];

  const simple = new Set<number>([1.5]);
  const none: string[] = [];
  const noGaps: { beforeMm: number; afterMm: number; reason: string }[] = [];
  const ok = AutoMovieRecoveryShape.prepareCriticalBrackets(
    [event(false)],
    heights,
    1,
    simple,
    none,
    noGaps,
  );
  TestValidator.equals("one bracket", ok.bracketed.length, 1);
  TestValidator.predicate(
    "the bracket ends",
    nclose(ok.bracketed[0]!.before, 1.49, 1e-12) &&
      nclose(ok.bracketed[0]!.after, 1.51, 1e-12),
  );
  TestValidator.equals("supported", ok.unsupportedVertices.size, 0);
  TestValidator.equals("the level is swapped", simple.has(1.5), false);
  TestValidator.equals("no diagnostics", none.length, 0);

  const flatLevels = new Set<number>([1.5]);
  const diagnostics: string[] = [];
  const gaps: { beforeMm: number; afterMm: number; reason: string }[] = [];
  const flat = AutoMovieRecoveryShape.prepareCriticalBrackets(
    [event(true)],
    heights,
    1,
    flatLevels,
    diagnostics,
    gaps,
  );
  TestValidator.equals("unsupported", [...flat.unsupportedVertices], [7]);
  TestValidator.equals("a plateau diagnostic", diagnostics, [
    "Unresolved plateau at 1.5 mm",
  ]);
  TestValidator.equals("one gap", gaps.length, 1);
}
