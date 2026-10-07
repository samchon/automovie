/**
 * Join registered members into a candidate anatomical assembly and its plan.
 *
 * From the repository root:
 *   node test/scripts/human-source/body-anatomy/join-registered-members.mjs ASSEMBLY PLAN REGISTRATION OUTPUT [LAYER|-] [TARGET_PLAN]
 *
 * ASSEMBLY and PLAN are the registered whole assembly being superseded for
 * the members REGISTRATION names; REGISTRATION is the directory the
 * registration producer wrote. Every other member, the skin and the document
 * pass through unchanged, so a compile of OUTPUT differs from a compile of
 * the input only in the registered members and their rig nodes.
 *
 * Positions arrive as little-endian float64 metres in the target neutral
 * frame. Normals are recomputed from the registered triangles, area weighted,
 * because a non-rigid map does not carry the old ones. A member that arrives
 * with its own triangles is a mirrored bone: it takes those triangles and a
 * rigid binding to its own bone.
 *
 * A member's source record names the acquired or authored file whose bytes
 * were actually consumed, restored from the whole-source preparation receipt
 * the plan cites; the registered object has its own digest in
 * `compiledMeshSha256`, taken over the JSON.stringify bytes the compile entry
 * hashes. A mirrored bone's record therefore names the right member's file,
 * and its `substitution` keeps the left file its identity names as a receipt.
 * A member authored in the target frame names the authored file it came from.
 * A registration may also name `authoredParts`: complete target-native part
 * payloads with file digests. Those replace the part's geometry, attachments,
 * bindings and numerical fields together. Transporting only new positions
 * would leave old vertex addresses and quantity derivatives behind. Every
 * replacement surface must have a corresponding registered member, whose
 * Float64 positions must equal the payload's baseline. The normal typed
 * assembly compiler remains responsible for full source/rig admission.
 *
 * LAYER is the directory of the compile entry's layer-surfaces stage. With
 * it the subcutaneous member takes the shell that stage built between the
 * dermal and fascial faces, replacing the lattice surface: the stored mesh
 * is the neutral shell, and its source record names that file. The shell is
 * derived from the skin and has no attachment of its own, so it is bound
 * whole to the first bone of the member's former binding; that is a
 * held-neutral carrier, not an anatomical attachment.
 *
 * TARGET_PLAN carries a registration over to another source generation of
 * the same skin: its body view, head view and person document replace the
 * plan's, and the assembly is bound to that body basis. This is valid only
 * when the two generations share skin topology, weights and collar and
 * differ in a few vertex positions, which is the source owner's finding to
 * make and is recorded here, not checked. Layer surfaces must then belong to
 * the target basis. Pass - for LAYER to give a target plan without a layer.
 * This step publishes nothing; the output is a campaign candidate.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const [assemblyFile, planFile, registrationDirectory, output, layerArgument, targetPlanFile] = process.argv.slice(2);
const layerDirectory = layerArgument === "-" ? undefined : layerArgument;
if (!assemblyFile || !planFile || !registrationDirectory || !output)
  throw new Error("Expected ASSEMBLY PLAN REGISTRATION OUTPUT.");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const receiptBytes = fs.readFileSync(path.join(registrationDirectory, "registration-receipt.json"));
const receipt = JSON.parse(receiptBytes);
const revision = "body-anatomy-registration/" + sha(receiptBytes);
const assembly = JSON.parse(fs.readFileSync(assemblyFile, "utf8"));
const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
if (receipt.targetBodyBasis !== assembly.basis)
  throw new Error("Registration and assembly name different body bases.");
fs.mkdirSync(output, { recursive: true });

/** Area-weighted unit vertex normals of an indexed triangle surface. */
function normalsOf(positions, indices) {
  const sums = new Float64Array(positions.length);
  for (let at = 0; at < indices.length; at += 3) {
    const [a, b, c] = [indices[at] * 3, indices[at + 1] * 3, indices[at + 2] * 3];
    const u = [positions[b] - positions[a], positions[b + 1] - positions[a + 1], positions[b + 2] - positions[a + 2]];
    const v = [positions[c] - positions[a], positions[c + 1] - positions[a + 1], positions[c + 2] - positions[a + 2]];
    const area = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (Math.hypot(...area) === 0) throw new Error("Registration collapsed a source triangle.");
    for (const corner of [a, b, c]) for (let axis = 0; axis < 3; axis++) sums[corner + axis] += area[axis];
  }
  const normals = new Array(positions.length);
  for (let at = 0; at < positions.length; at += 3) {
    const length = Math.hypot(sums[at], sums[at + 1], sums[at + 2]);
    if (!(length > 0)) throw new Error("Registration cancelled a vertex normal.");
    for (let axis = 0; axis < 3; axis++) normals[at + axis] = sums[at + axis] / length;
  }
  return normals;
}

