import { TestValidator } from "@nestia/e2e";
import { FamilyConicDeformationAudit as A } from "../../../reference-conics/FamilyConicDeformationAudit";
import { nclose } from "../../internal/nclose";

/**
 * A deformation observer distinguishes discarded out-of-plane motion, finite columns and missing geometry on small made points.
 *
 * Scenarios:
 * 1. Identity has zero discrepancy; a 4 mm move normal to a nonunit XZ basis is 4 mm normal and 0 in-plane.
 * 2. A 3-4-5 displacement within that plane has length 5; rotating the plane makes the same lost X component normal instead.
 * 3. Under (x,y,z) -> (x,y+x^2,z), the column from (0,0,0) to (1,0,0) maps to (1,1,0), so its exact mapped candidate has angle 0. The start Jacobian would incorrectly give 45 degrees.
 * 4. Reversing a column gives 180 degrees. Translating both ends by (0,3,4) keeps angle 0 while both endpoint errors are 5 mm.
 * 5. A collapsed reference or candidate column has no angle; nonfinite inputs/results and a degenerate section plane are refused.
 * 6. A tiny known rotation remains measurable, a borrowed callback result cannot replace the first endpoint, large basis scales do not change the plane, and arithmetic overflow is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Numbers the six scenarios, their independent geometric answers and unavailable-input behavior.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the point and column observers on explicit in-memory triples; detects lost longitudinal displacement and a Jacobian substituted for a finite column.
 * @evidence contracts/development/testing.md#independent-expectations Orthogonal projection, the 3-4-5 triangle, the endpoints of an explicit quadratic shear and reversal determine the answers; the 1e-12 allowance covers ordinary small-coordinate roundoff; separate extreme-scale cases check basis normalization and overflow refusal.
 * @evidence contracts/development/testing.md#distinguishing-cases Identity, normal and in-plane errors, a rotated/nonunit plane, nonlinear transport, unchanged directions with wrong endpoints, reversed/collapsed columns and malformed values are distinct cases. Figure correspondence and appearance remain capture work.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit reached by --include human_deformation_audit; it builds no body, reads no reference and starts no host.
 */
export function test_human_deformation_audit(): void {
  const failures: string[] = [];

  /** Gather every assertion in this round before reporting failures together. */
  const observe: (label: string, predicate: () => boolean) => void = (label: string, predicate: () => boolean): void => {
    try { TestValidator.predicate(label, predicate); } catch { failures.push(label); }
  };
  const identity: (p: A.V3) => A.V3 = (p: A.V3): A.V3 => p;
  const lift: (p: A.V3) => A.V3 = (p: A.V3): A.V3 => [p[0], p[1] + 4, p[2]];
  const u: A.V3 = [2, 0, 0];
  const v: A.V3 = [0, 0, 3];

  /** Compare a geometric scalar within binary64 roundoff for these small inputs. */
  const near: (label: string, actual: number, expected: number) => void = (label: string, actual: number, expected: number): void => {
    observe(`${label}: ${actual} against ${expected}`, (): boolean => nclose(actual, expected, 1e-12));
  };
  const same: A.IPoint = A.point(identity, [1, 2, 3], [1, 2, 3], u, v);
  near("identity", same.distanceMm, 0);
  const lost: A.IPoint = A.point(lift, [0, 0, 0], [0, 0, 0], u, v);
  near("lost normal displacement", lost.normalMm, 4);
  near("no in-plane displacement", lost.inPlaneMm, 0);
  near("normal distance", lost.distanceMm, 4);
  const along: A.IPoint = A.point(identity, [0, 0, 0], [3, 0, 4], u, v);
  near("in-plane triangle", along.inPlaneMm, 5);
  near("in-plane total", along.distanceMm, 5);
  near("in-plane normal", along.normalMm, 0);
  near("rotated plane", A.point(identity, [0, 0, 0], [4, 0, 0], [0, 2, 0], v).normalMm, 4);

  const shear: (p: A.V3) => A.V3 = (p: A.V3): A.V3 => [p[0], p[1] + p[0] * p[0], p[2]];
  const exact: A.IColumn = A.column(shear, [[0, 0, 0], [1, 0, 0]], [[0, 0, 0], [1, 1, 0]]);
  near("finite nonlinear column", exact.degrees ?? NaN, 0);
  near("nonlinear start", exact.endpointMm[0], 0);
  near("nonlinear end", exact.endpointMm[1], 0);
  near("reversed column", A.column(identity, [[0, 0, 0], [1, 0, 0]], [[0, 0, 0], [-1, 0, 0]]).degrees ?? NaN, 180);
  const offset: A.IColumn = A.column(identity, [[0, 0, 0], [2, 0, 0]], [[0, 3, 4], [2, 3, 4]]);
  near("parallel column", offset.degrees ?? NaN, 0);
  near("wrong start despite equal angle", offset.endpointMm[0], 5);
  near("wrong end despite equal angle", offset.endpointMm[1], 5);
  observe("collapsed reference unavailable", (): boolean => A.column(identity, [[0, 0, 0], [0, 0, 0]], [[0, 0, 0], [1, 0, 0]]).degrees === null);
  observe("collapsed candidate unavailable", (): boolean => A.column(identity, [[0, 0, 0], [1, 0, 0]], [[0, 0, 0], [0, 0, 0]]).degrees === null);

  /** Check explicit observer refusals without changing a foreign method. */
  const refuses: (label: string, read: () => unknown) => void = (label: string, read: () => unknown): void => {
    let refused: boolean = false;
    try { read(); } catch { refused = true; }
    observe(label, (): boolean => refused);
  };
  refuses("degenerate plane", (): A.IPoint => A.point(identity, [0, 0, 0], [0, 0, 0], u, u));
  refuses("nonfinite source", (): A.IColumn => A.column(identity, [[NaN, 0, 0], [1, 0, 0]], [[0, 0, 0], [1, 0, 0]]));
  refuses("nonfinite map result", (): A.IPoint => A.point((): A.V3 => [0, Infinity, 0], [0, 0, 0], [0, 0, 0], u, v));
  const turn: number = 1e-9;
  near("tiny known angle", A.column(identity, [[0, 0, 0], [1, 0, 0]], [[0, 0, 0], [Math.cos(turn), Math.sin(turn), 0]]).degrees ?? NaN, (180 / Math.PI) * turn);
  const work: A.V3 = [0, 0, 0];
  const borrowed: (p: A.V3) => A.V3 = (p: A.V3): A.V3 => {
    [work[0], work[1], work[2]] = [p[0] + 1, p[1], p[2]];
    return work;
  };
  const reused: A.IColumn = A.column(borrowed, [[0, 0, 0], [1, 0, 0]], [[1, 0, 0], [2, 0, 0]]);
  near("borrowed start", reused.endpointMm[0], 0);
  near("borrowed end", reused.endpointMm[1], 0);
  near("borrowed direction", reused.degrees ?? NaN, 0);
  near("large basis scale", A.point(lift, [0, 0, 0], [0, 0, 0], [1e308, 0, 0], [0, 0, 1e308]).normalMm, 4);
  refuses("overflowing point discrepancy", (): A.IPoint => A.point(identity, [1e308, 0, 0], [-1e308, 0, 0], u, v));
  refuses("overflowing column", (): A.IColumn => A.column(identity, [[-1e308, 0, 0], [1e308, 0, 0]], [[0, 0, 0], [1, 0, 0]]));
  TestValidator.predicate(failures.join("; ") || "all deformation observer cases", (): boolean => failures.length === 0);
}
