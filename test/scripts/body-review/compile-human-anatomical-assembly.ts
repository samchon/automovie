/**
 * Compile one complete source-owned coarse assembly through actual consumers.
 *
 * From test/: pnpm exec ttsx -P tsconfig.scripts.json
 * scripts/body-review/compile-human-anatomical-assembly.ts ASSEMBLY PLAN OUTPUT
 * OUTPUT must be a new directory. Its parent may hold the job's logs and
 * input provenance, but no caller reserves OUTPUT in advance. Each attempt
 * owns a fresh archive epoch, including a rejected or partially written run;
 * later attempts use another OUTPUT and preserve the previous artifacts.
 *
 * ASSEMBLY is the source producer's actual typed registered graph/mesh/binding
 * payload. PLAN supplies its original source body/head and actual saved person
 * document. This owning native entry refuses mismatched original source bytes,
 * reference frames, anatomical identities and source geometry digests; it
 * does not invent a rig, clinical pose or source field to make admission pass.
 * One job constructs the complete body/person through the normal person owner,
 * preserving its original admission alongside every part before quality checks.
 * Typed split inputs, model archives, numerical documents and static readback
 * retain rejected construction as rejected. Canonical shared
 * publication and current-source GPU observation remain separate owners.
 * Each model archive also retains the same build's returned rig placements;
 * static vertices never substitute for the missing rest/posed state.
 * Structured progress records retain actual completed body, face and person
 * stages. A thrown stage has no fabricated completion or timer heartbeat.
 *
 * Whole-person construction also writes body-joint-centres.json, the registered
 * anatomical joint centres beside the rig landmarks, and body-layer-order.json
 * and person-layer-order.json: the signed distance of each internal source part
 * to its bounding layer, read by the package's own layer-order reader on
 * the geometry this job built. The optional stage layer-order ends the job
 * after those readings, before static export, and exits nonzero when any
 * part has an outside vertex or an unavailable side observation. Every stage
 * preserves reported layer refusals in its exit status; none proves global
 * containment from vertex-only non-refusal.
 *
 * An optional fifth argument names a layer thickness field for the body
 * basis (pass the stage, or full, before it). With it the bounding layer is
 * the fascial face the package derives from the constructed skin, and the
 * subcutaneous member, which lies outside that face by definition, is not
 * read against it. Without it the bounding layer is the skin. The stage
 * layer-surfaces writes the neutral dermal and fascial faces and the
 * subcutaneous shell of the plan's body basis for the offline registration
 * producer, which consumes them instead of recomputing the offset.
 * An optional sixth argument names a JSON record of shape channel weights
 * for the document, to read the same layer order on a shaped body.
 * The body-only stage uses the normal body builder with the actual paired
 * generation's endpoint source. It retains all anatomical parts and static
 * readback without constructing the face. Its body skin has no head skin,
 * so cranial containment and complete person appearance stay unverified.
 * This stage writes body-layer-order.json and body readback; joint centres
 * and person-layer-order.json belong to whole-person construction.
 */