const planDirectory = path.dirname(path.resolve(planFile));
const originals = Object.entries(JSON.parse(fs.readFileSync(path.resolve(planDirectory, plan.sourcePreparationReceipt), "utf8")).originalInputs);
/**
 * The original file of one member: the authored derivative of a refused
 * acquired member, an acquired atlas OBJ, an authored gland or another
 * authored mesh, in that order of precedence.
 */
function originalOf(part, member) {
  const suffixes = ["/authored-trapezius-source/" + member + ".mesh.json", "/all-parts-raw/" + member + ".obj",
    "/authored-breast-glandular/" + part + ".mesh.json", "/authored-other-gaps/" + part + ".mesh.json"];
  for (const suffix of suffixes) {
    const found = originals.filter(([file]) => file.endsWith(suffix));
    if (found.length > 1) throw new Error("Ambiguous original input for " + part + "/" + member);
    if (found.length === 0) continue;
    if (sha(fs.readFileSync(found[0][0])) !== found[0][1]) throw new Error("Original input bytes changed: " + found[0][0]);
    return { uri: found[0][0], sha256: found[0][1] };
  }
  throw new Error("No original input for " + part + "/" + member);
}
const identities = new Map(assembly.parts.map((part) => [part.id, part.surfaces[0].source.anatomicalIdentity]));
/** One key convention for native member IDs and legacy filename identifiers. */
const memberKey = (part, member) => part + "--" + member.replace(/[/:]/g, "-");
const registered = new Map();
for (const member of receipt.members) {
  const key = memberKey(member.part, member.member);
  if (registered.has(key)) throw new Error("Ambiguous registered member key: " + key);
  registered.set(key, member);
}
const authoredParts = new Set();
const nativePayloadInputs = [];
for (const replacement of receipt.authoredParts ?? []) {
  if (authoredParts.has(replacement.part)) throw new Error("Duplicate target-native part: " + replacement.part);
  const file = path.join(registrationDirectory, replacement.file);
  const bytes = fs.readFileSync(file);
  if (sha(bytes) !== replacement.sha256) throw new Error("Target-native part bytes changed: " + replacement.part);
  const part = JSON.parse(bytes.toString("utf8"));
  const index = assembly.parts.findIndex((candidate) => candidate.id === replacement.part);
  if (index < 0 || part.id !== replacement.part || part.tissue !== assembly.parts[index].tissue ||
      !Array.isArray(part.surfaces) || part.surfaces.length === 0 || !Array.isArray(part.attachments) ||
      typeof part.qualification !== "string" || part.qualification.trim() === "")
    throw new Error("Target-native replacement does not retain its complete part identity: " + replacement.part);
  const formerMembers = new Set(assembly.parts[index].surfaces.map((surface) => surface.id));
  if (part.surfaces.length !== formerMembers.size || part.surfaces.some((surface) => !formerMembers.has(surface.id)))
    throw new Error("Target-native replacement lost an anatomical source member: " + replacement.part);
  const members = new Set();
  for (const surface of part.surfaces) {
    const key = memberKey(part.id, surface.id);
    if (members.has(key) || !registered.has(key))
      throw new Error("Target-native surface has no unique registration: " + key);
    members.add(key);
  }
  // Assigning the complete payload removes old optional fields when the new
  // source has none. Undefined is not permission to retain an old derivative.
  assembly.parts[index] = part;
  authoredParts.add(part.id);
  nativePayloadInputs.push({ file: path.relative(path.resolve(output), path.resolve(file)).replaceAll("\\", "/"), sha256: replacement.sha256 });
}
const replacedFiles = new Map();
const used = new Set();
for (const part of assembly.parts)
  for (const surface of part.surfaces) {
    const key = memberKey(part.id, surface.id);
    const member = registered.get(key);
    if (member === undefined) continue;
    used.add(key);
    const bytes = fs.readFileSync(path.join(registrationDirectory, member.positions));
    const positions = Array.from(new Float64Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 8));
    if (positions.length !== member.vertices * 3 || positions.some((value) => !Number.isFinite(value)))
      throw new Error("Registered positions are incomplete: " + key);
    if (authoredParts.has(part.id) && (positions.length !== surface.mesh.positions.length ||
        positions.some((value, at) => value !== surface.mesh.positions[at])))
      throw new Error("Target-native baseline and registered member differ: " + key);
    let indices = surface.mesh.indices;
    if (member.indices !== undefined) {
      const raw = fs.readFileSync(path.join(registrationDirectory, member.indices));
      indices = Array.from(new Int32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4));
      if (part.tissue !== "bone" && !authoredParts.has(part.id))
        throw new Error("New soft-tissue triangles require a complete target-native part: " + key);
      if (authoredParts.has(part.id) && (indices.length !== surface.mesh.indices.length ||
          indices.some((value, at) => value !== surface.mesh.indices[at])))
        throw new Error("Target-native topology and registered member differ: " + key);
      if (part.tissue === "bone")
        surface.binding = { ...surface.binding, bones: [part.id], boneIndices: new Array(member.vertices * 4).fill(0),
          weights: Array.from({ length: member.vertices * 4 }, (_, at) => (at % 4 === 0 ? 1 : 0)) };
    } else if (positions.length !== surface.mesh.positions.length)
      throw new Error("Registered member changed its vertex population: " + key);
    surface.mesh = { ...surface.mesh, positions, indices, normals: normalsOf(positions, indices) };
    const meshBytes = JSON.stringify(surface.mesh);
    const file = key + ".mesh.json";
    fs.writeFileSync(path.join(output, file), meshBytes);
    surface.compiledMeshSha256 = sha(meshBytes);
    const own = originalOf(part.id, member.member);
    if (authoredParts.has(part.id) && member.authoredSource === undefined)
      throw new Error("A target-native member needs its actual source file: " + key);
    const authored = member.authoredSource === undefined ? undefined : path.join(registrationDirectory, member.authoredSource);
    const consumed = authored !== undefined ? { uri: path.relative(process.cwd(), authored).replaceAll("\\", "/"), sha256: sha(fs.readFileSync(authored)) }
      : member.consumedPart === undefined ? own : originalOf(member.consumedPart, member.consumedMember);
    surface.source = { ...surface.source, ...consumed, revision: "bodyparts3d-or-authored-coarse-source-20261006",
      anatomicalIdentity: authoredParts.has(part.id) ? surface.source.anatomicalIdentity : identities.get(member.consumedPart ?? part.id),
      acquisition: "MRI-derived/illustrator atlas boundary or reproducibly authored source; " + member.account + " (" + revision + ")" };
    if (member.consumedPart !== undefined)
      surface.source.substitution = { operation: "sagittalMirror", replacedUri: own.uri, replacedSha256: own.sha256,
        replacedAnatomicalIdentity: identities.get(part.id),
        account: "The atlas is one asymmetric individual and the target exterior is symmetric; the left member is authored as the mirror of the right so the basis is symmetric by construction. No symmetry of the individual and no validity of a reflected organ is asserted." };
    else delete surface.source.substitution;
    surface.binding.account += "; rest positions registered by " + revision;
    replacedFiles.set(key, { file: path.relative(path.resolve(output), path.resolve(consumed.uri)).replaceAll("\\", "/"), sha256: consumed.sha256 });
  }
