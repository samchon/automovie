import type { IAutoMovieMesh } from "@automovie/interface";
import type { AutoMovieHumanBodyBoneId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodySourceVertexBinding } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodySourceVertexBinding";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import typia from "typia";

import { readHumanBodyMaterialSignedIntegral } from "../human-source/body-anatomy/readHumanBodyMaterialSignedIntegral.ts";
import { readHumanBodyMaterialSurfaceIncidence } from "../human-source/body-anatomy/readHumanBodyMaterialSurfaceIncidence.ts";
import type { IHumanTrunkSourcePacket } from "./IHumanTrunkSourcePacket.ts";
import type { IHumanTrunkSourceChart } from "./IHumanTrunkSourceChart.ts";
import { rebuildHumanTrunkSourceChart } from "./rebuildHumanTrunkSourceChart.ts";
import { deriveHumanTrunkSourceAssembly } from "./deriveHumanTrunkSourceAssembly.ts";

/** Original translation authority, without a case-derived replacement. @author Samchon */
interface IHumanTrunkSourceTranslation {
  oldCanonicalTranslationMetres: number[];
}

/**
 * Produce fresh attached trunk source charts from the immutable atlas packet.
 * Usage: ttsx -P scripts/trunk-source/tsconfig.json
 * scripts/trunk-source/author-trunk-source.ts PACKET OUTPUT.
 * Optional paired --raw-assembly RAW_C --baseline-operators ORIGINAL_OPERATORS
 * also emits a fresh C derivative under one source generation. The original
 * inputs never overwrite and the operator receipt alone owns A-to-C units.
 *
 * The original source packet owns membership, acquired attachment ordinals,
 * rights and fixed artist dimensions. This producer preserves every other
 * member and rebuilds the discontinuously scheduled latissimus origin curve
 * together with its matching named-attachment material-chart binding
 * in A, not N. The caller must regenerate C translation, bindings, fields,
 * source registration and downstream consumers under the new source hashes.
 * No anatomical source is modified in place or admitted by this publication.
 * An original broad chart remains an authored hypothesis: this source step
 * establishes continuous parameterization and PL quantity, not thoracic
 * clearance, clinical tissue volume, target placement or visible correctness.
 */
