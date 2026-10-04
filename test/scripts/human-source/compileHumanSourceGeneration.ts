import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { assembleHumanSourceGeneration } from "./assembleHumanSourceGeneration.ts";
import { assembleHumanSourceP1 } from "./assembleHumanSourceP1.ts";
import { classifyHumanSourceRows } from "./classifyHumanSourceRows.ts";
import { compareHumanSourceBodyStage } from "./compareHumanSourceBodyStage.ts";
import { buildHumanSourceCut } from "./buildHumanSourceCut.ts";
import { buildHumanSourceTopology } from "./buildHumanSourceTopology.ts";
import { createHumanSourceBodyField } from "./createHumanSourceBodyField.ts";
import { createHumanSourceDeltaReader } from "./createHumanSourceDeltaReader.ts";
import { extendHumanSourceBand } from "./extendHumanSourceBand.ts";
import { measureHumanSourceCarry } from "./measureHumanSourceCarry.ts";
import { readHumanSourceInput } from "./readHumanSourceInput.ts";
import { readHumanSourceSample } from "./readHumanSourceSample.ts";
import { reproduceHumanBodyRig } from "./reproduceHumanBodyRig.ts";
import { reproduceHumanBodyRows } from "./reproduceHumanBodyRows.ts";
import { reproduceHumanFaceRows } from "./reproduceHumanFaceRows.ts";
import type { IHumanSourceAcquisition } from "./structures/IHumanSourceAcquisition.ts";
import type { IHumanSourceChinReceipt } from "./structures/IHumanSourceChinReceipt.ts";
import type { IHumanSourceExtractionReceipt } from "./structures/IHumanSourceExtractionReceipt.ts";
import type { IHumanSourceFaceExtractionReceipt } from "./structures/IHumanSourceFaceExtractionReceipt.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import type { IHumanSourceRecropReceipt } from "./structures/IHumanSourceRecropReceipt.ts";
import type { IHumanSourceRigBone } from "./structures/IHumanSourceRigBone.ts";
import type { IHumanSourceUpstreamLock } from "./structures/IHumanSourceUpstreamLock.ts";
import { writeHumanSourceArtifacts } from "./writeHumanSourceArtifacts.ts";

/** Recipe recovery acceptance residual, metres (`face_extraction/recipes.py`). */
const RECIPE_TOLERANCE_METRES = 2e-6;
/** Git revision of the face the published body was cut against (id `mpfb-connected-head-2026-09-20-rigid-mandible`). */
const RIGID_FACE_REVISION = "bfbb0f885";
const RIGID_FACE_SHA256 = "5201ba8edb6857e36e02aa62c6ccb2f22758211aa5a63b1e6d30a99e65bf728f";

/** Historical body publications the replay is compared with: extraction stage, r3, r8, r9. */
const BODY_STAGE_REVISIONS = ["a457f3715", "0fd0878d5", "bf045a5a4", "4fedb6b96"];

/**
 * Compile source generation G1 from one prepared and sampled work directory
 * (#2689 N1) into a new OUTPUT directory and return the generation id.
 *
 * Order: verify the acquisition against the lock and the sample against its
 * manifest; read the published face and body and the two historical faces by
 * digest; freeze the neck cut (`buildHumanSourceCut`); reproduce face rows,
 * body rows and the body rig; compare the replay with historical body stages.
 * Every input is then read and the input record is frozen, so the generation
 * id assembled next covers all of them. Assemble the one-skin generation,
 * define every channel crossing the neck once on its band
 * (`extendHumanSourceBand`), build the P1 pair, measure every row's carry on
 * those artifacts, classify provenance from the measured residuals, and write
 * them with the reproduction record and a content-only manifest.
 * Tracked published bases are read only.
 */
