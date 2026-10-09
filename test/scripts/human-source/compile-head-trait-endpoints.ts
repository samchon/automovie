/** Compile actual paired dimensional endpoints through the same TS source provider.
 * From test: ttsx -P tsconfig.human-source.json scripts/human-source/compile-head-trait-endpoints.ts SAMPLE AUTHORING PROVIDER NEW_OUTPUT
 * Each of the existing 54 numerical fields moves by +/- one millimetre or
 * degree around its captured neutral. These samples are an authored prototype
 * envelope, not a clinical range, valid interpolation or combined-shape proof.
 * Existing provider neutral/joint bytes must reproduce before endpoints write.
 * All refusals remain recorded and prevent component completion.
 */
import { Vector3 } from "@automovie/engine";
import { humanPersonHeadShapeFieldUnit } from "@automovie/human/human/document/humanPersonHeadShapeFieldUnit";
import type { AutoMovieHumanPersonHeadShapeField } from "@automovie/human/human/structures/AutoMovieHumanPersonHeadShapeField";
import crypto from "node:crypto";
import path from "node:path";

import { createHumanSourcePublication } from "./createHumanSourcePublication.ts";
import { HumanHeadSourceProvider } from "./head-authoring/HumanHeadSourceProvider.ts";
import { readHumanHeadSourceAuthoring } from "./head-authoring/readHumanHeadSourceAuthoring.ts";
import type { IHumanHeadSourceRecipe } from "./head-authoring/structures/IHumanHeadSourceRecipe.ts";
import { readHumanSourcePublication } from "./readHumanSourcePublication.ts";
import type { IHumanSourceHeadTraitField } from "./structures/IHumanSourceHeadTraitField.ts";
import type { IHumanSourceHeadTraitPacket } from "./structures/IHumanSourceHeadTraitPacket.ts";

const [sampleDirectory, source, providerDirectory, output, ...extra] = process.argv.slice(2);
if ([sampleDirectory, source, providerDirectory, output].some((value) => value === undefined) || extra.length !== 0)
  throw new Error("Usage: compile-head-trait-endpoints.ts SAMPLE AUTHORING PROVIDER NEW_OUTPUT");
const repository = path.resolve(__dirname, "../../..");
const authoring = readHumanHeadSourceAuthoring(sampleDirectory, source, repository, "test/scripts/human-source/compile-head-trait-endpoints.ts");
const admitted = readHumanSourcePublication(path.resolve(providerDirectory), ["neutral-provider.f64", "joints-provider.f64", "head-provider-packet.json"], "component");
const provider = new HumanHeadSourceProvider(authoring), sample = authoring.sample;
const neutral = provider.evaluate(sample.neutral, authoring.recipe, sample.landmarksNeutral);
const arrayBytes = (values: Float64Array): Uint8Array => new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
const sha = (bytes: Uint8Array): string => crypto.createHash("sha256").update(bytes).digest("hex");
const neutralSha = sha(arrayBytes(neutral.positions)), jointsSha = sha(arrayBytes(neutral.joints));
if (neutralSha !== sha(admitted.outputs.get("neutral-provider.f64")!) || jointsSha !== sha(admitted.outputs.get("joints-provider.f64")!))
  throw new Error("The source authoring directory does not reproduce this provider's neutral and joint bytes.");
