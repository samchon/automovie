import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { HUMAN_SOURCE_BROW_BAND_SELECTION } from "./HUMAN_SOURCE_BROW_BAND_SELECTION.ts";
import { HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION } from "./HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION.ts";
import { HUMAN_SOURCE_RECIPE_TOLERANCE_METRES } from "./HUMAN_SOURCE_RECIPE_TOLERANCE_METRES.ts";
import { assembleHumanSourceGeneration } from "./assembleHumanSourceGeneration.ts";
import { assembleHumanSourceP1 } from "./assembleHumanSourceP1.ts";
import { assertHumanSourceWorkInputs } from "./assertHumanSourceWorkInputs.ts";
import { authorHumanSourceHeadViewRows } from "./authorHumanSourceHeadViewRows.ts";
import { authorHumanSourcePosteriorOcclusion } from "./authorHumanSourcePosteriorOcclusion.ts";
import { authorHumanSourceTongueRest } from "./authorHumanSourceTongueRest.ts";
import { bindHumanSourceParts } from "./bindHumanSourceParts.ts";
import { buildHumanSourceAuthoredHeadRegions } from "./buildHumanSourceAuthoredHeadRegions.ts";
import { buildHumanSourceCut } from "./buildHumanSourceCut.ts";
import { buildHumanSourceTopology } from "./buildHumanSourceTopology.ts";
import { classifyHumanSourceRows } from "./classifyHumanSourceRows.ts";
import { compareHumanSourceBodyStage } from "./compareHumanSourceBodyStage.ts";
import { compileHumanSourceAuthoredSkin } from "./compileHumanSourceAuthoredSkin.ts";
import { createHumanSourceBodyField } from "./createHumanSourceBodyField.ts";
import { createHumanSourceDeltaReader } from "./createHumanSourceDeltaReader.ts";
import { createHumanSourcePublication } from "./createHumanSourcePublication.ts";
import { defineHumanSourceAuthoredNasalContours } from "./defineHumanSourceAuthoredNasalContours.ts";
import { defineHumanSourceBand } from "./defineHumanSourceBand.ts";
import { defineHumanSourceHeadLandmarks } from "./defineHumanSourceHeadLandmarks.ts";
import { defineHumanSourceHeadRegions } from "./defineHumanSourceHeadRegions.ts";
import { defineHumanSourceHeadSampleSelections } from "./defineHumanSourceHeadSampleSelections.ts";
import { defineHumanSourceMacros } from "./defineHumanSourceMacros.ts";
import { defineHumanSourceOpticalSupport } from "./defineHumanSourceOpticalSupport.ts";
import { defineHumanSourceOralSupport } from "./defineHumanSourceOralSupport.ts";
import { defineHumanSourcePeriocular } from "./defineHumanSourcePeriocular.ts";
import { defineHumanSourceSkinLandmarks } from "./defineHumanSourceSkinLandmarks.ts";
import { defineHumanSourceToeRays } from "./defineHumanSourceToeRays.ts";
import { mapHumanSourceSampleFaces } from "./mapHumanSourceSampleFaces.ts";
import { measureHumanSourceCarry } from "./measureHumanSourceCarry.ts";
import { readHumanSourceAcquisition } from "./readHumanSourceAcquisition.ts";
import { readHumanSourceBaseFaces } from "./readHumanSourceBaseFaces.ts";
import { readHumanSourceHeadTraits } from "./readHumanSourceHeadTraits.ts";
import { readHumanSourceInput } from "./readHumanSourceInput.ts";
import { readHumanSourceMirror } from "./readHumanSourceMirror.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import { readHumanSourceSample } from "./readHumanSourceSample.ts";
import { readHumanSourceWorkBytes } from "./readHumanSourceWorkBytes.ts";
import { readdressHumanSourceFaceBasis } from "./readdressHumanSourceFaceBasis.ts";
import { regenerateHumanSourceAuthoredFaceRows } from "./regenerateHumanSourceAuthoredFaceRows.ts";
import { regenerateHumanSourceBodyFields } from "./regenerateHumanSourceBodyFields.ts";
import { regenerateHumanSourcePose } from "./regenerateHumanSourcePose.ts";
import { registerHumanSourceTeeth } from "./registerHumanSourceTeeth.ts";
import { reproduceHumanBodyRig } from "./reproduceHumanBodyRig.ts";
import { reproduceHumanBodyRows } from "./reproduceHumanBodyRows.ts";
import { reproduceHumanFaceRows } from "./reproduceHumanFaceRows.ts";
import { splitHumanSourcePersonViews } from "./splitHumanSourcePersonViews.ts";
import type { IHumanSourceAuthoredCompilation } from "./structures/IHumanSourceAuthoredCompilation.ts";
import type { IHumanSourceBodyField } from "./structures/IHumanSourceBodyField.ts";
import type { IHumanSourceChinReceipt } from "./structures/IHumanSourceChinReceipt.ts";
import type { IHumanSourceEditReceipt } from "./structures/IHumanSourceEditReceipt.ts";
import type { IHumanSourceExtractionReceipt } from "./structures/IHumanSourceExtractionReceipt.ts";
import type { IHumanSourceFaceExtractionReceipt } from "./structures/IHumanSourceFaceExtractionReceipt.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import type { IHumanSourceHeadTraits } from "./structures/IHumanSourceHeadTraits.ts";
import type { IHumanSourcePosteriorOcclusionAuthoring } from "./structures/IHumanSourcePosteriorOcclusionAuthoring.ts";
import type { IHumanSourceRecropReceipt } from "./structures/IHumanSourceRecropReceipt.ts";
import type { IHumanSourceRigBone } from "./structures/IHumanSourceRigBone.ts";
import type { IHumanSourceTongueRestAuthoring } from "./structures/IHumanSourceTongueRestAuthoring.ts";
import type { IHumanSourceUpstreamLock } from "./structures/IHumanSourceUpstreamLock.ts";
import { writeHumanSourceArtifacts } from "./writeHumanSourceArtifacts.ts";