for (const key of registered.keys())
  if (!used.has(key)) throw new Error("A registered member has no surface in the assembly: " + key);
let rebased;
if (targetPlanFile !== undefined) {
  const target = JSON.parse(fs.readFileSync(targetPlanFile, "utf8"));
  const directory = path.dirname(path.resolve(targetPlanFile));
  const body = JSON.parse(gunzipSync(fs.readFileSync(path.resolve(directory, target.bodyView))).toString("utf8")).body;
  rebased = { from: assembly.basis, to: body.id, plan: target, directory };
  assembly.basis = body.id;
  assembly.registration += "; carried from body basis " + rebased.from + " to " + rebased.to + " on the source owner's finding of identical skin topology, weights and collar";
}
let shell;
if (layerDirectory !== undefined) {
  const file = path.join(layerDirectory, "subcutaneous-shell.mesh.json");
  const bytes = fs.readFileSync(file);
  const layer = JSON.parse(fs.readFileSync(path.join(layerDirectory, "layer-surfaces.json"), "utf8"));
  if (layer.basis !== assembly.basis || layer.subcutaneousShellSha256 !== sha(bytes))
    throw new Error("Layer surfaces do not belong to this assembly's body basis.");
  // An older packet's absent coverage is unknown, rather than a zero reading.
  // Non-refusal by these local proxies does not certify global embedding.
  const layerCounts = [layer.beyondReachVertices, layer.unmeasuredReachVertices,
    layer.dermalInvertedTriangles, layer.invertedTriangles];
  if (layerCounts.some((count) => !Number.isSafeInteger(count) || count !== 0))
    throw new Error("Layer replacement requires complete opposite-sheet observations and no reported offset inversion or reach refusal.");
  const part = assembly.parts.find((candidate) => candidate.id === "subcutaneousAdipose");
  if (part === undefined || part.surfaces.length !== 1) throw new Error("The assembly has no single subcutaneous member.");
  const surface = part.surfaces[0];
  const mesh = JSON.parse(bytes);
  shell = { former: surface.source.uri.replaceAll("\\", "/").split("/").pop(), file: path.relative(path.resolve(output), path.resolve(file)).replaceAll("\\", "/"), sha256: sha(bytes) };
  surface.mesh = mesh;
  surface.compiledMeshSha256 = sha(JSON.stringify(mesh));
  surface.source = { ...surface.source, uri: path.relative(process.cwd(), file).replaceAll("\\", "/"), sha256: shell.sha256,
    revision: "body-layer-shell/" + layer.fieldSha256,
    acquisition: "Shell between the dermal and fascial faces the package derives from the body skin and an authored thickness field; not an imaged or segmented tissue" };
  const vertices = mesh.positions.length / 3;
  surface.binding = { bones: [surface.binding.bones[0]], boneIndices: new Array(vertices * 4).fill(0),
    weights: Array.from({ length: vertices * 4 }, (_, at) => (at % 4 === 0 ? 1 : 0)),
    account: "Held-neutral carrier only: the shell is derived from the skin and regenerated from it, so it has no anatomical attachment of its own" };
  part.qualification += "; subcutaneous layer replaced by the skin-derived shell " + surface.source.revision;
}

