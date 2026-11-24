import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection, AutoMovieHumanF1Mammary } from "@automovie/human";
import type { AutoMovieVector3Tuple, IAutoMovieHumanConicLoft, IAutoMovieHumanF1Mammary, IAutoMovieLoftSectionFrame, IAutoMovieViewPart } from "@automovie/interface";

/**
 * The breast's footprint by rule and the loop a host's skin makes with it.
 *
 * The made person: suprasternale at (120, 1400, 0), the hip centres' midpoint at (0, 700, 0), the shoulder point at (100, 1420, 180),
 * the armpit's front fold point at (110, 1300, 130), the bust point at (130, 1250, 95) and the umbilicus at (130, 1050, 0), the thorax
 * up `+Y`; the breast's course starts at (125, 1250, 40) along `+X`, its chart `u` up and `v` toward `-Z`. The made host is a round tube
 * of radius 150 mm about the `Y` axis from 800 to 1500 mm, its phase 0 toward `+X` on the median plane `z = 0`.
 *
 * Scenarios:
 * 1. The four reaches: up to `CSL / CNL = 100.5 / 192.5` of the midclavicular point's distance to the bust point (`|(20, -160, 5)| =
 *    161.32` mm) straight below the midclavicular point (1410), so `1410 - 84.22 - 1250 = 75.78` mm; down to the fold at `1400 - 0.59 x
 *    350 = 1193.5` (Fujisawa's index of the surface distance from suprasternale to the umbilicus, a straight line on the tube), 56.5 mm;
 *    lateral to the armpit's front fold point's `z`, 90 mm, toward `-v`; medial to the sternal border at `z = 27.8 / 2 / 133.1 x 142.5 /
 *    529.3 x 700`, 19.68 mm, toward `+v`.
 * 2. Without the umbilicus the fold falls back to de Leva's `181.5 / 529.3` of mid-hip to suprasternale: `1400 - 0.59 x (1 - 181.5 /
 *    529.3) x 700`, down 121.38 mm.
 * 3. The footprint's extremes stand at those reaches: up at clock 0, `+v` at a quarter turn.
 * 4. Every sampled loop point lies on the tube (radius 150 within 1e-6 mm), at its footprint point's height and on the tube's radius
 *    through it, and the loop's first clock derivative matches its central difference.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanF1Mammary.footprint`, `at` and `loop` on a made person and a made host.
 * @evidence contracts/development/testing.md#independent-expectations Each reach is hand arithmetic from the made points; a point dropped on a tube about `Y` along its radius keeps its height and its direction from the axis.
 * @evidence contracts/development/testing.md#distinguishing-cases A reach read along the wrong axis or sign, a footprint that is not the quarter ellipses, or a loop not on the host fails a scenario.
 * @evidence contracts/development/testing.md#execution-ownership Made points and one made tube.
 * @evidence contracts/development/common.md#meaningful-documentation Names every made point and the arithmetic behind each expectation.
 */
