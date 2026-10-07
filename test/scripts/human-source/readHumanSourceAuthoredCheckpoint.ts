import crypto from "node:crypto";
import path from "node:path";

import type { IHumanSourceAuthoredCheckpointInput } from "./structures/IHumanSourceAuthoredCheckpointInput.ts";
import type { IHumanSourceAuthoredCheckpoint } from "./structures/IHumanSourceAuthoredCheckpoint.ts";
import type { IHumanSourceAuthoredStageReceipt } from "./structures/IHumanSourceAuthoredStageReceipt.ts";
import { serializeHumanSourceInspectionDescriptor } from "./serializeHumanSourceInspectionDescriptor.ts";
import { readHumanSourcePublication } from "./readHumanSourcePublication.ts";

/**
 * Read completed-eye geometry into the same normal source preparation graph.
 * Every stored file is content-verified, source inputs must match the freshly
 * verified sample/provider/replay, and native maps, triangle incidence, UVs and
 * support weights must exactly match the preparation rebuilt by their owners.
 * Both views must equal projection of the one checkpoint root. This is an
 * explicit inspection input retaining its lip refusal, never a full-stage
 * acceptance or a coordinate graft onto historical bindings.
 */
export function readHumanSourceAuthoredCheckpoint(input: IHumanSourceAuthoredCheckpointInput): IHumanSourceAuthoredCheckpoint {
  const sha = (bytes: Buffer): string => crypto.createHash("sha256").update(bytes).digest("hex");
  const admitted = readHumanSourcePublication(input.directory, ["stage-receipt.json", "full-stage-refusal.json"], "inspection");
  const receiptBytes = admitted.outputs.get("stage-receipt.json")!;
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as IHumanSourceAuthoredStageReceipt;
  if (receipt.schema !== "automovie-authored-neutral-skin-stage/1" || receipt.completeGeneration || receipt.fullStageAccepted || !receipt.inspectionOnly ||
      !receipt.completedComponents.includes("periocular-continuous-neutral") || !receipt.completedComponents.includes("complete-source-replay") ||
      receipt.refusedComponents.join("\n") !== "lip-neutral-closure" || receipt.activeRootVertices !== input.root.topology.vertexCount ||
      receipt.headVertices !== input.skin.headPositions.length / 3 || receipt.bodyVertices !== input.skin.bodyPositions.length / 3 ||
      receipt.endpointStates !== input.endpointStates || receipt.cutVertices !== input.skin.partition.cut.intersections.length)
    throw new Error("Source inspection requires the completed-eye checkpoint and explicit full-stage lip refusal.");
  const data = new Map<string, Buffer>();
  for (const [name, expected] of Object.entries(receipt.files)) {
    if (path.basename(name) !== name) throw new Error("Checkpoint has a nonlocal file name.");
    const bytes = admitted.outputs.get(name);
    if (bytes === undefined) throw new Error("Checkpoint publication does not own " + name);
    if (sha(bytes) !== expected) throw new Error("Source checkpoint file changed: " + name);
    data.set(name, bytes);
  }
  for (const observed of input.inputs.filter((one) => /^(sample|provider|replay)\//.test(one.path)))
    if (!receipt.inputs.some((one) => one.path === observed.path && one.sha256 === observed.sha256 && one.bytes === observed.bytes))
      throw new Error("Source checkpoint has a different preparation input: " + observed.path);
  const bytes = (name: string): Buffer => {
    const value = data.get(name); if (value === undefined) throw new Error("Source checkpoint lacks " + name); return value;
  };
  const equal = (name: string, value: Float64Array | Int32Array): void => {
    if (!bytes(name).equals(Buffer.from(value.buffer, value.byteOffset, value.byteLength))) throw new Error("Source checkpoint correspondence differs: " + name);
  };
  equal("native-to-source.i32", input.root.nativeToSource); equal("source-to-native.i32", input.root.sourceToNative);
  equal("root-parent-triangles.i32", input.root.topology.triangles); equal("root-corner-uv.f64", input.root.topology.cornerUv);
  equal("head-indices.i32", input.skin.partition.headIndices); equal("head-uv.f64", input.skin.partition.headUv);
  equal("body-indices.i32", input.skin.partition.cut.p1BodyIndices); equal("body-uv.f64", input.skin.partition.cut.p1BodyUv);
  equal("head-samples.i32", input.skin.partition.cut.faceToG1); equal("body-samples.i32", input.skin.partition.cut.p1BodyToG1);
  equal("original-face-to-head.i32", input.skin.partition.originalFaceToHead);
  const json = <T>(name: string): T => JSON.parse(bytes(name).toString("utf8")) as T;
  const rootWeights = json<Record<string, unknown>>("root-weights.json");
  if (JSON.stringify(rootWeights) !== JSON.stringify({ bones: input.skin.bones, attachments: input.skin.attachments }))
    throw new Error("Source checkpoint has different native support weights.");
  const doubles = (name: string): Float64Array => { const value = bytes(name); return new Float64Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)); };
  const positions = doubles("root-positions.f64"), head = doubles("head-positions.f64"), body = doubles("body-positions.f64");
  if (positions.length !== input.skin.positions.length || !positions.every(Number.isFinite)) throw new Error("Source checkpoint root is incomplete or nonfinite.");
  const admitView = (values: Float64Array, samples: Int32Array): void => {
    if (values.length !== samples.length * 3 || !values.every((value, at) => value === positions[3 * samples[Math.floor(at / 3)] + at % 3]))
      throw new Error("Source checkpoint view is not the exact shared-root projection.");
  };
  admitView(head, input.skin.partition.cut.faceToG1); admitView(body, input.skin.partition.cut.p1BodyToG1);
  input.skin.partition.cut.intersections.forEach(({ a, b, t }, index) => {
    for (let axis = 0; axis < 3; axis++)
      if (positions[3 * (input.root.topology.vertexCount + index) + axis] !== (1 - t) * positions[3 * a + axis] + t * positions[3 * b + axis])
        throw new Error("Source inspection checkpoint moved a frozen cut sample independently.");
  });
  input.root.topology.positions.set(positions.subarray(0, input.root.topology.positions.length));
  input.skin.positions.set(positions); input.skin.headPositions = head; input.skin.bodyPositions = body;
  // Host PID, executable and stack are provenance, not portable geometry identity.
  const descriptor = serializeHumanSourceInspectionDescriptor(receipt);
  input.inputs.push({ role: "failed-qualified eye source descriptor", path: "inspection-recipe/component", revision: null, bytes: descriptor.length, sha256: sha(descriptor) });
  for (const [name, value] of data) if (name !== "full-stage-refusal.json")
    input.inputs.push({ role: "completed source component bytes", path: "inspection-checkpoint/" + name, revision: null, bytes: value.length, sha256: sha(value) });
  const lidSeatReceipt = json<IHumanSourceAuthoredCheckpoint["lidSeatReceipt"]>("lid-seat-source-receipt.json");
  const orbitalSkinReceipt = json<IHumanSourceAuthoredCheckpoint["orbitalSkinReceipt"]>("orbital-skin-source-receipt.json");
  const excludedRegionReceipts = json<IHumanSourceAuthoredCheckpoint["excludedRegionReceipts"]>("excluded-region-source-receipt.json");
  return { bodyNeutralReceipt: json<Record<string, unknown>>("body-neutral-source-receipt.json"), lidSeatReceipt, orbitalSkinReceipt,
    excludedRegionReceipts, editReceipt: json<IHumanSourceAuthoredCheckpoint["editReceipt"]>("edit-receipt.json"),
    movedSourceVertices: [...new Set([...lidSeatReceipt.sides.flatMap((one) => one.movedSourceVertices), ...orbitalSkinReceipt.sides.flatMap((one) => one.movedSourceVertices),
      ...excludedRegionReceipts.flatMap((one) => one.sourceVertices)])].sort((a, b) => a - b),
    refusal: bytes("full-stage-refusal.json").toString("utf8") };
}
