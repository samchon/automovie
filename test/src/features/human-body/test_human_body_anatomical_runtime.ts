import { createConnectedBodyRuntime } from "@automovie/playground/src/human/body/connectedBodyRuntime";
import { createConnectedBodyPreview } from "@automovie/playground/src/human/body/connectedBodyPreview";
import { createConnectedBodyRenderer } from "@automovie/playground/src/human/body/connectedBodyRenderer";
import type { ConnectedBodyRequest, ConnectedBodyResult } from "@automovie/playground/src/human/body/connectedBodyProtocol";
import type { HumanResidentPort } from "@automovie/playground/src/human/common/residentWorker";
import { WebIO } from "@gltf-transform/core";
import { serializeHumanBodyAnatomicalDocument } from "@automovie/human/body/document/serializeHumanBodyAnatomicalDocument";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";
import { TestValidator } from "@nestia/e2e";

import { bodyAnatomicalInspectionFixture } from "../internal/bodyAnatomicalInspectionFixture";
import { nclose, rejectsError } from "../internal/predicates";

/**
 * The actual resident dispatcher preserves legacy preview, candidate qualification and local refusal/recovery.
 *
 * Scenarios:
 * 1. The real resident dispatcher previews independent target candidates and exports their static material-merged asset.
 * 2. Imaging and pose-operation refusals recover to independent targets and the legacy skin branch; malformed and oversized text cannot bypass admission.
 */
export async function test_human_body_anatomical_runtime(): Promise<void> {
  const { basis, document } = bodyAnatomicalInspectionFixture();
  if (document.tier !== "detailed") throw new Error("fixture tier");
  const runtime = createConnectedBodyRuntime(basis);
  const request = { operation: "preview" as const, document: serializeHumanBodyAnatomicalDocument(document), measure: false };
  const first = await runtime(request);
  if (first.operation !== "preview") throw new Error("preview expected");
  TestValidator.equals("actual optional report names candidates", first.anatomicalRequest?.candidates.map((head) => head.part), ["leftHumerus", "leftFemur"]);
  TestValidator.predicate("actual report converts independent target radii", first.anatomicalRequest?.candidates.every((head, index) => nclose(head.radiusMetres, [.024, .025][index])) === true);
  TestValidator.equals("actual candidate meshes", first.model.parts.map((part) => part.id), ["leftHumerus/head-candidate", "leftFemur/head-candidate"]);
  TestValidator.predicate("static Float32 preview buffers", first.model.parts.every((part) => part.geometry.mesh.positions instanceof Float32Array && part.attachedBone === null));
  const port: HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult> = {
    onmessage: null,
    onerror: null,
    postMessage: (request) => { void runtime(request.input).then((value) => port.onmessage?.({ data: { id: request.id, success: true, value } })); },
    terminate: () => {},
  };
  const renderer = createConnectedBodyRenderer({
    maxAnisotropy: 1,
    loadTexture: async () => { throw new Error("Untextured candidates must not request a texture."); },
  });
  const preview = createConnectedBodyPreview({
    worker: () => port,
    serialize: serializeHumanBodyAnatomicalDocument,
    renderer,
  });
  const prepared = await preview.build(document);
  TestValidator.equals("preview retains worker qualification beside the prepared frame", prepared.anatomicalRequest, first.anatomicalRequest);
  TestValidator.equals("qualification remains paired with actual prepared parts", prepared.frame.model.parts.map((part) => part.id), ["leftHumerus/head-candidate", "leftFemur/head-candidate"]);
  renderer.dispose(prepared.frame);
  preview.disposeWorker();
  const observed = { ...document, targets: { ...document.targets,
    leftUpperLimb: { upperArm: { humerus: { sphereFittedHeadRadius: { kind: "observed" as const, millimetres: 24, modality: "ct" as const, acquisitionPosture: "supine" as const } } } },
  } };
  TestValidator.predicate("actual acquisition refuses", await rejectsError(() => runtime({ ...request, document: serializeHumanBodyAnatomicalDocument(observed) }), "posture-unregistered"));
  TestValidator.predicate("new inspector never solves a legacy pose", await rejectsError(() => runtime({ operation: "armsDown", document: request.document }), "arms-down"));
  const recovered = { ...document, targets: { ...document.targets,
    leftUpperLimb: { upperArm: { humerus: { sphereFittedHeadRadius: { kind: "target" as const, millimetres: 23 } } } },
  } };
  const recovery = await runtime({ ...request, document: serializeHumanBodyAnatomicalDocument(recovered) });
  if (recovery.operation !== "preview") throw new Error("preview expected");
  TestValidator.predicate("same resident recovers independently", recovery.anatomicalRequest?.candidates.every((head, index) => nclose(head.radiusMetres, [.023, .025][index])) === true);
  const exported = await runtime({ operation: "export", document: serializeHumanBodyAnatomicalDocument(recovered) });
  if (exported.operation !== "export") throw new Error("export expected");
  const asset = (await new WebIO().readBinary(exported.glb)).getRoot();
  TestValidator.equals("resident export returns the candidate finish only", asset.listMaterials().map((material) => material.getName()), ["articular-inspection"]);
  TestValidator.equals("resident export merges the two candidate parts", asset.listMeshes().length, 1);
  const legacy = await runtime({ ...request, document: serializeHumanBodyBasisDocument({ id: "legacy", name: "Legacy", basis: basis.id, shape: {} }) });
  if (legacy.operation !== "preview") throw new Error("legacy preview expected");
  TestValidator.equals("legacy report remains absent", legacy.anatomicalRequest, undefined);
  TestValidator.equals("legacy original skin remains", legacy.model.parts.length, 1);
  TestValidator.predicate("budget precedes new dispatch", await rejectsError(() => runtime({ ...request, document: " ".repeat(16 * 1024 * 1024 + 1) }), "16,777,216"));
  for (const raw of ["null", "1", "[]", "{"])
    TestValidator.predicate("invalid record has no bypass", await rejectsError(() => runtime({ ...request, document: raw })));
}
