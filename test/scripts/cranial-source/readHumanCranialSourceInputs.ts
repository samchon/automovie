import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import typia from "typia";
import type { IAutoMovieMesh } from "@automovie/interface";
import type { AutoMovieHumanBodyBoneId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import type { IHumanBodyAnatomicalCompilePlan } from "../body-review/IHumanBodyAnatomicalCompilePlan.ts";
import { readHumanBodyAtlasObj } from "../body-review/readHumanBodyAtlasObj.ts";
import type { IHumanCranialSourceInput } from "./IHumanCranialSourceInput.ts";

/** An explicit original source-exterior digest is separate from its registration output. @author Samchon */
interface CranialExteriorReceipt { atlasSkinSha256: string }

/** Original publisher acquisition and unresolved rights stay intact. @author Samchon */
interface CranialAcquisitionReceipt extends Record<string, unknown> {
  archive: string;
  archiveSha256: string;
  membershipTableSha256: string;
  parts: number;
  members: number;
  rights: Record<string, unknown>;
}

/**
 * Read actual cranial source inputs once, preserving original bytes and rights.
 * The acquired cranial inventory intentionally has its own contract: no
 * absent generic tree/URI fields are fabricated. The shared OBJ parser retains
 * original millimetre vertices and normal ordinals; this owner converts once
 * by (x,z,-y)/1000 and normalizes original directions before the axis change.
 * Unsupported OBJ features or changed referenced bytes refuse publication.
 */
export function readHumanCranialSourceInputs(
  files: Readonly<Record<string, string>>,
): IHumanCranialSourceInput {
  const repository = path.resolve(__dirname, "../../..");
  const provenance: IHumanCranialSourceInput["provenance"] = {};
  const physicalFiles: Record<string, string> = {};
  const hash = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
  const resolve = (file: string): string => {
    const absolute = path.resolve(repository, file);
    const relative = path.relative(repository, absolute);
    if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative))
      throw new Error("Cranial source inputs require repository-relative authority.");
    return absolute;
  };
  const record = (role: string, absolute: string, sha256: string, bytes: number, expected?: string): void => {
    if (expected !== undefined && (!/^[a-f\d]{64}$/i.test(expected) || sha256 !== expected.toLowerCase()))
      throw new Error("Cranial source bytes differ: " + role);
    const previous = provenance[role];
    if (previous !== undefined && (previous.uri !== path.relative(repository, absolute).replaceAll("\\", "/") || previous.sha256 !== sha256))
      throw new Error("Cranial input role has conflicting authority: " + role);
    physicalFiles[role] = absolute;
    provenance[role] = { uri: path.relative(repository, absolute).replaceAll("\\", "/"), sha256, bytes };
  };
  const read = (role: string, file: string, expected?: string): Buffer => {
    const absolute = resolve(file), bytes = fs.readFileSync(absolute);
    record(role, absolute, hash(bytes), bytes.length, expected);
    return bytes;
  };
  const enrol = (role: string, file: string, expected: string): void => {
    const absolute = resolve(file), digest = createHash("sha256");
    const descriptor = fs.openSync(absolute, "r"), buffer = Buffer.alloc(65536);
    let bytes = 0;
    try {
      for (;;) {
        const count = fs.readSync(descriptor, buffer, 0, buffer.length, null);
        if (count === 0) break;
        bytes += count;
        digest.update(buffer.subarray(0, count));
      }
    } finally { fs.closeSync(descriptor); }
    record(role, absolute, digest.digest("hex"), bytes, expected);
  };
  const required = (name: string): string => {
    const file = files[name];
    if (file === undefined) throw new Error("Missing cranial source input: " + name);
    return file;
  };
  const assembly = typia.assert<IAutoMovieHumanBodyAnatomicalAssembly>(JSON.parse(read("assembly", required("assembly")).toString("utf8")));
  const plan = typia.assert<IHumanBodyAnatomicalCompilePlan>(JSON.parse(read("plan", required("plan")).toString("utf8")));
  if (assembly.mode !== "neutral-only" || plan.mode !== "neutral-only" || assembly.generation !== assembly.rig.generation ||
      JSON.stringify(assembly.shape) !== JSON.stringify(plan.shape))
    throw new Error("Initial cranial birth needs one held-neutral parent assembly and plan.");
  const planDirectory = path.dirname(physicalFiles.plan);
  const headFile = files.head ?? path.resolve(planDirectory, plan.headView);
  const headBytes = read("head", headFile);
  const head = typia.assert<IAutoMovieHumanPersonHeadView>(JSON.parse(gunzipSync(headBytes).toString("utf8")));
  if (head.face.surfaces.length === 0 || head.face.surfaces.some((surface) =>
    surface.positions.length === 0 || surface.positions.length % 3 !== 0 || !surface.positions.every(Number.isFinite)))
    throw new Error("Initial cranial birth needs every declared target head surface's complete finite XYZ population.");
  const inventory = typia.assert<IHumanCranialSourceInput["inventory"]>(JSON.parse(read("inventory", required("inventory")).toString("utf8")));
  if (inventory.parts.length === 0 || new Set(inventory.parts.map((part) => part.id)).size !== inventory.parts.length)
    throw new Error("Acquired cranial inventory is empty or repeats a bone.");
  const acquisitionBytes = read("acquisition", required("acquisition"));
  const acquisition = typia.assert<CranialAcquisitionReceipt>(JSON.parse(acquisitionBytes.toString("utf8")));
  if (Object.keys(acquisition.rights).length === 0 || acquisition.parts !== inventory.parts.length ||
      acquisition.members !== inventory.parts.reduce((count, part) => count + part.actualAcquiredFiles.length, 0))
    throw new Error("Acquired cranial membership and rights receipt disagree.");
  enrol("acquisition_archive", acquisition.archive, acquisition.archiveSha256);
  const convert = (original: IAutoMovieMesh): IHumanCranialSourceInput["sources"][number]["mesh"] => {
    if (original.indices === null || original.normals === null)
      throw new Error("Acquired cranial source needs original indices and normals.");
    const positions: number[] = [], normals: number[] = [];
    for (let at = 0; at < original.positions.length; at += 3) {
      positions.push(original.positions[at] / 1000, original.positions[at + 2] / 1000, -original.positions[at + 1] / 1000);
      const length = Math.hypot(original.normals[at], original.normals[at + 1], original.normals[at + 2]);
      if (!(length > 0) || !Number.isFinite(length)) throw new Error("Acquired source direction is zero or unrepresentable.");
      normals.push(original.normals[at] / length, original.normals[at + 2] / length, -original.normals[at + 1] / length);
    }
    if (!positions.every(Number.isFinite)) throw new Error("Atlas metre conversion is unrepresentable.");
    return { ...original, positions, normals, indices: original.indices };
  };
  const acquiredDirectory = path.dirname(physicalFiles.inventory);
  const sources: IHumanCranialSourceInput["sources"] = [];
  const sourceIds = new Set<string>();
  for (const part of inventory.parts) {
    if (part.actualAcquiredFiles.length === 0) throw new Error("Declared cranial bone has no acquired source: " + part.id);
    for (const source of part.actualAcquiredFiles) {
      if (sourceIds.has(source.file) || path.basename(source.file) !== source.file)
        throw new Error("Acquired cranial file identity repeats or escapes its directory.");
      sourceIds.add(source.file);
      const bytes = read("member_" + source.file, path.join(acquiredDirectory, source.file + ".obj"), source.sha256);
      const text = bytes.toString("utf8");
      if (!text.includes("# File ID : " + source.file) || source.sourceHeader.length === 0 || source.sourceHeader.some((line) => !text.includes(line)))
        throw new Error("Acquired cranial publisher header differs: " + source.file);
      const mesh = convert(readHumanBodyAtlasObj(text));
      if (mesh.positions.length / 3 !== source.vertices || mesh.indices.length / 3 !== source.triangles)
        throw new Error("Acquired cranial vertex/face population differs: " + source.file);
      sources.push({ part: part.id, source, uri: provenance["member_" + source.file].uri, mesh });
    }
  }
  const exteriorReceipt = typia.assert<CranialExteriorReceipt>(JSON.parse(read("skin_receipt", required("skin_receipt")).toString("utf8")));
  const sourceExterior = convert(readHumanBodyAtlasObj(read("skin", required("skin"), exteriorReceipt.atlasSkinSha256).toString("utf8")));
  for (const [at, source] of plan.rawInputs.entries())
    enrol("parent_source_" + at, path.resolve(planDirectory, source.file), source.sha256);
  const parentRig = JSON.parse(read("parent_rig", path.resolve(planDirectory, plan.rig)).toString("utf8"));
  if (JSON.stringify(parentRig) !== JSON.stringify(assembly.rig))
    throw new Error("Parent cranial assembly differs from its actual rig input.");
  const cutoffBone = typia.assert<AutoMovieHumanBodyBoneId>(required("cutoff_bone"));
  const transportParent = typia.assert<AutoMovieHumanBodyBoneId>(required("transport_parent"));
  if (!sources.some((source) => source.part === cutoffBone) || !assembly.rig.nodes.some((node) => node.id === transportParent))
    throw new Error("Cranial initialization recipe lacks its actual source cutoff or transport parent.");
  for (const name of ["historical_join", "historical_repair"])
    if (files[name] !== undefined) read(name, files[name]);
  return { assembly, plan, head, inventory, sources, sourceExterior, cutoffBone, transportParent,
    acquisition, provenance, physicalFiles, planDirectory };
}
