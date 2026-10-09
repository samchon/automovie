/** Replay every admitted acquired native state through the same TS head provider.
 * From test: ttsx -P tsconfig.human-source.json scripts/human-source/replay-head-source-provider.ts SAMPLE AUTHORING NEW_OUTPUT
 * Exact sparse nonzero rows and dense native joint differences retain original
 * state order and recipes. Every refusal is recorded and prevents completion;
 * no partial set becomes a normal generation input. Host details stay outside
 * the portable replay content manifest, whose schema the existing reader owns.
 */
import crypto from "node:crypto";
import path from "node:path";

import { createHumanSourcePublication } from "./createHumanSourcePublication.ts";
import { HumanHeadSourceProvider } from "./head-authoring/HumanHeadSourceProvider.ts";
import { readHumanHeadSourceAuthoring } from "./head-authoring/readHumanHeadSourceAuthoring.ts";
import { readHumanHeadSourceNativeState } from "./head-authoring/readHumanHeadSourceNativeState.ts";
import type { IHumanSourceAuthoredReplay } from "./structures/IHumanSourceAuthoredReplay.ts";
import type { IHumanSourceSampleState } from "./structures/IHumanSourceSampleState.ts";

const [sampleDirectory, source, output, ...extra] = process.argv.slice(2);
if (sampleDirectory === undefined || source === undefined || output === undefined || extra.length !== 0)
  throw new Error("Usage: replay-head-source-provider.ts SAMPLE AUTHORING NEW_OUTPUT");
const repository = path.resolve(__dirname, "../../..");
const authoring = readHumanHeadSourceAuthoring(sampleDirectory, source, repository, "test/scripts/human-source/replay-head-source-provider.ts");
const sample = authoring.sample, provider = new HumanHeadSourceProvider(authoring);
const neutral = provider.evaluate(sample.neutral, authoring.recipe, sample.landmarksNeutral);
const publication = createHumanSourcePublication(path.resolve(output));
const arrayBytes = (values: Float64Array | Int32Array): Uint8Array => new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
const sha = (bytes: Uint8Array): string => crypto.createHash("sha256").update(bytes).digest("hex");
try {
  publication.write("neutral.f64", arrayBytes(neutral.positions));
  publication.write("landmarks-neutral.f64", arrayBytes(neutral.joints));
  publication.write("polygons.json", JSON.stringify(neutral.polygons) + "\n");
  const rowIds: number[] = [], rowDeltas: number[] = [], jointDeltas: number[] = [];
  const states: IHumanSourceSampleState[] = [], refusals: unknown[] = [];
  const incidence = JSON.stringify(neutral.polygons);
  for (const [ordinal, state] of sample.manifest.states.entries()) {
    try {
      const decoded = readHumanHeadSourceNativeState(sample, state.name);
      const current = sample.neutral.slice(), currentJoints = sample.landmarksNeutral.slice();
      decoded.vertices.forEach((id, row) => {
        for (let axis = 0; axis < 3; axis++) current[3 * id + axis] += decoded.deltas[3 * row + axis];
      });
      currentJoints.forEach((_value, at) => { currentJoints[at] += decoded.landmarks[at]; });
      const evaluated = provider.evaluate(current, authoring.recipe, currentJoints);
      if (evaluated.positions.length !== neutral.positions.length || evaluated.joints.length !== neutral.joints.length || JSON.stringify(evaluated.polygons) !== incidence)
        throw new Error("Head source replay changed its declared population or frozen cell incidence.");
      const positionsDelta = evaluated.positions.map((value, at) => value - neutral.positions[at]);
      const jointsDelta = evaluated.joints.map((value, at) => value - neutral.joints[at]);
      if (!positionsDelta.every(Number.isFinite) || !jointsDelta.every(Number.isFinite))
        throw new Error("Head source sparse differences are not representable finite coordinates.");
      const offset = rowIds.length, landmarkOffset = jointDeltas.length / 3;
      for (let id = 0; id < evaluated.positions.length / 3; id++)
        if ([0, 1, 2].some((axis) => positionsDelta[3 * id + axis] !== 0)) {
          if (id > 2147483647) throw new Error("Head source native row identities exceed signed int32 representation.");
          rowIds.push(id);
          for (let axis = 0; axis < 3; axis++) rowDeltas.push(positionsDelta[3 * id + axis]);
        }
      for (const value of jointsDelta) jointDeltas.push(value);
      states.push({ ...state, rowOffset: offset, rowCount: rowIds.length - offset, landmarkOffset });
      console.log("[head-source-replay]", ordinal + 1, state.name, rowIds.length - offset);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      refusals.push({ ordinal: ordinal + 1, name: state.name, reason });
      console.log("[head-source-replay-refusal]", ordinal + 1, state.name, reason);
    }
  }
  publication.write("rows.i32", arrayBytes(Int32Array.from(rowIds)));
  publication.write("rows.f64", arrayBytes(Float64Array.from(rowDeltas)));
  publication.write("landmarks.f64", arrayBytes(Float64Array.from(jointDeltas)));
  const receipt: IHumanSourceAuthoredReplay = {
    schema: "automovie-authored-head-source-replay/2", originalNativeVertices: sample.manifest.vertices,
    vertices: neutral.positions.length / 3, landmarkIds: [...sample.manifest.landmarkIds], states,
    sourceStateCount: sample.manifest.states.length, complete: states.length === sample.manifest.states.length && refusals.length === 0,
    refusals, files: publication.files(), sampleInputs: Object.fromEntries(Object.entries(sample.manifest.files).map(([name, file]) => [name, file.sha256])),
    authoringInputsSha256: authoring.manifestSha256,
  };
  const manifest = JSON.stringify({ ...receipt, recipe: authoring.recipe, qualification: "Authored TS source replay; no biological fit, finite combination, pose, static export or rendered acceptance." }, null, 1) + "\n";
  publication.write("replay-manifest.json", manifest);
  if (refusals.length !== 0) throw new Error("Actual source replay refused " + refusals.length + " of " + sample.manifest.states.length + " states; partial assets are not a complete generation input.");
  publication.complete(sha(Buffer.from(manifest)), false, false, authoring.verifyUnchanged);
} catch (error) {
  publication.refuse(error);
  throw error;
}