/** Recipe recovery acceptance residual, metres (`face_extraction/recipes.py`). */
const RECIPE_TOLERANCE_METRES = HUMAN_SOURCE_RECIPE_TOLERANCE_METRES;
/** Git revision of the face the published body was cut against (id `mpfb-connected-head-2026-09-20-rigid-mandible`). */
const RIGID_FACE_REVISION = "bfbb0f885";
const RIGID_FACE_SHA256 =
  "5201ba8edb6857e36e02aa62c6ccb2f22758211aa5a63b1e6d30a99e65bf728f";

/**
 * Body band reach, metres: the smallest reach without a band fold when the
 * one-skin person evaluator was swept over 40, 60, 80 and 112.5 mm (40 mm
 * folded at neck height -1, 60 mm did not). An authored rig convention, recorded as such in the band.
 */
const BAND_REACH_METRES = 0.06;
/** Historical body publications the replay is compared with: extraction stage, r3, r8, r9. */
const BODY_STAGE_REVISIONS = [
  "a457f3715",
  "0fd0878d5",
  "bf045a5a4",
  "4fedb6b96",
];

/**
 * Compile source generation G1 from one prepared and sampled work directory
 * (#2689) into a new OUTPUT directory and return the generation id.
 *
 * Order: verify the acquisition against the lock and the sample against its
 * manifest; read the published face and body and the two historical faces by
 * digest; freeze the neck cut (`buildHumanSourceCut`); reproduce face rows,
 * body rows and the body rig; compare the replay with historical body stages.
 * Every input is then read and the input record is frozen, so the generation
 * id assembled next covers all of them. Assemble the one-skin generation,
 * define every MPFB macro once over the whole skin (`defineHumanSourceMacros`),
 * define the remaining one-sided endpoints on the body band
 * (`defineHumanSourceBand`), build
 * the P1 pair after binding the attached parts to the skin and regenerating
 * their body-control rows (`bindHumanSourceParts`), measure every row's carry on
 * those artifacts, classify provenance from the measured residuals, split the
 * generation into the person head and body views (`splitHumanSourcePersonViews`),
 * and write them with the reproduction record and a content-only manifest.
 * Explicit completed-eye inspection uses verified checkpoint geometry through
 * these same owners and retains its full-stage refusal; ordinary compilation
 * still requires every source-neutral authoring stage to succeed.
 * Tracked published bases are read only.
 */
