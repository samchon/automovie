import { assertHumanSourceSparseStateInput } from "../assertHumanSourceSparseStateInput.ts";
import type { IHumanSourceSample } from "../structures/IHumanSourceSample.ts";
import type { IHumanHeadSourceNativeState } from "./structures/IHumanHeadSourceNativeState.ts";

/** Decode an admitted source state without the generation's public-frame rotation.
 * Head source authoring operates in Blender metres (+X left, +Z up, -Y anterior).
 * The existing span owner refuses malformed rows before arrays are sliced;
 * conversion to public [X,Z,-Y] belongs to downstream generation compilation.
 */
export function readHumanHeadSourceNativeState(
  sample: IHumanSourceSample,
  name: string,
): IHumanHeadSourceNativeState {
  const state = sample.states.get(name);
  if (state === undefined) throw new Error("No native source state: " + name);
  const landmarkCount = sample.manifest.landmarkIds.length;
  assertHumanSourceSparseStateInput({
    name,
    vertices: sample.manifest.vertices,
    rowsVertex: sample.rowsVertex,
    rowsDelta: sample.rowsDelta,
    rowOffset: state.rowOffset,
    rowCount: state.rowCount,
    landmarkDelta: sample.landmarkDelta,
    landmarkOffset: state.landmarkOffset,
    landmarkCount,
  });
  return {
    vertices: Array.from(sample.rowsVertex.slice(state.rowOffset, state.rowOffset + state.rowCount)),
    deltas: sample.rowsDelta.slice(3 * state.rowOffset, 3 * (state.rowOffset + state.rowCount)),
    landmarks: sample.landmarkDelta.slice(3 * state.landmarkOffset, 3 * (state.landmarkOffset + landmarkCount)),
  };
}
