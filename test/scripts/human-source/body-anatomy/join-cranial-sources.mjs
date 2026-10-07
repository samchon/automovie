/**
 * Add the acquired cranial constituents to a whole neutral candidate.
 *
 * From the repository root:
 *   node test/scripts/human-source/body-anatomy/join-cranial-sources.mjs ASSEMBLY PLAN ACQUIRED OUTPUT
 *
 * All acquired head bones retain their source-relative placement under one
 * uniform scale and translation. The common placement aligns the atlas skin
 * section above the lowest hyoid point with the target head's skin: the scale
 * is the ratio of their vertical spans, and their sagittal and anterior
 * centres coincide. This is an authored initial registration, not a clinical
 * fit, an inferred personal skeleton, or proof of containment. No constituent
 * is fitted separately or reduced to satisfy a clearance measurement.
 *
 * Original source vertices, indices and normalized source directions are
 * retained. The uniform positive scale leaves those directions unchanged.
 * Exact zero-area two-face cells are repaired at source by the named
 * contraction owner, with original bytes and complete face lineage retained.
 * Every other source mesh passes through unchanged. Each bone has its own fixed rest node and
 * material identity. Neutral geometry reaches the normal Person compiler;
 * motion and numerical head deformation remain separate unverified work.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { repairCranialZeroCells } from "./repair-cranial-zero-cells.mjs";

const [assemblyFile, planFile, acquiredDirectory, output] = process.argv.slice(2);
if (!assemblyFile || !planFile || !acquiredDirectory || !output)
  throw new Error("Expected ASSEMBLY PLAN ACQUIRED OUTPUT.");
const root = process.cwd();
const artifacts = path.resolve(root, ".wiki/08-campaigns/2707-human/artifacts") + path.sep;
if (!path.resolve(output).startsWith(artifacts)) throw new Error("Cranial candidates belong under campaign artifacts.");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assemblyBytes = fs.readFileSync(assemblyFile);
const planBytes = fs.readFileSync(planFile);
const assembly = JSON.parse(assemblyBytes);
const plan = JSON.parse(planBytes);
if (assembly.mode !== "neutral-only" || plan.mode !== "neutral-only")
  throw new Error("Cranial overview registration requires a held-neutral assembly and plan.");
const planDirectory = path.dirname(path.resolve(planFile));
const headBytes = fs.readFileSync(path.resolve(planDirectory, plan.headView));
const head = JSON.parse(gunzipSync(headBytes));
const inventoryBytes = fs.readFileSync(path.join(acquiredDirectory, "inventory.json"));
const inventory = JSON.parse(inventoryBytes);
const topologyRepairs = [];
const qualification = "Authored first neutral placement of acquired constituents from one male MRI-derived illustrator atlas; one common exterior-driven similarity preserves relative source anatomy. No clinical or personal registration, containment, functional joint or head-control acceptance.";

/** Original OBJ triangles in common atlas metres, with no per-part movement. */
function readObj(bytes) {
  const positions = [];
  const indices = [];
  const normals = [];
  for (const line of bytes.toString("utf8").split(/\r?\n/)) {
    if (line.startsWith("v ")) {
      const [x, y, z] = line.trim().split(/\s+/).slice(1, 4).map(Number);
      positions.push(x / 1000, z / 1000, -y / 1000);
    } else if (line.startsWith("vn ")) {
      const [x, y, z] = line.trim().split(/\s+/).slice(1, 4).map(Number);
      const length = Math.hypot(x, y, z);
      if (!(length > 0)) throw new Error("Acquired source direction has zero length.");
      normals.push(x / length, z / length, -y / length);
    } else if (line.startsWith("f ")) {
      const corners = line.trim().split(/\s+/).slice(1).map((corner) => Number(corner.split("/")[0]) - 1);
      if (corners.length !== 3) throw new Error("Acquired cranial source is not triangulated.");
      indices.push(...corners);
    }
  }
  if (positions.length === 0 || normals.length !== positions.length || positions.some((value) => !Number.isFinite(value)) ||
      indices.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= positions.length / 3))
    throw new Error("Acquired cranial source has invalid geometry.");
  return { positions, indices, normals };
}

