import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { humanPersonHeadShapeFieldUnit } from "@automovie/human/human/document/humanPersonHeadShapeFieldUnit";
import type { IHumanSourceAuthoredCompilation } from "./structures/IHumanSourceAuthoredCompilation.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import type { IHumanSourceHeadTraitPacket } from "./structures/IHumanSourceHeadTraitPacket.ts";
import type { IHumanSourceHeadTraits } from "./structures/IHumanSourceHeadTraits.ts";
import { readHumanSourcePublication } from "./readHumanSourcePublication.ts";

/** Read actual paired dimensional variants on the current common root.
 * Each trait's explicit sampled +/- difference defines a source authoring
 * envelope, not a clinical normal or validated combination. Absolute native
 * positions become differences from this exact provider neutral, rotate once
 * to [X,Z,-Y] metres, and share the frozen cut interpolation.
 *
 * The packet must name the same authoring receipt as the replay, the same
 * sample and this provider's neutral, joints and packet, so a sampled state
 * and a dimensional endpoint are differences of one formula on one source.
 * The packet and endpoint bytes enter the generation input record. The
 * formula, recipe and compiler bytes are already there through the producer
 * closure, which covers the whole source script directory.
 */
export function readHumanSourceHeadTraits(directory: string, current: IHumanSourceAuthoredCompilation, provider: string,
  inputs: IHumanSourceGenerationInput[], landmarkIds: readonly string[]): IHumanSourceHeadTraits {
  const sha = (bytes: Buffer): string => crypto.createHash("sha256").update(bytes).digest("hex");
  const admitted = readHumanSourcePublication(directory, ["head-trait-endpoints.json"], "component");
  const providerPublication = readHumanSourcePublication(provider,
    ["head-provider-packet.json", "neutral-provider.f64", "joints-provider.f64"], "component");
  const read = (file: string, expected: string | undefined, locator: string, role: string): Buffer => {
    const data = locator.startsWith("head-traits/") ? admitted.outputs.get(locator.slice("head-traits/".length)) :
      locator.startsWith("provider/") ? providerPublication.outputs.get(locator.slice("provider/".length)) : fs.readFileSync(file);
    if (data === undefined) throw new Error(`Dimensional publication does not own ${locator}.`);
    const digest = sha(data);
    if (expected !== undefined && digest !== expected) throw new Error(`Dimensional source input changed: ${locator}.`);
    inputs.push({ role, path: locator, revision: null, bytes: data.length, sha256: digest });
    return data;
  };
  const receipt = read(path.join(directory, "head-trait-endpoints.json"), undefined,
    "head-traits/head-trait-endpoints.json", "actual dimensional source receipt");
  const packet = JSON.parse(receipt.toString("utf8")) as IHumanSourceHeadTraitPacket;
  if (packet.schema !== "automovie-authored-head-dimensional-endpoints/2" || packet.refusals.length !== 0 ||
      packet.providerVertices !== current.root.nativeToSource.length || packet.providerNeutralSha256 !== current.packet.positions.sha256 ||
      packet.providerJointsSha256 !== current.packet.bonepoints.sha256 ||
      new Set(packet.fields.map((field) => field.id)).size !== packet.fields.length)
    throw new Error("Dimensional source packet does not share this complete provider neutral and unique traits.");
  if (packet.authoringInputsSha256 !== current.authoringInputsSha256)
    throw new Error("Dimensional endpoints and the endpoint replay were computed from different head authoring inputs.");
  const sampled = Object.entries(current.packet.sampleInputs);
  if (sampled.length !== Object.keys(packet.sampleInputs).length || sampled.some(([name, file]) => packet.sampleInputs[name] !== file.sha256))
    throw new Error("Dimensional endpoints were computed from a different source sample.");
  if (sha(providerPublication.outputs.get("head-provider-packet.json")!) !== packet.providerPacketSha256)
    throw new Error("Dimensional endpoints name a different provider packet than this generation reads.");
  const f64 = (data: Buffer): Float64Array => new Float64Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  const neutral = f64(read(path.join(provider, "neutral-provider.f64"), packet.providerNeutralSha256, "provider/neutral-provider.f64", "shared dimensional neutral"));
  const jointsNeutral = f64(read(path.join(provider, "joints-provider.f64"), current.packet.bonepoints.sha256,
    "provider/joints-provider.f64", "shared dimensional joints neutral"));
  const result: IHumanSourceHeadTraits = { fields: [], targets: {}, jointTargets: {} };
  for (const field of packet.fields) {
    if (field.unit !== humanPersonHeadShapeFieldUnit(field.id) || !Number.isFinite(field.samplingDifference) || field.samplingDifference <= 0 || !field.supportQualification.trim())
      throw new Error(`Dimensional field ${field.id} has no exact unit and sampled support.`);
    const endpointNames = new Map<string, string>();
    for (const direction of ["positive", "negative"] as const) {
      const endpoints = field.endpoints.filter((endpoint) => endpoint.direction === direction);
      const difference = direction === "positive" ? field.samplingDifference : -field.samplingDifference;
      if (endpoints.length !== 1 || endpoints[0].difference !== difference) throw new Error(`Dimensional field ${field.id} lacks its exact ${direction} sample.`);
      const endpoint = endpoints[0];
      const positions = f64(read(path.join(directory, endpoint.positions), endpoint.positionsSha256, `head-traits/${endpoint.positions}`, "actual dimensional positions"));
      const joints = f64(read(path.join(directory, endpoint.joints), endpoint.jointsSha256, `head-traits/${endpoint.joints}`, "actual dimensional joint witnesses"));
      if (positions.length !== neutral.length || joints.length !== jointsNeutral.length || joints.length !== 3 * landmarkIds.length)
        throw new Error(`Dimensional field ${field.id} changes native geometry or joint population.`);
      const name = `head-source:${field.id}:${direction}`;
      endpointNames.set(direction, name);
      const delta = new Float64Array(3 * current.root.topology.vertexCount);
      current.root.sourceToNative.forEach((native, vertex) => {
        delta[3 * vertex] = positions[3 * native] - neutral[3 * native];
        delta[3 * vertex + 1] = positions[3 * native + 2] - neutral[3 * native + 2];
        delta[3 * vertex + 2] = -(positions[3 * native + 1] - neutral[3 * native + 1]);
      });
      const rows: number[] = [];
      const add = (vertex: number, value: Iterable<number>): void => {
        const xyz = Array.from(value);
        if (xyz.some((coordinate) => !Number.isFinite(coordinate))) throw new Error(`Dimensional field ${field.id} has a nonfinite delta.`);
        if (xyz.some((coordinate) => coordinate !== 0)) rows.push(vertex, ...xyz);
      };
      for (let vertex = 0; vertex < current.root.topology.vertexCount; vertex++) add(vertex, delta.subarray(3 * vertex, 3 * vertex + 3));
      current.skin.partition.cut.intersections.forEach(({ a, b, t }, index) =>
        add(current.root.topology.vertexCount + index, [0, 1, 2].map((axis) => (1 - t) * delta[3 * a + axis] + t * delta[3 * b + axis])));
      result.targets[name] = rows;
      const jointRows: number[] = [];
      for (let joint = 0; joint < landmarkIds.length; joint++) {
        const xyz = [joints[3 * joint] - jointsNeutral[3 * joint], joints[3 * joint + 2] - jointsNeutral[3 * joint + 2], -(joints[3 * joint + 1] - jointsNeutral[3 * joint + 1])];
        if (xyz.some((value) => !Number.isFinite(value))) throw new Error(`Dimensional field ${field.id} has nonfinite joint witnesses.`);
        if (xyz.some((value) => value !== 0)) jointRows.push(joint, ...xyz);
      }
      result.jointTargets[name] = jointRows;
    }
    result.fields.push({ id: field.id, unit: field.unit, positiveUnitsPerWeight: field.samplingDifference,
      negativeUnitsPerWeight: field.samplingDifference, minimum: -field.samplingDifference, maximum: field.samplingDifference,
      bodyChannel: `headSource:${field.id}`, positiveEndpoint: endpointNames.get("positive")!, negativeEndpoint: endpointNames.get("negative")!,
      qualification: field.supportQualification });
  }
  return result;
}
