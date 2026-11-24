import {
  autoMovieHemisphereDirections,
  autoMovieIrradianceOf,
  projectAutoMovieIrradianceProbe,
} from "@automovie/engine";
import type {
  IAutoMovieIrradianceProbe,
  IAutoMovieProjectIrradianceProbe,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A probe above a lit floor reports the floor's bounce: the cube projection and
 * cosine convolution turn what the cube sees into the irradiance a receiver
 * gets, within the order-2 error.
 *
 * A 40 m square floor of diffuse albedo 0.5 lies 1 m below the probe under a
 * 1000 lux directional light pointing straight down, so it has luminance 0.5 ×
 * 1000 / π = 159.2 nits and nothing else is lit. The probe's six 32-texel faces
 * are filled here from that geometry: a texel whose direction meets the floor
 * square sees 159.2 nits, every other texel sees black, and none sees a back
 * face.
 *
 * Scenarios:
 *
 * 1. A receiver facing down gets π × 159.2 × 0.998 = 499 ± 50 lux, where 0.998 is
 *    the square's view factor from 1 m and 10 % covers the order-2 error.
 * 2. A receiver facing up gets at most 50 lux, and the three channels are equal.
 * 3. An independent estimate, π times the mean radiance over 4096 cosine-weighted
 *    directions of `autoMovieHemisphereDirections` about the downward normal,
 *    cast against the floor, reproduces the downward receiver's analytic value
 *    within 2 %.
 * 4. A face set that misses a face, or a size of zero, throws.
 *
 * The GPU bake of the same floor is compared with these values in a capture
 * under the visual-debugging skill.
 */
export function test_unit_render_draw_film_probes_floor(): void {
  const luminance: number = (0.5 * 1000) / Math.PI;
  const seen: (d: IAutoMovieVector3) => number = (
    d: IAutoMovieVector3,
  ): number => {
    if (d.y >= 0) return 0;
    const t: number = 1 / -d.y;
    return Math.abs(t * d.x) <= 20 && Math.abs(t * d.z) <= 20 ? luminance : 0;
  };
  const probe: IAutoMovieIrradianceProbe = projectAutoMovieIrradianceProbe({
    size: 32,
    faces: cubeFaces(32, seen),
  });

  // The view factor of a square of half side a, seen from distance h on its
  // axis: 4 × (1 / 2π) × (A / √(1+A²) atan(B / √(1+A²)) + B / √(1+B²) atan(A / √(1+B²)))
  // with A = B = a / h (rectangle-to-parallel-element formula, applied per quadrant).
  const a: number = 20;
  const s: number = Math.sqrt(1 + a * a);
  const factor: number = (4 / (2 * Math.PI)) * (2 * (a / s) * Math.atan(a / s));
  const analytic: number = Math.PI * luminance * factor;

  // 1 and 2.
  const down: [number, number, number] = autoMovieIrradianceOf(probe, {
    x: 0,
    y: -1,
    z: 0,
  });
  const up: [number, number, number] = autoMovieIrradianceOf(probe, {
    x: 0,
    y: 1,
    z: 0,
  });
  TestValidator.predicate(
    `the downward receiver gets 499 ± 50 lux (${down[0].toFixed(1)}; analytic ${analytic.toFixed(1)})`,
    Math.abs(down[0] - 499) <= 50 && Math.abs(factor - 0.998) < 0.001,
  );
  TestValidator.predicate(
    `the upward receiver gets at most 50 lux (${up[0].toFixed(1)})`,
    up[0] <= 50 && up[0] === up[1] && up[1] === up[2],
  );

  // 3. Independent reference.
  const directions: IAutoMovieVector3[] = autoMovieHemisphereDirections({
    normal: { x: 0, y: -1, z: 0 },
    count: 4096,
  });
  const estimate: number =
    (Math.PI *
      directions.reduce(
        (sum: number, d: IAutoMovieVector3): number => sum + seen(d),
        0,
      )) /
    directions.length;
  TestValidator.predicate(
    `the cosine-weighted ray estimate agrees within 2 % (${estimate.toFixed(1)})`,
    Math.abs(estimate - analytic) <= 0.02 * analytic,
  );

  // 4. Malformed inputs.
  const refused: (props: IAutoMovieProjectIrradianceProbe.IProps) => boolean = (
    props: IAutoMovieProjectIrradianceProbe.IProps,
  ): boolean => {
    try {
      projectAutoMovieIrradianceProbe(props);
      return false;
    } catch {
      return true;
    }
  };
  TestValidator.predicate(
    "five faces or a zero size throw",
    refused({ size: 32, faces: cubeFaces(32, seen).slice(0, 5) }) &&
      refused({ size: 0, faces: cubeFaces(32, seen) }),
  );
}

/**
 * Six cube faces of a probe, each texel's radiance taken from `seen` along its
 * direction.
 */
function cubeFaces(
  size: number,
  seen: (direction: IAutoMovieVector3) => number,
): IAutoMovieProjectIrradianceProbe.IFace[] {
  const frames: [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3][] = [
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
  return frames.map(
    ([forward, right, up]: [
      IAutoMovieVector3,
      IAutoMovieVector3,
      IAutoMovieVector3,
    ]): IAutoMovieProjectIrradianceProbe.IFace => {
      const radiance: Float32Array = new Float32Array(size * size * 4);
      for (let j: number = 0; j < size; ++j)
        for (let i: number = 0; i < size; ++i) {
          const s: number = ((i + 0.5) / size) * 2 - 1;
          const t: number = ((j + 0.5) / size) * 2 - 1;
          const value: number = seen({
            x: forward.x + s * right.x + t * up.x,
            y: forward.y + s * right.y + t * up.y,
            z: forward.z + s * right.z + t * up.z,
          });
          radiance.set([value, value, value, 1], 4 * (j * size + i));
        }
      return {
        forward,
        right,
        up,
        radiance,
        backFaces: new Uint8Array(size * size),
      };
    },
  );
}
