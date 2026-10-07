import { decodeHumanSourceSparseState } from "./decodeHumanSourceSparseState.ts";
import type { IHumanSourceDeltaReader } from "./structures/IHumanSourceDeltaReader.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";
import type { IHumanSourceSampleState } from "./structures/IHumanSourceSampleState.ts";

/**
 * Read sampled states in the shared frame. The conversion of a delta is the
 * rotation part of the published frame map `[x, z - offset, -y]`; the offset
 * cancels in a difference of two samples.
 */
export function createHumanSourceDeltaReader(
  sample: IHumanSourceSample,
): IHumanSourceDeltaReader {
  const vertices = sample.manifest.vertices;
  const landmarkCount = sample.manifest.landmarkIds.length;
  const state = (name: string): IHumanSourceSampleState => {
    const found = sample.states.get(name);
    if (found === undefined) throw new Error(`No sampled state ${name}.`);
    return found;
  };
  const decode = (name: string) => {
    const current = state(name);
    return decodeHumanSourceSparseState({
      name,
      vertices,
      rowsVertex: sample.rowsVertex,
      rowsDelta: sample.rowsDelta,
      rowOffset: current.rowOffset,
      rowCount: current.rowCount,
      landmarkDelta: sample.landmarkDelta,
      landmarkOffset: current.landmarkOffset,
      landmarkCount,
    });
  };
  return {
    has: (name) => sample.states.has(name),
    state,
    skin: (name) => {
      const s = decode(name);
      const out = new Float64Array(3 * vertices);
      s.vertices.forEach((vertex, row) =>
        out.set(s.deltas.slice(3 * row, 3 * row + 3), 3 * vertex),
      );
      return out;
    },
    landmarks: (name) => decode(name).landmarks,
  };
}