/** Bounds of an explicitly selected source section, used by one common map. */
function bounds(positions, bottom = -Infinity) {
  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  for (let at = 0; at < positions.length; at += 3) {
    if (positions[at + 1] < bottom) continue;
    for (let axis = 0; axis < 3; axis++) {
      low[axis] = Math.min(low[axis], positions[at + axis]);
      high[axis] = Math.max(high[axis], positions[at + axis]);
    }
  }
  if (low.some((value, axis) => !Number.isFinite(value) || high[axis] <= value)) throw new Error("Head exterior section has no volume span.");
  return { low, high };
}

const sourceRecords = inventory.parts.flatMap((part) => part.actualAcquiredFiles.map((source) => {
  const file = path.resolve(acquiredDirectory, source.file + ".obj");
  const bytes = fs.readFileSync(file);
  if (sha(bytes) !== source.sha256) throw new Error("Immutable acquired cranial bytes differ.");
  const originalMesh = readObj(bytes);
  if (originalMesh.positions.length / 3 !== source.vertices || originalMesh.indices.length / 3 !== source.triangles)
    throw new Error("Acquired cranial member population differs.");
  const { mesh, receipt } = repairCranialZeroCells(originalMesh);
  if (receipt !== null) topologyRepairs.push({ part: part.id, member: source.file, sourceSha256: source.sha256, ...receipt });
  return { part: part.id, source, file, mesh };
}));
const hyoidBottom = Math.min(...sourceRecords.filter((record) => record.part === "hyoid")
  .flatMap((record) => record.mesh.positions.filter((_, at) => at % 3 === 1)));
const skinFile = path.resolve(root, ".references/bodyparts3d/compartment-references/FJ2810.obj");
const skinBytes = fs.readFileSync(skinFile);
if (sha(skinBytes) !== "50fb17d0b3559b8b6c5481dbe7f877d25726e576564da615c45b2dd7654e315d")
  throw new Error("The source exterior is not the acquired part-of atlas skin.");
