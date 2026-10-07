import crypto from "node:crypto";

import type { IHumanSourceAuthoredReplay } from "./structures/IHumanSourceAuthoredReplay.ts";
import type { IHumanSourceDeltaReader } from "./structures/IHumanSourceDeltaReader.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";
import { decodeHumanSourceSparseState } from "./decodeHumanSourceSparseState.ts";
import { readHumanSourcePublication } from "./readHumanSourcePublication.ts";

/** Read complete provider endpoints on the compacted current root.
 * Native rows retire only through the explicit source map; new authored nodes
 * carry their own provider deltas. Deltas rotate from Blender XYZ to public
 * [X,Z,-Y] metres without translating them. Frozen cut interpolation belongs
 * to the consuming partition. Every replay content byte is recorded in the
 * compiler input identity and rechecked before writing its derivatives. A
 * schema 1 manifest listed its host run record among those files and is
 * refused, because its digest would tie the generation id to one machine.
 */
export function readHumanSourceAuthoredReplay(
  directory: string,
  sample: IHumanSourceSample,
  nativeToSource: Int32Array,
  inputs: IHumanSourceGenerationInput[],
  authoringInputsSha256: string,
): IHumanSourceDeltaReader {
  const sha = (value: Buffer): string => crypto.createHash("sha256").update(value).digest("hex");
  const admitted = readHumanSourcePublication(directory, ["replay-manifest.json", "rows.i32", "rows.f64", "landmarks.f64"], "component");
  const manifestBytes = admitted.outputs.get("replay-manifest.json")!;
  const manifest = JSON.parse(manifestBytes.toString("utf8")) as IHumanSourceAuthoredReplay;
  inputs.push({ role: "complete authored provider replay", path: "replay/replay-manifest.json", revision: null,
    bytes: manifestBytes.length, sha256: sha(manifestBytes) });
  if (manifest.schema !== "automovie-authored-head-source-replay/2" || !manifest.complete || manifest.refusals.length !== 0 ||
      manifest.authoringInputsSha256 !== authoringInputsSha256 ||
      manifest.sourceStateCount !== sample.manifest.states.length || manifest.states.length !== manifest.sourceStateCount ||
      manifest.originalNativeVertices !== sample.manifest.vertices || manifest.vertices !== nativeToSource.length ||
      manifest.landmarkIds.join("\n") !== sample.manifest.landmarkIds.join("\n"))
    throw new Error("Authored replay does not completely cover this original source and current root.");
  for (const [name, file] of Object.entries(sample.manifest.files))
    if (manifest.sampleInputs[name] !== file.sha256) throw new Error(`Authored replay sampled input differs: ${name}.`);
  const states = new Map(manifest.states.map((state) => [state.name, state]));
  if (states.size !== manifest.states.length || sample.manifest.states.some((state) => {
    const actual = states.get(state.name);
    return actual === undefined || actual.kind !== state.kind || JSON.stringify(actual.recipe) !== JSON.stringify(state.recipe);
  })) throw new Error("Authored replay has a different named state or recipe population.");
  const bytes = new Map<string, Buffer>();
  for (const [name, expected] of Object.entries(manifest.files)) {
    const data = admitted.outputs.get(name);
    if (data === undefined) throw new Error(`Authored replay publication does not own ${name}.`);
    if (data.length !== expected.bytes || sha(data) !== expected.sha256)
      throw new Error(`Authored replay file differs from its manifest: ${name}.`);
    inputs.push({ role: "authored provider replay data", path: `replay/${name}`, revision: null, ...expected });
    bytes.set(name, data);
  }
  const data = (name: string): ArrayBuffer => {
    const buffer = bytes.get(name);
    if (buffer === undefined) throw new Error(`Authored replay lacks ${name}.`);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  };
  const rowsVertex = new Int32Array(data("rows.i32"));
  const rowsDelta = new Float64Array(data("rows.f64"));
  const joints = new Float64Array(data("landmarks.f64"));
  if (nativeToSource.some((vertex) => !Number.isSafeInteger(vertex) || vertex < -1))
    throw new Error("Authored replay has an invalid native-to-active source map.");
  const count = nativeToSource.reduce((maximum, vertex) => Math.max(maximum, vertex + 1), 0);
  const state = (name: string) => {
    const result = states.get(name);
    if (result === undefined) throw new Error(`No authored replay state ${name}.`);
    return result;
  };
  const decode = (name: string) => {
    const current = state(name);
    return decodeHumanSourceSparseState({ name, vertices: nativeToSource.length, rowsVertex, rowsDelta,
      rowOffset: current.rowOffset, rowCount: current.rowCount, landmarkDelta: joints,
      landmarkOffset: current.landmarkOffset, landmarkCount: manifest.landmarkIds.length });
  };
  return {
    has: (name) => states.has(name), state,
    skin: (name) => {
      const current = decode(name);
      const result = new Float64Array(3 * count);
      for (let row = 0; row < current.vertices.length; row++) {
        const native = current.vertices[row];
        const vertex = nativeToSource[native];
        if (vertex < 0) continue;
        result.set(current.deltas.slice(3 * row, 3 * row + 3), 3 * vertex);
      }
      return result;
    },
    landmarks: (name) => decode(name).landmarks,
  };
}