const joinProducerSha256 = sha(fs.readFileSync(new URL(import.meta.url)));
const generation = "registered-body-" + sha(JSON.stringify({ receipt: sha(receiptBytes), producer: joinProducerSha256,
  assembly: sha(fs.readFileSync(assemblyFile)), plan: sha(fs.readFileSync(planFile)) })).slice(0, 20);
const nodes = JSON.parse(fs.readFileSync(path.join(registrationDirectory, "source-rig-nodes.json"), "utf8"));
const supportAccounts = [];
for (const reading of receipt.measurements ?? []) {
  if (reading.supportVertex === undefined) continue;
  const part = assembly.parts.find((candidate) => candidate.id === reading.part);
  if (!authoredParts.has(reading.part) || part === undefined || part.surfaces.length !== 1 ||
      !Number.isSafeInteger(reading.supportVertex) || reading.supportVertex < 0)
    throw new Error("Native support measurement has no unambiguous source member: " + reading.part);
  const surface = part.surfaces[0];
  const point = surface.mesh.positions.slice(reading.supportVertex * 3, reading.supportVertex * 3 + 3);
  if (point.length !== 3 || !Array.isArray(reading.supportPole) || reading.supportPole.length !== 3 ||
      point.some((value, at) => value !== reading.supportPole[at]))
    throw new Error("Native support ordinal differs from its actual source point: " + reading.part);
  const supports = part.attachments.filter((attachment) => attachment.role === "support");
  if (supports.length !== 1) throw new Error("Native support measurement needs one declared site owner: " + reading.part);
  const attachment = supports[0];
  const node = nodes.find((candidate) => candidate.id === attachment.bone);
  const site = node?.sites.find((candidate) => candidate.id === attachment.site);
  if (site === undefined) throw new Error("Native support site is missing from its registered bone: " + reading.part);
  site.account = "Actual target-native member " + surface.id + " support vertex " + reading.supportVertex +
    "; source registration " + revision + "; complete native payload consumed by join " + joinProducerSha256 + ".";
  site.qualification = "Authored target-native kinematic support reference only; anatomical footprint, Cooper support and physiological mechanics unverified.";
  supportAccounts.push({ part: reading.part, member: surface.id, vertex: reading.supportVertex, bone: attachment.bone, site: attachment.site,
    sourcePointMetres: point, sourceSha256: surface.source.sha256 });
}
assembly.rig = { ...assembly.rig, generation, nodes };
assembly.generation = generation;
assembly.registration += "; members superseded by " + revision;
// The registered parts are declared to follow the skin when the body is
// shaped. Eight neighbours at inverse squared distance is this candidate's
// first, coarse rule; the package's binding record states what it omits.
assembly.exteriorBinding = { neighbours: 8, power: 2,
  account: "First overview rule: every internal vertex takes the inverse-squared-distance mean displacement of its eight nearest neutral skin vertices. Bones are not kept rigid and no tissue volume is conserved." };
