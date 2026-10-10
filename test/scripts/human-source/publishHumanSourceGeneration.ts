import fs from "node:fs";
import { assertHumanSourceWorkInputs } from "./assertHumanSourceWorkInputs.ts";
import { createHumanSourcePublication } from "./createHumanSourcePublication.ts";
import { defineHumanSourceSkinLandmarks } from "./defineHumanSourceSkinLandmarks.ts";
import { registerHumanSourceTeeth } from "./registerHumanSourceTeeth.ts";
import type { IHumanSourceEditReceipt } from "./structures/IHumanSourceEditReceipt.ts";
import { writeHumanSourceArtifacts } from "./writeHumanSourceArtifacts.ts";
import type { IHumanSourceGenerationOptions } from "./structures/IHumanSourceGenerationOptions.ts";
import type { IHumanSourceCompiledGeneration } from "./structures/IHumanSourceCompiledGeneration.ts";

/**
 * Write and atomically complete one coherent source publication.
 * All original reproduction losses, source edits, rights and inspection
 * refusals remain in their receipts. Final byte and filesystem verification
 * precedes authority completion; a failed write preserves refused evidence.
 * Attachment observations are included without promoting source or clinical
 * qualification, and the output directory is never reused.
 */
export function publishHumanSourceGeneration(
  options: IHumanSourceGenerationOptions,
  source: IHumanSourceCompiledGeneration,
): void {
  const { work, output, provider, replay, traitsDirectory, inspectionCheckpoint, repository, attachmentDocument } = options;
  const { face, body, inputs, producer, acquisitionReading, authored, oralAuthoring,
    tongueAuthoring, cut, fields, generation, p1, views, sampleRecord, head, regions,
    sampleSelections, periocular, optical, rowEdits, poseReceipt, reproduction, attachment } = source;
  const acquisition = acquisitionReading.acquisition;
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
    attachmentDocument,
  );
  if (fs.existsSync(output))
    throw new Error(`Compile output already exists: ${output}`);
  const publication = createHumanSourcePublication(output);
  try {
    writeHumanSourceArtifacts(publication, generation, p1, views, reproduction);
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
            attachmentRegistration: {
              ...attachment,
              document: source.attachmentDocument,
              documentInput: inputs.find((input) => input.path === "attachment-document/input"),
              hostFace: views.head.face.id,
              hostGeneration: generation.id,
              referenceConvention: "Original admitted numerical document on this newly registered host, plus the unchanged ordinary empty-shape/expression brow bootstrap. Source document basis identity is retained, not model-rebound; dimensions remain authored inputs and runtime retains its current-reference checks.",
            },
            bodyLandmarks: defineHumanSourceSkinLandmarks(body, generation, cut)
              .records,
            fieldProducers: [
              ...fields.receipts,
              poseReceipt,
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
          attachmentDocument,
        );
      },
    );
  } catch (error) {
    publication.refuse(error);
    throw error;
  }
}
