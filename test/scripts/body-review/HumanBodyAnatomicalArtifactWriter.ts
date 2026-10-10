import type { IAutoMovieHumanBodyBuild } from "@automovie/human/body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import { createHumanBodyAtlasExportQualification } from "@automovie/human/body/export/createHumanBodyAtlasExportQualification";
import { createHumanBodyAssemblyExportQualification } from "@automovie/human/body/export/createHumanBodyAssemblyExportQualification";
import { exportHumanBody } from "@automovie/human/body/export/exportHumanBody";
import { autoMovieRenderDigest, inspectAutoMovieMeshTopology, validateMeshTopology, validateModel } from "@automovie/engine";
import type { IAutoMovieHumanGltfExport } from "@automovie/human/common/export/IAutoMovieHumanGltfExport";
import { gltfMaterialExtensions } from "@automovie/human/common/export/gltfMaterialExtensions";
import { readHumanBodyAssemblyAssetCorrespondence } from "@automovie/human/body/export/readHumanBodyAssemblyAssetCorrespondence";
import type { IHumanBodyLayerReference } from "@automovie/human/body/anatomy/layer/IHumanBodyLayerReference";
import type { IHumanBodyLayerObservation } from "@automovie/human/body/anatomy/layer/IHumanBodyLayerObservation";
import type { IAutoMovieHumanStaticPartInterval } from "@automovie/human/common/export/IAutoMovieHumanStaticPartInterval";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { type Primitive, WebIO } from "@gltf-transform/core";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

import type { IHumanBodyAnatomicalAssetReadback } from "./IHumanBodyAnatomicalAssetReadback";
import type { IHumanBodyAnatomicalSourceMemberReadback } from "./IHumanBodyAnatomicalSourceMemberReadback";
import type { IHumanBodyNativeSubcutaneousMemberReadback } from "./IHumanBodyNativeSubcutaneousMemberReadback";

/**
 * Preserve actual construction archives and read the exporter-written Float32
 * source intervals. This IO owner never constructs or changes an anatomy.
 * Archives keep rejected models separately from static export admission.
 */
export class HumanBodyAnatomicalArtifactWriter {
  /** The exclusive output epoch already created by the owning CLI. */
  constructor(private readonly output: string) {}

  /** Byte identity of one retained artifact, independently of its file name. */
  private hash(bytes: string | Uint8Array): string {
    return createHash("sha256").update(bytes).digest("hex");
  }

