import { HUMAN_SOURCE_RECIPE_TOLERANCE_METRES } from "./HUMAN_SOURCE_RECIPE_TOLERANCE_METRES.ts";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import crypto from "node:crypto";
import { buildHumanSourceAuthoredHeadRegions } from "./buildHumanSourceAuthoredHeadRegions.ts";
import { buildHumanSourceCut } from "./buildHumanSourceCut.ts";
import { buildHumanSourceTopology } from "./buildHumanSourceTopology.ts";
import { compareHumanSourceBodyStage } from "./compareHumanSourceBodyStage.ts";
import { compileHumanSourceAuthoredSkin } from "./compileHumanSourceAuthoredSkin.ts";
import { createHumanSourceBodyField } from "./createHumanSourceBodyField.ts";
import { createHumanSourceDeltaReader } from "./createHumanSourceDeltaReader.ts";
import { readHumanSourceHeadTraits } from "./readHumanSourceHeadTraits.ts";
import { readHumanSourceInput } from "./readHumanSourceInput.ts";
import { readdressHumanSourceFaceBasis } from "./readdressHumanSourceFaceBasis.ts";
import { regenerateHumanSourceAuthoredFaceRows } from "./regenerateHumanSourceAuthoredFaceRows.ts";
import { reproduceHumanBodyRig } from "./reproduceHumanBodyRig.ts";
import { reproduceHumanBodyRows } from "./reproduceHumanBodyRows.ts";
import { reproduceHumanFaceRows } from "./reproduceHumanFaceRows.ts";
import type { IHumanSourceAuthoredCompilation } from "./structures/IHumanSourceAuthoredCompilation.ts";
import type { IHumanSourceBodyField } from "./structures/IHumanSourceBodyField.ts";
import type { IHumanSourceHeadTraits } from "./structures/IHumanSourceHeadTraits.ts";
import type { IHumanSourceGenerationOptions } from "./structures/IHumanSourceGenerationOptions.ts";
import type { IHumanSourceGenerationInputs } from "./structures/IHumanSourceGenerationInputs.ts";
import type { IHumanSourcePreparedGeneration } from "./structures/IHumanSourcePreparedGeneration.ts";

/** Original recipe recovery tolerance in head-frame metres. */
const RECIPE_TOLERANCE_METRES = HUMAN_SOURCE_RECIPE_TOLERANCE_METRES;
/** Exact historical publications compared by the normal replay owner. */
const BODY_STAGE_REVISIONS = ["a457f3715", "0fd0878d5", "bf045a5a4", "4fedb6b96"];

/**
 * Reproduce the cut, endpoints and rig before final source assembly.
 * Current provider authoring replaces the root and readdresses its derivatives
 * through the existing owners. Every input is frozen before content identity;
 * no source range, topology refusal or historical recovery check is weakened.
 */
export function replayHumanSourceGeneration(
  options: IHumanSourceGenerationOptions,
  source: IHumanSourceGenerationInputs,
): IHumanSourcePreparedGeneration {
  const { work, output, repository, provider, replay, traitsDirectory, inspectionCheckpoint } = options;
  let { face, body } = source;
  const { sample, extraction, fineHead, rigidFace, preparation, lowerFace, inputs, mirror } = source;
  const rig = source.rig;
  const sha = (bytes: Buffer | string): string =>
    crypto.createHash("sha256").update(bytes).digest("hex");
  const log = (...parts: unknown[]): void => console.log("[human-source]", ...parts);
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

  return {
    ...source, face, body, topology, cut, reader, field, faceRows,
    bodyRowsRaw, rigRows, stages, authored, headTraits,
  };
}
