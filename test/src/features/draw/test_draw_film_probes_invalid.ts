import {
  autoMovieIrradianceGrid,
  projectAutoMovieIrradianceProbe,
  sampleAutoMovieIrradianceVolume,
} from "@automovie/engine";
import type {
  IAutoMovieIrradianceProbe,
  IAutoMovieIrradianceVolume,
  IAutoMovieProjectIrradianceProbe,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A probe inside a solid is marked invalid and contributes nothing: the
 * receivers around it take only their valid neighbours, renormalized, and a
 * point outside the grid takes its nearest face's probes.
 *
 * Scenarios:
 *
 * 1. A probe whose cube sees back faces in every texel, as inside a closed box of
 *    the static layer, is invalid; one that sees back faces in exactly a
 *    quarter of its texels is still valid, and one past a quarter is not.
 * 2. In a two-probe grid along X whose first probe is invalid and second sees a
 *    uniform 100-nit surround (irradiance 100π lux for any normal), a point a
 *    quarter of the way from the invalid probe gets the valid probe's 100π, not
 *    the 75 % blend toward zero plain trilinear weights would give.
 * 3. With both probes invalid every point gets zero.
 * 4. A point beyond the grid's end takes the end probe's value; the grid of a 2 m
 *    box at 1 m spacing holds three probes per axis, positioned from `min`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Projects synthetic cubes and samples the volume; a validity threshold off by a texel, weights not renormalized or an unclamped grid coordinate fails.
 * @evidence contracts/development/testing.md#independent-expectations A uniform surround of radiance L gives irradiance π L for any normal; the quarter threshold and the renormalization are the issue's rules.
 * @evidence contracts/development/testing.md#distinguishing-cases The threshold's boundary on both sides, a mixed pair, an all-invalid pair and points outside the box; the floor's bounce is owned by `test_draw_film_probes_floor`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_probes_invalid`, with synthetic inputs and no GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_probes_invalid(): void {
  const size: number = 8;
  const texels: number = 6 * size * size;

  // 1. The quarter threshold.
  const backAt: (count: number) => IAutoMovieIrradianceProbe = (
    count: number,
  ): IAutoMovieIrradianceProbe =>
    projectAutoMovieIrradianceProbe({ size, faces: uniform(size, 0, count) });
  TestValidator.predicate(
    "all back faces, a quarter and just past a quarter",
    !backAt(texels).valid &&
      backAt(texels / 4).valid &&
      !backAt(texels / 4 + 1).valid,
  );

  // 2. A mixed pair along X.
  const lit: IAutoMovieIrradianceProbe = projectAutoMovieIrradianceProbe({
    size: 16,
    faces: uniform(16, 100, 0),
  });
  const inside: IAutoMovieIrradianceProbe = {
    ...backAt(texels),
    coefficients: lit.coefficients.map((): number => 0),
  };
  const pair: (
    first: IAutoMovieIrradianceProbe,
    second: IAutoMovieIrradianceProbe,
  ) => IAutoMovieIrradianceVolume = (
    first: IAutoMovieIrradianceProbe,
    second: IAutoMovieIrradianceProbe,
  ): IAutoMovieIrradianceVolume => ({
    min: { x: 0, y: 0, z: 0 },
    spacing: 1,
    counts: { x: 2, y: 1, z: 1 },
    probes: [first, second],
  });
  const at: (
    volume: IAutoMovieIrradianceVolume,
    point: IAutoMovieVector3,
  ) => number = (
    volume: IAutoMovieIrradianceVolume,
    point: IAutoMovieVector3,
  ): number =>
    sampleAutoMovieIrradianceVolume({
      volume,
      point,
      normal: { x: 0.3, y: 0.9, z: -0.2 },
    })[0];
  TestValidator.predicate(
    `a point near the invalid probe takes the valid one (${at(pair(inside, lit), { x: 0.25, y: 0, z: 0 }).toFixed(2)})`,
    nclose(
      at(pair(inside, lit), { x: 0.25, y: 0, z: 0 }),
      100 * Math.PI,
      0.02 * 100 * Math.PI,
    ),
  );

  // 3. No valid neighbour.
  TestValidator.predicate(
    "with no valid probe the bounce is zero",
    at(pair(inside, inside), { x: 0.5, y: 0, z: 0 }) === 0,
  );

  // 4. Clamping and the grid.
  TestValidator.predicate(
    "a point past the end takes the end probe",
    nclose(
      at(pair(lit, inside), { x: -3, y: 2, z: 5 }),
      at(pair(lit, inside), { x: 0, y: 0, z: 0 }),
      1e-12,
    ),
  );
  const grid: ReturnType<typeof autoMovieIrradianceGrid> =
    autoMovieIrradianceGrid({
      min: { x: -1, y: 0, z: 2 },
      max: { x: 1, y: 2, z: 4 },
      spacing: 1,
      layer: 1,
      revision: "a",
    });
  TestValidator.predicate(
    "a 2 m box at 1 m spacing holds 3 probes per axis from min",
    grid.counts.x === 3 &&
      grid.counts.y === 3 &&
      grid.counts.z === 3 &&
      grid.positions.length === 27 &&
      grid.positions[1]![0] === 0 &&
      grid.positions[26]![2] === 4,
  );
}

/**
 * Six faces of a uniform surround of `radiance` nits, the first `back` texels
 * flagged as back faces.
 */
function uniform(
  size: number,
  radiance: number,
  back: number,
): IAutoMovieProjectIrradianceProbe.IFace[] {
  const axes: [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3][] = [
    [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 1, z: 0 },
    ],
    [
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 1, z: 0 },
    ],
    [
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: -1 },
    ],
    [
      { x: 0, y: -1, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
    ],
    [
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ],
    [
      { x: 0, y: 0, z: -1 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ],
  ];
  let remaining: number = back;
  return axes.map(
    ([forward, right, up]: [
      IAutoMovieVector3,
      IAutoMovieVector3,
      IAutoMovieVector3,
    ]): IAutoMovieProjectIrradianceProbe.IFace => {
      const flags: Uint8Array = new Uint8Array(size * size);
      for (
        let k: number = 0;
        k < flags.length && remaining > 0;
        ++k, --remaining
      )
        flags[k] = 1;
      return {
        forward,
        right,
        up,
        radiance: new Float32Array(size * size * 4).fill(radiance),
        backFaces: flags,
      };
    },
  );
}