const groups: Array<readonly [string, readonly string[]]> = [
  ["cranial", ["head", "cranial"]], ["facial", ["head", "facial"]], ["cervical", ["head", "cervical"]],
  ["ears.left", ["ears", "left"]], ["ears.right", ["ears", "right"]], ["nasalExterior", ["nasalExterior"]],
];
const nodeAt = (recipe: IHumanHeadSourceRecipe, keys: readonly string[]): Record<string, unknown> => {
  let node: unknown = recipe;
  for (const key of keys) {
    if (node === null || typeof node !== "object" || !Object.hasOwn(node, key)) throw new Error("Dimensional recipe lacks complete source field group: " + keys.join("."));
    node = (node as Record<string, unknown>)[key];
  }
  if (node === null || typeof node !== "object" || Array.isArray(node)) throw new Error("Dimensional recipe group is not a named numerical record.");
  return node as Record<string, unknown>;
};
const dimensions: Array<readonly [AutoMovieHumanPersonHeadShapeField, readonly string[], string, "mm" | "degree"]> = [];
for (const [group, keys] of groups) for (const [key, value] of Object.entries(nodeAt(authoring.recipe, keys))) {
  if (key === "qualification") continue;
  const suffix = key.endsWith("OffsetDegrees") ? "OffsetDegrees" : "OffsetMillimetres";
  if (!key.endsWith(suffix) || typeof value !== "number" || !Number.isFinite(value)) throw new Error("A provider recipe entry lacks its exact finite dimensional unit: " + key);
  const id = (group + "." + key.slice(0, -suffix.length)) as AutoMovieHumanPersonHeadShapeField;
  const unit = suffix === "OffsetDegrees" ? "degree" : "mm";
  if (humanPersonHeadShapeFieldUnit(id) !== unit) throw new Error("Dimensional source field differs from its public quantity/unit owner: " + id);
  dimensions.push([id, keys, key, unit]);
}
if (dimensions.length !== 54 || new Set(dimensions.map(([id]) => id)).size !== 54)
  throw new Error("The complete anatomical recipe must carry its 54 independent dimensional fields.");
