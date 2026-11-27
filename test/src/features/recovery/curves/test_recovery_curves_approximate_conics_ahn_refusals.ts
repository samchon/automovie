import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMoviePlanarCurveSource,
} from "@automovie/interface";
import { AutoMovieRecoveryConicApproximation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { RecoveryConicSources } from "../../internal/RecoveryConicSources";
import { nclose } from "../../internal/nclose";

/**
 * The Ahn adaptation is deterministic and refuses honestly.
 *
 * Scenarios:
 *
 * 1. Repeated calls give the same status, arcs, queries and weights, and leave the
 *    options and source breaks unchanged.
 * 2. Invalid budgets and a throwing callback refuse without default geometry.
 * 3. An unsplit inflection under a one-arc budget refuses as budget exhausted.
 */
export function test_recovery_curves_approximate_conics_ahn_refusals(): void {
  const options: IAutoMovieConicApproximation.IOptions =
    RecoveryConicSources.options();

  const before: string = JSON.stringify(options);
  const cubic: IAutoMoviePlanarCurveSource = RecoveryConicSources.cubic;
  const convex: IAutoMoviePlanarCurveSource = RecoveryConicSources.convex;
  const fitted: IAutoMovieConicApproximation.IResult = AutoMovieRecoveryConicApproximation.approximateAhn(
    convex,
    options,
  );
  const repeated: IAutoMovieConicApproximation.IResult = AutoMovieRecoveryConicApproximation.approximateAhn(
    convex,
    options,
  );
  TestValidator.equals("deterministic status", repeated.status, fitted.status);
  TestValidator.equals(
    "deterministic count",
    repeated.arcs.length,
    fitted.arcs.length,
  );
  TestValidator.equals(
    "deterministic source queries",
    repeated.queries,
    fitted.queries,
  );
  for (const [i, arc] of repeated.arcs.entries())
    TestValidator.predicate(
      "deterministic weights",
      nclose(arc.weight, fitted.arcs[i]!.weight, 0),
    );
  TestValidator.equals("options not mutated", JSON.stringify(options), before);
  TestValidator.equals("source breaks not mutated", cubic.breaks, [0]);

  // Invalid contracts and inadequate budgets must not return default geometry.
  for (const invalid of [
    { ...options, maximumArcs: 0 },
    { ...options, maximumArcs: NaN },
    { ...options, maximumArcs: 1.5 },
    { ...options, maximumDepth: 53 },
    { ...options, maximumDepth: 1.5 },
    { ...options, toleranceMm: NaN },
    { ...options, toleranceMm: Infinity },
  ]) {
    const refusal: IAutoMovieConicApproximation.IResult = AutoMovieRecoveryConicApproximation.approximateAhn(
      convex,
      invalid,
    );
    TestValidator.equals("invalid admission", refusal.status, "refused");
    TestValidator.equals("admission invokes no callbacks", refusal.queries, 0);
  }
  const nonfiniteBreak: IAutoMovieConicApproximation.IResult = AutoMovieRecoveryConicApproximation.approximateAhn(
    { ...convex, breaks: [NaN] },
    options,
  );
  TestValidator.predicate(
    "a nonfinite source break refuses before sampling",
    nonfiniteBreak.status === "refused" && nonfiniteBreak.queries === 0,
  );
  const throwing: IAutoMovieConicApproximation.IResult = AutoMovieRecoveryConicApproximation.approximateAhn(
    {
      ...convex,
      evaluate: (_t: number): Readonly<AutoMovieVector2Tuple> => {
        throw new Error("Source acquisition failed");
      },
    },
    options,
  );
  TestValidator.equals("throwing source refused", throwing.status, "refused");
  TestValidator.predicate(
    "callback failure explained",
    throwing.diagnostics.includes("Source acquisition failed"),
  );
  const exhausted: IAutoMovieConicApproximation.IResult = AutoMovieRecoveryConicApproximation.approximateAhn(
    { ...cubic, breaks: [] },
    { ...options, maximumArcs: 1 },
  );
  TestValidator.equals(
    "unsplit inflection refused",
    exhausted.status,
    "refused",
  );
  TestValidator.predicate(
    "budget limitation explained",
    exhausted.diagnostics.some((diagnostic: string): boolean =>
      diagnostic.includes("budget exhausted"),
    ),
  );
}
