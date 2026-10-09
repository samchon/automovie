import { readHumanBodyLayerExterior } from "@automovie/human/body/anatomy/layer/readHumanBodyLayerExterior";
import { humanPhysicalSourceDomain } from "@automovie/human/common/basis/humanPhysicalSourceDomain";
import type { IAutoMovieHumanPersonGeneration } from "@automovie/human/human/structures/IAutoMovieHumanPersonGeneration";
import type { IHumanBodyLayerExterior } from "@automovie/human/body/anatomy/layer/IHumanBodyLayerExterior";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodyLayerThicknessField } from "@automovie/human/body/anatomy/layer/IAutoMovieHumanBodyLayerThicknessField";
import type { IHumanBodyLayerReference } from "@automovie/human/body/anatomy/layer/IHumanBodyLayerReference";
import type { IHumanBodyLayerSurfaces } from "@automovie/human/body/anatomy/layer/IHumanBodyLayerSurfaces";
import { createHumanBodyLayerSurfaces } from "@automovie/human/body/anatomy/layer/createHumanBodyLayerSurfaces";
import { createHumanBodySubcutaneousShell } from "@automovie/human/body/anatomy/layer/createHumanBodySubcutaneousShell";
import { readHumanBodyLayerOrder } from "@automovie/human/body/anatomy/layer/readHumanBodyLayerOrder";
import type { IAutoMovieModel } from "@automovie/interface";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Retain native layer observations and Float32 source containment readings.
 * Tissue ownership determines which actual layer bounds each source part;
 * unknown sides and offset refusals remain failures rather than absent rows.
 */
export class HumanBodyAnatomicalLayerWriter {
  /** Inputs belong to the admitted compile epoch and stay unchanged. */
  constructor(
    private readonly output: string,
    private readonly assembly: IAutoMovieHumanBodyAnatomicalAssembly,
    private readonly field: IAutoMovieHumanBodyLayerThicknessField | undefined,
    private readonly skinIndices: readonly number[],
  ) {}

  /** Every measured limited offset condition must permit reference use. */
  static refuses(surfaces: IHumanBodyLayerSurfaces): boolean {
    return surfaces.beyondReachVertices > 0 || surfaces.unmeasuredReachVertices > 0 ||
      surfaces.invertedTriangles > 0 || surfaces.dermalInvertedTriangles > 0;
  }