const sourceBounds = bounds(readObj(skinBytes).positions, hyoidBottom);
const targetBounds = bounds(head.face.surfaces[0].positions);
const scale = (targetBounds.high[1] - targetBounds.low[1]) / (sourceBounds.high[1] - sourceBounds.low[1]);
const translation = [0, 1, 2].map((axis) => (targetBounds.low[axis] + targetBounds.high[axis] - scale * (sourceBounds.low[axis] + sourceBounds.high[axis])) / 2);
if (!(scale > 0) || !Number.isFinite(scale)) throw new Error("The common head registration is not invertible.");
fs.mkdirSync(output, { recursive: true });
const known = new Set(assembly.parts.map((part) => part.id));
const templateSource = assembly.parts.find((part) => part.tissue === "bone").surfaces[0].source;
const nodes = [];
const parts = [];
const aliases = [];
for (const part of inventory.parts) {
  if (known.has(part.id)) throw new Error("The whole assembly already has cranial identity " + part.id);
  const unique = new Map();
  for (const record of sourceRecords.filter((record) => record.part === part.id)) {
    const identity = sha(JSON.stringify(record.mesh));
    const previous = unique.get(identity);
    if (previous !== undefined) aliases.push({ part: part.id, duplicate: previous.source.file, emitted: record.source.file, geometrySha256: identity });
    unique.set(identity, record);
  }
  const surfaces = [...unique.values()].map((record) => {
    const positions = record.mesh.positions.map((value, at) => scale * value + translation[at % 3]);
    const mesh = { positions, normals: record.mesh.normals, indices: record.mesh.indices, uvs: null, skin: null };
    return { id: record.source.file, mesh, compiledMeshSha256: sha(JSON.stringify(mesh)),
      source: { ...templateSource, uri: path.relative(root, record.file).replaceAll("\\", "/"), sha256: record.source.sha256,
        revision: "bodyparts3d-4.0-cranial-acquired", anatomicalIdentity: record.source.anatomicalIdentity,
        acquisition: "Original OBJ millimetres converted by (x,z,-y)/1000 to common atlas metres; " +
          (topologyRepairs.some((repair) => repair.member === record.source.file) ? "exact zero-area source cells contracted under the manifold link condition, source coordinate and face lineage retained in registration receipt; " : "") + qualification },
      binding: { bones: [part.id], boneIndices: new Array(positions.length / 3 * 4).fill(0),
        weights: Array.from({ length: positions.length / 3 * 4 }, (_, at) => at % 4 === 0 ? 1 : 0), account: "Own fixed anatomical rest frame; neutral source only" } };
  });
  parts.push({ id: part.id, tissue: "bone", surfaces, attachments: [], qualification });
  nodes.push({ id: part.id, parent: "c1", rest: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    sites: [], joint: { kind: "fixed" }, projections: [], account: "Held neutral cranial source frame; C1 is a fixed transport parent, not an anatomical joint claim", qualification });
}
const producer = { main: sha(fs.readFileSync(import.meta.filename)), repair: sha(fs.readFileSync(new URL("./repair-cranial-zero-cells.mjs", import.meta.url))) };
const generation = "cranial-neutral-" + sha(assemblyBytes + sha(inventoryBytes) + sha(headBytes) + JSON.stringify(producer)).slice(0, 20);
assembly.parts.push(...parts);
assembly.rig = { ...assembly.rig, generation, nodes: [...assembly.rig.nodes, ...nodes] };
assembly.generation = generation;
assembly.registration += "; cranial common source similarity, scale " + scale + ", translation " + JSON.stringify(translation) + "; " + qualification;
const bytes = JSON.stringify(assembly);
fs.writeFileSync(path.join(output, "source-assembly.json"), bytes);
fs.writeFileSync(path.join(output, "source-rig.json"), JSON.stringify(assembly.rig));
const rebase = (value) => path.relative(path.resolve(output), path.resolve(planDirectory, value)).replaceAll("\\", "/");
const next = {};
for (const [key, value] of Object.entries(plan)) {
  if (["rig", "shape", "mode", "rawInputs"].includes(key)) continue;
  next[key] = typeof value === "string" ? rebase(value) : Array.isArray(value) ? value.map(rebase) : value;
}
next.rig = "source-rig.json";
next.shape = plan.shape;
next.mode = plan.mode;
next.rawInputs = [...plan.rawInputs.map((input) => ({ ...input, file: rebase(input.file) })),
  ...sourceRecords.map((record) => ({ file: path.relative(path.resolve(output), record.file).replaceAll("\\", "/"), sha256: record.source.sha256 }))];
fs.writeFileSync(path.join(output, "compile-plan.json"), JSON.stringify(next, null, 2));
fs.writeFileSync(path.join(output, "registration-receipt.json"), JSON.stringify({ generation, assemblySha256: sha(bytes),
  inputAssemblySha256: sha(assemblyBytes), inputPlanSha256: sha(planBytes), headSha256: sha(headBytes), acquiredInventorySha256: sha(inventoryBytes),
  atlasSkinSha256: sha(skinBytes), producerSha256: sha(fs.readFileSync(import.meta.filename)), sourceBounds, targetBounds, scale, translation,
  addedParts: parts.map((part) => part.id), acquiredMembers: sourceRecords.length, aliases,
  producer, topologyRepairs,
  addedMembers: parts.reduce((count, part) => count + part.surfaces.length, 0), qualification }, null, 2));
console.log(JSON.stringify({ generation, addedParts: parts.length, addedMembers: parts.reduce((count, part) => count + part.surfaces.length, 0), aliases, scale, translation }));
