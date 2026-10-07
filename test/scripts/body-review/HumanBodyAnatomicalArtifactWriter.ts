import type { IAutoMovieHumanBodyBuild } from "@automovie/human/body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import { createHumanBodyAtlasExportQualification } from "@automovie/human/body/export/createHumanBodyAtlasExportQualification";
import { createHumanBodyAssemblyExportQualification } from "@automovie/human/body/export/createHumanBodyAssemblyExportQualification";
import { exportHumanBody } from "@automovie/human/body/export/exportHumanBody";
import { inspectAutoMovieMeshTopology, validateMeshTopology, validateModel } from "@automovie/engine";
import type { IAutoMovieHumanGltfExport } from "@automovie/human/common/export/IAutoMovieHumanGltfExport";
import { gltfMaterialExtensions } from "@automovie/human/common/export/gltfMaterialExtensions";
import { readHumanBodyAssemblyAssetCorrespondence } from "@automovie/human/body/export/readHumanBodyAssemblyAssetCorrespondence";
import type { IHumanBodyLayerReference } from "@automovie/human/body/anatomy/layer/IHumanBodyLayerReference";
import type { IAutoMovieModel } from "@automovie/interface";
import { WebIO } from "@gltf-transform/core";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

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

  async readback(
    bytes: Uint8Array,
    model: IAutoMovieModel,
    prefix: "" | "body:",
  ) {
    const decoded = await new WebIO()
      .registerExtensions(gltfMaterialExtensions)
      .readBinary(bytes);
    const readings = [];
    for (const primitive of decoded
      .getRoot()
      .listMeshes()
      .flatMap((mesh) => mesh.listPrimitives())) {
      const record = readHumanBodyAssemblyAssetCorrespondence(primitive);
      if (record === undefined) continue;
      const actual = primitive.getAttribute("POSITION")!.getArray()!;
      for (const account of record.qualification.parts) {
        const interval = record.geometry.parts.find(
          (part) => part.id === account.id,
        )!;
        const source = model.parts.find((part) => part.id === account.id)!;
        if (source.geometry.type !== "mesh")
          throw new Error(
            "Actual source assembly member is not its mesh: " + source.id,
          );
        let maximumFloat32ReplayDifference = 0;
        for (let at = 0; at < interval.vertexCount * 3; at++)
          maximumFloat32ReplayDifference = Math.max(
            maximumFloat32ReplayDifference,
            Math.abs(
              actual[interval.vertexOffset * 3 + at] -
                Math.fround(source.geometry.mesh.positions[at]),
            ),
          );
        if (maximumFloat32ReplayDifference !== 0)
          throw new Error(
            "Actual static accessor differs from its posed source member: " +
              source.id,
          );
        const assetIndices = primitive.getIndices()!.getArray()!;
        const positions: number[] = [];
        for (
          let at = interval.vertexOffset * 3;
          at < (interval.vertexOffset + interval.vertexCount) * 3;
          at++
        )
          positions.push(actual[at]);
        const indices: number[] = [];
        for (
          let at = interval.indexOffset;
          at < interval.indexOffset + interval.indexCount;
          at++
        )
          indices.push(assetIndices[at] - interval.vertexOffset);
        const float32Mesh = { ...source.geometry.mesh, positions, indices };
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
          maximumFloat32ReplayDifference,
          float32Topology,
          float32Admission,
          qualification: account.qualification,
          source: account.source,
          clinical: account.clinical,
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
      ),
    );
    this.writeAsset("body", asset);
    fs.writeFileSync(
      path.join(this.output, "body-readback.json"),
      JSON.stringify(await this.readback(asset.glb, build.model, ""), null, 2),
    );
  }

}
