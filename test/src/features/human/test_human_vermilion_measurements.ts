import { AutoMovieHumanVermilion } from "../../../../packages/human/src/appearance/AutoMovieHumanVermilion";
import type { IAutoMovieHumanHermiteCurve } from "../../../../packages/human/src/lofting/IAutoMovieHumanHermiteCurve";
import { HumanVermilionMeasurements as M } from "../internal/HumanVermilionMeasurements";

/**
 * The actual appearance colour boundary locates ls/li independently of the anterior lip bulge.
 *
 * @evidence contracts/testing.md#behavioral-verification Moves lip prominence, colour border and final skin independently. The former prominence measurement is red while actual border-to-stomion distances are green. The real appearance consumer reports half lip weight at its declared boundary.
 * @evidence contracts/testing.md#independent-expectations Independently authored median border points [98,8,0] and [98,-10,0] with stomion [100,0,0] imply sqrt(68) and sqrt(104) mm. Moving final skin depth to 95 implies sqrt(89), without reading a target or solve coefficient.
 * @evidence contracts/testing.md#distinguishing-cases Cupid peaks are higher than the median border, prominence moves between y3 and y6, border-only and skin-only changes have distinct expected effects, and missing boundary or skin stays non-finite.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test selected by --include human_vermilion_measurements, evaluating the real portable colour-boundary consumer and independent final-skin reader without person generation or a host.
 */
export function test_human_vermilion_measurements(): void {
  const boundary: AutoMovieHumanVermilion.IBoundary = AutoMovieHumanVermilion.prepare(curve(8, -10));
  const sto: M.Point = [100, 0, 0];
  const expectedUpper: number = Math.sqrt(68);
  const expectedLower: number = Math.sqrt(104);
  const rows: unknown[] = [];
  for (const apex of [3, 6]) {
    const median: M.Point[][] = [skin(apex)];
    const read: M.IReading = M.read(boundary.points, median, sto);
    check("upper border independent of bulge", close(read.upper, expectedUpper));
    check("lower border independent of bulge", close(read.lower, expectedLower));
    const wrong: number = Math.hypot(1, apex);
    check("old prominence oracle is red", !close(wrong, expectedUpper));
    rows.push({ apex, expectedUpper, measuredUpper: read.upper, expectedLower, measuredLower: read.lower, wrongProminence: wrong });
  }
  check("real consumer puts border at half colour weight", close(AutoMovieHumanVermilion.weight(boundary, [98, 8, 0], [1, 0, 0]), 0.5));
  const moved: AutoMovieHumanVermilion.IBoundary = AutoMovieHumanVermilion.prepare(curve(6, -10));
  const changed: M.IReading = M.read(moved.points, [skin(3)], sto);
  const x: number = 101 + (98 - 101) * (6 - 3) / (8 - 3);
  check("moving only the colour border changes the known skin read", close(changed.upper, Math.hypot(x - 100, 6)));
  const displacedSkin: M.Point[] = skin(3).map((point: M.Point): M.Point => point[1] === 8 ? [95, point[1], point[2]] : point);
  const independent: M.IReading = M.read(boundary.points, [displacedSkin], sto);
  check("actual skin depth is measured rather than returned guide", close(independent.upper, Math.sqrt(89)));
  check("unavailable boundary stays red", !Number.isFinite(M.read([], [skin(3)], sto).upper));
  check("unavailable skin stays red", !Number.isFinite(M.read(boundary.points, [], sto).upper));
  console.log(JSON.stringify({ status: "PASS", peopleGenerated: 0, rows, movedBorder: changed.upper, independentSkin: independent.upper }, null, 2));
}

/** Analytic median with independently movable anterior lip prominence. */
function skin(apex: number): M.Point[] {
  return [[95, 15, 0], [98, 8, 0], [101, apex, 0], [100, 0, 0], [101, -5, 0], [98, -10, 0], [95, -15, 0]];
}

/** Closed exterior border whose Cupid peaks exceed its true median height. */
function curve(upper: number, lower: number): IAutoMovieHumanHermiteCurve {
  const points: M.Point[] = [[98, upper, 0], [98, upper + 2, 3], [100, 1, 20], [98, lower, 0], [100, 1, -20], [98, upper + 2, -3]];
  return { name: "synthetic exterior vermilion", chain: "head.lower", closed: true, spans: points.map((point: M.Point, k: number): IAutoMovieHumanHermiteCurve["spans"][number] => {
    const next: M.Point = points[(k + 1) % points.length]!;
    const length: number = Math.hypot(next[0] - point[0], next[1] - point[1], next[2] - point[2]);
    const derivative: M.Point = [(next[0] - point[0]) / length, (next[1] - point[1]) / length, (next[2] - point[2]) / length];
    return { address: `independent/${k}`, interval: length, start: point, end: next, startDerivative: derivative, endDerivative: derivative };
  }) };
}

/** Assertion independent of production dimensions. */
function check(label: string, result: boolean): void {
  if (!result) throw new Error(label);
}

/** Tight floating-point comparison of these exact linear fixtures. */
function close(a: number, b: number): boolean {
  return Number.isFinite(a) && Math.abs(a - b) < 1e-7;
}

