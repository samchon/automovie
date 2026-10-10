import { createHash } from "node:crypto";
import typia from "typia";
import type { IAutoMovieHumanBodySourcePart } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodySourcePart";
import type { IAutoMovieHumanBodySourceBoneNode } from "@automovie/human/body/anatomy/articulation/rig/IAutoMovieHumanBodySourceBoneNode";
import { HUMAN_PERSON_SEAM } from "@automovie/human/human/constants/HUMAN_PERSON_SEAM";
import type { IHumanCranialSourceInput } from "./IHumanCranialSourceInput.ts";
import type { IHumanCranialSourceResult } from "./IHumanCranialSourceResult.ts";
import { repairHumanCranialSourceZeroCells } from "./repairHumanCranialSourceZeroCells.ts";
import { readHumanBodyMaterialSurfaceIncidence } from "../human-source/body-anatomy/readHumanBodyMaterialSurfaceIncidence.ts";

/** Actual publisher claims and their separate unresolved qualification. @author Samchon */
interface CranialSourceRights {
  official: string;
  officialUri: string;
  embedded: string;
  qualification: string;
  attribution: string;
}

/** Original member and its repaired A-frame mesh stay together through alias selection. @author Samchon */
interface RepairedCranialMember {
  original: IHumanCranialSourceInput["sources"][number];
  mesh: IHumanCranialSourceInput["sources"][number]["mesh"];
}

/** Material triangles declare target skin membership; null addresses the complete source exterior. @author Samchon */
interface CranialBoundPopulation {
  positions: readonly number[];
  indices: readonly number[] | null;
}

/**
 * Construct one initial cranial source with a common positive similarity.
 * The source exterior above the actual cutoff bone and target head own the
 * bounds: their vertical span ratio supplies scale and all three centres
 * supply translation. This restores an authored initialization, not a fit
 * or a clinical skeleton. Fixed transport nodes and four-slot bindings share
 * the emitted generation. Parent parts, fields, rights and plan stay immutable.
 */