export function compileHumanSourceGeneration(work: string, output: string, repository: string): string {
  const log = (...parts: unknown[]): void => console.log("[human-source]", ...parts);
  const sha = (bytes: Buffer | string): string => crypto.createHash("sha256").update(bytes).digest("hex");
  const started = Date.now();

  const lockPath = path.join(repository, "test/scripts/human-source/upstream-lock.json");
  const lockBytes = fs.readFileSync(lockPath);
  const lock: IHumanSourceUpstreamLock = JSON.parse(lockBytes.toString("utf8"));
  const acquisition: IHumanSourceAcquisition = JSON.parse(fs.readFileSync(path.join(work, "acquisition.json"), "utf8"));
  if (acquisition.observeOnly || acquisition.lockSha256 !== sha(lockBytes))
    throw new Error("The work directory was not verified against the current upstream lock.");
  const upstream = lock.sources.map((source) => {
    const observed = acquisition.sources.find((s) => s.name === source.name);
    if (source.consumed && observed?.contentSha256 !== source.contentSha256)
      throw new Error(`Consumed source ${source.name} was not verified in this work directory.`);
    return {
      name: source.name,
      consumed: source.consumed,
      locator: source.locator,
      revision: source.revision,
      archiveSha256: source.archiveSha256,
      contentSha256: source.contentSha256,
      licenses: source.licenses,
      rights: source.rights,
    };
  });

  const sample = readHumanSourceSample(path.join(work, "sample"));
  if (sample.manifest.neutralRecoveryMetres !== 0 || sample.manifest.landmarkRecoveryMetres !== 0)
    throw new Error("The sample did not recover its neutral exactly.");
  log("sample", sample.manifest.vertices, "vertices", sample.manifest.states.length, "states");

  const inputs: IHumanSourceGenerationInput[] = [];
  const producerDirectory = path.join(repository, "test/scripts/human-source");
  const producerFiles = (directory: string): string[] =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
      entry.name === "__pycache__"
        ? []
        : entry.isDirectory()
          ? producerFiles(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
    );
  for (const file of producerFiles(producerDirectory).sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))) {
    const bytes = fs.readFileSync(file);
    inputs.push({ role: "producer", path: path.relative(repository, file).replace(/\\/g, "/"), revision: null, bytes: bytes.length, sha256: sha(bytes) });
  }
  const facePath = "test/studies/human-face/connected-basis/global-face/basis.json.gz";
  const face = readHumanSourceInput<IAutoMovieHumanFaceBasis>(inputs, "published face basis", repository, facePath, null, null);
  const faceSha256 = inputs[inputs.length - 1].sha256;
  const body = readHumanSourceInput<IAutoMovieHumanBodyBasis>(
    inputs, "published body basis", repository, "test/studies/human-body/connected-basis/basis.json.gz", null, null,
  );
  const preparation = readHumanSourceInput<IHumanSourceRecropReceipt>(
    inputs, "face recrop receipt", repository, "test/studies/human-face/connected-basis/global-face/preparation-receipt.json", null, null,
  );
  const extraction = readHumanSourceInput<IHumanSourceExtractionReceipt>(
    inputs, "body extraction receipt", repository, "test/studies/human-body/connected-basis/extraction-receipt.json", null, null,
  );
  const lowerFace = readHumanSourceInput<IHumanSourceChinReceipt>(
    inputs, "lower-face chin bake receipt", repository, "test/studies/human-face/connected-basis/global-face/lower-face-receipt.json", null, null,
  );
  const faceExtraction = readHumanSourceInput<IHumanSourceFaceExtractionReceipt>(
    inputs, "face extraction receipt", repository, "test/studies/human-face/connected-basis/global-face/extraction-receipt.json", null, null,
  );
  const fineHead = readHumanSourceInput<IAutoMovieHumanFaceBasis>(
    inputs, "pre-recrop face (face extraction output)", repository, facePath, preparation.connectivitySource, faceExtraction.compressedSha256,
  );
  const rigidFace = readHumanSourceInput<IAutoMovieHumanFaceBasis>(
    inputs, "face the published body was cut against", repository, facePath, RIGID_FACE_REVISION, RIGID_FACE_SHA256,
  );
  const rig = JSON.parse(
    fs.readFileSync(path.join(work, "upstream/mpfb2/src/mpfb/data/rigs/standard/rig.game_engine.json"), "utf8"),
  ) as Record<string, IHumanSourceRigBone>;
  log("inputs read", inputs.length);

  const topology = buildHumanSourceTopology(sample, extraction.frame.offset);
  const surfaceOf = (basis: IAutoMovieHumanFaceBasis): IAutoMovieHumanFaceBasis["surfaces"][number] => {
    const found = basis.surfaces.find((s) => s.id === "Human");
    if (found === undefined) throw new Error(`${basis.id} has no Human skin.`);
    return found;
  };
  const cut = buildHumanSourceCut({
    topology,
    fineHead: surfaceOf(fineHead),
    rigidFace: surfaceOf(rigidFace),
    face: surfaceOf(face),
    body: body.surfaces[0],
    minimumY: preparation.minimumY,
  });
  log("cut", cut.checks);
  const reader = createHumanSourceDeltaReader(sample);
  const field = createHumanSourceBodyField(sample, extraction.frame.offset);
  const faceRows = reproduceHumanFaceRows({
    face, cut, topology, sample, reader,
    landmarksNeutral: field.landmarksNeutral,
    chinFactor: lowerFace.factor,
    tolerance: RECIPE_TOLERANCE_METRES,
  });
  log("face rows", faceRows.rows.length, "recipes", Object.keys(faceRows.recipes).length);
  const bodyRows = reproduceHumanBodyRows({ body, cut, reader, field, sample });
  log("body rows", bodyRows.rows.length, "unavailable", Object.keys(bodyRows.unavailable).length);
  const rigRows = reproduceHumanBodyRig({ body, cut, reader, field, sample, gameEngineRig: rig });
  log("rig rows", rigRows.rows.length);
  const stages: Record<string, Record<string, number | boolean | string>> = {};
  for (const revision of BODY_STAGE_REVISIONS) {
    const stage = readHumanSourceInput<IAutoMovieHumanBodyBasis>(inputs, "historical body stage", repository, "test/studies/human-body/connected-basis/basis.json.gz", revision, null);
    stages[revision] = compareHumanSourceBodyStage({ stage, revision, cut, reader, field, sample });
    log("stage", revision, stages[revision]);
  }
  // Every input is read by now. Freezing the record makes a later read throw
  // instead of silently escaping the generation identity computed below.
  Object.freeze(inputs);

  const sampleRecord: Record<string, string | number> = {
    blender: sample.manifest.blender,
    numpy: sample.manifest.numpy,
    extension: sample.manifest.extension.join("; "),
    // Content digests only: the sample manifest itself carries the run clock.
    ...Object.fromEntries(Object.entries(sample.manifest.files).map(([name, file]) => [name, file.sha256])),
  };
  const assembled = assembleHumanSourceGeneration({
    face, body, faceSha256, cut, topology, reader,
    chinFactor: lowerFace.factor,
    faceRows, bodyRows, rig: rigRows, upstream,
    sample: sampleRecord,
    inputs,
  });
  const extended = extendHumanSourceBand({ generation: assembled, face, body, cut, faceRows, reader, field, sample });
  const generation = extended.generation;
  log("band", extended.checks);
  const p1 = assembleHumanSourceP1({ face, body, generation, cut, topology, bodyRows });
  log("generation", generation.id, "p1", p1.checks);
  const measured = measureHumanSourceCarry({ rows: [...faceRows.rows, ...bodyRows.rows, ...rigRows.rows], face, body, cut, generation, p1 });
  const classified = classifyHumanSourceRows(measured);
  const files = writeHumanSourceArtifacts(output, generation, p1, {
    generation: generation.id,
    rows: classified.rows,
    losses: [...faceRows.losses, ...bodyRows.losses, ...rigRows.losses, ...classified.losses],
    checks: { cut: cut.checks, band: extended.checks, face: faceRows.checks, body: bodyRows.checks, rig: rigRows.checks, p1: p1.checks, ...Object.fromEntries(Object.entries(stages).map(([r, c]) => ["stage " + r, c])) },
  });
  if (generation.inputs.length !== inputs.length) throw new Error("The generation identity does not cover every recorded input.");
  // The manifest records content and the identities it was computed from: the
  // locked upstream, every input digest, the sample's file digests with the
  // pinned tool versions that produced them, and every output digest. It holds
  // no clock, host, path, runtime or acquisition-route fact, so a checkout that
  // regenerates the same bytes writes the same manifest. Those run facts go to
  // `run-environment.json`, a record of this run rather than of the content.
  fs.writeFileSync(
    path.join(output, "generation-manifest.json"),
    JSON.stringify(
      { generation: generation.id, upstream: generation.upstream, inputs, sample: sampleRecord, outputs: files },
      null,
      1,
    ) + "\n",
  );
  fs.writeFileSync(
    path.join(output, "run-environment.json"),
    JSON.stringify({ node: process.version, acquisition: acquisition.sources }, null, 1) + "\n",
  );
  log("written", output, ((Date.now() - started) / 1000).toFixed(1), "s");
  return generation.id;
}