  writeAsset(name: string, asset: IAutoMovieHumanGltfExport): void {
    const directory = path.resolve(this.output, name);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, name + ".glb"), asset.glb);
    fs.writeFileSync(
      path.join(directory, name + ".gltf"),
      JSON.stringify(asset.gltf.json),
    );
    for (const [uri, bytes] of Object.entries(asset.gltf.resources)) {
      const target = path.resolve(directory, uri);
      if (!target.startsWith(directory + path.sep))
        throw new Error(
          "Static source resource leaves its output owner: " + uri,
        );
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes);
    }
  }

  /** Preserve every constructed part before independent quality/export checks. */
  writeConstructedModel(name: string, model: IAutoMovieModel): void {
    const directory = path.join(this.output, "constructed-" + name + "-model");
    fs.mkdirSync(directory, { recursive: true });
    const records = model.parts.map((part, index) => {
      const file = String(index).padStart(4, "0") + ".json.gz";
      const bytes = gzipSync(JSON.stringify(part));
      fs.writeFileSync(path.join(directory, file), bytes);
      return { index, id: part.id, file, sha256: this.hash(bytes) };
    });
    const { parts: _parts, ...metadata } = model;
    const metadataBytes = gzipSync(JSON.stringify(metadata));
    fs.writeFileSync(path.join(directory, "model.json.gz"), metadataBytes);
    fs.writeFileSync(
      path.join(directory, "manifest.json"),
      JSON.stringify(
        {
          modelSha256: this.hash(metadataBytes),
          parts: records,
          meaning:
            "Complete actual model metadata and ordered parts, individually serialized without dropping geometry; admission remains separate",
        },
        null,
        2,
      ),
    );
  }

  /** Read one actual accessor interval and require exact Float32 mesh replay. */
  private readMember(
    primitive: Primitive,
    interval: IAutoMovieHumanStaticPartInterval,
    model: IAutoMovieModel,
    emittedDigest?: string,
  ): IAutoMovieMesh {
    const source = model.parts.find((part) => part.id === interval.id);
    if (source === undefined || source.geometry.type !== "mesh")
      throw new Error("Actual source interval has no constructed mesh: " + interval.id);
    const mesh = source.geometry.mesh;
    if (emittedDigest !== undefined && autoMovieRenderDigest(JSON.stringify(mesh)) !== emittedDigest)
      throw new Error("Native source qualification differs from its actual emitted mesh: " + interval.id);
    const actual = primitive.getAttribute("POSITION")!.getArray()!;
    const assetIndices = primitive.getIndices()!.getArray()!;
    if (interval.vertexCount * 3 !== mesh.positions.length ||
        interval.indexCount !== (mesh.indices?.length ?? mesh.positions.length / 3))
      throw new Error("Actual source accessor population differs: " + interval.id);
    const positions: number[] = [], indices: number[] = [];
    for (let at = 0; at < interval.vertexCount * 3; at++) {
      const value = actual[interval.vertexOffset * 3 + at];
      if (value !== Math.fround(mesh.positions[at]))
        throw new Error("Actual static accessor differs from its posed source member: " + interval.id);
      positions.push(value);
    }
    for (let at = 0; at < interval.indexCount; at++) {
      const value = assetIndices[interval.indexOffset + at] - interval.vertexOffset;
      if (value !== (mesh.indices?.[at] ?? at))
        throw new Error("Actual static index differs from its posed source member: " + interval.id);
      indices.push(value);
    }
    return { ...mesh, positions, indices };
  }

  async readback(
    bytes: Uint8Array,
    model: IAutoMovieModel,
    prefix: "" | "body:",
    layers: readonly IHumanBodyLayerObservation[] = [],
  ): Promise<IHumanBodyAnatomicalAssetReadback> {
    const decoded = await new WebIO()
      .registerExtensions(gltfMaterialExtensions)
      .readBinary(bytes);
    const readings: IHumanBodyAnatomicalSourceMemberReadback[] = [];
    const nativeReadings: IHumanBodyNativeSubcutaneousMemberReadback[] = [];
    for (const primitive of decoded
      .getRoot()
      .listMeshes()
      .flatMap((mesh) => mesh.listPrimitives())) {
      const record = readHumanBodyAssemblyAssetCorrespondence(primitive);
      if (record === undefined) continue;
      for (const account of record.qualification.parts) {
        const interval = record.geometry.parts.find(
          (part) => part.id === account.id,
        )!;
        const float32Mesh = this.readMember(primitive, interval, model);
        const float32Topology = inspectAutoMovieMeshTopology(float32Mesh);
        const float32Admission = validateMeshTopology({
          mesh: float32Mesh,
          expectClosed: true,
        });
        readings.push({
          id: account.id,
          anatomicalOwner: account.part,
          tissue: account.tissue,
          sourceMesh: account.compiledMeshSha256,
          ...(account.sourceVertices === undefined
            ? {}
            : { sourceVertices: account.sourceVertices }),
          vertices: interval.vertexCount,
          indices: interval.indexCount,
          maximumFloat32ReplayDifference: 0,
          float32Topology,
          float32Admission,
          qualification: account.qualification,
          source: account.source,
          clinical: account.clinical,
        });
      }
      const native = record.qualification.nativeSubcutaneous;
      for (const member of native?.members ?? []) {
        const interval = record.geometry.parts.find((part) => part.id === member.id)!;
        const mesh = this.readMember(primitive, interval, model, member.meshDigest);
        nativeReadings.push({
          ...member,
          nativeSource: native!.source,
          finalExteriorDigest: native!.exteriorDigest,
          vertices: interval.vertexCount,
          indices: interval.indexCount,
          maximumFloat32ReplayDifference: 0,
          float32Topology: inspectAutoMovieMeshTopology(mesh),
          meaning: "One disjoint boundary member can be open; the exporter validates their complete carrying material primitive. Original layer failures remain separate.",
        });
      }
    }
    const expected = model.parts.filter((part) =>
      part.id.startsWith(prefix + "anatomical-source:"),
    ).length;
    if (readings.length !== expected)
      throw new Error(
        "Static readback omitted an actual source assembly member.",
      );
    const expectedNative = layers.flatMap((layer) => layer.nativeSubcutaneous?.members.map((member) => prefix + member.id) ?? []);
    if (nativeReadings.length !== expectedNative.length ||
        new Set(nativeReadings.map((reading) => reading.id)).size !== nativeReadings.length ||
        expectedNative.some((id) => !nativeReadings.some((reading) => reading.id === id)))
      throw new Error("Static readback omitted an actual native subcutaneous boundary member.");
    const refused = readings.filter(
      (reading) => !reading.float32Admission.success,
    );
    if (refused.length !== 0) {
      fs.writeFileSync(
        path.join(
          this.output,
          (prefix === "" ? "body" : "person") + "-float32-source-refusals.json",
        ),
        JSON.stringify(refused, null, 2),
      );
      throw new Error(
        "Actual Float32 source topology refuses: " +
          refused.map((reading) => reading.id).join(", "),
      );
    }
    return {
      glbSha256: this.hash(bytes),
      sourceMembers: readings,
      nativeSubcutaneousMembers: nativeReadings,
      qualification:
        "actual static source interval and Float32 replay only; anatomy/clearance/GPU not certified",
    };
  }

  skinOf(
    model: IAutoMovieModel,
    id: string,
  ): IHumanBodyLayerReference {
    const part = model.parts.find((candidate) => candidate.id === id);
    if (part === undefined || part.geometry.type !== "mesh")
      throw new Error("Constructed model has no skin mesh " + id);
    return { name: id, mesh: part.geometry.mesh };
  }

  /** Write the actual body through the shared static exporter and readback. */
  async writeBodyAsset(
    build: IAutoMovieHumanBodyBuild,
    candidate: IAutoMovieHumanBodyBasis,
  ): Promise<void> {
    const validation = validateModel({ model: build.model });
    fs.writeFileSync(
      path.join(this.output, "body-model-admission.json"),
      JSON.stringify(
        {
          parts: build.model.parts.map((part, index) => ({
            index,
            id: part.id,
          })),
          validation,
        },
        null,
        2,
      ),
    );
    if (!validation.success)
      throw new Error(
        "Actual neutral body assembly is not a valid resident model; full diagnostics are in body-model-admission.json.",
      );
    fs.writeFileSync(
      path.join(this.output, "body-source-quantities.json"),
      JSON.stringify(build.anatomicalQuantities ?? [], null, 2),
    );
    const asset = await exportHumanBody(
      build.model,
      undefined,
      undefined,
      await createHumanBodyAtlasExportQualification(
        candidate,
        build.evaluatedDocument,
      ),
      await createHumanBodyAssemblyExportQualification(
        candidate,
        build.evaluatedDocument,
        "",
        build.layerObservations,
      ),
    );
    this.writeAsset("body", asset);
    fs.writeFileSync(
      path.join(this.output, "body-readback.json"),
      JSON.stringify(await this.readback(asset.glb, build.model, "", build.layerObservations), null, 2),
    );
  }

}
