import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanVariation,
  AutoMovieMotionHumanVariationDraw,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionVariationSource } from "../internal/motionVariationSource";

/**
 * The draws and bound rules of the seeded variation
 * (`AutoMovieMotionHumanVariationDraw`) have the distributions and bounds
 * their documents state.
 *
 * A normal truncated at 2 spreads has mean 0 and variance `1 - 2 * 2
 * phi(2) / (Phi(2) - Phi(-2)) = 0.7737`, a standard deviation of 0.8796. A
 * standard normal disc cut at radius 2 puts `(1 - e^-0.5) / (1 - e^-2) =
 * 0.455` of its points within radius 1. The cell rule gives `MARGIN` (0.8)
 * of the distance to the nearer midpoint: on names 0, 1 and 3, a value of
 * 0.2 keeps 0.8 * 0.3 = 0.24, 0.6 keeps 0.8 * 0.1 = 0.08, 2.5 keeps 0.8 * 0.5
 * = 0.4 (the open side mirrors the inner one), and 0.5 or 5 keep nothing.
 *
 * Scenarios:
 * 1. Over 400 repeats, `normals` stays within [-2, 2] with mean 0 and
 *    standard deviation 0.8796, each within 0.05.
 * 2. Over 400 repeats, `disc` stays within radius 2 and puts 0.455 +- 0.04
 *    of its points within radius 1.
 * 3. `cell` gives the five values above, and 0 on an axis of one name.
 * 4. `basis` is a right-handed orthonormal frame along its direction,
 *    including a vertical one, and along +Z for a zero direction.
 * 5. `quantity` lies between the spread's two ends and narrows from a novice
 *    to an elite; `scalar` never exceeds its bound, and gives 0 without
 *    room.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Draws from real seeded series and reads each rule; a draw past its truncation, a biased or mis-scaled distribution, a wrong cell edge, a degenerate basis or an offset past its bound fails.
 * @evidence contracts/development/testing.md#independent-expectations The moments and the disc share are worked out from the normal distribution in the comment; the cell values are worked out by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases 400 repeats per draw, five cell values including a tie and an open side, three directions, two skills and three bounds.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the worked moments, share and cells and the 5 scenarios.
 */
export function test_motion_compose_variation_draw(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const D = AutoMovieMotionHumanVariationDraw;
  const N: number = 400;
  const series = (index: number) =>
    motionVariationSource({ index }).series("draw");

  // 1. Normals.
  const values: number[] = [];
  for (let i: number = 0; i < N; i++) {
    const drawn: number[] = D.normals(series(i), 1);
    values.push(...drawn);
  }
  const mean: number = values.reduce((a, b) => a + b, 0) / N;
  const sd: number = Math.sqrt(
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / N,
  );
  complaints.check(
    `normals lie in [-2, 2] with mean ${mean.toFixed(4)} and deviation ${sd.toFixed(4)}`,
    values.every((v) => Math.abs(v) <= D.TRUNCATE) &&
      Math.abs(mean) <= 0.05 &&
      Math.abs(sd - 0.8796) <= 0.05,
  );

  // 2. Disc.
  let inside: number = 0;
  let widest: number = 0;
  for (let i: number = 0; i < N; i++) {
    const [x, y] = D.disc(series(i));
    const r: number = Math.hypot(x, y);
    widest = Math.max(widest, r);
    if (r <= 1) inside++;
  }
  complaints.check(
    `the disc stays within radius 2 (widest ${widest.toFixed(4)}) with ${(inside / N).toFixed(3)} within radius 1`,
    widest <= D.TRUNCATE + 1e-12 && Math.abs(inside / N - 0.455) <= 0.04,
  );

  // 3. Cells.
  const names: number[] = [3, 0, 1];
  for (const [value, bound] of [
    [0.2, 0.24],
    [0.6, 0.08],
    [2.5, 0.4],
    [0.5, 0],
    [5, 0],
  ] as const)
    complaints.check(
      `the cell of ${value} keeps ${D.cell(names, value)}, ${bound} expected`,
      Math.abs(D.cell(names, value) - bound) <= 1e-12,
    );
  complaints.check("an axis of one name keeps nothing", D.cell([2], 2.3) === 0);

  // 4. Basis.
  const dot = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    a.x * b.x + a.y * b.y + a.z * b.z;
  for (const direction of [
    { x: 0.3, y: -0.2, z: 2 },
    { x: 0, y: 5, z: 0.01 },
    { x: 0, y: 0, z: 0 },
  ]) {
    const [a, b, c] = D.basis(direction) as [
      IAutoMovieVector3,
      IAutoMovieVector3,
      IAutoMovieVector3,
    ];
    const length: number = Math.hypot(direction.x, direction.y, direction.z);
    const along: IAutoMovieVector3 =
      length > 0
        ? {
            x: direction.x / length,
            y: direction.y / length,
            z: direction.z / length,
          }
        : { x: 0, y: 0, z: 1 };
    const det: number =
      a.x * (b.y * c.z - b.z * c.y) -
      a.y * (b.x * c.z - b.z * c.x) +
      a.z * (b.x * c.y - b.y * c.x);
    complaints.check(
      `the basis of (${direction.x}, ${direction.y}, ${direction.z}) is right-handed, orthonormal and along it`,
      Math.abs(dot(a, along) - 1) <= 1e-9 &&
        Math.abs(dot(a, b)) <= 1e-9 &&
        Math.abs(dot(a, c)) <= 1e-9 &&
        Math.abs(dot(b, c)) <= 1e-9 &&
        Math.abs(dot(b, b) - 1) <= 1e-9 &&
        Math.abs(dot(c, c) - 1) <= 1e-9 &&
        Math.abs(det - 1) <= 1e-9,
    );
  }

  // 5. Quantity and scalar.
  const spread = AutoMovieMotionHumanVariation.SPREADS.place;
  const novice: number = D.quantity(
    motionVariationSource({ skill: 0 }),
    "path",
    spread,
  );
  const elite: number = D.quantity(
    motionVariationSource({ skill: 1 }),
    "path",
    spread,
  );
  complaints.check(
    `the spread lies between its ends and narrows with skill (${novice.toFixed(4)} to ${elite.toFixed(4)})`,
    novice <= spread[0] + 1e-12 &&
      elite >= spread[1] - 1e-12 &&
      elite <= novice,
  );
  for (const bound of [0.005, 0.02, 1]) {
    let largest: number = 0;
    for (let i: number = 0; i < 100; i++)
      largest = Math.max(
        largest,
        Math.abs(
          D.scalar(
            motionVariationSource({ index: i }),
            "slot",
            "path",
            spread,
            1,
            bound,
          ),
        ),
      );
    complaints.check(
      `an offset bounded by ${bound} reaches ${largest.toFixed(5)}`,
      largest <= bound + 1e-12,
    );
  }
  complaints.check(
    "no room gives no offset",
    D.scalar(motionVariationSource(), "slot", "path", spread, 1, 0) === 0,
  );
  complaints.assert("every draw and bound rule is as documented");
}