const assemblyBytes = JSON.stringify(assembly);
fs.writeFileSync(path.join(output, "source-assembly.json"), assemblyBytes);
fs.writeFileSync(path.join(output, "source-rig.json"), JSON.stringify(assembly.rig));

// Every path of the plan is relative to the plan's own directory.
const rebase = (value) => path.relative(path.resolve(output), path.resolve(planDirectory, value)).replaceAll("\\", "/");
const next = {};
for (const [key, value] of Object.entries(plan)) {
  if (key === "rawInputs" || key === "rig" || key === "shape" || key === "mode") continue;
  next[key] = typeof value === "string" ? rebase(value) : Array.isArray(value) ? value.map(rebase) : value;
}
for (const key of ["shape", "mode"]) if (plan[key] !== undefined) next[key] = plan[key];
if (rebased !== undefined)
  for (const key of ["bodyView", "headView", "personDocument"])
    next[key] = path.relative(path.resolve(output), path.resolve(rebased.directory, rebased.plan[key])).replaceAll("\\", "/");
next.rig = "source-rig.json";
next.rawInputs = plan.rawInputs.map((source) => {
  const name = source.file.replaceAll("\\", "/").split("/").pop().replace(/\.mesh\.json$/, "");
  if (shell !== undefined && source.file.replaceAll("\\", "/").split("/").pop() === shell.former) return { file: shell.file, sha256: shell.sha256 };
  const replaced = replacedFiles.get(name);
  return replaced === undefined ? { ...source, file: rebase(source.file) } : replaced;
});
// Acquired raw files need not have a registered member's filename. Preserve
// those original receipts, and explicitly enrol every newly consumed source
// and complete native payload rather than relying on a filename substitution.
const actualInputs = new Map(next.rawInputs.map((source) => [path.resolve(output, source.file), source.sha256]));
for (const source of [...replacedFiles.values(), ...nativePayloadInputs]) {
  const file = path.resolve(output, source.file);
  const former = actualInputs.get(file);
  if (former !== undefined && former !== source.sha256)
    throw new Error("One actual source input has conflicting digests: " + source.file);
  if (former === undefined) {
    next.rawInputs.push(source);
    actualInputs.set(file, source.sha256);
  }
}
fs.writeFileSync(path.join(output, "compile-plan.json"), JSON.stringify(next, null, 2));
fs.writeFileSync(path.join(output, "join-receipt.json"), JSON.stringify({
  generation, revision, rebasedFrom: rebased?.from ?? null, bodyBasis: assembly.basis, registrationReceiptSha256: sha(receiptBytes), inputAssemblySha256: sha(fs.readFileSync(assemblyFile)),
  inputPlanSha256: sha(fs.readFileSync(planFile)), assemblySha256: sha(assemblyBytes), replacedMembers: [...replacedFiles.keys()],
  joinProducerSha256, rawInputCount: next.rawInputs.length, supportAccounts,
  authoredParts: [...authoredParts],
  meaning: "Campaign candidate assembly; registered members and rig nodes replaced, complete target-native parts replace their bindings and derivatives together, all else unchanged, nothing published",
}, null, 2));
console.log(JSON.stringify({ generation, replacedMembers: replacedFiles.size }));
