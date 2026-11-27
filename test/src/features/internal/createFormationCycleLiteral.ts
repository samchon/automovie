import type { IAutoMovieRenderFormationCycle } from "@automovie/render";
import * as THREE from "three";

/**
 * The smallest formation cycle: one take of one part over two samples, whose
 * matrices are both the identity row triple.
 */
export function createFormationCycleLiteral(): IAutoMovieRenderFormationCycle {
  const matrices: Float32Array = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
  ]);
  const texture: THREE.DataTexture = new THREE.DataTexture(
    matrices,
    2,
    3,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  const take: IAutoMovieRenderFormationCycle["active"] = {
    gait: "walk",
    strideMeters: 1,
    periodSeconds: 1,
    matrices,
    texture,
  };
  return {
    samples: 2,
    names: ["body"],
    takes: new Map([["walk", take]]),
    fallback: take,
    active: take,
    uniforms: {
      automovieCycleTexture: { value: texture },
      automovieCycleSamples: { value: 2 },
      automovieCycleRows: { value: 3 },
      automovieCycleAdvance: { value: 0 },
      automovieCycleTurn: { value: 0 },
    },
  };
}
