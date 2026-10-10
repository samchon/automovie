import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readHumanSourceProducerClosure } from "../human-source/readHumanSourceProducerClosure.ts";
import { readHumanCranialSourceInputs } from "./readHumanCranialSourceInputs.ts";
import { buildHumanCranialSource } from "./buildHumanCranialSource.ts";
import type { IHumanBodyAnatomicalCompilePlan } from "../body-review/IHumanBodyAnatomicalCompilePlan.ts";

/**
 * Normal TypeScript initial cranial source authoring, with fresh outputs only.
 * From test/: ttsx -P scripts/cranial-source/tsconfig.json
 * --cache-dir ../node_modules/.cache/ttsc/ttsx
 * scripts/cranial-source/author-cranial-source.ts --assembly ASSEMBLY --plan PLAN
 * --inventory INVENTORY --acquisition ACQUISITION --skin SOURCE_OBJ
 * --skin-receipt ORIGINAL_SKIN_RECEIPT --cutoff-bone BONE --transport-parent BONE
 * --output NEW_DIRECTORY [--head HEAD_GZIP] [--historical-join ORIGINAL_BYTES]
 * [--historical-repair ORIGINAL_BYTES]. Historical originals are never executed.
 * The actual compiler closure and all physical inputs own the new identity.
 * Failure leaves old generations untouched and records a refused fresh attempt.
 * The existing material loader consumes the resulting cranial assembly/receipt;
 * downstream numerical, clinical and rendered admission remain separate.
 */
