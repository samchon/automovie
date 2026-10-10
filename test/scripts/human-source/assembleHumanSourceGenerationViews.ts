import { assembleHumanSourceGeneration } from "./assembleHumanSourceGeneration.ts";
import { assembleHumanSourceP1 } from "./assembleHumanSourceP1.ts";
import { authorHumanSourceHeadViewRows } from "./authorHumanSourceHeadViewRows.ts";
import { bindHumanSourceParts } from "./bindHumanSourceParts.ts";
import { classifyHumanSourceRows } from "./classifyHumanSourceRows.ts";
import { defineHumanSourceAuthoredNasalContours } from "./defineHumanSourceAuthoredNasalContours.ts";
import { defineHumanSourceBand } from "./defineHumanSourceBand.ts";
import { defineHumanSourceHeadLandmarks } from "./defineHumanSourceHeadLandmarks.ts";
import { defineHumanSourceHeadRegions } from "./defineHumanSourceHeadRegions.ts";
import { defineHumanSourceHeadSampleSelections } from "./defineHumanSourceHeadSampleSelections.ts";
import { defineHumanSourceMacros } from "./defineHumanSourceMacros.ts";
import { defineHumanSourceOpticalSupport } from "./defineHumanSourceOpticalSupport.ts";
import { defineHumanSourceOralSupport } from "./defineHumanSourceOralSupport.ts";
import { defineHumanSourcePeriocular } from "./defineHumanSourcePeriocular.ts";
import { mapHumanSourceSampleFaces } from "./mapHumanSourceSampleFaces.ts";
import { measureHumanSourceCarry } from "./measureHumanSourceCarry.ts";
import { regenerateHumanSourceBodyFields } from "./regenerateHumanSourceBodyFields.ts";
import { regenerateHumanSourcePose } from "./regenerateHumanSourcePose.ts";
import { splitHumanSourcePersonViews } from "./splitHumanSourcePersonViews.ts";
import { resolveHumanFaceAppearanceDocument } from "@automovie/human/face/basis/resolveHumanFaceAppearanceDocument";
import { compileHumanSourceAttachmentRegistration } from "./compileHumanSourceAttachmentRegistration.ts";
import type { IHumanSourcePreparedGeneration } from "./structures/IHumanSourcePreparedGeneration.ts";
import type { IHumanSourceCompiledGeneration } from "./structures/IHumanSourceCompiledGeneration.ts";
import type { IHumanSourcePersonViews } from "./structures/IHumanSourcePersonViews.ts";
import type { IHumanSourceReproductionReport } from "./structures/IHumanSourceReproductionReport.ts";

/**
 * Body band reach, metres: the smallest reach without a band fold when the
 * one-skin person evaluator was swept over 40, 60, 80 and 112.5 mm (40 mm
 * folded at neck height -1, 60 mm did not). An authored rig convention,
 * recorded as such in the band.
 */
const BAND_REACH_METRES = 0.06;

/**
 * Assemble the shared generation and final consumer-frame partition views.
 * Macros, bindings and landmark owners retain their original order. Attachment
 * preparation follows final head-row and optical support registration, so a
 * complete publication never substitutes a coarse cage disk for required
 * native support. The pinned numerical document supplies independent optical
 * dimensions and relief unchanged; ordinary brow bootstrap is also observed.
 * Its source identity remains distinct from this newly composed host.
 * Numerical support registration is separate from whole-model acceptance.
 */
export function assembleHumanSourceGenerationViews(
  source: IHumanSourcePreparedGeneration,
): IHumanSourceCompiledGeneration {
  let { face } = source;
  const { body, sample, faceSha256, cut, topology, faceRows, bodyRowsRaw, rigRows,
    upstream, inputs, authored, headTraits, reader, field, mirror, baseFaces,
    toeRays, oralSourceSha256, tongueAuthoring, stages, extraction, producer } = source;
  const log = (...parts: unknown[]): void => console.log("[human-source]", ...parts);
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
  const views: IHumanSourcePersonViews = {
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
  const attachment = compileHumanSourceAttachmentRegistration({
    basis: views.head.face,
    document: resolveHumanFaceAppearanceDocument(
      views.head.face,
      source.attachmentDocument,
    ),
  });
  // The P1 face is a second supported export of this same head geometry.
  // Carry the one registration to both outputs without recomputing support
  // in a different frame or replacing P1's distinct endpoint/driver rows.
  p1.face = {
    ...p1.face,
    periocular: views.head.face.periocular,
    opticalSupport: views.head.face.opticalSupport,
    oralSupport: views.head.face.oralSupport,
    surfaces: p1.face.surfaces.map((surface) => {
      const registered = views.head.face.surfaces.find((entry) => entry.id === surface.id);
      if (registered === undefined ||
          registered.positions.length !== surface.positions.length ||
          registered.positions.some((value, at) => value !== surface.positions[at]) ||
          registered.indices.length !== surface.indices.length ||
          registered.indices.some((vertex, at) => vertex !== surface.indices[at]) ||
          registered.sourcePartition?.generation !== surface.sourcePartition?.generation ||
          registered.sourcePartition?.samples.length !== surface.sourcePartition?.samples.length ||
          registered.sourcePartition?.samples.some((sample, at) => sample !== surface.sourcePartition?.samples[at]))
        throw new Error("P1 attachment projection needs identical actual host incidence and source samples.");
      return {
        ...surface,
        materialCharts: registered.materialCharts,
        hairDomains: registered.hairDomains,
      };
    }),
  };
  const reproduction: IHumanSourceReproductionReport = {
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
    };
  return {
    ...source, face, sampleRecord, generation, fields, p1, views, head,
    regions, sampleSelections, periocular, optical, rowEdits,
    poseReceipt: pose.receipt, reproduction, attachment,
  };
}