export function compileHumanSourceGeneration(
  work: string,
  output: string,
  repository: string,
  provider?: string,
  replay?: string,
  traitsDirectory?: string,
  oralEvaluations?: number,
  tongueEvaluations?: number,
  inspectionCheckpoint?: string,
): string {
  if (
    inspectionCheckpoint !== undefined &&
    (provider === undefined ||
      replay === undefined ||
      oralEvaluations !== undefined ||
      tongueEvaluations !== undefined)
  )
    throw new Error(
      "Completed-eye inspection requires its provider/replay and cannot claim an oral fitting run.",
    );
  const log = (...parts: unknown[]): void =>
    console.log("[human-source]", ...parts);
  const sha = (bytes: Buffer | string): string =>
    crypto.createHash("sha256").update(bytes).digest("hex");
  const started = Date.now();

  const lockPath = path.join(
    repository,
    "test/scripts/human-source/upstream-lock.json",
  );
  const lockBytes = fs.readFileSync(lockPath);
  const lock: IHumanSourceUpstreamLock = JSON.parse(lockBytes.toString("utf8"));
  const acquisitionReading = readHumanSourceAcquisition(
    work,
    lock,
    sha(lockBytes),
  );
  const acquisition = acquisitionReading.acquisition;
  const upstream = lock.sources.map((source) => {
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
  if (
    sample.manifest.neutralRecoveryMetres !== 0 ||
    sample.manifest.landmarkRecoveryMetres !== 0
  )
    throw new Error("The sample did not recover its neutral exactly.");
  log(
    "sample",
    sample.manifest.vertices,
    "vertices",
    sample.manifest.states.length,
    "states",
  );

  const inputs: IHumanSourceGenerationInput[] = [];
  inputs.push({
    role: "verified current acquisition lock",
    path: "test/scripts/human-source/upstream-lock.json",
    revision: null,
    bytes: lockBytes.length,
    sha256: sha(lockBytes),
  });
  inputs.push({
    role: "verified content sample manifest",
    path: "sample/manifest.json",
    revision: null,
    bytes: sample.manifestBytes.length,
    sha256: sha(sample.manifestBytes),
  });
  const producer = readHumanSourceProducerClosure(repository);
  inputs.push(...producer.inputs);
  let oralAuthoring: IHumanSourcePosteriorOcclusionAuthoring | undefined;
  let tongueAuthoring: IHumanSourceTongueRestAuthoring | undefined;
  if (
    tongueEvaluations !== undefined &&
    (oralEvaluations === undefined ||
      !Number.isSafeInteger(tongueEvaluations) ||
      tongueEvaluations < 1)
  )
    throw new Error(
      "Source tongue authoring needs post-occlusion authoring and a positive evaluation budget.",
    );
  if (oralEvaluations !== undefined) {
    if (!Number.isSafeInteger(oralEvaluations) || oralEvaluations < 1)
      throw new Error(
        "Oral source authoring needs a positive finite evaluation budget.",
      );
    const recipe = JSON.stringify({
      maximumEvaluations: oralEvaluations,
      tongueMaximumEvaluations: tongueEvaluations,
      method: "immutable-full-crown-source-width-depth-height-direct-search",
      tongueLining: "normal shared authored defaults",
      tongueRoot: "posterior-quarter source convention",
    });
    inputs.push({
      role: "explicit shared oral neutral source recipe",
      path: "authoring/oral-neutral-recipe",
      revision: null,
      bytes: Buffer.byteLength(recipe),
      sha256: sha(recipe),
    });
  }
  const facePath =
    "test/studies/human-face/connected-basis/global-face/basis.json.gz";
  let face = readHumanSourceInput<IAutoMovieHumanFaceBasis>(
    inputs,
    "published face basis",
    repository,
    facePath,
    null,
    null,
  );
  const faceSha256 = inputs[inputs.length - 1].sha256;
  let body = readHumanSourceInput<IAutoMovieHumanBodyBasis>(
    inputs,
    "published body basis",
    repository,
    "test/studies/human-body/connected-basis/basis.json.gz",
    null,
    null,
  );
  const preparation = readHumanSourceInput<IHumanSourceRecropReceipt>(
    inputs,
    "face recrop receipt",
    repository,
    "test/studies/human-face/connected-basis/global-face/preparation-receipt.json",
    null,
    null,
  );
  const extraction = readHumanSourceInput<IHumanSourceExtractionReceipt>(
    inputs,
    "body extraction receipt",
    repository,
    "test/studies/human-body/connected-basis/extraction-receipt.json",
    null,
    null,
  );
  const lowerFace = readHumanSourceInput<IHumanSourceChinReceipt>(
    inputs,
    "lower-face chin bake receipt",
    repository,
    "test/studies/human-face/connected-basis/global-face/lower-face-receipt.json",
    null,
    null,
  );
  const faceExtraction =
    readHumanSourceInput<IHumanSourceFaceExtractionReceipt>(
      inputs,
      "face extraction receipt",
      repository,
      "test/studies/human-face/connected-basis/global-face/extraction-receipt.json",
      null,
      null,
    );
  const fineHead = readHumanSourceInput<IAutoMovieHumanFaceBasis>(
    inputs,
    "pre-recrop face (face extraction output)",
    repository,
    facePath,
    preparation.connectivitySource,
    faceExtraction.compressedSha256,
  );
  const rigidFace = readHumanSourceInput<IAutoMovieHumanFaceBasis>(
    inputs,
    "face the published body was cut against",
    repository,
    facePath,
    RIGID_FACE_REVISION,
    RIGID_FACE_SHA256,
  );
  const rig = JSON.parse(
    readHumanSourceWorkBytes(
      inputs,
      work,
      "upstream/mpfb2/src/mpfb/data/rigs/standard/rig.game_engine.json",
      "native public rig",
    ).toString("utf8"),
  ) as Record<string, IHumanSourceRigBone>;
  const baseFaces = readHumanSourceBaseFaces(work, inputs);
  const mirror = readHumanSourceMirror(work, inputs);
  const toeRays =
    sample.weights.rays === undefined
      ? null
      : defineHumanSourceToeRays(work, inputs);
  const oralSourceSha256: string[] = [];
  for (const [folder, asset] of [
    ["teeth/teeth_base", "teeth_base"],
    ["tongue/tongue01", "tongue01"],
  ] as const) {
    for (const extension of ["obj", "mhclo"] as const) {
      const relative = `upstream/makehuman-system-assets/${folder}/${asset}.${extension}`;
      const bytes = readHumanSourceWorkBytes(
        inputs,
        work,
        relative,
        `native oral source ${asset}.${extension}`,
      );
      if (
        !bytes
          .toString("utf8")
          .includes("explicitly released as CC0 in september 2020")
      )
        throw new Error(
          `Native oral source ${relative} does not carry its authoritative CC0 release header.`,
        );
      oralSourceSha256.push(inputs[inputs.length - 1].sha256);
    }
  }
  // Register native tooth identities before editing their coordinates; the
  // registrar retains and checks those populations through later stages.
  if (oralEvaluations !== undefined) {
    const teeth = registerHumanSourceTeeth(face);
    if (Object.keys(teeth.regions).length !== 32)
      throw new Error(
        "Oral authoring needs every original source crown identity.",
      );
    face = { ...face, skinRegions: { ...face.skinRegions, ...teeth.regions } };
    oralAuthoring = authorHumanSourcePosteriorOcclusion(face, oralEvaluations);
    face = oralAuthoring.face;
    log(
      "source oral neutral",
      oralAuthoring.search.evaluations,
      "evaluations",
      oralAuthoring.search.evaluation,
    );
    if (tongueEvaluations !== undefined) {
      // Empty shared lining settings deliberately consume the existing normal
      // authored dimensions; no person's numerical document supplies a mean.
      tongueAuthoring = authorHumanSourceTongueRest(
        face,
        {},
        tongueEvaluations,
      );
      face = tongueAuthoring.face;
      log(
        "source tongue neutral",
        tongueAuthoring.search.evaluations,
        "evaluations",
        tongueAuthoring.search.evaluation,
      );
    }
  }
  const cageSource = HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION.sourceSha256;
  const cageAssets = [
    sample.manifest.files["neutral.f64"].sha256,
    inputs.find((input) => input.role === "native base polygon table")?.sha256,
    inputs.find((input) => input.role === "native mirror correspondence")
      ?.sha256,
  ];
  if (
    cageSource.length !== cageAssets.length ||
    cageSource.some((digest, index) => digest !== cageAssets[index])
  )
    throw new Error(
      "Periocular cage selection does not correspond to this actual native source.",
    );
  const browSource = HUMAN_SOURCE_BROW_BAND_SELECTION.sourceSha256;
  const browPart = sample.manifest.parts.find(
    (part) => part.id === "Human.eyebrow001",
  );
  const browAssets = [
    cageAssets[0],
    browPart === undefined
      ? undefined
      : sample.manifest.files[browPart.files["0"]]?.sha256,
    cageAssets[2],
  ];
  if (browSource.some((digest, index) => digest !== browAssets[index]))
    throw new Error(
      "Brow band selection does not correspond to this actual neutral, card and mirror source.",
    );
  log("inputs read", inputs.length);

  let topology = buildHumanSourceTopology(sample, extraction.frame.offset);
  const surfaceOf = (
    basis: IAutoMovieHumanFaceBasis,
  ): IAutoMovieHumanFaceBasis["surfaces"][number] => {
    const found = basis.surfaces.find((s) => s.id === "Human");
    if (found === undefined) throw new Error(`${basis.id} has no Human skin.`);
    return found;
  };
  let cut = buildHumanSourceCut({
    topology,
    fineHead: surfaceOf(fineHead),
    rigidFace: surfaceOf(rigidFace),
    face: surfaceOf(face),
    body: body.surfaces[0],
    minimumY: preparation.minimumY,
  });
  log("cut", cut.checks);
  let reader = createHumanSourceDeltaReader(sample);
  let field: IHumanSourceBodyField = createHumanSourceBodyField(
    sample,
    extraction.frame.offset,
  );
  let faceRows = reproduceHumanFaceRows({
    face,
    cut,
    topology,
    sample,
    reader,
    landmarksNeutral: field.landmarksNeutral,
    chinFactor: lowerFace.factor,
    tolerance: RECIPE_TOLERANCE_METRES,
  });
  log(
    "face rows",
    faceRows.rows.length,
    "recipes",
    Object.keys(faceRows.recipes).length,
  );
  let bodyRowsRaw = reproduceHumanBodyRows({
    body,
    cut,
    reader,
    field,
    sample,
  });
  log(
    "body rows",
    bodyRowsRaw.rows.length,
    "unavailable",
    Object.keys(bodyRowsRaw.unavailable).length,
  );
  let rigRows = reproduceHumanBodyRig({
    body,
    cut,
    reader,
    field,
    sample,
    gameEngineRig: rig,
  });
  log("rig rows", rigRows.rows.length);
  const stages: Record<string, Record<string, number | boolean | string>> = {};
  for (const revision of BODY_STAGE_REVISIONS) {
    const stage = readHumanSourceInput<IAutoMovieHumanBodyBasis>(
      inputs,
      "historical body stage",
      repository,
      "test/studies/human-body/connected-basis/basis.json.gz",
      revision,
      null,
    );
    stages[revision] = compareHumanSourceBodyStage({
      stage,
      revision,
      cut,
      reader,
      field,
      sample,
    });
    log("stage", revision, stages[revision]);
  }
  let authored: IHumanSourceAuthoredCompilation | undefined;
  let headTraits: IHumanSourceHeadTraits | undefined;
  if ((provider === undefined) !== (replay === undefined))
    throw new Error(
      "Current source generation needs both its provider and complete replay.",
    );
  if (provider !== undefined && replay !== undefined) {
    authored = compileHumanSourceAuthoredSkin(
      work,
      provider,
      replay,
      `${output}-source-stage`,
      repository,
      mirror,
      inspectionCheckpoint,
    );
    inputs.push(...authored.inputs);
    faceRows = regenerateHumanSourceAuthoredFaceRows(faceRows, cut, authored);
    cut = authored.skin.partition.cut;
    topology = authored.root.topology;
    reader = authored.reader;
    const landmarksNeutral = field.landmarksNeutral;
    field = {
      neutral: topology.positions,
      landmarksNeutral,
      delta: reader.skin,
      landmarks: reader.landmarks,
    };
    bodyRowsRaw = reproduceHumanBodyRows({ body, cut, reader, field, sample });
    rigRows = {
      ...rigRows,
      freshWeights: authored.skin.bones.slice(0, topology.vertexCount),
    };
    const headOf = new Map(
      Array.from(cut.faceToG1, (source, vertex): [number, number] => [
        source,
        vertex,
      ]),
    );
    const targets = Object.fromEntries(
      Object.entries(faceRows.g1Targets).map(([name, rows]) => {
        const head: number[] = [];
        for (let at = 0; at < rows.length; at += 4) {
          const vertex = headOf.get(rows[at]);
          if (vertex === undefined)
            throw new Error(
              `Current head endpoint ${name} lies outside its partition.`,
            );
          head.push(vertex, rows[at + 1], rows[at + 2], rows[at + 3]);
        }
        return [name, head];
      }),
    );
    face = readdressHumanSourceFaceBasis({
      face,
      skin: authored.skin,
      generation: sha(JSON.stringify(inputs)),
      targets,
      regions: buildHumanSourceAuthoredHeadRegions(
        face,
        authored.skin.partition,
      ),
    });
    if (traitsDirectory !== undefined) {
      headTraits = readHumanSourceHeadTraits(
        traitsDirectory,
        authored,
        provider,
        inputs,
        sample.manifest.landmarkIds,
      );
      const targets = { ...body.surfaces[0].targets };
      const landmarkTargets = { ...body.landmarks.targets };
      const originalOf = new Map(
        Array.from(cut.r16ToSource, (source, vertex): [number, number] => [
          source,
          vertex,
        ]),
      );
      for (const [name, rows] of Object.entries(headTraits.targets)) {
        const projectedBody: number[][] = [];
        for (let at = 0; at < rows.length; at += 4) {
          const vertex = originalOf.get(rows[at]);
          if (vertex !== undefined)
            projectedBody.push([
              vertex,
              rows[at + 1],
              rows[at + 2],
              rows[at + 3],
            ]);
        }
        targets[name] = projectedBody.sort((a, b) => a[0] - b[0]).flat();
        const joints: number[][] = [];
        const jointRows = headTraits.jointTargets[name];
        for (let at = 0; at < jointRows.length; at += 4) {
          const vertex = body.landmarks.ids.indexOf(
            sample.manifest.landmarkIds[jointRows[at]],
          );
          if (vertex >= 0)
            joints.push([
              vertex,
              jointRows[at + 1],
              jointRows[at + 2],
              jointRows[at + 3],
            ]);
        }
        if (joints.length !== 0)
          landmarkTargets[name] = joints.sort((a, b) => a[0] - b[0]).flat();
      }
      body = {
        ...body,
        channels: [
          ...body.channels,
          ...headTraits.fields.map((field) => ({
            id: field.bodyChannel,
            kind: "shape" as const,
            group: "headSource",
            mirror: null,
            minimum: -1,
            maximum: 1,
            positive: field.positiveEndpoint,
            negative: field.negativeEndpoint,
          })),
        ],
        landmarks: { ...body.landmarks, targets: landmarkTargets },
        surfaces: body.surfaces.map((surface, index) =>
          index === 0 ? { ...surface, targets } : surface,
        ),
      };
      bodyRowsRaw = reproduceHumanBodyRows({
        body,
        cut,
        reader,
        field,
        sample,
      });
      bodyRowsRaw.g1Targets = {
        ...bodyRowsRaw.g1Targets,
        ...headTraits.targets,
      };
      for (const name of Object.keys(headTraits.targets))
        delete bodyRowsRaw.unavailable[name];
    }
    log(
      "current provider root/P1",
      topology.vertexCount,
      cut.faceToG1.length,
      cut.p1BodyToG1.length,
    );
  }
  // Every input is read by now. Freezing the record makes a later read throw
  // instead of silently escaping the generation identity computed below.
  Object.freeze(inputs);

  const sampleRecord: Record<string, string | number> = {
    blender: sample.manifest.blender,
    numpy: sample.manifest.numpy,
    extension: sample.manifest.extension.join("; "),
    // The content manifest is recorded above; only the separate run clock is excluded.
    ...Object.fromEntries(
      Object.entries(sample.manifest.files).map(([name, file]) => [
        name,
        file.sha256,
      ]),
    ),
  };
  const assembledRaw = assembleHumanSourceGeneration({
    face,
    body,
    faceSha256,
    cut,
    topology,
    faceRows,
    bodyRows: bodyRowsRaw,
    rig: rigRows,
    upstream,
    sample: sampleRecord,
    inputs,
    nativeToSource: authored?.root.nativeToSource,
    sourceToNative: authored?.root.sourceToNative,
  });
  const fields = regenerateHumanSourceBodyFields({
    body,
    generation: assembledRaw,
    cut,
    bodyRows: bodyRowsRaw,
    sample,
    nativeToSource: authored?.root.nativeToSource,
  });
  const assembled = fields.generation;
  const bodyRows = fields.bodyRows;
  log(
    "fields",
    fields.receipts.map((r) => r.revision),
  );
  const macros = defineHumanSourceMacros({
    generation: assembled,
    face,
    body,
    cut,
    faceRows,
    reader,
    field,
  });
  if (headTraits !== undefined) {
    if (macros.generation.anchor === null)
      throw new Error(
        "Dimensional head traits need the common head anchor owner.",
      );
    macros.generation.anchor.targets.push(...Object.keys(headTraits.targets));
    const bodyOf = new Map(
      Array.from(cut.p1BodyToG1, (source, vertex): [number, number] => [
        source,
        vertex,
      ]),
    );
    for (const [name, rows] of Object.entries(headTraits.targets)) {
      const projected: number[][] = [];
      for (let at = 0; at < rows.length; at += 4) {
        const vertex = bodyOf.get(rows[at]);
        if (vertex !== undefined)
          projected.push([vertex, rows[at + 1], rows[at + 2], rows[at + 3]]);
      }
      bodyRows.p1Targets[name] = projected.sort((a, b) => a[0] - b[0]).flat();
    }
  }
  log("macros", macros.checks);
  const extended = defineHumanSourceBand({
    generation: macros.generation,
    face,
    body,
    reachMetres: BAND_REACH_METRES,
  });
  log("band", extended.checks);
  const parts = bindHumanSourceParts({
    generation: extended.generation,
    face,
    body,
    cut,
    faceRows,
    sample,
    reader,
    offset: extraction.frame.offset,
  });
  const bound = parts.generation;
  if (authored !== undefined)
    face = {
      ...face,
      nasalContours: defineHumanSourceAuthoredNasalContours(authored, bound.id),
    };
  log("parts", parts.checks);
  const head = defineHumanSourceHeadLandmarks({
    generation: bound,
    mirror,
    faces: baseFaces,
    face,
    faceToG1: cut.faceToG1,
    nativeToSource: authored?.root.nativeToSource,
    sourceToNative: authored?.root.sourceToNative,
    sourceGuide: authored?.headGuide,
  });
  log(
    "head landmarks",
    Object.fromEntries(head.records.map((r) => [r.name, r.vertex])),
  );
  const regions = defineHumanSourceHeadRegions({
    faces: baseFaces,
    mirror,
    sampleFaces: mapHumanSourceSampleFaces(
      sample,
      baseFaces,
      mirror.twin.length,
    ),
    faceToG1: cut.faceToG1,
    nativeToSource: authored?.root.nativeToSource,
  });
  const sampleSelections = defineHumanSourceHeadSampleSelections({
    mirror,
    faceToG1: cut.faceToG1,
    nativeToSource: authored?.root.nativeToSource,
    nasalPorts: authored?.packet.orderedPorts.nose,
  });
  log(
    "head regions",
    Object.fromEntries(
      regions.records.map((r) => [
        r.name,
        `${r.baseVertices} base, ${r.viewVertices} view`,
      ]),
    ),
  );
  // The eye registrations name the generation by its id (the SHA-256 of every
  // input digest) beside the consumed CC0 upstream content digests.
  const eyeSources = [
    ...new Set([
      ...bound.upstream.filter((u) => u.consumed).map((u) => u.contentSha256),
      ...producer.inputs
        .filter(
          (input) =>
            input.path.startsWith("test/scripts/human-source/") &&
            input.path.endsWith("_SELECTION.ts"),
        )
        .map((input) => input.sha256),
      bound.id,
    ]),
  ].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  const periocular = defineHumanSourcePeriocular({
    face,
    faceToG1: cut.faceToG1,
    mirror,
    generation: bound.id,
    sourceSha256: eyeSources,
    nativeToSource: authored?.root.nativeToSource,
  });
  const assembledP1 = assembleHumanSourceP1({
    face,
    body,
    generation: bound,
    cut,
    topology,
    bodyRows,
    headLandmarks: head.skinLandmarks,
    headRegions: { ...regions.skinRegions, ...sampleSelections.skinRegions },
    periocular: periocular.periocular,
    toeRays,
    sampleRays: sample.weights.rays ?? null,
    sourceToNative: authored?.root.sourceToNative,
  });
  const pose =
    authored === undefined
      ? regenerateHumanSourcePose(assembledP1.body, bound, cut)
      : {
          body: assembledP1.body,
          generation: bound,
          receipt: {
            revision: "current-provider-neutral-phase",
            created: [],
            states: [],
            method:
              "neutral source assembly; no contact-solver pose production is run before neutral and shape acceptance",
            qualification:
              "Historical mapped rig and pose data remain qualified derivatives; this phase does not admit motion or regenerate pose correctives.",
          },
        };
  log("pose", pose.receipt.created);
  const generation = pose.generation;
  const p1 = {
    ...assembledP1,
    body: pose.body,
    checks: {
      ...assembledP1.checks,
      unavailableTargets: (pose.body.unavailableTargets ?? []).length,
    },
  };
  log("generation", generation.id, "p1", p1.checks);
  // A part macro row regenerated from the refit is no longer a carried loss.
  const aliasedEndpoints = new Set(
    generation.aliases.flatMap((a) => Object.keys(a.endpoints)),
  );
  const regeneratedPartRow = (
    surface: string,
    row: string,
    kind: string,
  ): boolean =>
    kind === "part-not-regenerated" &&
    aliasedEndpoints.has(row) &&
    generation.parts.some((p) => p.id === surface);
  const measured = measureHumanSourceCarry({
    rows: [...faceRows.rows, ...bodyRows.rows, ...rigRows.rows],
    face,
    body,
    cut,
    generation,
    p1,
  });
  const classified = classifyHumanSourceRows(measured);
  const split = splitHumanSourcePersonViews({ generation, p1 });
  // Optical support witnesses the head view's eye surface, landmarks and
  // endpoint rows exactly as consumers load them, so it is read after the split.
  const rowEdits = authorHumanSourceHeadViewRows(split.head.face);
  const optical = defineHumanSourceOpticalSupport({
    face: split.head.face,
    generation: bound.id,
    sourceSha256: eyeSources,
  });
  const oralSupport = defineHumanSourceOralSupport(
    split.head.face,
    bound.id,
    oralSourceSha256,
    tongueAuthoring?.loop,
  );
  const views = {
    ...split,
    head: {
      ...split.head,
      ...(headTraits === undefined
        ? {}
        : {
            headShapeSource: {
              generation: generation.id,
              fields: headTraits.fields,
            },
          }),
      face: {
        ...split.head.face,
        opticalSupport: optical.supports,
        oralSupport,
      },
    },
  };
  producer.verifyUnchanged();
  acquisitionReading.verifyUnchanged();
  assertHumanSourceWorkInputs(
    inputs,
    work,
    provider,
    replay,
    traitsDirectory,
    inspectionCheckpoint,
    repository,
  );
  if (fs.existsSync(output))
    throw new Error(`Compile output already exists: ${output}`);
  const publication = createHumanSourcePublication(output);
  try {
    writeHumanSourceArtifacts(publication, generation, p1, views, {
      generation: generation.id,
      rows: classified.rows,
      losses: [
        ...faceRows.losses.filter(
          (l) => !regeneratedPartRow(l.surface, l.row, l.kind),
        ),
        ...parts.losses,
        ...bodyRows.losses,
        ...rigRows.losses,
        ...classified.losses,
      ],
      checks: {
        cut: cut.checks,
        band: extended.checks,
        macros: macros.checks,
        parts: parts.checks,
        face: faceRows.checks,
        body: bodyRows.checks,
        rig: rigRows.checks,
        p1: p1.checks,
        ...Object.fromEntries(
          Object.entries(stages).map(([r, c]) => ["stage " + r, c]),
        ),
      },
    });
    if (generation.inputs.length !== inputs.length)
      throw new Error(
        "The generation identity does not cover every recorded input.",
      );
    const oralPreparation = {
      generation: generation.id,
      occlusion: oralAuthoring?.search ?? null,
      crownFrames: oralAuthoring?.frames ?? [],
      tongue: tongueAuthoring?.search ?? null,
      tongueLoop: tongueAuthoring?.loop ?? null,
      qualification:
        "Source authoring before shared binding; clinical ranges and full normal contact/Float32/render admission are separate.",
    };
    // The manifest records content and the identities it was computed from: the
    // locked upstream, every input digest, the sample's file digests with the
    // pinned tool versions that produced them, and every output digest. It holds
    // no clock, host, path, runtime or acquisition-route fact, so a checkout that
    // regenerates the same bytes writes the same manifest. Those run facts go to
    // `run-environment.json`, a record of this run rather than of the content.
    const writeManifest = (): void =>
      publication.write(
        "generation-manifest.json",
        JSON.stringify(
          {
            generation: generation.id,
            completeGeneration: inspectionCheckpoint === undefined,
            inspectionOnly: inspectionCheckpoint !== undefined,
            upstream: generation.upstream,
            inputs,
            sample: sampleRecord,
            headLandmarks: head.records,
            headRegions: regions.records,
            headSampleSelections: sampleSelections.records,
            teeth: registerHumanSourceTeeth(face).record,
            marginChain: p1.marginChain,
            endpointDomains: p1.endpointDomains,
            driverDomain: {
              convention:
                "face driver channels driver:<endpoint> span [0, the body channel side envelope plus one per targeting corrective]; this is a conservative activation bound, not an attainable or clinical maximum; beyond gain one the endpoint row is a linear extrapolation outside the upstream range; within [0, 1] it is the regenerated row",
              maxima: Object.fromEntries(
                views.head.face.channels
                  .filter((c) => c.id.startsWith("driver:") && c.maximum !== 1)
                  .map((c) => [c.id, c.maximum]),
              ),
            },
            periocular: periocular.record,
            opticalSupport: optical.records,
            bodyLandmarks: defineHumanSourceSkinLandmarks(body, generation, cut)
              .records,
            fieldProducers: [
              ...fields.receipts,
              pose.receipt,
              ...(authored === undefined
                ? []
                : [
                    authored.bodyNeutralReceipt,
                    authored.lidSeatReceipt,
                    authored.orbitalSkinReceipt,
                    ...(authored.lipSealReceipt === undefined
                      ? []
                      : [authored.lipSealReceipt]),
                    ...authored.excludedRegionReceipts,
                  ]),
            ],
            oralPreparation,
            outputs: publication.files(),
          },
          null,
          1,
        ) + "\n",
      );
    // Everything an authoring stage changed over the sampled source, for the
    // coherence reading of this generation against an unedited one.
    const stageEdits = authored?.editReceipt ?? {
      positions: [],
      endpoints: [],
      endpointVertices: [],
      rederivedEndpoints: [],
    };
    // Two derivatives follow the moved neutral beyond the moved vertices. A
    // deforming card is bound to its nearest skin point, so a card with a vertex
    // on moved skin has its binding, and every row, derived again. The body
    // field producers diffuse and filter over the whole body view.
    const movedSkin = new Set(authored?.movedSourceVertices ?? []);
    const reboundCards =
      movedSkin.size === 0
        ? []
        : generation.parts.filter(
            (part) =>
              part.binding?.kind === "surface" &&
              part.binding.triangles.some((triangle) =>
                [0, 1, 2].some((corner) =>
                  movedSkin.has(
                    generation.skin.triangles[3 * triangle + corner],
                  ),
                ),
              ),
          );
    const editReceipt: IHumanSourceEditReceipt = {
      ...stageEdits,
      positions: [
        ...stageEdits.positions,
        ...(oralAuthoring === undefined
          ? []
          : [
              {
                view: "head" as const,
                surface: "Human.teeth_base",
                vertices: oralAuthoring.editedVertices,
              },
            ]),
        ...(tongueAuthoring === undefined
          ? []
          : [
              {
                view: "head" as const,
                surface: "Human.tongue01",
                vertices: tongueAuthoring.editedVertices,
              },
            ]),
      ],
      endpoints: [
        ...stageEdits.endpoints,
        ...rowEdits,
        ...(oralAuthoring?.editedEndpoints.map((endpoint) => ({
          view: "head" as const,
          surface: "Human.teeth_base",
          endpoint,
          vertices: oralAuthoring!.editedEndpointVertices[endpoint],
        })) ?? []),
        ...Object.entries(tongueAuthoring?.editedEndpointVertices ?? {}).map(
          ([endpoint, vertices]) => ({
            view: "head" as const,
            surface: "Human.tongue01",
            endpoint,
            vertices,
          }),
        ),
      ],
      endpointVertices: [
        ...stageEdits.endpointVertices,
        ...reboundCards.map((part) => ({
          view: "head" as const,
          surface: part.id,
          vertices: Array.from(
            { length: part.vertices },
            (_, vertex) => vertex,
          ),
        })),
      ],
      rederivedEndpoints:
        movedSkin.size === 0
          ? []
          : fields.endpoints.map((endpoint) => ({
              view: "body" as const,
              surface: body.surfaces[0].id,
              endpoint,
            })),
    };
    publication.write("edit-receipt.json", JSON.stringify(editReceipt) + "\n");
    if (authored?.inspectionRefusal !== undefined)
      publication.write(
        "inspection-qualification.json",
        JSON.stringify(
          {
            completeGeneration: false,
            fullStageAccepted: false,
            inspectionOnly: true,
            component: "periocular-continuous-source",
            generation: generation.id,
            checkpoint: inspectionCheckpoint,
            fullStageRefusal: JSON.parse(authored.inspectionRefusal),
            qualification:
              "Normal source composition, bindings, endpoints, fields and host registrations regenerated on one completed-eye root. Lip closure remains refused; no full source, clinical, motion or GPU acceptance is inherited.",
          },
          null,
          2,
        ),
      );
    if (oralAuthoring !== undefined)
      publication.write(
        "oral-source-authoring-receipt.json",
        JSON.stringify(
          {
            generation: generation.id,
            search: oralAuthoring.search,
            frames: oralAuthoring.frames,
            editedVertices: oralAuthoring.editedVertices,
            editedEndpoints: oralAuthoring.editedEndpoints,
            invalidatedDerivatives: oralAuthoring.invalidatedDerivatives,
            qualification:
              "Source neutral/endpoint authoring before skin binding; ports, full source generation and normal contact/Float32/GPU acceptance remain separate.",
          },
          null,
          1,
        ) + "\n",
      );
    if (tongueAuthoring !== undefined)
      publication.write(
        "tongue-source-authoring-receipt.json",
        JSON.stringify(
          {
            generation: generation.id,
            search: tongueAuthoring.search,
            loop: tongueAuthoring.loop,
            editedVertices: tongueAuthoring.editedVertices,
            editedEndpointVertices: tongueAuthoring.editedEndpointVertices,
            qualification: tongueAuthoring.qualification,
          },
          null,
          1,
        ) + "\n",
      );
    writeManifest();
    publication.write(
      "run-environment.json",
      JSON.stringify(
        {
          node: process.version,
          acquisition: acquisition.sources,
          acquisitionReceiptSha256: acquisitionReading.sha256,
        },
        null,
        1,
      ) + "\n",
    );
    publication.complete(
      generation.id,
      inspectionCheckpoint === undefined,
      inspectionCheckpoint !== undefined,
      () => {
        producer.verifyUnchanged();
        acquisitionReading.verifyUnchanged();
        assertHumanSourceWorkInputs(
          inputs,
          work,
          provider,
          replay,
          traitsDirectory,
          inspectionCheckpoint,
          repository,
        );
      },
    );
  } catch (error) {
    publication.refuse(error);
    throw error;
  }
  log("written", output, ((Date.now() - started) / 1000).toFixed(1), "s");
  return generation.id;
}