function main(): void {
  const [packetArgument, outputArgument, ...extra] = process.argv.slice(2);
  if (packetArgument === undefined || outputArgument === undefined)
    throw new Error("Expected immutable PACKET and fresh OUTPUT.");
  const derivativeFiles = new Map<string, string>();
  for (let at = 0; at < extra.length; at += 2) {
    const option = extra[at], value = extra[at + 1];
    if ((option !== "--raw-assembly" && option !== "--baseline-operators") ||
        value === undefined || derivativeFiles.has(option))
      throw new Error("Expected unique paired --raw-assembly and --baseline-operators inputs.");
    derivativeFiles.set(option, value);
  }
  if (derivativeFiles.size !== 0 && derivativeFiles.size !== 2)
    throw new Error("Canonical source derivation needs both original raw assembly and translation authority.");
  const repository = path.resolve(__dirname, "../../..");
  const packetFile = path.resolve(packetArgument);
  const output = path.resolve(outputArgument);
  const artifacts = path.join(repository, ".wiki/08-campaigns/2707-human/artifacts");
  const resolve = (base: string, file: string): string => {
    const absolute = path.resolve(base, file);
    const relative = path.relative(repository, absolute);
    if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative))
      throw new Error("Trunk source provenance must remain repository-relative.");
    return absolute;
  };
  const relativeOutput = path.relative(artifacts, output);
  if (!relativeOutput || relativeOutput === ".." || relativeOutput.startsWith(".." + path.sep) ||
      path.isAbsolute(relativeOutput) || fs.existsSync(output))
    throw new Error("Trunk source publication needs a fresh campaign artifact directory.");
  const hash = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
  const inputs = new Map<string, string>();
  const read = (file: string, expected?: string): Buffer => {
    const absolute = resolve(repository, file);
    const bytes = fs.readFileSync(absolute);
    const digest = hash(bytes);
    if (expected !== undefined && digest !== expected) throw new Error("Original source bytes changed: " + file);
    inputs.set(absolute, digest);
    return bytes;
  };
  const packetBytes = read(packetFile);
  const packet = typia.assert<IHumanTrunkSourcePacket>(JSON.parse(packetBytes.toString("utf8")));
  if (packet.frame !== "common-atlas-metres,+X-left,+Y-up,+Z-forward")
    throw new Error("Trunk charts require the original atlas metre frame.");
  read(packet.recipe, packet.recipeSha256);
  for (const resource of packet.sourceReferences) read(resource.uri, resource.sha256);
  const meshes = new Map<string, IHumanTrunkSourceChart["mesh"]>();
  const originalMeshes = new Map<string, IHumanTrunkSourceChart["mesh"]>();
  const bindings = new Map<string, IAutoMovieHumanBodySourceVertexBinding>();
  const originalBytes = new Map<string, Buffer>();
  const originalObjs = new Map<string, Buffer>();
  for (const part of packet.parts) {
    const file = resolve(path.dirname(packetFile), part.mesh);
    const bytes = read(file, part.meshSha256);
    const mesh = typia.assert<IAutoMovieMesh>(JSON.parse(bytes.toString("utf8")));
    if (mesh.indices === null) throw new Error("Original source chart needs explicit triangle ordinals: " + part.id);
    if (mesh.positions.length !== 3 * part.vertices || mesh.indices.length !== 3 * part.triangles)
      throw new Error("Original chart membership does not match the packet: " + part.id);
    const indexed: IHumanTrunkSourceChart["mesh"] = { ...mesh, indices: mesh.indices };
    meshes.set(part.id, indexed);
    originalMeshes.set(part.id, indexed);
    originalBytes.set(part.id, bytes);
    const obj = resolve(path.dirname(packetFile), part.id + ".obj");
    originalObjs.set(part.id, read(obj, typia.assert<string>(part.objSha256)));
  }
  const rebuilt = new Set<string>();
  for (const side of ["left", "right"]) {
    const id = side + "LatissimusDorsi";
    const part = packet.parts.find((part) => part.id === id);
    const mesh = meshes.get(id);
    if (part === undefined || mesh === undefined) throw new Error("Complete paired source fan is missing: " + id);
    const expectedBones = [side + "CoxalBone", "t7", "l5", side + "Humerus"];
    if (part.attachments.length !== expectedBones.length || part.attachments.some((row, at) =>
      row.bone !== expectedBones[at] || row.role !== (at === 3 ? "insertion" : "origin")))
      throw new Error("Source fan does not retain the iliac/T7/L5/humeral attachment order.");
    const sites = part.attachments.map((attachment) => {
      const site = packet.proposedSharedSites.find((site) =>
        site.bone === attachment.bone && site.site === attachment.site);
      if (site === undefined) throw new Error("Source fan has an unregistered actual attachment.");
      const resource = packet.sourceReferences.find((row) => row.file === site.sourceFile);
      if (resource === undefined || resource.sha256 !== site.sourceSha256)
        throw new Error("Source fan attachment does not name its actual acquired bytes.");
      const vertices = read(resource.uri, site.sourceSha256).toString("utf8").split(/\r?\n/).filter((line) => line.startsWith("v "));
      const row = vertices[site.sourceVertex];
      if (row === undefined) throw new Error("Source fan attachment has an invalid vertex ordinal.");
      const coordinates = row.trim().split(/\s+/).slice(1, 4).map(Number);
      const actual = [coordinates[0] / 1000, coordinates[2] / 1000, -coordinates[1] / 1000];
      if (actual.some((value, axis) => value !== site.world[axis]))
        throw new Error("Source fan attachment disagrees with the acquired atlas conversion.");
      return site.world;
    });
    const rows = Math.sqrt(mesh.positions.length / 6);
    // Original quarter-path marks the iliac-to-lumbar station. The remaining
    // material rows continue at L5, rather than skipping a quarter of L5-to-T7.
    const lumbarStation = Math.floor((rows - 1) / 4) - 1;
    const candidate = rebuildHumanTrunkSourceChart({ mesh, rows, columns: rows,
      originStations: [0, lumbarStation, rows - 1], origins: [sites[0], sites[2], sites[1]],
      originBones: typia.assert<AutoMovieHumanBodyBoneId[]>([expectedBones[0], expectedBones[2], expectedBones[1]]),
      terminalBone: typia.assert<AutoMovieHumanBodyBoneId>(expectedBones[3]) });
    const incidence = readHumanBodyMaterialSurfaceIncidence(candidate.mesh.positions, candidate.mesh.indices);
    if (!incidence.qualified) throw new Error("Rebuilt source chart incidence refuses: " + JSON.stringify(incidence.failures));
    meshes.set(id, candidate.mesh);
    bindings.set(id, candidate.binding);
    rebuilt.add(id);
  }
  let parentAssembly: IAutoMovieHumanBodyAnatomicalAssembly | undefined;
  let parentAssemblyBytes: Buffer | undefined;
  let originalTranslation: IHumanTrunkSourceTranslation | undefined;
  if (derivativeFiles.size !== 0) {
    parentAssemblyBytes = read(resolve(process.cwd(), derivativeFiles.get("--raw-assembly")!));
    // The large original assembly is parsed once; the receiver structurally
    // shares every unaffected member instead of deeply cloning this graph.
    parentAssembly = typia.assert<IAutoMovieHumanBodyAnatomicalAssembly>(JSON.parse(parentAssemblyBytes.toString("utf8")));
    originalTranslation = typia.assert<IHumanTrunkSourceTranslation>(JSON.parse(
      read(resolve(process.cwd(), derivativeFiles.get("--baseline-operators")!)).toString("utf8")));
  }
  for (const [file, digest] of inputs)
    if (hash(fs.readFileSync(file)) !== digest) throw new Error("Trunk source input changed during preparation: " + file);
  const compareNames = (first: string, second: string): number => first < second ? -1 : first > second ? 1 : 0;
  const recipeFiles = fs.readdirSync(__dirname).filter((name) => name.endsWith(".ts") || name === "tsconfig.json").sort(compareNames);
  const recipes = Object.fromEntries(recipeFiles.map((name) => [name, hash(fs.readFileSync(path.join(__dirname, name)))]));
  const portableInputs = Object.fromEntries([...inputs].map(([file, sha256]) =>
    [path.relative(repository, file).replaceAll("\\", "/"), sha256]));
  fs.mkdirSync(output);
  const publishedParts = packet.parts.map((part) => {
    const mesh = meshes.get(part.id)!;
    const changed = rebuilt.has(part.id);
    const bytes = changed ? Buffer.from(JSON.stringify(mesh)) : originalBytes.get(part.id)!;
    fs.writeFileSync(path.join(output, part.mesh), bytes);
    let objBytes = originalObjs.get(part.id)!;
    if (changed) {
      const lines = ["# Authored source derivative; common atlas metres +X left +Y up +Z anterior; not original OBJ millimetres"];
      for (let at = 0; at < mesh.positions.length; at += 3)
        lines.push("v " + mesh.positions.slice(at, at + 3).join(" "));
      for (let at = 0; at < mesh.indices.length; at += 3)
        lines.push("f " + mesh.indices.slice(at, at + 3).map((id) => id + 1).join(" "));
      objBytes = Buffer.from(lines.join("\n") + "\n");
    }
    fs.writeFileSync(path.join(output, part.id + ".obj"), objBytes);
    if (!changed) return { ...part, sourceRebuilt: false };
    const bindingBytes = Buffer.from(JSON.stringify(bindings.get(part.id)!));
    const bindingFile = part.id + ".binding.json";
    fs.writeFileSync(path.join(output, bindingFile), bindingBytes);
    const count = mesh.positions.length / 6;
    const thicknesses = Array.from({ length: count }, (_, at) => Math.hypot(...[0, 1, 2].map((axis) =>
      mesh.positions[3 * at + axis] - mesh.positions[3 * (count + at) + axis])) * 1000);
    const { artistProfile, sourceVertexDistanceMetres, objSha256, ...retained } = part;
    return { ...retained, meshSha256: hash(bytes), objSha256: hash(objBytes), volumeCubicMetres: readHumanBodyMaterialSignedIntegral(mesh.positions, mesh.indices).value,
      parentMeshSha256: part.meshSha256, parentObjSha256: objSha256,
      bindingFile, bindingSha256: hash(bindingBytes),
      parentArtistProfile: artistProfile, parentSourceVertexDistanceMetres: sourceVertexDistanceMetres,
      artistProfile: { representation: "Original within-row material path and humeral terminal with continuous acquired-origin schedule",
        thicknessMm: [Math.min(...thicknesses), Math.max(...thicknesses)],
        thicknessMeaning: "Derived positive station thickness conserving original signed PL source quantity; not a clinical range",
        parentFixedDimensions: "Historical parentArtistProfile; its original thickness values do not describe this derivative" },
      sourceVertexDistanceMetres: "unobserved for this derivative", sourceRebuilt: true,
      consumer: "source-only; registration and current GPU appearance remain unverified" };
  });
  const published = { ...packet, parts: publishedParts, parentPacketSha256: hash(packetBytes),
    parentRecipe: packet.recipe, parentRecipeSha256: packet.recipeSha256,
    recipe: path.relative(repository, __filename).replaceAll("\\", "/"), recipeSha256: recipes["author-trunk-source.ts"], recipes,
    numericalAdmission: false, embeddingQualified: false,
    qualification: "Continuous attached atlas chart with conserved original signed PL quantity; no target, clinical or rendered admission." };
  fs.writeFileSync(path.join(output, "packet.json"), JSON.stringify(published, null, 2) + "\n");
  if (parentAssembly !== undefined && parentAssemblyBytes !== undefined && originalTranslation !== undefined) {
    const generation = "trunk-canonical-source-" + hash(Buffer.from(JSON.stringify({
      parentAssembly: hash(parentAssemblyBytes), inputs: portableInputs, recipes,
      parts: publishedParts.map((part) => [part.id, part.meshSha256]),
    }))).slice(0, 20);
    const result = deriveHumanTrunkSourceAssembly({ assembly: parentAssembly,
      translation: originalTranslation.oldCanonicalTranslationMetres, generation,
      replacements: packet.parts.filter((part) => rebuilt.has(part.id)).map((part) => ({
        part: part.id, originalMesh: originalMeshes.get(part.id)!, mesh: meshes.get(part.id)!,
        binding: bindings.get(part.id)!,
        originalUri: path.relative(repository, resolve(path.dirname(packetFile), part.mesh)).replaceAll("\\", "/"),
        originalSha256: part.meshSha256,
        uri: path.relative(repository, path.join(output, part.mesh)).replaceAll("\\", "/"),
        sha256: hash(Buffer.from(JSON.stringify(meshes.get(part.id)!))),
      })) });
    const assemblyBytes = Buffer.from(JSON.stringify(result.assembly));
    fs.writeFileSync(path.join(output, "source-assembly.json"), assemblyBytes);
    fs.writeFileSync(path.join(output, "assembly-derivation-receipt.json"), JSON.stringify({
      generation, assemblySha256: hash(assemblyBytes), parentAssemblySha256: hash(parentAssemblyBytes),
      parentGeneration: parentAssembly.generation, originalTranslation: originalTranslation.oldCanonicalTranslationMetres,
      originalTranslationAuthority: derivativeFiles.get("--baseline-operators"), inputs: portableInputs, recipes,
      parts: result.assembly.parts.length, members: result.assembly.parts.reduce((total, part) => total + part.surfaces.length, 0),
      nodes: result.assembly.rig.nodes.length, retainedParts: parentAssembly.parts.filter((part) => !rebuilt.has(part.id)).length,
      retainedRigNodesAndSites: result.assembly.rig.nodes === parentAssembly.rig.nodes,
      retainedShape: result.assembly.shape === parentAssembly.shape, readings: result.readings,
      numericalAdmission: false, embeddingQualified: false, targetFramePlacement: "unobserved", renderedAppearance: "unobserved",
    }, null, 2) + "\n");
  }
  fs.writeFileSync(path.join(output, "authoring-receipt.json"), JSON.stringify({ inputs: Object.fromEntries([...inputs].map(([file, sha256]) =>
    [path.relative(repository, file).replaceAll("\\", "/"), sha256])), recipes,
    rebuilt: [...rebuilt], retained: packet.parts.filter((part) => !rebuilt.has(part.id)).map((part) => part.id),
    frame: packet.frame, runtime: { node: process.version, executable: process.execPath },
    sourceInputsUnchanged: true, numericalAdmission: false, embeddingQualified: false }, null, 2) + "\n");
  console.log(JSON.stringify({ output, rebuilt: [...rebuilt], parts: publishedParts.length, sourceOnly: true }));
}

main();