const facetNormals = (positions: Float64Array): Array<readonly [number, number, number]> => {
  const point = (id: number) => Vector3.create(positions[3 * id], positions[3 * id + 1], positions[3 * id + 2]);
  return neutral.polygons.flatMap((cell) => {
    if (cell.length !== 4) throw new Error("Dimensional source facets require original provider quadrilateral cells.");
    return [[cell[0], cell[1], cell[2]], [cell[0], cell[2], cell[3]]].map((triangle) => {
      const normal = Vector3.cross(Vector3.subtract(point(triangle[1]), point(triangle[0])), Vector3.subtract(point(triangle[2]), point(triangle[0])));
      return [normal.x, normal.y, normal.z] as const;
    });
  });
};
const baselineNormals = facetNormals(neutral.positions), incidence = JSON.stringify(neutral.polygons);
const publication = createHumanSourcePublication(path.resolve(output));
try {
  const fields: IHumanSourceHeadTraitField[] = [], refusals: unknown[] = [];
  for (const [id, keys, key, unit] of dimensions) {
    const neutralValue = nodeAt(authoring.recipe, keys)[key] as number;
    const field: IHumanSourceHeadTraitField = { id, unit, samplingDifference: 1,
      supportQualification: "authored +/-1 dimensional unit samples; no clinical range, interpolation, combination, person-contact or rendered qualification", endpoints: [] };
    for (const [difference, direction] of [[1, "positive"], [-1, "negative"]] as const) {
      const requested = structuredClone(authoring.recipe), node = nodeAt(requested, keys);
      node[key] = neutralValue + difference;
      try {
        const evaluated = provider.evaluate(sample.neutral, requested, sample.landmarksNeutral);
        if (evaluated.positions.length !== neutral.positions.length || evaluated.joints.length !== neutral.joints.length || JSON.stringify(evaluated.polygons) !== incidence)
          throw new Error("A dimensional endpoint changed fixed provider correspondence or cell population.");
        const normals = facetNormals(evaluated.positions);
        let minimumCosine = Infinity;
        normals.forEach((normal, ordinal) => {
          const before = baselineNormals[ordinal], length = Math.hypot(...normal), beforeLength = Math.hypot(...before);
          const cosine = (normal[0] * before[0] + normal[1] * before[1] + normal[2] * before[2]) / (length * beforeLength);
          if (!Number.isFinite(cosine) || cosine <= 0) throw new Error("An actual dimensional endpoint reverses or degenerates an emitted cell against its neutral source facet.");
          minimumCosine = Math.min(minimumCosine, cosine);
        });
        let changed = 0, changedNative = 0, changedJoints = 0, maximum = 0;
        for (let at = 0; at < evaluated.positions.length; at += 3) {
          const delta = [0, 1, 2].map((axis) => evaluated.positions[at + axis] - neutral.positions[at + axis]);
          if (delta.some((value) => value !== 0)) { changed++; if (at / 3 < sample.manifest.vertices) changedNative++; }
          maximum = Math.max(maximum, Math.hypot(...delta) * 1000);
        }
        for (let at = 0; at < evaluated.joints.length; at += 3) if ([0, 1, 2].some((axis) => evaluated.joints[at + axis] !== neutral.joints[at + axis])) changedJoints++;
        if (!Number.isFinite(maximum)) throw new Error("Dimensional endpoint displacement is not representable finite millimetres.");
        if (changed === 0) throw new Error("This named source trait has no actual positional effect in the authored neutral.");
        const positions = id + "." + direction + ".f64", joints = id + "." + direction + ".joints.f64";
        const positionsBytes = arrayBytes(evaluated.positions), jointsBytes = arrayBytes(evaluated.joints);
        publication.write(positions, positionsBytes); publication.write(joints, jointsBytes);
        const endpoint = { direction, difference, requestedRecipeValue: node[key], positions, positionsSha256: sha(positionsBytes), joints, jointsSha256: sha(jointsBytes),
          changedVertices: changed, changedNativeVertices: changedNative, changedJointWitnesses: changedJoints,
          maximumPointDisplacementMillimetres: maximum, minimumNeutralFacetCosine: minimumCosine };
        field.endpoints.push(endpoint);
        console.log("[head-trait-endpoints]", id, direction, changed, "changed vertices", changedNative, "native", changedJoints, "joints", maximum, "maximum mm", minimumCosine, "minimum facet cosine");
      } catch (error) {
        const cause = error instanceof Error ? error.message : String(error);
        refusals.push({ id, direction, request: node[key], cause });
        console.log("[head-trait-endpoints-refusal]", id, direction, String(node[key]), cause);
      }
    }
    const record = { ...field, recipePath: [...keys, key], neutralRecipeValue: neutralValue };
    fields.push(record);
  }
  const packet: IHumanSourceHeadTraitPacket = { schema: "automovie-authored-head-dimensional-endpoints/2",
    authoringInputsSha256: authoring.manifestSha256, sampleInputs: Object.fromEntries(Object.entries(sample.manifest.files).map(([name, file]) => [name, file.sha256])),
    providerNeutralSha256: neutralSha, providerJointsSha256: jointsSha, providerPacketSha256: sha(admitted.outputs.get("head-provider-packet.json")!),
    providerVertices: neutral.positions.length / 3, polygons: neutral.polygons.length, fields, refusals };
  const packetBytes = JSON.stringify({ ...packet, frame: authoring.manifest.frame,
    qualification: "Authored single-axis TypeScript source samples; no interpolation, combination, contact, static export or rendered acceptance." }, null, 1) + "\n";
  publication.write("head-trait-endpoints.json", packetBytes);
  if (refusals.length !== 0) throw new Error("Actual dimensional endpoints refused " + refusals.length + " of " + (2 * fields.length) + " samples; partial assets are not a complete generation input.");
  publication.complete(sha(Buffer.from(packetBytes)), false, false, () => {
    authoring.verifyUnchanged();
    const current = readHumanSourcePublication(path.resolve(providerDirectory), [...admitted.outputs.keys()], "component");
    for (const [name, bytes] of admitted.outputs) if (!current.outputs.get(name)!.equals(bytes)) throw new Error("Provider changed during dimensional source production: " + name);
  });
} catch (error) {
  publication.refuse(error);
  throw error;
}