function main(): void {
  const allowed = new Set(["assembly", "plan", "inventory", "acquisition", "skin", "skin-receipt",
    "cutoff-bone", "transport-parent", "output", "head", "historical-join", "historical-repair"]);
  const files: Record<string, string> = {};
  const args = process.argv.slice(2);
  for (let at = 0; at < args.length; at += 2) {
    const option = args[at], value = args[at + 1];
    if (!option.startsWith("--") || !allowed.has(option.slice(2)) || value === undefined)
      throw new Error("Expected named cranial source inputs and a fresh output.");
    const name = option.slice(2).replaceAll("-", "_");
    if (files[name] !== undefined) throw new Error("Repeated cranial source option: " + option);
    files[name] = value;
  }
  const repository = path.resolve(__dirname, "../../..");
  if (files.output === undefined) throw new Error("Missing fresh cranial source output.");
  const output = path.resolve(repository, files.output);
  const artifacts = path.join(repository, ".wiki/08-campaigns/2707-human/artifacts");
  const relative = path.relative(artifacts, output);
  if (relative === "" || relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative) || fs.existsSync(output))
    throw new Error("Cranial source publication requires a fresh campaign output directory.");
  const closure = readHumanSourceProducerClosure(repository,
    "test/scripts/cranial-source/author-cranial-source.ts", {
      projectFile: "test/scripts/cranial-source/tsconfig.json",
      sourceDirectory: "test/scripts/cranial-source",
    });
  const input = readHumanCranialSourceInputs(files);
  const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
  const identity = JSON.stringify({
    inputs: Object.entries(input.provenance).sort(([a], [b]) => compare(a, b)),
    producer: closure.inputs,
    recipe: { cutoffBone: input.cutoffBone, transportParent: input.transportParent,
      atlasFrame: "(x,z,-y)/1000 once; +X left/+Y up/+Z anterior metres",
      targetFrame: "Declared held-neutral head and parent source metres",
      normals: "Normalize acquired directions before axes; shared repaired normals with acquired unused directions",
      registration: "One positive span/centre similarity; no personal/clinical fit" },
  });
  const generation = "cranial-ts-neutral-" + hash(identity).slice(0, 20);
  const result = buildHumanCranialSource(input, generation);
  const rebase = (file: string): string => path.relative(output, path.resolve(input.planDirectory, file)).replaceAll("\\", "/");
  const sources = new Map<string, string>();
  for (const source of input.plan.rawInputs) {
    const absolute = path.resolve(input.planDirectory, source.file);
    const previous = sources.get(absolute);
    if (previous !== undefined && previous !== source.sha256)
      throw new Error("Original source plan repeats conflicting byte authority.");
    sources.set(absolute, source.sha256);
  }
  for (const source of input.sources) {
    const absolute = path.resolve(repository, source.uri);
    const previous = sources.get(absolute);
    if (previous !== undefined && previous !== source.source.sha256)
      throw new Error("Acquired cranial source conflicts with the original plan.");
    sources.set(absolute, source.source.sha256);
  }
  const plan: IHumanBodyAnatomicalCompilePlan = {
    ...input.plan, rig: "source-rig.json", headView: path.relative(output, input.physicalFiles.head).replaceAll("\\", "/"),
    bodyView: rebase(input.plan.bodyView), personDocument: rebase(input.plan.personDocument),
    inventory: rebase(input.plan.inventory), compiledAtlas: rebase(input.plan.compiledAtlas),
    atlasReceipt: rebase(input.plan.atlasReceipt), otherParts: rebase(input.plan.otherParts),
    glandular: rebase(input.plan.glandular), adipose: rebase(input.plan.adipose),
    registration: rebase(input.plan.registration), sourcePreparationReceipt: rebase(input.plan.sourcePreparationReceipt),
    attachmentPackets: input.plan.attachmentPackets.map(rebase),
    rawInputs: [...sources].map(([file, sha256]) => ({ file: path.relative(output, file).replaceAll("\\", "/"), sha256 })),
  };
  verifyInputs(input.physicalFiles, input.provenance);
  closure.verifyUnchanged();
  fs.mkdirSync(output, { recursive: true });
  const statusFile = path.join(output, "authoring-status.json");
  fs.writeFileSync(statusFile, JSON.stringify({ state: "writing", generation }));
  try {
    const outputs = new Map<string, string>([
      ["source-assembly.json", JSON.stringify(result.assembly)],
      ["source-rig.json", JSON.stringify(result.assembly.rig)],
      ["compile-plan.json", JSON.stringify(plan)],
    ]);
    for (const [name, text] of outputs) {
      const file = path.join(output, name);
      fs.writeFileSync(file, text);
      if (hashFile(file) !== hash(text)) throw new Error("Cranial source output bytes differ: " + name);
    }
    verifyInputs(input.physicalFiles, input.provenance);
    closure.verifyUnchanged();
    fs.writeFileSync(path.join(output, "registration-receipt.json"), JSON.stringify({ ...result.receipt,
      state: "complete", producerInputs: closure.inputs,
      originalFrameProtocol: "Acquired A metres; one common authored similarity into declared held-neutral head frame",
      numericalAdmission: false, clinicalAdmission: "unavailable", renderedAppearance: "unobserved",
      sourceCoordinateAndFaceLineage: "retained in original input and declared repair receipts",
      rightsQualification: "original publisher claims and unresolved qualification retained" }));
    fs.writeFileSync(statusFile, JSON.stringify({ state: "complete", generation }));
    console.log(JSON.stringify({ generation, addedParts: result.receipt.addedParts.length,
      acquiredMembers: result.receipt.acquiredMembers, addedMembers: result.receipt.addedMembers,
      repairs: result.receipt.topologyRepairs.length, scale: result.receipt.scale,
      numericalAdmission: false, output: path.relative(repository, output).replaceAll("\\", "/") }));
  } catch (error) {
    fs.writeFileSync(statusFile, JSON.stringify({ state: "refused", generation,
      reason: error instanceof Error ? error.message : String(error) }));
    throw error;
  }
}

/** Native bounded byte reading pins provenance without hydrating archived geometry. */
function hashFile(file: string): string {
  const digest = createHash("sha256"), descriptor = fs.openSync(file, "r");
  const buffer = Buffer.alloc(65536);
  try {
    for (;;) {
      const count = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (count === 0) break;
      digest.update(buffer.subarray(0, count));
    }
  } finally { fs.closeSync(descriptor); }
  return digest.digest("hex");
}

/** Original input roles are unchanged before and after fresh candidate emission. */
function verifyInputs(
  files: Readonly<Record<string, string>>,
  receipts: ReturnType<typeof readHumanCranialSourceInputs>["provenance"],
): void {
  for (const [role, file] of Object.entries(files))
    if (hashFile(file) !== receipts[role].sha256) throw new Error("Cranial input changed during authoring: " + role);
}

/** Exact serialized bytes own producer and output identity. */
function hash(text: string): string { return createHash("sha256").update(text).digest("hex"); }

main();