import {
  inspectAutoMovieMeshTopology,
  validateMeshTopology,
  validateModel,
} from "@automovie/engine";
import type { IAutoMovieHumanBodySourceRig } from "@automovie/human/body/anatomy/articulation/rig/IAutoMovieHumanBodySourceRig";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { AutoMovieHumanBodyPartId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyPartId";
import type { IAutoMovieHumanBodyLayerThicknessField } from "@automovie/human/body/anatomy/layer/IAutoMovieHumanBodyLayerThicknessField";
import type { IHumanBodyLayerReference } from "@automovie/human/body/anatomy/layer/IHumanBodyLayerReference";
import type { IHumanBodyLayerSurfaces } from "@automovie/human/body/anatomy/layer/IHumanBodyLayerSurfaces";
import { createHumanBodyLayerSurfaces } from "@automovie/human/body/anatomy/layer/createHumanBodyLayerSurfaces";
import { createHumanBodySubcutaneousShell } from "@automovie/human/body/anatomy/layer/createHumanBodySubcutaneousShell";
import { readHumanBodyLayerOrder } from "@automovie/human/body/anatomy/layer/readHumanBodyLayerOrder";
import { createHumanBodyBasisBuilder } from "@automovie/human/body/basis/createHumanBodyBasisBuilder";
import { createHumanBodyAssemblyExportQualification } from "@automovie/human/body/export/createHumanBodyAssemblyExportQualification";
import { createHumanBodyAtlasExportQualification } from "@automovie/human/body/export/createHumanBodyAtlasExportQualification";
import { exportHumanBody } from "@automovie/human/body/export/exportHumanBody";
import { readHumanBodyAssemblyAssetCorrespondence } from "@automovie/human/body/export/readHumanBodyAssemblyAssetCorrespondence";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "@automovie/human/body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanGltfExport } from "@automovie/human/common/export/IAutoMovieHumanGltfExport";
import { gltfMaterialExtensions } from "@automovie/human/common/export/gltfMaterialExtensions";
import { createHumanFaceOralExportQualification } from "@automovie/human/face/export/createHumanFaceOralExportQualification";
import { createHumanPersonBodyEndpointSource } from "@automovie/human/human/build/createHumanPersonBodyEndpointSource";
import { createHumanPersonGenerationBuilder } from "@automovie/human/human/build/createHumanPersonGenerationBuilder";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import { deriveHumanPersonBody } from "@automovie/human/human/document/deriveHumanPersonBody";
import { parseHumanPersonDocument } from "@automovie/human/human/document/parseHumanPersonDocument";
import { serializeHumanPersonDocument } from "@automovie/human/human/document/serializeHumanPersonDocument";
import { exportHumanPerson } from "@automovie/human/human/export/exportHumanPerson";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import type { IAutoMovieModel } from "@automovie/interface";
import { WebIO } from "@gltf-transform/core";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import typia from "typia";

import type { IHumanBodyAnatomicalCompilePlan } from "./IHumanBodyAnatomicalCompilePlan";
import { createHumanBodyConstructionProgressObservers } from "./createHumanBodyConstructionProgressObservers";
import { writeHumanBodyConstructionRigReading } from "./writeHumanBodyConstructionRigReading";

const [assemblyFile, planFile, output, stage, layerFieldFile, shapeFile] =
  process.argv.slice(2);
if (!assemblyFile || !planFile || !output)
  throw new Error("Expected ASSEMBLY PLAN OUTPUT.");
if (
  stage !== undefined &&
  stage !== "source-admission" &&
  stage !== "layer-order" &&
  stage !== "layer-surfaces" &&
  stage !== "body-only" &&
  stage !== "full"
)
  throw new Error(
    "The optional production stage is source-admission, layer-surfaces, layer-order, body-only or full.",
  );
if (stage === "layer-surfaces" && layerFieldFile === undefined)
  throw new Error("The layer-surfaces stage needs a layer thickness field.");
// Only the parent is reusable. Exclusive creation refuses an existing epoch
// before any input or archive record can be replaced by this attempt.
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.mkdirSync(output);
const planBytes = fs.readFileSync(planFile);
const plan = typia.assertEquals<IHumanBodyAnatomicalCompilePlan>(
  JSON.parse(planBytes.toString("utf8")),
);
const resolve = (file: string): string =>
  path.resolve(path.dirname(planFile), file);
const hash = (bytes: string | Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");
const headBytes = fs.readFileSync(resolve(plan.headView));
const originalBodyBytes = fs.readFileSync(resolve(plan.bodyView));
const head = typia.assertEquals<IAutoMovieHumanPersonHeadView>(
  JSON.parse(gunzipSync(headBytes).toString("utf8")),
);
const body = typia.assertEquals<IAutoMovieHumanPersonBodyView>(
  JSON.parse(gunzipSync(originalBodyBytes).toString("utf8")),
);
const assemblyBytes = fs.readFileSync(assemblyFile);
const originalAssembly =
  typia.assertEquals<IAutoMovieHumanBodyAnatomicalAssembly>(
    JSON.parse(assemblyBytes.toString("utf8")),
  );
const originalRig = typia.assertEquals<IAutoMovieHumanBodySourceRig>(
  JSON.parse(fs.readFileSync(resolve(plan.rig), "utf8")),
);
if (JSON.stringify(originalRig) !== JSON.stringify(originalAssembly.rig))
  throw new Error("Actual rig input differs from the assembled source graph.");
const originalSourceHashes = new Set<string>();
const preparation: unknown = JSON.parse(
  fs.readFileSync(resolve(plan.sourcePreparationReceipt), "utf8"),
);
if (
  preparation === null ||
  typeof preparation !== "object" ||
  !("sourceGaps" in preparation) ||
  !Array.isArray(preparation.sourceGaps)
)
  throw new Error(
    "Actual source preparation needs its complete source-member refusal population.",
  );
const sourceRefusals: unknown[] = preparation.sourceGaps;
for (const source of plan.rawInputs) {
  const digest = hash(fs.readFileSync(resolve(source.file)));
  if (digest !== source.sha256.toLowerCase())
    throw new Error("Original anatomical source bytes differ: " + source.file);
  originalSourceHashes.add(digest);
}
if (
  originalAssembly.basis !== body.body.id ||
  originalAssembly.generation !== originalAssembly.rig.generation
)
  throw new Error(
    "Source assembly is not registered to the actual original body view.",
  );
if (JSON.stringify(originalAssembly.shape) !== JSON.stringify(plan.shape))
  throw new Error(
    "Source assembly plan differs from its actual registered shape.",
  );
const declared = new Set(typia.reflect.literals<AutoMovieHumanBodyPartId>());
const ids = originalAssembly.parts.map((part) => part.id);
if (new Set(ids).size !== ids.length || ids.some((id) => !declared.has(id)))
  throw new Error("Source assembly repeats or invents an anatomical owner.");
for (const part of originalAssembly.parts)
  for (const surface of part.surfaces)
    if (
      !originalSourceHashes.has(surface.source.sha256.toLowerCase()) ||
      hash(JSON.stringify(surface.mesh)) !==
        surface.compiledMeshSha256.toLowerCase()
    )
      throw new Error(
        "Registered source mesh identity differs: " +
          part.id +
          "/" +
          surface.id,
      );

const candidateId =
  body.body.id +
  "/anatomical-" +
  hash(
    JSON.stringify({
      originalBody: hash(JSON.stringify(body.body)),
      assembly: hash(assemblyBytes),
      plan: hash(planBytes),
    }),
  ).slice(0, 16);
const assembly = { ...originalAssembly, basis: candidateId };
const candidate: IAutoMovieHumanBodyBasis = {
  ...body.body,
  id: candidateId,
  anatomicalAssembly: assembly,
};
// A derived atlas consumer cannot silently change any original skin, rig,
// shape, material or source correspondence row while inheriting its source ID.
const restore = { ...candidate, id: body.body.id };
delete restore.anatomicalAssembly;
const original = { ...body.body };
delete original.anatomicalAssembly;
if (JSON.stringify(restore) !== JSON.stringify(original))
  throw new Error(
    "Derived source assembly altered the original skin/rig/shape payload.",
  );
const person = parseHumanPersonDocument(
  fs.readFileSync(resolve(plan.personDocument), "utf8"),
  originalAssembly,
);
if (person.face.basis !== head.face.id || person.body.basis !== body.body.id)
  throw new Error(
    "Actual saved person document does not name the source head/body.",
  );
// An optional sixth argument gives the document a shape of its own: named
// channel weights away from the registered shape, which only an assembly
// that declares an exterior binding admits. The assembly itself is unchanged.
const documentShape =
  shapeFile === undefined
    ? plan.shape
    : typia.assertEquals<Record<string, number>>(
        JSON.parse(fs.readFileSync(shapeFile, "utf8")),
      );
person.body = {
  ...person.body,
  basis: candidateId,
  shape: { ...documentShape },
  anatomicalInspection: undefined,
};
const saved = serializeHumanPersonDocument(person, assembly);
const document = parseHumanPersonDocument(saved, assembly);
const bodyDocument: IAutoMovieHumanBodyBasisDocument = document.body;
fs.writeFileSync(
  path.join(output, "candidate-body.basis.json.gz"),
  gzipSync(JSON.stringify(candidate)),
);
fs.writeFileSync(path.join(output, "person-document.json"), saved);
fs.writeFileSync(
  path.join(output, "body-document.json"),
  JSON.stringify(bodyDocument, null, 2),
);
// The existing viewer tuple reader consumes each complete typed partition;
// joining both into one JSON string would exceed the runtime string limit.
const bodyBytes = gzipSync(JSON.stringify({ ...body, body: candidate }));
fs.writeFileSync(path.join(output, "whole-neutral.head.json.gz"), headBytes);
fs.writeFileSync(path.join(output, "whole-neutral.body.json.gz"), bodyBytes);
fs.writeFileSync(path.join(output, "whole-neutral.json"), saved);
fs.writeFileSync(
  path.join(output, "viewer-split-receipt.json"),
  JSON.stringify(
    {
      generation: body.id,
      bodyBasis: candidateId,
      faceBasis: head.face.id,
      headSha256: hash(headBytes),
      bodySha256: hash(bodyBytes),
      documentSha256: hash(saved),
      originalBodySha256: hash(originalBodyBytes),
      sourceAssemblySha256: hash(assemblyBytes),
      meaning:
        "Actual complete typed construction inputs; runtime admission and rendered acceptance remain separate",
    },
    null,
    2,
  ),
);
const layerFieldBytes =
  layerFieldFile === undefined ? undefined : fs.readFileSync(layerFieldFile);
const layerFieldSha256 =
  layerFieldBytes === undefined ? undefined : hash(layerFieldBytes);
const layerField =
  layerFieldBytes === undefined
    ? undefined
    : typia.assertEquals<IAutoMovieHumanBodyLayerThicknessField>(
        JSON.parse(layerFieldBytes.toString("utf8")),
      );
if (layerField !== undefined && layerField.basis !== body.body.id)
  throw new Error("Layer thickness field addresses another body basis.");
const skinIndices = body.body.surfaces[0].indices;

/** Limited offset conditions must all be observed and non-refusing before use. */
function layerSurfaceRefuses(surfaces: IHumanBodyLayerSurfaces): boolean {
  return (
    surfaces.beyondReachVertices > 0 ||
    surfaces.unmeasuredReachVertices > 0 ||
    surfaces.invertedTriangles > 0 ||
    surfaces.dermalInvertedTriangles > 0
  );
}

if (stage === "layer-surfaces") {
  // Static entry imports and all original input admission above are complete.
  // The remaining synchronous path consumes only the loaded layer/mesh owners;
  // it never constructs a face or lazily imports a source module.
  console.log(
    JSON.stringify({
      stage: "layer-surfaces-inputs-verified",
      pid: process.pid,
      bodyBasis: body.body.id,
      fieldSha256: layerFieldSha256,
      qualification:
        "Static source modules and original inputs already loaded; remaining layer computation is synchronous on these immutable values",
    }),
  );
  const surfaces = createHumanBodyLayerSurfaces({
    positions: body.body.surfaces[0].positions,
    indices: skinIndices,
    field: layerField!,
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
      basis: body.body.id,
      fieldSha256: layerFieldSha256,
      vertices: surfaces.dermis.length / 3,
      beyondReachVertices: surfaces.beyondReachVertices,
      tightestVertex: surfaces.tightestVertex,
      tightestRatio: surfaces.tightestRatio,
      invertedTriangles: surfaces.invertedTriangles,
      dermalInvertedTriangles: surfaces.dermalInvertedTriangles,
      unmeasuredReachVertices: surfaces.unmeasuredReachVertices,
      qualification: surfaces.qualification,
      subcutaneousShellSha256: hash(shell),
      dermis: surfaces.dermis,
      fascia: surfaces.fascia,
      meaning:
        "Neutral dermal and fascial faces of the body basis skin by the package's one offset rule; the counts are read, not repaired",
    }),
  );
  console.log(
    JSON.stringify({
      stage,
      vertices: surfaces.dermis.length / 3,
      beyondReachVertices: surfaces.beyondReachVertices,
      tightestRatio: surfaces.tightestRatio,
      invertedTriangles: surfaces.invertedTriangles,
      dermalInvertedTriangles: surfaces.dermalInvertedTriangles,
      unmeasuredReachVertices: surfaces.unmeasuredReachVertices,
      qualification: surfaces.qualification,
    }),
  );
  process.exit(layerSurfaceRefuses(surfaces) ? 1 : 0);
}
const sourceAdmission = originalAssembly.parts.flatMap((part) =>
  part.surfaces.map((surface) => ({
    part: part.id,
    member: surface.id,
    originalBytesSha256: surface.source.sha256,
    registeredSourceMeshSha256: surface.compiledMeshSha256,
    vertices: surface.mesh.positions.length / 3,
    triangles: (surface.mesh.indices?.length ?? 0) / 3,
    topology: inspectAutoMovieMeshTopology(surface.mesh),
    closedResidentAdmission: validateMeshTopology({
      mesh: surface.mesh,
      expectClosed: true,
    }),
  })),
);
fs.writeFileSync(
  path.join(output, "source-admission.json"),
  JSON.stringify(
    {
      assemblyDigest: hash(assemblyBytes),
      node: {
        version: process.version,
        executable: process.execPath,
        pid: process.pid,
      },
      members: sourceAdmission,
    },
    null,
    2,
  ),
);
if (stage === "source-admission") {
  const failures = sourceAdmission.filter(
    (source) => !source.closedResidentAdmission.success,
  );
  console.log(
    JSON.stringify({
      stage,
      observedMembers: sourceAdmission.length,
      refusedMembers: failures.map((source) => ({
        part: source.part,
        member: source.member,
        violations: source.closedResidentAdmission.success
          ? 0
          : source.closedResidentAdmission.violations.length,
      })),
    }),
  );
  process.exitCode = failures.length === 0 ? 0 : 1;
} else {
  function writeAsset(name: string, asset: IAutoMovieHumanGltfExport): void {
    const directory = path.resolve(output, name);
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
  function writeConstructedModel(name: string, model: IAutoMovieModel): void {
    const directory = path.join(output, "constructed-" + name + "-model");
    fs.mkdirSync(directory, { recursive: true });
    const records = model.parts.map((part, index) => {
      const file = String(index).padStart(4, "0") + ".json.gz";
      const bytes = gzipSync(JSON.stringify(part));
      fs.writeFileSync(path.join(directory, file), bytes);
      return { index, id: part.id, file, sha256: hash(bytes) };
    });
    const { parts: _parts, ...metadata } = model;
    const metadataBytes = gzipSync(JSON.stringify(metadata));
    fs.writeFileSync(path.join(directory, "model.json.gz"), metadataBytes);
    fs.writeFileSync(
      path.join(directory, "manifest.json"),
      JSON.stringify(
        {
          modelSha256: hash(metadataBytes),
          parts: records,
          meaning:
            "Complete actual model metadata and ordered parts, individually serialized without dropping geometry; admission remains separate",
        },
        null,
        2,
      ),
    );
  }

  /**
   * Read every internal source part against the constructed skin and report the
   * paired left and right parts side by side. Boundary classification uses an
   * authored numerical reading tolerance of one micrometre. This convention
   * is separate from Float32 coordinate spacing and anatomical thickness.
   */
  function writeLayerOrder(
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
      assembly.parts.map((part) => [part.id, part.tissue]),
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
      layerField === undefined
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
      path.join(output, name + "-layer-order.json"),
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

  async function readback(
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
          output,
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
      glbSha256: hash(bytes),
      sourceMembers: readings,
      qualification:
        "actual static source interval and Float32 replay only; anatomy/clearance/GPU not certified",
    };
  }

  function skinOf(
    model: IAutoMovieModel,
    id: string,
  ): IHumanBodyLayerReference {
    const part = model.parts.find((candidate) => candidate.id === id);
    if (part === undefined || part.geometry.type !== "mesh")
      throw new Error("Constructed model has no skin mesh " + id);
    return { name: id, mesh: part.geometry.mesh };
  }

  /** Preserve actual offset observations before refusing an unusable reference. */
  function facesOf(positions: number[]): IHumanBodyLayerReference[] {
    const surfaces = createHumanBodyLayerSurfaces({
      positions,
      indices: skinIndices,
      field: layerField!,
    });
    fs.writeFileSync(
      path.join(output, "evaluated-layer-surface-observations.json"),
      JSON.stringify(surfaces),
    );
    if (layerSurfaceRefuses(surfaces))
      throw new Error(
        "Evaluated layer references have unavailable reach or reported offset refusals; observations are retained before signed-sheet use.",
      );
    return [
      {
        name: "body-fascial-face",
        mesh: {
          positions: surfaces.fascia,
          normals: surfaces.normals,
          indices: skinIndices,
          uvs: null,
          skin: null,
        },
      },
      {
        name: "body-dermal-face",
        mesh: {
          positions: surfaces.dermis,
          normals: surfaces.normals,
          indices: skinIndices,
          uvs: null,
          skin: null,
        },
      },
    ];
  }

  /** Write the actual body through the shared static exporter and readback. */
  async function writeBodyAsset(
    build: IAutoMovieHumanBodyBuild,
  ): Promise<void> {
    const validation = validateModel({ model: build.model });
    fs.writeFileSync(
      path.join(output, "body-model-admission.json"),
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
      path.join(output, "body-source-quantities.json"),
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
    writeAsset("body", asset);
    fs.writeFileSync(
      path.join(output, "body-readback.json"),
      JSON.stringify(await readback(asset.glb, build.model, ""), null, 2),
    );
  }

  void (async () => {
    if (
      plan.mode === "neutral-only" &&
      (assembly.mode !== "neutral-only" ||
        Object.keys(document.face.expression).length !== 0 ||
        document.face.oral?.performance !== undefined ||
        Object.values(document.face.skinRelief?.regions ?? {}).some(
          (region) => region?.performance !== undefined,
        ))
    )
      throw new Error(
        "Whole-person neutral compilation requires the explicit neutral source and owner-neutral face expression, oral and regional performance omission.",
      );
    const generation = joinHumanPersonGeneration(head, {
      ...body,
      body: candidate,
    });
    const progress = createHumanBodyConstructionProgressObservers(generation);
    if (stage === "body-only") {
      const build = createHumanBodyBasisBuilder(candidate, {
        physicalSource: "source-partition",
        endpointSource: createHumanPersonBodyEndpointSource(generation),
        observeProgress: progress.observeBodyConstructionProgress,
      })(
        deriveHumanPersonBody({ document, faceMaterials: head.face.materials }),
      );
      writeConstructedModel("body", build.model);
      writeHumanBodyConstructionRigReading({
        directory: path.join(output, "constructed-body-model"),
        generation: generation.id,
        sourceAssemblySha256: hash(assemblyBytes),
        body: build,
      });
      fs.writeFileSync(
        path.join(output, "normal-body-construction.json"),
        JSON.stringify(
          {
            node: {
              version: process.version,
              executable: process.execPath,
              pid: process.pid,
            },
            generation: generation.id,
            candidateId,
            sourceAssemblySha256: hash(assemblyBytes),
            bodyParts: build.model.parts.map((part) => part.id),
            actualSourceIds: ids,
            originalMemberRefusals: sourceRefusals,
            qualification:
              "Normal body construction with the actual same-generation head endpoint context; complete face, head skin, whole exterior binding and person admission not constructed",
          },
          null,
          2,
        ),
      );
      const faces =
        layerField === undefined
          ? undefined
          : facesOf(build.posedSurfaces[0].positions);
      const refused = writeLayerOrder(
        "body",
        build.model,
        [faces?.[0] ?? skinOf(build.model, "Human/skin")],
        "anatomical-source:",
        faces === undefined ? undefined : [faces[1]],
      );
      await writeBodyAsset(build);
      console.log(
        JSON.stringify({
          stage,
          candidateId,
          bodyParts: build.model.parts.length,
          sourceMembers: build.model.parts.filter((part) =>
            part.id.startsWith("anatomical-source:"),
          ).length,
          bodyLayerRefusals: refused,
          qualification:
            "Body unit only; missing head skin and person assembly are unverified",
        }),
      );
      process.exitCode = refused === 0 ? 0 : 1;
      return;
    }
    const personBuild =
      createHumanPersonGenerationBuilder(progress).construct(document);
    const bodyBuild = personBuild.body;
    fs.writeFileSync(
      path.join(output, "normal-construction.json"),
      JSON.stringify(
        {
          node: {
            version: process.version,
            executable: process.execPath,
            pid: process.pid,
          },
          generation: generation.id,
          candidateId,
          sourceAssemblySha256: hash(assemblyBytes),
          declaredParts: declared.size,
          actualSourceIds: ids,
          mode: plan.mode ?? "articulated",
          originalMemberRefusals: sourceRefusals,
          bodyParts: bodyBuild.model.parts.map((part) => part.id),
          personParts: personBuild.model.parts.map((part) => part.id),
          admission: personBuild.admission,
          meaning:
            "Complete normal person construction; rejected admission remains rejected and quality checks follow",
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({
        stage: "normal-construction",
        candidateId,
        actualParts: ids.length,
        bodyParts: bodyBuild.model.parts.length,
        personParts: personBuild.model.parts.length,
        admission: personBuild.admission,
      }),
    );
    writeConstructedModel("body", bodyBuild.model);
    writeConstructedModel("person", personBuild.model);
    writeHumanBodyConstructionRigReading({
      directory: path.join(output, "constructed-body-model"),
      generation: generation.id,
      sourceAssemblySha256: hash(assemblyBytes),
      body: bodyBuild,
    });
    writeHumanBodyConstructionRigReading({
      directory: path.join(output, "constructed-person-model"),
      generation: generation.id,
      sourceAssemblySha256: hash(assemblyBytes),
      body: bodyBuild,
      person: personBuild,
    });
    // The fascial face is derived from the skin this construction evaluated,
    // in its native vertex order, by the same function the registration read.
    const bodyFaces =
      layerField === undefined
        ? undefined
        : facesOf(bodyBuild.posedSurfaces[0].positions);
    // bodyBuild is personBuild.body: both references consume this exact output.
    const personFaces = bodyFaces;
    const faceSkin = skinOf(personBuild.model, "face:Human/skin");
    const bodyLayerRefusals = writeLayerOrder(
      "body",
      bodyBuild.model,
      [bodyFaces?.[0] ?? skinOf(bodyBuild.model, "Human/skin")],
      "anatomical-source:",
      bodyFaces === undefined ? undefined : [bodyFaces[1]],
    );
    const personLayerRefusals = writeLayerOrder(
      "person",
      personBuild.model,
      [
        faceSkin,
        personFaces?.[0] ?? skinOf(personBuild.model, "body:Human/skin"),
      ],
      "body:anatomical-source:",
      personFaces === undefined ? undefined : [faceSkin, personFaces[1]],
    );
    // Registered anatomical joint centres beside the rig landmarks they are
    // named for: the rig pivots the skin about its landmark, a bone turns about
    // its own centre, and the distance between the two is what a later motion
    // stage has to reconcile. Neither is moved here.
    const jointCentres = [...(bodyBuild.anatomicalRig?.sites ?? [])].flatMap(
      ([bone, sites]) =>
        [...sites]
          .filter(
            ([site]) =>
              site.startsWith("registeredJointCentre:") &&
              bodyBuild.landmarks[
                site.slice("registeredJointCentre:".length)
              ] !== undefined,
          )
          .map(([site, centre]) => {
            const landmark = site.slice("registeredJointCentre:".length);
            const pivot = bodyBuild.landmarks[landmark];
            return {
              bone,
              landmark,
              registeredCentreMetres: centre,
              rigLandmarkMetres: pivot,
              offsetMetres: {
                x: centre.x - pivot.x,
                y: centre.y - pivot.y,
                z: centre.z - pivot.z,
              },
              distanceMetres: Math.hypot(
                centre.x - pivot.x,
                centre.y - pivot.y,
                centre.z - pivot.z,
              ),
            };
          }),
    );
    fs.writeFileSync(
      path.join(output, "body-joint-centres.json"),
      JSON.stringify(
        {
          joints: jointCentres,
          meaning:
            "Atlas joint centres under each bone's registered similarity against the target rig's skinning landmarks; authored geometric conventions, not functional joint centres",
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({
        stage: "layer-order",
        bodyLayerRefusals,
        personLayerRefusals,
      }),
    );
    if (stage === "layer-order") {
      process.exitCode =
        bodyLayerRefusals === 0 && personLayerRefusals === 0 ? 0 : 1;
      return;
    }
    await writeBodyAsset(bodyBuild);
    fs.writeFileSync(
      path.join(output, "person-source-quantities.json"),
      JSON.stringify(personBuild.body.anatomicalQuantities ?? [], null, 2),
    );
    const personAsset = await exportHumanPerson(
      personBuild.model,
      await createHumanBodyAtlasExportQualification(
        candidate,
        personBuild.body.evaluatedDocument,
        "body:",
      ),
      await createHumanBodyAssemblyExportQualification(
        candidate,
        personBuild.body.evaluatedDocument,
        "body:",
      ),
      await createHumanFaceOralExportQualification(
        head.face,
        document.face,
        personBuild.model,
        "face:",
      ),
    );
    writeAsset("person", personAsset);
    fs.writeFileSync(
      path.join(output, "person-readback.json"),
      JSON.stringify(
        await readback(personAsset.glb, personBuild.model, "body:"),
        null,
        2,
      ),
    );
    fs.writeFileSync(
      path.join(output, "source-receipt.json"),
      JSON.stringify(
        {
          candidateId,
          constructionAdmission: personBuild.admission,
          mode: plan.mode ?? "articulated",
          motionSupport:
            plan.mode === "neutral-only"
              ? "unregistered; static held rest only"
              : "source registered",
          originalGeneration: body.id,
          originalBodyBasis: body.body.id,
          originalBodyDigest: hash(JSON.stringify(body.body)),
          originalHeadDigest: hash(JSON.stringify(head)),
          assemblyDigest: hash(assemblyBytes),
          declaredIds: [...declared],
          actualSourceIds: ids,
          namedSourceGaps: [...declared].filter((id) => !ids.includes(id)),
          originalMemberRefusals: sourceRefusals,
          clinical: "unavailable",
          renderedObservation: "not-observed",
          sourceMeaning:
            "derived coarse source inspection, not canonical generation publication",
        },
        null,
        2,
      ),
    );
    process.exitCode =
      personBuild.admission.accepted &&
      bodyLayerRefusals === 0 &&
      personLayerRefusals === 0
        ? 0
        : 1;
    console.log(
      JSON.stringify({
        candidateId,
        constructionAdmission: personBuild.admission,
        declaredParts: declared.size,
        actualParts: ids.length,
        bodySourceMembers: bodyBuild.model.parts.filter((part) =>
          part.id.startsWith("anatomical-source:"),
        ).length,
        personSourceMembers: personBuild.model.parts.filter((part) =>
          part.id.startsWith("body:anatomical-source:"),
        ).length,
      }),
    );
  })().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
