import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";
import type { IHumanSourceTopology } from "./structures/IHumanSourceTopology.ts";

/**
 * Convert the sampled skin to the shared frame and fan-triangulate it.
 *
 * The frame `[x, z - offset, -y]` and the fan from each polygon's first loop
 * corner are the conventions both published bases were extracted with (the
 * deleted extractors' `clip`/`correspondence` modules). `offset` is the
 * source-frame convention recorded by the body extraction receipt; the caller
 * proves it by exact twins rather than trusting the number.
 */
export function buildHumanSourceTopology(sample: IHumanSourceSample, offset: number): IHumanSourceTopology {
  const n = sample.manifest.vertices;
  const positions = new Float64Array(3 * n);
  for (let v = 0; v < n; v++) {
    positions[3 * v] = sample.neutral[3 * v];
    positions[3 * v + 1] = sample.neutral[3 * v + 2] - offset;
    positions[3 * v + 2] = -sample.neutral[3 * v + 1];
  }
  const triangles: number[] = [];
  const cornerUv: number[] = [];
  for (let p = 0; p < sample.loopStart.length; p++) {
    const start = sample.loopStart[p];
    const total = sample.loopTotal[p];
    for (let k = 1; k < total - 1; k++) {
      const loops = [start, start + k, start + k + 1];
      for (const loop of loops) {
        triangles.push(sample.loopVertex[loop]);
        cornerUv.push(sample.loopUv[2 * loop], 1 - sample.loopUv[2 * loop + 1]);
      }
    }
  }
  return {
    offset,
    vertexCount: n,
    positions,
    triangles: Int32Array.from(triangles),
    cornerUv: Float64Array.from(cornerUv),
  };
}