export function buildHumanCranialSource(
  input: IHumanCranialSourceInput,
  generation: string,
): IHumanCranialSourceResult {
  if (generation.length === 0 || generation === input.assembly.generation)
    throw new Error("Cranial birth needs a distinct byte-bound producer generation.");
  const hash = (value: string): string => createHash("sha256").update(value).digest("hex");
  const qualification = "Authored initial common cranial similarity from one acquired atlas and an actual head exterior; source rights qualification retained. No clinical, personal, containment, joint-motion or rendered admission.";
  const rights = typia.assert<CranialSourceRights>(input.acquisition.rights);
  const topologyRepairs: IHumanCranialSourceResult["receipt"]["topologyRepairs"] = [];
  const records: RepairedCranialMember[] = input.sources.map((original) => {
    const repaired = repairHumanCranialSourceZeroCells(original.mesh);
    if (repaired.receipt !== null) topologyRepairs.push({ part: original.part, member: original.source.file,
      sourceSha256: original.source.sha256, repair: repaired.receipt });
    return { original, mesh: repaired.mesh };
  });
  let cutoff = Infinity;
  for (const record of records) {
    if (record.original.part !== input.cutoffBone) continue;
    for (let at = 1; at < record.mesh.positions.length; at += 3) cutoff = Math.min(cutoff, record.mesh.positions[at]);
  }
  if (!Number.isFinite(cutoff)) throw new Error("Cranial source has no finite cutoff-bone population.");
  const sourceBounds = bounds([{ positions: input.sourceExterior.positions, indices: null }], cutoff);
  const targetPopulations: CranialBoundPopulation[] = [];
  for (const surface of input.head.face.surfaces)
    for (const region of surface.regions)
      if (region.material === HUMAN_PERSON_SEAM.skinMaterial)
        targetPopulations.push({ positions: surface.positions, indices: region.indices });
  const targetBounds = bounds(targetPopulations);
  const scale = (targetBounds.high[1] - targetBounds.low[1]) / (sourceBounds.high[1] - sourceBounds.low[1]);
  const translation = [0, 1, 2].map((axis) =>
    (targetBounds.low[axis] + targetBounds.high[axis] - scale * (sourceBounds.low[axis] + sourceBounds.high[axis])) / 2);
  if (!(scale > 0) || !Number.isFinite(scale) || !translation.every(Number.isFinite))
    throw new Error("Initial common cranial similarity is not finite and invertible.");
  const knownParts = new Set(input.assembly.parts.map((part) => part.id));
  const knownNodes = new Set(input.assembly.rig.nodes.map((node) => node.id));
  const parts: IAutoMovieHumanBodySourcePart[] = [];
  const nodes: IAutoMovieHumanBodySourceBoneNode[] = [];
  const aliases: IHumanCranialSourceResult["receipt"]["aliases"] = [];
  for (const part of input.inventory.parts) {
    if (knownParts.has(part.id) || knownNodes.has(part.id))
      throw new Error("Initial cranial source duplicates an original part or node: " + part.id);
    const unique = new Map<string, RepairedCranialMember>();
    for (const record of records.filter((entry) => entry.original.part === part.id)) {
      const identity = hash(JSON.stringify({ positions: record.mesh.positions, indices: record.mesh.indices, normals: record.mesh.normals }));
      const previous = unique.get(identity);
      if (previous !== undefined) aliases.push({ part: part.id,
        duplicate: previous.original.source.file, emitted: record.original.source.file, geometrySha256: identity });
      unique.set(identity, record);
    }
    if (unique.size === 0) throw new Error("Declared cranial part lost every original member.");
    const surfaces = [...unique.values()].map((record) => {
      const positions = record.mesh.positions.map((value, at) => scale * value + translation[at % 3]);
      if (!positions.every(Number.isFinite)) throw new Error("Emitted common cranial coordinates are unrepresentable.");
      const mesh = { ...record.mesh, positions };
      const incidence = readHumanBodyMaterialSurfaceIncidence(mesh.positions, mesh.indices);
      if (!incidence.qualified)
        throw new Error("Emitted cranial source incidence refused: " + JSON.stringify(incidence.failures));
      const source = record.original.source;
      return { id: source.file, mesh, compiledMeshSha256: hash(JSON.stringify(mesh)),
        source: { uri: record.original.uri, sha256: source.sha256,
          revision: "cranial-acquired/" + input.provenance.acquisition.sha256,
          anatomicalIdentity: source.anatomicalIdentity,
          license: rights.official, licenseUri: rights.officialUri, attribution: rights.attribution,
          acquisition: JSON.stringify({ publisherHeader: source.sourceHeader, publisherRights: rights,
            acquisitionReceipt: input.provenance.acquisition,
            conversion: "Original millimetres take (x,z,-y)/1000 once; acquired directions normalize before axis conversion",
            repair: topologyRepairs.find((entry) => entry.member === source.file)?.repair ?? null, qualification }) },
        binding: { bones: [part.id], boneIndices: new Array<number>(positions.length / 3 * 4).fill(0),
          weights: Array.from({ length: positions.length / 3 * 4 }, (_, at) => at % 4 === 0 ? 1 : 0),
          account: "Own fixed source frame; held-neutral carrier, not anatomical attachment" } };
    });
    parts.push(typia.assert<IAutoMovieHumanBodySourcePart>({ id: part.id, tissue: "bone", surfaces, attachments: [], qualification }));
    nodes.push({ id: part.id, parent: input.transportParent,
      rest: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      sites: [], joint: { kind: "fixed" }, projections: [],
      account: "Initial held-neutral cranial source; explicit fixed transport parent, not an anatomical joint",
      qualification });
  }
  const assembly = { ...input.assembly, generation,
    parts: [...input.assembly.parts, ...parts],
    rig: { ...input.assembly.rig, generation, nodes: [...input.assembly.rig.nodes, ...nodes] },
    registration: input.assembly.registration + "; common cranial source similarity " +
      JSON.stringify({ scale, translation, cutoffBone: input.cutoffBone, transportParent: input.transportParent }) + "; " + qualification };
  return { assembly, receipt: {
    schema: "automovie-cranial-source-birth/1", generation,
    assemblySha256: hash(JSON.stringify(assembly)), headSha256: input.provenance.head.sha256,
    addedParts: parts.map((part) => part.id), acquiredMembers: records.length,
    addedMembers: parts.reduce((count, part) => count + part.surfaces.length, 0),
    aliases, topologyRepairs, sourceBounds, targetBounds, scale, translation,
    inputs: input.provenance, acquisition: input.acquisition, qualification,
  } };
}

/** Every declared skin-material triangle contributes; source exterior uses its complete XYZ table. */
function bounds(
  populations: readonly CranialBoundPopulation[], bottom: number = -Infinity,
): IHumanCranialSourceResult["receipt"]["sourceBounds"] {
  if (populations.length === 0) throw new Error("Cranial bounds have no declared population.");
  const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
  for (const { positions, indices } of populations) {
    if (positions.length === 0 || positions.length % 3 !== 0)
      throw new Error("Cranial bound population is not complete XYZ.");
    if (indices !== null && (indices.length === 0 || indices.length % 3 !== 0 ||
        indices.some((vertex) => !Number.isSafeInteger(vertex) || vertex < 0 || vertex >= positions.length / 3)))
      throw new Error("Cranial target skin region has no complete valid triangle population.");
    const count = indices === null ? positions.length / 3 : indices.length;
    for (let vertex = 0; vertex < count; vertex++) {
      const at = 3 * (indices === null ? vertex : indices[vertex]);
      if (![positions[at], positions[at + 1], positions[at + 2]].every(Number.isFinite))
        throw new Error("Cranial bound population contains nonfinite coordinates.");
      if (positions[at + 1] < bottom) continue;
      for (let axis = 0; axis < 3; axis++) {
        low[axis] = Math.min(low[axis], positions[at + axis]);
        high[axis] = Math.max(high[axis], positions[at + axis]);
      }
    }
  }
  if (low.some((value, axis) => !Number.isFinite(value) || !Number.isFinite(high[axis]) || high[axis] <= value))
    throw new Error("Cranial bound population has no positive finite span.");
  return { low, high };
}
