import type { IHumanSourceCut } from "./structures/IHumanSourceCut.ts";
import type { IHumanSourceDeltaReader } from "./structures/IHumanSourceDeltaReader.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";
import type { IHumanSourceFaceRecipeCandidate } from "./structures/IHumanSourceFaceRecipeCandidate.ts";

/**
 * Project original sampled states once for the face recipe recovery owner.
 * The original extraction cut, not a replaced provider topology, owns this
 * comparison. Current provider replay is read only after a recipe is known.
 */
export function createHumanSourceFaceRecipeCandidates(cut: IHumanSourceCut, reader: IHumanSourceDeltaReader, sample: IHumanSourceSample): IHumanSourceFaceRecipeCandidate[] {
  return sample.manifest.states.filter((state) => state.kind !== "body-macro-pair").map((state) => {
    const source = reader.skin(state.name), field = new Float64Array(3 * cut.faceSamples.length), sum = [0, 0, 0];
    cut.faceSamples.forEach(({ a, b, t }, vertex) => {
      for (let axis = 0; axis < 3; axis++) {
        const value = a === b ? source[3 * a + axis] : (1 - t) * source[3 * a + axis] + t * source[3 * b + axis];
        field[3 * vertex + axis] = value; sum[axis] += value;
      }
    });
    return { name: state.name, field, sum };
  });
}
