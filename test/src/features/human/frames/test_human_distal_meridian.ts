import type {
  AutoMovieVector3Tuple as Point,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import { FamilyConicDistalGauge } from "../../../reference-conics/FamilyConicDistalGauge";

/**
 * Compare the implicit phase map with the closed-form polar coordinates of
 * a translated circular section.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual measured-gauge pullback at the protected section and on the retained stock.
 * @evidence contracts/development/testing.md#independent-expectations Solves the circle equation for its positive ray radius and differentiates that expression twice.
 * @evidence contracts/development/testing.md#distinguishing-cases Both transverse offsets are nonzero. Keeping the same numeric phase on the shifted stock fails away from its own centre.
 * @evidence contracts/development/testing.md#execution-ownership Uses an analytic cylinder, one fixed chart and a finite phase sweep without a mesh or asset.
 */
export function test_human_distal_meridian(): void {
  const shift: Point = [0, 4, -2];
  const radius: number = 10;
  const jet = (s: number, theta: number): IAutoMovieSolidSurface.IJet => {
    const y: number = radius * Math.cos(theta);
    const z: number = radius * Math.sin(theta);
    return {
      p: [s, shift[1] + y, shift[2] + z],
      u: [1, 0, 0],
      v: [0, -z, y],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, -y, -z],
    };
  };
  const mark: number = 30;
  const read = FamilyConicDistalGauge.align(
    { origin: [mark, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
    { pointAt: (s) => (theta): Point => jet(s, theta).p, jet },
    mark,
  );
  for (let i: number = -32; i <= 32; ++i) {
    const phi: number = i * (Math.PI / 16);
    const c: number = Math.cos(phi), s: number = Math.sin(phi);
    const q: number = shift[1] * c + shift[2] * s;
    const dq: number = -shift[1] * s + shift[2] * c;
    const discriminant: number = Math.sqrt(
      radius ** 2 - shift[1] ** 2 - shift[2] ** 2 + q ** 2,
    );
    const r: number = q + discriminant;
    const first: number = dq + (q * dq) / discriminant;
    const second: number =
      -q + (dq ** 2 - q ** 2) / discriminant -
      (q * dq) ** 2 / discriminant ** 3;
    const lane = read(phi);
    for (const station of [mark, mark + radius]) {
      const own = lane(station);
      const predicted: Pick<IAutoMovieSolidSurface.IJet, "p" | "v" | "vv"> = {
        p: [station, r * c, r * s],
        v: [0, first * c - r * s, first * s + r * c],
        vv: [0, (second - r) * c - 2 * first * s, (second - r) * s + 2 * first * c],
      };
      for (const key of ["p", "v", "vv"] as const)
        assert.ok(
          Math.hypot(...own[key].map((x, axis): number => x - predicted[key][axis]!)) <
            1e-11,
          `${key} disagrees at phase ${phi} and station ${station}`,
        );
    }
  }
}