export function test_human_mammary_footprint(): void {
  const failures: string[] = [];
  const ring = (r: number): number[] => [r, 0, Math.SQRT2 - 1, 0, r, Math.SQRT2 - 1, -r, 0, Math.SQRT2 - 1, 0, -r, Math.SQRT2 - 1];
  const rho: number = 1 / (1 + 1 / Math.cos(Math.PI / 8));
  const field: number[] = [...ring(150), ...Array.from({ length: 8 }, (): number => rho)];
  const tube: IAutoMovieHumanConicLoft.IFamily = {
    name: "tube", centres: [[0, 800, 0], [0, 1500, 0]], halves: [], up: [1, 0, 0], layout: AutoMovieHumanConicSection.limb(1),
    knots: [0, 350, 700], values: field.map((x: number): number[] => [x, x, x]),
  };
  const host: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(tube, Array.from({ length: 71 }, (_, i: number): number => 10 * i));
  const navelless: IAutoMovieHumanF1Mammary.IPoints = {
    suprasternale: [120, 1400, 0], up: [0, 1, 0], hips: [0, 700, 0],
    shoulder: [100, 1420, 180], armpitFront: [110, 1300, 130], bust: [130, 1250, 95],
  };
  const points: IAutoMovieHumanF1Mammary.IPoints = { ...navelless, umbilicus: [130, 1050, 0] };
  const frame: IAutoMovieLoftSectionFrame = { origin: [125, 1250, 40], u: [0, 1, 0], v: [0, 0, -1] };
  const f: IAutoMovieHumanF1Mammary.IFootprint = AutoMovieHumanF1Mammary.footprint(frame, points, host);
  const share: number = 100.5 / 192.5, sternum: number = (142.5 / 529.3) * 700;
  const expected = { up: 1410 - share * Math.hypot(20, 160, 5) - 1250, down: 1250 - (1400 - 0.59 * 350), plusV: 40 - (27.8 / 2 / 133.1) * sternum, minusV: 130 - 40 };
  for (const key of ["up", "down", "plusV", "minusV"] as const)
    if (!(Math.abs(f.reaches[key] - expected[key]) <= 1e-6)) failures.push(`reach ${key} is ${f.reaches[key]}, expected ${expected[key]}`);
  const fallback: number = AutoMovieHumanF1Mammary.footprint(frame, navelless, host).reaches.down;
  const fallen: number = 1250 - (1400 - 0.59 * (1 - 181.5 / 529.3) * 700);
  if (!(Math.abs(fallback - fallen) <= 1e-6)) failures.push(`the fallback's down reach is ${fallback}, expected ${fallen}`);

  const top: AutoMovieVector3Tuple = AutoMovieHumanF1Mammary.at(f, 0), side: AutoMovieVector3Tuple = AutoMovieHumanF1Mammary.at(f, Math.PI / 2);
  if (!(Math.abs(top[1] - (1250 + expected.up)) <= 1e-9 && Math.abs(top[2] - 40) <= 1e-9)) failures.push("the up extreme stands at " + top.join(", "));
  if (!(Math.abs(side[2] - (40 - expected.plusV)) <= 1e-9 && Math.abs(side[1] - 1250) <= 1e-9)) failures.push("the +v extreme stands at " + side.join(", "));

  const loop: IAutoMovieHumanF1Mammary.ILoop = AutoMovieHumanF1Mammary.loop(host, f);
  for (let k: number = 0; k < 240; k += 7) {
    const clock: number = (2 * Math.PI * k) / 240, p = loop.at(clock).point, line = AutoMovieHumanF1Mammary.at(f, clock);
    if (!(Math.abs(Math.hypot(p[0], p[2]) - 150) <= 1e-6)) failures.push(`loop point ${k} stands ${Math.hypot(p[0], p[2])} mm from the tube's axis`);
    // Dropped along the tube's radius in its level section: the same height, and on the ray from the axis through the footprint point.
    if (!(Math.abs(p[1] - line[1]) <= 1e-6 && Math.abs(p[0] * line[2] - p[2] * line[0]) <= 1e-6 * 150 * Math.hypot(line[0], line[2]) && p[0] * line[0] + p[2] * line[2] > 0))
      failures.push(`loop point ${k} at ${p.join(", ")} is not its footprint point ${line.join(", ")} dropped along the radius`);
    const h: number = 1e-5, a = loop.at(clock - h).point, b = loop.at(clock + h).point, d = loop.at(clock).first;
    const gap: number = Math.hypot((b[0] - a[0]) / (2 * h) - d[0], (b[1] - a[1]) / (2 * h) - d[1], (b[2] - a[2]) / (2 * h) - d[2]);
    if (!(gap <= 1e-3 * Math.max(1, Math.hypot(...d)))) failures.push(`loop point ${k}'s first derivative differs from its central difference by ${gap}`);
  }
  if (failures.length > 0) throw new Error("mammary footprint:\n" + failures.join("\n"));
}