  /**
   * Read every internal source part against the constructed skin and report the
   * paired left and right parts side by side. Boundary classification uses an
   * authored numerical reading tolerance of one micrometre. This convention
   * is separate from Float32 coordinate spacing and anatomical thickness.
   */
  writeLayerOrder(
    name: string,
    model: IAutoMovieModel,
    references: IHumanBodyLayerReference[],
    subjectPrefix: string,
    dermal?: IHumanBodyLayerReference[],
  ): number {
    // Each tissue is read against the face that bounds it. Bone, muscle and
    // connective tissue lie under the fascia. The subcutaneous member is the
    // layer between the dermal and fascial faces and is not read against
    // either. A gland lies in that same layer, on the fascia and under the
    // dermis, so with a thickness field it is read against the dermal face.
    // The tissue of a part comes from the assembly, not from its name.
    const tissueOf = new Map<string, string>(
      this.assembly.parts.map((part) => [part.id, part.tissue]),
    );
    const partsOf = (tissue: string): string[] =>
      model.parts
        .map((part) => part.id)
        .filter(
          (id) =>
            id.startsWith(subjectPrefix) &&
            tissueOf.get(id.slice(subjectPrefix.length).split("/")[0]) ===
              tissue,
        );
    const superficial = dermal === undefined ? [] : partsOf("fibroglandular");
    const excluded =
      this.field === undefined
        ? []
        : [
            ...model.parts
              .map((part) => part.id)
              .filter((id) =>
                id.startsWith(subjectPrefix + "subcutaneousAdipose/"),
              ),
            ...superficial,
          ];
    const exteriors = references.map((reference) => reference.name);
    const readings = readHumanBodyLayerOrder({
      model,
      references,
      subjectPrefix,
      excluded,
      toleranceMetres: 1e-6,
    });
    for (const id of superficial)
      readings.push(
        ...readHumanBodyLayerOrder({
          model,
          references: dermal!,
          subjectPrefix: id,
          excluded: [],
          toleranceMetres: 1e-6,
        }),
      );
    const outermost = new Map<string, number>();
    for (const reading of readings) {
      if (reading.maximumSignedMetres === null) continue;
      const owner = reading.subject.slice(subjectPrefix.length).split("/")[0];
      outermost.set(
        owner,
        Math.max(
          outermost.get(owner) ?? -Infinity,
          reading.maximumSignedMetres,
        ),
      );
    }
    const pairs = [...outermost.keys()]
      .filter(
        (owner) =>
          owner.startsWith("left") && outermost.has("right" + owner.slice(4)),
      )
      .map((owner) => ({
        part: owner.slice(4),
        leftMetres: outermost.get(owner)!,
        rightMetres: outermost.get("right" + owner.slice(4))!,
        differenceMetres: Math.abs(
          outermost.get(owner)! - outermost.get("right" + owner.slice(4))!,
        ),
      }));
    const refused = readings.filter((reading) => reading.refused);
    const unavailable = readings.filter(
      (reading) => !reading.judged || reading.unavailable !== null,
    );
    fs.writeFileSync(
      path.join(this.output, name + "-layer-order.json"),
      JSON.stringify(
        {
          exteriors,
          excluded,
          subjects: readings.length,
          refusedSubjects: refused.length,
          unavailableSubjects: unavailable.length,
          vertices: readings.reduce(
            (total, reading) => total + reading.vertices,
            0,
          ),
          outsideVertices: readings.reduce(
            (total, reading) => total + reading.outsideVertices,
            0,
          ),
          boundaryVertices: readings.reduce(
            (total, reading) => total + reading.boundaryVertices,
            0,
          ),
          largestPairDifferenceMetres: pairs.reduce(
            (largest, pair) => Math.max(largest, pair.differenceMetres),
            0,
          ),
          pairs,
          readings,
          meaning:
            "Vertex signed distance of each internal source part to the named reference sheets on Float32 coordinates; triangle crossings, crossings between parts and rendered appearance are not read here",
        },
        null,
        2,
      ),
    );
    return readings.filter(
      (reading) =>
        reading.refused || !reading.judged || reading.unavailable !== null,
    ).length;
  }

  /** Preserve actual offset observations before refusing an unusable reference. */
  facesOf(positions: number[], exterior?: IHumanBodyLayerExterior, name: string = "evaluated"): IHumanBodyLayerReference[] {
    const surfaces = createHumanBodyLayerSurfaces({
      positions,
      indices: this.skinIndices,
      field: this.field!,
      exterior,
    });
    fs.writeFileSync(
      path.join(this.output, name + "-layer-surface-observations.json"),
      JSON.stringify(surfaces),
    );
    if (HumanBodyAnatomicalLayerWriter.refuses(surfaces))
      throw new Error(
        "Evaluated layer references have unavailable reach or reported offset refusals; observations are retained before signed-sheet use.",
      );
    return [
      {
        name: "body-fascial-face",
        mesh: {
          positions: surfaces.fascia,
          normals: surfaces.normals,
          indices: [...this.skinIndices],
          uvs: null,
          skin: null,
        },
      },
      {
        name: "body-dermal-face",
        mesh: {
          positions: surfaces.dermis,
          normals: surfaces.normals,
          indices: [...this.skinIndices],
          uvs: null,
          skin: null,
        },
      },
    ];
  }

