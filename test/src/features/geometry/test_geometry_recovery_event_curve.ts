import {
  type IAutoMovieRecoveryEventCurvePiece,
  type IAutoMovieRecoveryEventCurveArc,
  AutoMovieRecoveryEventCurve as E,
  prepareAutoMovieRecoveryAnnularChart,
} from "@automovie/recovery";


import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64";

/**
 * Native occurrence direction determines endpoint names and the annular seam.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls maintained occurrence admission, Bernstein restriction, reversal, native endpoint resolution and the actual annular chart constructor. Assertions inspect shared seam identity and native coefficient names rather than duplicated arithmetic.
 * @evidence contracts/testing.md#independent-expectations Reversing a cubic starts at its raw P3 and therefore uses the second native endpoint name. A proper interior parameter is neither native endpoint. Identical left/right objects establish one explicit seam owner. Different raw endpoint coordinates cannot claim an alias.
 * @evidence contracts/testing.md#distinguishing-cases Covers full forward/reverse, nonbinary proper restriction, reversed proper restriction, exact C0 rejection, false endpoint alias, nonhorizontal boundary preservation, explicit knot retention and degenerate seam rejection.
 * @evidence contracts/testing.md#execution-ownership Portable CPU-only generic curves exercise maintained recovery owners without a source asset, process, disk, fitter, renderer or anatomical fixture.
 */
export function test_geometry_recovery_event_curve(): void {
  const curve: (id: string, y: number) => C.Cubic = (
    id: string,
    y: number,
  ): C.Cubic => ({
    type: "cubicBezier",
    name: id,
    closed: true,
    unit: "mm",
    phaseUnit: "normalized",
    phaseIntervals: [1, 2],
    spans: [
      [
        [0, y, 0],
        [0.3, y + 0.1, 0],
        [1, y + 0.2, 0],
        [2, y + 0.3, 0],
      ],
      [
        [2, y + 0.3, 0],
        [1, y + 0.2, 1],
        [0.3, y + 0.1, 1],
        [0, y, 0],
      ],
    ],
  });
  const bottom: IAutoMovieRecoveryEventCurveArc = E.fromCurve(curve("lower", 0));
  const top: IAutoMovieRecoveryEventCurveArc = E.reverse(E.fromCurve(curve("upper", 3)));
  const chart: ReturnType<typeof prepareAutoMovieRecoveryAnnularChart> =
    prepareAutoMovieRecoveryAnnularChart(bottom, top, "domain");
  TestValidator.equals("one shared seam", chart.left === chart.right, true);
  TestValidator.equals(
    "forward native endpoint",
    chart.left.pieces[0]!.source.endpointAuthorities[0],
    "lower.knot0",
  );
  TestValidator.equals(
    "reverse native endpoint",
    E.endpointAuthority(top.pieces[0]!, 0),
    "upper.knot0",
  );
  TestValidator.equals(
    "seam upper occurrence uses parent P3",
    chart.left.pieces[0]!.source.endpointAuthorities[1],
    top.pieces[0]!.source.endpointAuthorities[1],
  );
  TestValidator.equals("three-dimensional boundary retained", chart.top, top);
  const restricted: IAutoMovieRecoveryEventCurveArc = E.portion(bottom, 0.13, 0.27);
  TestValidator.equals(
    "proper native start has no endpoint name",
    E.endpointAuthority(restricted.pieces[0]!, 0),
    null,
  );
  TestValidator.equals(
    "proper reversed start has no endpoint name",
    E.endpointAuthority(E.reverse(restricted).pieces[0]!, 0),
    null,
  );
  const end: IAutoMovieRecoveryEventCurveArc = E.portion(bottom, 0.13, 1 / 3);
  TestValidator.equals(
    "proper interval retains exact native end",
    E.endpointAuthority(end.pieces[0]!, 1),
    "lower.knot1",
  );
  const wrong: IAutoMovieRecoveryEventCurvePiece = {
    ...top.pieces[0]!,
    source: { ...top.pieces[0]!.source, start: 0, end: 0 },
  };
  TestValidator.error("empty native orientation cannot claim an endpoint", (): void => {
    E.endpointAuthority(wrong, 0);
  });
  const broken: C.Cubic = {
    ...curve("broken", 0),
    spans: [
      curve("broken", 0).spans[0]!,
      [
        [2.01, 0.3, 0],
        [1, 0, 1],
        [0, 0, 1],
        [0, 0, 0],
      ],
    ],
  };
  TestValidator.error("C0 mismatch rejected", (): void => {
    E.fromCurve(broken);
  });
  TestValidator.error("zero-length seam rejected", (): void => {
    prepareAutoMovieRecoveryAnnularChart(bottom, bottom, "collapsed");
  });
  const canonical: IAutoMovieRecoveryEventCurveArc = E.fromCurve({
    ...curve("phase", 0),
    canonicalKnots: [0, 0.13, 1],
  });
  TestValidator.equals(
    "declared phase retained",
    E.knots(canonical),
    [0, 0.13, 1],
  );
  TestValidator.equals(
    "reversed declared phase",
    E.knots(E.reverse(canonical)),
    [0, 0.87, 1],
  );
  const shifted: IAutoMovieRecoveryEventCurveArc = E.rotateAtKnot(canonical, 1);
  TestValidator.equals(
    "rotation retains native endpoint owner",
    E.endpointAuthority(shifted.pieces[0]!, 0),
    "phase.knot1",
  );
  TestValidator.equals(
    "rotation retains actual first coefficient",
    E.evaluate(shifted, 0),
    E.controls(canonical.pieces[1]!)[0],
  );
  TestValidator.error("one cubic cannot cross a native knot", (): void => {
    E.piece(bottom, 0.2, 0.7);
  });
  const first: IAutoMovieRecoveryEventCurveArc = E.line([0.3, 0, 0], [1, 0, 0], "first");
  const second: IAutoMovieRecoveryEventCurveArc = E.line([1, 0, 0], [2, 0, 0], "second");
  const combined: IAutoMovieRecoveryEventCurveArc = E.concatenate([first, second], "combined");
  TestValidator.equals(
    "composite retains both native pieces",
    combined.pieces.length,
    2,
  );
  TestValidator.equals(
    "composite exact start",
    E.evaluate(combined, 0),
    [0.3, 0, 0],
  );
  TestValidator.equals(
    "composite exact end",
    E.evaluate(combined, 1),
    [2, 0, 0],
  );
  TestValidator.error("disjoint paths cannot concatenate", (): void => {
    E.concatenate([second, first], "disjoint");
  });
  TestValidator.error("empty cubic rejected", (): void => {
    E.fromCurve({ ...curve("empty", 0), spans: [], phaseIntervals: [] });
  });
  TestValidator.error("zero width rejected", (): void => {
    E.fromCurve({ ...curve("zero-width", 0), phaseIntervals: [0, 1] });
  });
  TestValidator.error("nonmonotone phase rejected", (): void => {
    E.fromCurve({ ...curve("wrong-phase", 0), canonicalKnots: [0, 1, 1] });
  });
  TestValidator.error("empty portion rejected", (): void => {
    E.portion(bottom, 0.2, 0.2);
  });
  TestValidator.error("outside evaluation rejected", (): void => {
    E.evaluate(bottom, 1.01);
  });
  TestValidator.error("empty composite rejected", (): void => {
    E.concatenate([], "empty");
  });
  TestValidator.error("nonexistent rotation knot rejected", (): void => {
    E.rotateAtKnot(bottom, 2);
  });
}
