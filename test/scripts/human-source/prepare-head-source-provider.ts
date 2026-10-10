/** Bind one completed TS head evaluation to native corner UV and point lineage.
 * From test: ttsx -P tsconfig.human-source.json scripts/human-source/prepare-head-source-provider.ts SAMPLE AUTHORING EVALUATION NEW_OUTPUT
 * The final component owns its packet, cells and copied neutral/joint buffers.
 * Original rim UVs are inherited exactly; source-private lining charts use the
 * actual rim length. Packet preparation preserves rights and input authority,
 * and establishes no clinical or whole-generation geometry acceptance.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import typia from "typia";

import { readHumanHeadSourceAuthoring } from "./head-authoring/readHumanHeadSourceAuthoring.ts";
import type { IHumanHeadSourceProviderProvenance } from "./head-authoring/structures/IHumanHeadSourceProviderProvenance.ts";
import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import { readHumanSourcePublication } from "./readHumanSourcePublication.ts";
import type { IHumanSourceAuthoredCell } from "./structures/IHumanSourceAuthoredCell.ts";
import type { IHumanSourceAuthoredPacketEntry } from "./structures/IHumanSourceAuthoredPacketEntry.ts";

const [sampleDirectory, source, evaluation, output, ...extra] = process.argv.slice(2);
if ([sampleDirectory, source, evaluation, output].some((value) => value === undefined) || extra.length !== 0)
  throw new Error("Usage: prepare-head-source-provider.ts SAMPLE AUTHORING EVALUATION NEW_OUTPUT");
const repository = path.resolve(__dirname, "../../..");
const authoring = readHumanHeadSourceAuthoring(sampleDirectory, source, repository, "test/scripts/human-source/prepare-head-source-provider.ts");
const producer = readHumanSourceProducerClosure(repository, "test/scripts/human-source/author-head-source-provider.ts");
const admitted = readHumanSourcePublication(path.resolve(evaluation), ["provider-provenance.json", "polygons.json", "neutral-provider.f64", "joints-provider.f64"], "component");
const provenance = typia.assert<IHumanHeadSourceProviderProvenance>(JSON.parse(admitted.outputs.get("provider-provenance.json")!.toString("utf8")));
const polygons = typia.assert<number[][]>(JSON.parse(admitted.outputs.get("polygons.json")!.toString("utf8")));
const positionsBytes = admitted.outputs.get("neutral-provider.f64")!, jointsBytes = admitted.outputs.get("joints-provider.f64")!;
const sha = (bytes: Uint8Array): string => crypto.createHash("sha256").update(bytes).digest("hex");
if (positionsBytes.byteLength % 24 !== 0 || jointsBytes.byteLength % 24 !== 0 ||
  positionsBytes.length / 24 !== provenance.vertices || sha(positionsBytes) !== provenance.positionsSha256 ||
  provenance.nativeVertices !== authoring.sample.manifest.vertices || provenance.generationBasis !== authoring.profiles.earGuide.generation)
  throw new Error("Provider evaluation differs from its actual native source authority.");
const positions = new Float64Array(positionsBytes.buffer.slice(positionsBytes.byteOffset, positionsBytes.byteOffset + positionsBytes.byteLength));
const joints = new Float64Array(jointsBytes.buffer.slice(jointsBytes.byteOffset, jointsBytes.byteOffset + jointsBytes.byteLength));
if (!positions.every(Number.isFinite) || !joints.every(Number.isFinite) || joints.length !== 3 * authoring.sample.manifest.landmarkIds.length)
  throw new Error("Provider packet requires complete finite evaluated native positions and original joint witnesses.");
const sample = authoring.sample;
const sourcePolygons = Array.from(sample.loopStart, (start, ordinal) => Array.from(sample.loopVertex.subarray(start, start + sample.loopTotal[ordinal])));
const uv = (ordinal: number): number[][] => Array.from({ length: sample.loopTotal[ordinal] }, (_value, corner) =>
  Array.from(sample.loopUv.subarray(2 * (sample.loopStart[ordinal] + corner), 2 * (sample.loopStart[ordinal] + corner + 1))),
);
const removed = new Set(provenance.nasalSections.flatMap((section) => section.removedNativePolygonOrdinals));
const cells: IHumanSourceAuthoredCell[] = [];
sourcePolygons.forEach((cell, ordinal) => {
  if (!removed.has(ordinal)) cells.push({ id: "native-skin:" + ordinal, vertices: [...cell], cornerUV: uv(ordinal),
    materialRole: "inherited-native-skin", partId: "native-skin", originalNativePolygon: ordinal });
});
for (const section of provenance.nasalSections) {
  const cycle = section.sharedNativeRim;
  if (cycle.length === 0 || section.generatedRings.some((ring) => ring.length !== cycle.length) || section.capSourceCells.length !== section.terminalCapCells.length)
    throw new Error("Provider nasal packet lost its original rim or cap population.");
  const stations = [0];
  for (let ordinal = 0; ordinal < cycle.length; ordinal++) {
    const a = cycle[ordinal], b = cycle[(ordinal + 1) % cycle.length];
    stations.push(stations.at(-1)! + Math.hypot(positions[3 * b] - positions[3 * a], positions[3 * b + 1] - positions[3 * a + 1], positions[3 * b + 2] - positions[3 * a + 2]));
  }
  const length = stations.at(-1)!;
  if (!Number.isFinite(length) || length <= 0) throw new Error("New nasal UV chart needs a finite actual rim length.");
  for (let ordinal = 0; ordinal < stations.length; ordinal++) stations[ordinal] /= length;
  let previous = cycle;
  section.generatedRings.forEach((ring, ordinal) => {
    cycle.forEach((native, index) => {
      const next = (index + 1) % cycle.length;
      let chart: number[][], role: string, part: string;
      if (ordinal === 0) {
        const owners = section.removedNativePolygonOrdinals.filter((cell) => sourcePolygons[cell].includes(native) && sourcePolygons[cell].includes(cycle[next]));
        if (owners.length !== 1) throw new Error("Nasal support edge needs one removed native UV owner.");
        const owner = owners[0], nativeCell = sourcePolygons[owner], nativeUv = uv(owner);
        const a = nativeUv[nativeCell.indexOf(native)], b = nativeUv[nativeCell.indexOf(cycle[next])];
        const interior = [0, 1].map((axis) => nativeUv.reduce((sum, value) => sum + value[axis], 0) / nativeUv.length);
        const inward = interior.map((value, axis) => value - (a[axis] + b[axis]) / 2);
        const fraction = section.dimensions.rimSupportDepthMillimetres / section.dimensions.liningDepthMillimetres;
        chart = [[...a], [...b], b.map((value, axis) => value + fraction * inward[axis]), a.map((value, axis) => value + fraction * inward[axis])];
        role = "inherited-native-skin"; part = "nasal-rim-" + section.side;
      } else {
        chart = [[stations[index], 0], [stations[index + 1], 0], [stations[index + 1], 1], [stations[index], 1]];
        role = "authored-nasal-lining"; part = "nasal-vestibule-" + section.side;
      }
      cells.push({ id: part + ":" + ordinal + ":" + index, vertices: [previous[index], previous[next], ring[next], ring[index]], cornerUV: chart, materialRole: role, partId: part });
    });
    previous = ring;
  });
  section.capSourceCells.forEach((nativeCell, ordinal) => cells.push({ id: "nasal-floor-" + section.side + ":" + nativeCell,
    vertices: [...section.terminalCapCells[ordinal]], cornerUV: uv(nativeCell), materialRole: "authored-nasal-lining", partId: "nasal-vestibule-" + section.side }));
}
if (JSON.stringify(cells.map((cell) => cell.vertices)) !== JSON.stringify(polygons) ||
  cells.some((cell) => cell.vertices.some((id) => !Number.isSafeInteger(id) || id < 0 || id >= provenance.vertices)))
  throw new Error("Provider cell/UV packet disagrees with the actual generated polygon order or point population.");
const locators: Record<string, string> = {};
const entry = (file: string, logicalPath: string, expected?: string): IHumanSourceAuthoredPacketEntry => {
  const resolved = path.resolve(file), bytes = fs.readFileSync(resolved), digest = sha(bytes);
  if ((expected !== undefined && digest !== expected) || (locators[logicalPath] !== undefined && locators[logicalPath] !== resolved))
    throw new Error("Provider source locator differs from its original byte authority: " + logicalPath);
  locators[logicalPath] = resolved;
  return { logicalPath, sha256: digest };
};
const repositoryEntry = (file: string, expected?: string): IHumanSourceAuthoredPacketEntry => {
  const relative = path.relative(repository, path.resolve(file));
  if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) throw new Error("Provider profile/code authority must remain repository-bound.");
  return entry(file, relative.replaceAll("\\", "/"), expected);
};
const profileEntry = (name: string): IHumanSourceAuthoredPacketEntry => {
  const one = authoring.manifest.profiles[name];
  if (one === undefined) throw new Error("Provider packet lacks original source profile: " + name);
  return repositoryEntry(path.resolve(authoring.directory, one.path), one.sha256);
};
const active = [...new Set(polygons.flat())].sort((a, b) => a - b);
const retained = active.filter((id) => id < provenance.nativeVertices), retainedSet = new Set(retained);
const cellsBytes = JSON.stringify(cells), license = path.resolve(sample.directory, "../upstream/makehuman/LICENSE.ASSETS.md");
const packet = {
  schema: "automovie-authored-head-provider/1", stage: "TS author packet; source compiler admission pending",
  sourceId: authoring.manifest.sourceId, sourceBasisGeneration: authoring.profiles.earGuide.generation,
  authoringInputs: repositoryEntry(path.join(authoring.directory, "source-inputs.json"), authoring.manifestSha256),
  frame: authoring.profiles.earGuide.frame, originalNativeCount: provenance.nativeVertices, sampleInputs: sample.manifest.files,
  producerCode: producer.inputs.filter((input) => /\.(?:ts|mts|cts)$/u.test(input.path) && !input.path.startsWith("dependency/")).map((input) => repositoryEntry(path.join(repository, input.path), input.sha256)),
  producerRecipe: Object.fromEntries(Object.entries(provenance.recipeAuthority).map(([name, file]) => {
    const bytes = fs.readFileSync(file), expected = provenance.recipeInputs[name];
    if (expected === undefined || bytes.length !== expected.bytes || sha(bytes) !== expected.sha256) throw new Error("Provider recipe differs from its evaluated input: " + name);
    const relative = path.relative(repository, path.resolve(file));
    return [name, entry(file, relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative) ? "authoring-recipe/" + name : relative.replaceAll("\\", "/"), expected.sha256)];
  })),
  rights: { nativeMesh: "CC0 MakeHuman asset; exact pinned complete sample and original license authority", nativeLicense: entry(license, "upstream/makehuman/LICENSE.ASSETS.md"),
    authoredCode: "automovie TypeScript source authoring under repository MIT license; no third-party implementation text copied" },
  retainedNativeIds: retained, retiredNativeIds: Array.from({ length: provenance.nativeVertices }, (_value, id) => id).filter((id) => !retainedSet.has(id)),
  appendedBindings: provenance.nasalSections.flatMap((section) => section.appendedBindings),
  cells: { logicalPath: "provider-output/provider-cells.json", sha256: sha(Buffer.from(cellsBytes)) },
  positions: { logicalPath: "provider-output/neutral-provider.f64", sha256: sha(positionsBytes) },
  bonepoints: { logicalPath: "provider-output/joints-provider.f64", sha256: sha(jointsBytes) },
  sourceGuide: profileEntry("sourceGuide"), earGuide: profileEntry("earGuide"), nasalSocket: profileEntry("nasalSocket"), nasalAxisFit: profileEntry("nasalAxis"),
  ...(authoring.manifest.profiles.nasalExteriorGuide === undefined ? {} : { nasalExteriorGuide: profileEntry("nasalExteriorGuide") }),
  orderedPorts: { ears: authoring.profiles.earGuide.replacementPorts, nose: provenance.nasalSections.map((section) => ({ side: section.side, orderedNativeBoundary: section.sharedNativeRim })) },
  qualifications: ["Source-private charts and explicit prototype dimensions, not personal reconstruction or clinical norms.", "Retired native supports are not original-rest phantom coordinates."],
  invalidatedDescendants: provenance.invalidatedDescendants, pending: provenance.pending,
};
const packetBytes = JSON.stringify(packet, null, 2) + "\n";
publishHumanSourceFiles({ directory: path.resolve(output), generation: sha(Buffer.from(packetBytes)), completeGeneration: false, inspectionOnly: false,
  files: new Map<string, string | Uint8Array>([["provider-cells.json", cellsBytes], ["head-provider-packet.json", packetBytes], ["neutral-provider.f64", positionsBytes], ["joints-provider.f64", jointsBytes], ["run-locators.json", JSON.stringify(locators, null, 2) + "\n"]]),
  verifyInputs: () => {
    authoring.verifyUnchanged(); producer.verifyUnchanged();
    const current = readHumanSourcePublication(path.resolve(evaluation), [...admitted.outputs.keys()], "component");
    for (const [name, bytes] of admitted.outputs) if (!current.outputs.get(name)!.equals(bytes)) throw new Error("Provider evaluation changed during packet preparation: " + name);
    for (const [name, file] of Object.entries(provenance.recipeAuthority)) if (sha(fs.readFileSync(file)) !== provenance.recipeInputs[name].sha256) throw new Error("Provider recipe changed during packet preparation: " + name);
    if (sha(fs.readFileSync(license)) !== packet.rights.nativeLicense.sha256) throw new Error("Original native asset license changed during packet preparation.");
  },
});
console.log("[head-provider-packet]", cells.length, "oriented UV cells", packet.appendedBindings.length, "native support bindings", packet.retiredNativeIds.length, "retired samples");
