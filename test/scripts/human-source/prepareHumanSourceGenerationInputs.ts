import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { HUMAN_SOURCE_BROW_BAND_SELECTION } from "./HUMAN_SOURCE_BROW_BAND_SELECTION.ts";
import { HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION } from "./HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION.ts";
import { authorHumanSourcePosteriorOcclusion } from "./authorHumanSourcePosteriorOcclusion.ts";
import { authorHumanSourceTongueRest } from "./authorHumanSourceTongueRest.ts";
import { defineHumanSourceToeRays } from "./defineHumanSourceToeRays.ts";
import { readHumanSourceAcquisition } from "./readHumanSourceAcquisition.ts";
import { readHumanSourceBaseFaces } from "./readHumanSourceBaseFaces.ts";
import { readHumanSourceInput } from "./readHumanSourceInput.ts";
import { readHumanSourceMirror } from "./readHumanSourceMirror.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import { readHumanSourceSample } from "./readHumanSourceSample.ts";
import { readHumanSourceWorkBytes } from "./readHumanSourceWorkBytes.ts";
import { registerHumanSourceTeeth } from "./registerHumanSourceTeeth.ts";
import type { IHumanSourceChinReceipt } from "./structures/IHumanSourceChinReceipt.ts";
import type { IHumanSourceExtractionReceipt } from "./structures/IHumanSourceExtractionReceipt.ts";
import type { IHumanSourceFaceExtractionReceipt } from "./structures/IHumanSourceFaceExtractionReceipt.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import type { IHumanSourcePosteriorOcclusionAuthoring } from "./structures/IHumanSourcePosteriorOcclusionAuthoring.ts";
import type { IHumanSourceRecropReceipt } from "./structures/IHumanSourceRecropReceipt.ts";
import type { IHumanSourceRigBone } from "./structures/IHumanSourceRigBone.ts";
import type { IHumanSourceTongueRestAuthoring } from "./structures/IHumanSourceTongueRestAuthoring.ts";
import type { IHumanSourceUpstreamLock } from "./structures/IHumanSourceUpstreamLock.ts";
import type { IHumanSourceGenerationOptions } from "./structures/IHumanSourceGenerationOptions.ts";
import type { IHumanSourceGenerationInputs } from "./structures/IHumanSourceGenerationInputs.ts";

/** Exact historical face paired with the published body. */
const RIGID_FACE_REVISION = "bfbb0f885";
const RIGID_FACE_SHA256 = "5201ba8edb6857e36e02aa62c6ccb2f22758211aa5a63b1e6d30a99e65bf728f";

/**
 * Read pinned acquisition, source inputs and original oral authoring.
 * Each immutable file enters the owned input record before replay; optional
 * shared crown/tongue authoring preserves its existing budgets and refusals.
 */
export function prepareHumanSourceGenerationInputs(
  options: IHumanSourceGenerationOptions,
): IHumanSourceGenerationInputs {
  const { work, repository, oralEvaluations, tongueEvaluations } = options;
  const sha = (bytes: Buffer | string): string =>
    crypto.createHash("sha256").update(bytes).digest("hex");
  const log = (...parts: unknown[]): void => console.log("[human-source]", ...parts);
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
  const body = readHumanSourceInput<IAutoMovieHumanBodyBasis>(
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

  return {
    acquisitionReading, producer, inputs, upstream, sample, face, body,
    faceSha256, preparation, extraction, lowerFace, fineHead, rigidFace,
    rig, baseFaces, mirror, toeRays, oralSourceSha256, oralAuthoring, tongueAuthoring,
  };
}
