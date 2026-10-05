import { fillHumanSourceNippleRegion } from "./fillHumanSourceNippleRegion.ts";
import type { IHumanSourceBodyField } from "./structures/IHumanSourceBodyField.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";

/**
 * Replay the deleted body extractor's per-state arithmetic
 * (`44dec918c:extract-body-basis.py`, `sample_state`): fill the nipple region
 * on the absolute Blender sample, map to the shared frame, subtract the
 * equally treated neutral. The fill is the sampled operator
 * (`fillHumanSourceNippleRegion`), summed in index order, which may differ
 * from NumPy's BLAS order in the last bits inside the fill region only.
 */
export function createHumanSourceBodyField(sample: IHumanSourceSample, offset: number): IHumanSourceBodyField {
  const n = sample.manifest.vertices;
  const fill = (absolute: Float64Array): void => fillHumanSourceNippleRegion(sample, absolute);
  const frame = (blender: Float64Array): Float64Array => {
    const out = new Float64Array(3 * n);
    for (let v = 0; v < n; v++) {
      out[3 * v] = blender[3 * v];
      out[3 * v + 1] = blender[3 * v + 2] - offset;
      out[3 * v + 2] = -blender[3 * v + 1];
    }
    return out;
  };
  const filledNeutral = Float64Array.from(sample.neutral);
  fill(filledNeutral);
  const neutral = frame(filledNeutral);
  const landmarkCount = sample.manifest.landmarkIds.length;
  const landmarkFrame = (values: Float64Array, at: number): Float64Array => {
    const out = new Float64Array(3 * landmarkCount);
    for (let l = 0; l < landmarkCount; l++) {
      const x = values[at + 3 * l];
      const y = values[at + 3 * l + 1];
      const z = values[at + 3 * l + 2];
      out[3 * l] = x;
      out[3 * l + 1] = z - offset;
      out[3 * l + 2] = -y;
    }
    return out;
  };
  const landmarksNeutral = landmarkFrame(sample.landmarksNeutral, 0);
  const state = (name: string) => {
    const found = sample.states.get(name);
    if (found === undefined) throw new Error(`No sampled state ${name}.`);
    return found;
  };
  return {
    neutral,
    landmarksNeutral,
    delta: (name) => {
      const s = state(name);
      const absolute = Float64Array.from(sample.neutral);
      for (let i = 0; i < s.rowCount; i++) {
        const row = s.rowOffset + i;
        const v = sample.rowsVertex[row];
        for (let c = 0; c < 3; c++) absolute[3 * v + c] = sample.neutral[3 * v + c] + sample.rowsDelta[3 * row + c];
      }
      fill(absolute);
      const mapped = frame(absolute);
      for (let i = 0; i < mapped.length; i++) mapped[i] -= neutral[i];
      return mapped;
    },
    landmarks: (name) => {
      const s = state(name);
      const absolute = new Float64Array(3 * landmarkCount);
      for (let i = 0; i < absolute.length; i++)
        absolute[i] = sample.landmarksNeutral[i] + sample.landmarkDelta[3 * s.landmarkOffset + i];
      const mapped = landmarkFrame(absolute, 0);
      for (let i = 0; i < mapped.length; i++) mapped[i] -= landmarksNeutral[i];
      return mapped;
    },
  };
}
