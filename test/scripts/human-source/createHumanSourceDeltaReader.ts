import type { IHumanSourceDeltaReader } from "./structures/IHumanSourceDeltaReader.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";
import type { IHumanSourceSampleState } from "./structures/IHumanSourceSampleState.ts";

/**
 * Read sampled states in the shared frame. The conversion of a delta is the
 * rotation part of the published frame map `[x, z - offset, -y]`; the offset
 * cancels in a difference of two samples.
 */
export function createHumanSourceDeltaReader(sample: IHumanSourceSample): IHumanSourceDeltaReader {
  const vertices = sample.manifest.vertices;
  const landmarkCount = sample.manifest.landmarkIds.length;
  const state = (name: string): IHumanSourceSampleState => {
    const found = sample.states.get(name);
    if (found === undefined) throw new Error(`No sampled state ${name}.`);
    return found;
  };
  return {
    has: (name) => sample.states.has(name),
    state,
    skin: (name) => {
      const s = state(name);
      const out = new Float64Array(3 * vertices);
      for (let i = 0; i < s.rowCount; i++) {
        const row = s.rowOffset + i;
        const v = sample.rowsVertex[row];
        out[3 * v] = sample.rowsDelta[3 * row];
        out[3 * v + 1] = sample.rowsDelta[3 * row + 2];
        out[3 * v + 2] = -sample.rowsDelta[3 * row + 1];
      }
      return out;
    },
    landmarks: (name) => {
      const s = state(name);
      const out = new Float64Array(3 * landmarkCount);
      for (let l = 0; l < landmarkCount; l++) {
        const at = 3 * (s.landmarkOffset + l);
        out[3 * l] = sample.landmarkDelta[at];
        out[3 * l + 1] = sample.landmarkDelta[at + 2];
        out[3 * l + 2] = -sample.landmarkDelta[at + 1];
      }
      return out;
    },
  };
}
