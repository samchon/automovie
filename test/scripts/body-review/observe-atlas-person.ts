/**
 * Read a new atlas body candidate through the actual person and static writers.
 *
 * From test/: pnpm exec ttsx -P tsconfig.scripts.json
 * scripts/body-review/observe-atlas-person.ts HEAD_VIEW BODY_VIEW CANDIDATE PERSON_DOCUMENT OUTPUT
 *
 * Original skin, rig and shape data must remain byte-equivalent after removing
 * the explicit atlas derivative and its new basis name. The original G1 skin
 * generation is then retained; the composed candidate packet has its own
 * digest. An actual saved person document supplies the authored state; the
 * candidate's named bones are selected explicitly on that owned copy.
 * This records actual numerical and static outputs, not clinical validation,
 * fixed expected snapshots or rendered appearance.
 */
import { createHumanPersonGenerationBuilder } from "@automovie/human/human/build/createHumanPersonGenerationBuilder";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import { createHumanBodyAtlasExportQualification } from "@automovie/human/body/export/createHumanBodyAtlasExportQualification";
import { readHumanBodyAtlasAssetCorrespondence } from "@automovie/human/body/export/readHumanBodyAtlasAssetCorrespondence";
import { exportHumanPerson } from "@automovie/human/human/export/exportHumanPerson";
import { gltfMaterialExtensions } from "@automovie/human/common/export/gltfMaterialExtensions";
import { parseHumanPersonDocument } from "@automovie/human/human/document/parseHumanPersonDocument";
import { serializeHumanPersonDocument } from "@automovie/human/human/document/serializeHumanPersonDocument";
import { WebIO } from "@gltf-transform/core";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import typia from "typia";

async function main(): Promise<void> {
  const [headFile, bodyFile, candidateFile, personFile, output] = process.argv.slice(2);
  if (!headFile || !bodyFile || !candidateFile || !personFile || !output)
    throw new Error("Expected HEAD_VIEW BODY_VIEW CANDIDATE PERSON_DOCUMENT OUTPUT.");
  const read = (file: string): unknown => JSON.parse(gunzipSync(fs.readFileSync(file)).toString("utf8"));
  const head = typia.assertEquals<IAutoMovieHumanPersonHeadView>(read(headFile));
  const original = typia.assertEquals<IAutoMovieHumanPersonBodyView>(read(bodyFile));
  const candidate = typia.assertEquals<IAutoMovieHumanBodyBasis>(read(candidateFile));
  const preserved = { ...candidate, id: original.body.id };
  delete preserved.anatomicalCandidates;
  if (JSON.stringify(preserved) !== JSON.stringify(original.body))
    throw new Error("The atlas derivative changed the original body skin, rig or shape; original G1 identity cannot be inherited.");
  const generation = { ...joinHumanPersonGeneration(head, original), body: candidate };
  const document = parseHumanPersonDocument(fs.readFileSync(personFile, "utf8"));
  if (document.face.basis !== head.face.id || ![original.body.id, candidate.id].includes(document.body.basis))
    throw new Error("The saved person must name the actual source head and original or derived body basis.");
  document.body.basis = candidate.id;
  document.body.anatomicalInspection = (candidate.anatomicalCandidates ?? []).map((part) => part.id);
  const saved = serializeHumanPersonDocument(document);
  const replay = parseHumanPersonDocument(saved);
  fs.mkdirSync(output, { recursive: true });
  const packet = gzipSync(JSON.stringify(generation));
  fs.writeFileSync(path.join(output, "atlas-person.person.json.gz"), packet);
  fs.writeFileSync(path.join(output, "atlas-person.json"), saved);
  const sourceDigest = (bytes: string | Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
  fs.writeFileSync(path.join(output, "person-source.json"), JSON.stringify({ originalSkinGeneration: generation.id, originalBodyBasis: original.body.id, candidateBodyBasis: candidate.id, originalBodyDigest: sourceDigest(JSON.stringify(original.body)), packetSha256: sourceDigest(packet), qualification: "authored-reference-only", sourceSkinRigShape: "unchanged", renderedObservation: "not-observed" }, null, 2) + "\n");
  const built = createHumanPersonGenerationBuilder({ generation })(replay);
  const qualification = await createHumanBodyAtlasExportQualification(candidate, replay.body, "body:");
  const asset = await exportHumanPerson(built.model, qualification);
  fs.writeFileSync(path.join(output, "person.glb"), asset.glb);
  fs.writeFileSync(path.join(output, "person.gltf"), JSON.stringify(asset.gltf.json) + "\n");
  for (const [uri, bytes] of Object.entries(asset.gltf.resources)) {
    const target = path.resolve(output, uri);
    if (!target.startsWith(path.resolve(output) + path.sep)) throw new Error("Person resource leaves its output directory: " + uri);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  const decoded = await new WebIO().registerExtensions(gltfMaterialExtensions).readBinary(asset.glb);
  const readings = decoded.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives()).flatMap((primitive) => {
    const record = readHumanBodyAtlasAssetCorrespondence(primitive);
    if (record === undefined) return [];
    const positions = primitive.getAttribute("POSITION")!.getArray()!;
    return record.qualification.parts.map((part) => {
      const interval = record.geometry.parts.find((member) => member.id === part.id)!;
      const source = built.model.parts.find((member) => member.id === part.id)!;
      if (source.geometry.type !== "mesh") throw new Error("Person atlas output has no source mesh: " + part.id);
      let maximumSourceDifferenceMetres = 0;
      let maximumFloat32ReplayDifferenceMetres = 0;
      for (let at = 0; at < interval.vertexCount * 3; at++) {
        const actual = positions[interval.vertexOffset * 3 + at];
        const originalValue = source.geometry.mesh.positions[at];
        maximumSourceDifferenceMetres = Math.max(maximumSourceDifferenceMetres, Math.abs(actual - originalValue));
        maximumFloat32ReplayDifferenceMetres = Math.max(maximumFloat32ReplayDifferenceMetres, Math.abs(actual - Math.fround(originalValue)));
      }
      return { part: part.part, sourcePart: part.id, vertices: interval.vertexCount, triangles: interval.indexCount / 3, maximumSourceDifferenceMetres, maximumFloat32ReplayDifferenceMetres, source: part.source, registration: part.registration, partResolution: part.partResolution };
    });
  });
  const glbSha256 = sourceDigest(asset.glb);
  fs.writeFileSync(path.join(output, "person-readback.json"), JSON.stringify({ sourceSkinGeneration: generation.id, candidateBodyBasis: candidate.id, model: built.model.id, glbSha256, readings, renderedObservation: "not-observed" }, null, 2) + "\n");
  console.log("PERSON_STATIC_READBACK", readings.length, "atlas parts", glbSha256);
}
void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
