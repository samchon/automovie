import {
  type IAutoMovieSweepSurface,
  compileAutoMovieSweep,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { sweepGirthTube } from "../internal/sweepGirthTube";
import { sweepRowPerimeter } from "../internal/sweepRowPerimeter";

/** Metres each held limit perimeter may differ from the declared one. */
const HELD: number = 0.0005;

/**
 * Girth rings one row apart hold their perimeters together, though each
 * ring's factor moves its neighbours' rows.
 *
 * Scenarios:
 *
 * 1. The elliptic tube with girth rings at `u` 0.375, 0.5 and 0.625,
 *    declaring 3% more, the same and 2% less than the sweep's own
 *    perimeters there, as a trunk's waist, underbust and chest pull apart:
 *    at the medium tier, 16 columns, where the rings are a row apart, every
 *    subdivided limit perimeter lies within 0.5 mm of its declaration.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples the network with `sampleAutoMovieSurfaceNetwork` and measures the subdivided limit along each ring; solving each ring's factor alone, which crawls or oscillates when the factors couple, fails to converge and throws, while any joint solve that meets every declaration passes.
 * @evidence contracts/testing.md#independent-expectations Each declaration is the sweep's own section perimeter at its ring, a dense polyline of `compileAutoMovieSweep`, times a stated ratio; each measurement is a Richardson-extrapolated polyline through subdivided limit positions.
 * @evidence contracts/testing.md#distinguishing-cases Covers three coupled rings pulled in opposite directions; column counts and a single ring are owned by the girth and girth corners tests and the refusals by the girth refusal test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_girth_coupled` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_girth_coupled(): void {
  const sweep: IAutoMovieSweepSurface = compileAutoMovieSweep(
    sweepGirthTube({ exponent: 2 }).sweeps.tube!,
  );
  const section = (u: number): number => {
    let length: number = 0;
    for (let k: number = 0; k < 4096; ++k) {
      const a = sweep.point(u, k / 4096);
      const b = sweep.point(u, (k + 1) / 4096);
      length += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    }
    return length;
  };
  const declared: Array<[number, number]> = [
    [0.375, 1.03 * section(0.375)],
    [0.5, section(0.5)],
    [0.625, 0.98 * section(0.625)],
  ];
  const network = sweepGirthTube({
    exponent: 2,
    perimeter: declared[1]![1],
    beside: [declared[0]![1], declared[2]![1]],
  });
  const measured: number[] = sweepRowPerimeter(
    network,
    "medium",
    declared.map(([u]: [number, number]): number => u),
  );
  TestValidator.equals(
    "coupled girths all hold",
    declared.map(
      ([, perimeter]: [number, number], k: number): boolean =>
        Math.abs(measured[k]! - perimeter) <= HELD,
    ),
    [true, true, true],
  );
}