  /**
   * Read the actual final joined source-region skin before fabric partition.
   * The caller supplies the owning pre-partition model in the final Person
   * frame, retaining ground placement, stitching and canonical sample IDs.
   * With no thickness field, its complete paired skin is the reference; with
   * one, the same exterior supplies the original native layer observations.
   */
  facesOfPerson(model: IAutoMovieModel, generation: IAutoMovieHumanPersonGeneration, documentId: string): IHumanBodyLayerReference[] {
    const bodyPartition = generation.body.surfaces.find((surface) => surface.sourcePartition !== undefined)!;
    const facePartition = generation.face.surfaces.find((surface) => surface.sourcePartition !== undefined)!;
    const skinIds = new Set([
      ...bodyPartition.regions.map((region) => "body:" + region.id),
      ...facePartition.regions.map((region) => "face:" + region.id),
    ]);
    const exterior = readHumanBodyLayerExterior({
      domain: humanPhysicalSourceDomain(documentId, generation.id),
      samples: bodyPartition.sourcePartition!.samples,
      meshes: model.parts.filter((part) => skinIds.has(part.id)).map((part) => {
        if (part.geometry.type !== "mesh") throw new Error("Final person skin is not a mesh.");
        return part.geometry.mesh;
      }),
    });
    return this.field === undefined ? [{ name: "person-source-skin", mesh: exterior.mesh }] : this.facesOf(
      exterior.originVertices.flatMap((vertex) => exterior.mesh.positions.slice(vertex * 3, vertex * 3 + 3)),
      exterior,
      "person",
    );
  }

  /**
   * Prepare native layer sources before an anatomical assembly is registered.
   * Inputs are original metre positions, native triangle indices and the
   * basis-addressed thickness field. Bootstrap and registered construction
   * share this offset and refusal archive without a placeholder assembly.
   */
  static writeNative(
    output: string,
    positions: readonly number[],
    skinIndices: readonly number[],
    field: IAutoMovieHumanBodyLayerThicknessField,
    basis: string,
    fieldSha256: string | undefined,
  ): number {
  // Static entry imports and all original input admission above are complete.
  // The remaining synchronous path consumes only the loaded layer/mesh owners;
  // it never constructs a face or lazily imports a source module.
  console.log(
    JSON.stringify({
      stage: "layer-surfaces-inputs-verified",
      pid: process.pid,
      bodyBasis: basis,
      fieldSha256: fieldSha256,
      qualification:
        "Static source modules and original inputs already loaded; remaining layer computation is synchronous on these immutable values",
    }),
  );
  const surfaces = createHumanBodyLayerSurfaces({
    positions: positions,
    indices: skinIndices,
    field,
  });
  fs.writeFileSync(
    path.join(output, "layer-surface-observations.json"),
    JSON.stringify(surfaces),
  );
  const shell = JSON.stringify(
    createHumanBodySubcutaneousShell(surfaces, skinIndices),
  );
  fs.writeFileSync(path.join(output, "subcutaneous-shell.mesh.json"), shell);
  fs.writeFileSync(
    path.join(output, "layer-surfaces.json"),
    JSON.stringify({
      basis: basis,
      fieldSha256: fieldSha256,
      vertices: surfaces.dermis.length / 3,
      beyondReachVertices: surfaces.beyondReachVertices,
      tightestVertex: surfaces.tightestVertex,
      tightestRatio: surfaces.tightestRatio,
      invertedTriangles: surfaces.invertedTriangles,
      dermalInvertedTriangles: surfaces.dermalInvertedTriangles,
      unmeasuredReachVertices: surfaces.unmeasuredReachVertices,
      qualification: surfaces.qualification,
      subcutaneousShellSha256: createHash("sha256").update(shell).digest("hex"),
      dermis: surfaces.dermis,
      fascia: surfaces.fascia,
      meaning:
        "Neutral dermal and fascial faces of the body basis skin by the package's one offset rule; the counts are read, not repaired",
    }),
  );
  console.log(
    JSON.stringify({
      stage: "layer-surfaces",
      vertices: surfaces.dermis.length / 3,
      beyondReachVertices: surfaces.beyondReachVertices,
      tightestRatio: surfaces.tightestRatio,
      invertedTriangles: surfaces.invertedTriangles,
      dermalInvertedTriangles: surfaces.dermalInvertedTriangles,
      unmeasuredReachVertices: surfaces.unmeasuredReachVertices,
      qualification: surfaces.qualification,
    }),
  );
  return HumanBodyAnatomicalLayerWriter.refuses(surfaces) ? 1 : 0;
  }
}
