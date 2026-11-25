import type { IAutoMovieFormationCycle } from "@automovie/render";
import * as THREE from "three";

/**
 * A one-part formation cycle of two samples with a walking take and an idle
 * fallback.
 *
 * The walking take's part has the identity rotation and a translation along X
 * that is 0 at sample 0 and 10 at sample 1, a stride of 2 m and a period of 1 s.
 * The idle take has no stride and a period of 4 s.
 */
export function createFormationCycleFixture(): IAutoMovieFormationCycle {
  const samples: number = 2;
  const matrices: Float32Array = new Float32Array(3 * samples * 4);
  for (let sample: number = 0; sample < samples; ++sample)
    for (let row: number = 0; row < 3; ++row)
      matrices[(row * samples + sample) * 4 + row] = 1;
  matrices[(0 * samples + 1) * 4 + 3] = 10;
  const texture = (): THREE.DataTexture =>
    new THREE.DataTexture(new Float32Array(4), 1, 1);
  const walk: IAutoMovieFormationCycle["fallback"] = {
    gait: "walk",
    strideMeters: 2,
    periodSeconds: 1,
    matrices,
    texture: texture(),
  };
  const idle: IAutoMovieFormationCycle["fallback"] = {
    gait: "idle",
    strideMeters: 0,
    periodSeconds: 4,
    matrices: new Float32Array(matrices.length),
    texture: texture(),
  };
  return {
    samples,
    names: ["body"],
    takes: new Map([["walk", walk]]),
    fallback: idle,
    active: idle,
    uniforms: {
      automovieCycleTexture: { value: idle.texture },
      automovieCycleSamples: { value: samples },
      automovieCycleRows: { value: 3 },
      automovieCycleAdvance: { value: 0 },
      automovieCycleTurn: { value: 0 },
    },
  };
}