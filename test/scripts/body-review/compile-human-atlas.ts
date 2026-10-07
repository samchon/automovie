/**
 * Compile acquired atlas bones as explicit reference-only body resources.
 *
 * From test/: pnpm exec ttsx -P tsconfig.scripts.json
 * scripts/body-review/compile-human-atlas.ts PLAN BODY_VIEW OUTPUT
 *
 * BODY_VIEW is the actual source generation's body envelope. No published
 * generation is modified. Outputs are local candidate resources and a body
 * candidate basis for the current resident viewer. A group's anchor bbox
 * centre is translated to its reference carrier head, after the plan's signed
 * axis permutation and mm-to-m conversion. This is authored placement only,
 * not a bone landmark correspondence, cartilage fit or clinical registration.
 * Original faces, dimensions and adjacent parts' relative positions survive.
 */
import type { IAutoMovieHumanBodyAtlasPartResource } from "@automovie/human/body/anatomy/atlas/IAutoMovieHumanBodyAtlasPartResource";
import { createHumanBodyBasisBuilder } from "@automovie/human/body/basis/createHumanBodyBasisBuilder";
import { createHumanBodyAtlasExportQualification } from "@automovie/human/body/export/createHumanBodyAtlasExportQualification";
import { exportHumanBody } from "@automovie/human/body/export/exportHumanBody";
import { readHumanBodyAtlasAssetCorrespondence } from "@automovie/human/body/export/readHumanBodyAtlasAssetCorrespondence";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";
import { gltfMaterialExtensions } from "@automovie/human/common/export/gltfMaterialExtensions";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";
import { WebIO } from "@gltf-transform/core";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import typia from "typia";

import type { IHumanBodyAtlasCompilePlan } from "./IHumanBodyAtlasCompilePlan";
import { readHumanBodyAtlasObj } from "./readHumanBodyAtlasObj";

const [planFile, bodyFile, output] = process.argv.slice(2);
if (!planFile || !bodyFile || !output)
  throw new Error("Expected PLAN BODY_VIEW OUTPUT.");
const plan = typia.assertEquals<IHumanBodyAtlasCompilePlan>(
  JSON.parse(fs.readFileSync(planFile, "utf8")),
);
const decoded: unknown = JSON.parse(
  gunzipSync(fs.readFileSync(bodyFile)).toString("utf8"),
);
// Exact body payload admission happens in the real builder; the source envelope
// is not itself a person-authoring document.
const envelope = decoded as Record<string, unknown>;
const basis = typia.assertEquals<IAutoMovieHumanBodyBasis>(
  envelope.body ?? decoded,
);
const reference = createHumanBodyBasisBuilder(basis)({
  id: "atlas-reference",
  name: "Atlas reference registration",
  basis: basis.id,
  shape: {},
});
if (new Set(plan.parts.map((part) => part.id)).size !== plan.parts.length)
  throw new Error("Atlas plan repeats a part.");
if (
  new Set(plan.axes.map(Math.abs)).size !== 3 ||
  plan.axes.some(
    (axis) =>
      !Number.isInteger(axis) || Math.abs(axis) < 1 || Math.abs(axis) > 3,
  )
)
  throw new Error(
    "Atlas axis convention must be a signed permutation of 1, 2, 3.",
  );
const converted = new Map<string, IAutoMovieMesh>();
const originals = new Map<string, Buffer>();
for (const part of plan.parts) {
  const bytes = fs.readFileSync(
    path.resolve(path.dirname(planFile), part.file),
  );
  const text = bytes.toString("utf8");
  if (
    !text.includes("# Concept ID : " + part.identity) ||
    !text.includes("# File ID : " + part.fileId)
  )
    throw new Error("Atlas source identity differs: " + part.id);
  originals.set(part.id, bytes);
  const mesh = readHumanBodyAtlasObj(text);
  const permute = (values: number[], scale: number): number[] => {
    const result: number[] = [];
    for (let at = 0; at < values.length; at += 3)
      for (const axis of plan.axes)
        result.push(values[at + Math.abs(axis) - 1] * Math.sign(axis) * scale);
    return result;
  };
  const normals = permute(mesh.normals!, 1);
  // OBJ decimal normals are rounded directions. Unit normalization is part
  // of this offline source conversion; the shared NORMAL gate stays intact.
  for (let at = 0; at < normals.length; at += 3) {
    const length = Math.hypot(normals[at], normals[at + 1], normals[at + 2]);
    if (!(length > 0))
      throw new Error("Atlas OBJ has no normal direction: " + part.id);
    for (let axis = 0; axis < 3; axis++) normals[at + axis] /= length;
  }
  converted.set(part.id, {
    ...mesh,
    positions: permute(mesh.positions, 0.001),
    normals,
  });
}
const inversions = plan.axes.reduce(
  (total, axis, at) =>
    total +
    plan.axes.slice(at + 1).filter((next) => Math.abs(axis) > Math.abs(next))
      .length,
  0,
);
if (
  (inversions % 2 === 0 ? 1 : -1) *
    plan.axes.reduce((product, axis) => product * Math.sign(axis), 1) !==
  1
)
  throw new Error(
    "Atlas axis conversion must preserve the declared right-handed frame.",
  );
const sha256 = (bytes: string | Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");
const compiler = "reference-atlas-compiler/1";
const candidateId =
  basis.id +
  "/atlas-" +
  sha256(
    JSON.stringify({
      compiler,
      basis,
      plan,
      sources: [...originals].map(([id, bytes]) => [id, sha256(bytes)]),
    }),
  ).slice(0, 16);
const resources: IAutoMovieHumanBodyAtlasPartResource[] = [];
fs.mkdirSync(output, { recursive: true });
for (const part of plan.parts) {
  const group = plan.parts.filter((one) => one.group === part.group);
  if (
    group.some(
      (one) => one.anchorPart !== part.anchorPart || one.bone !== part.bone,
    )
  )
    throw new Error(
      "Atlas placement group disagrees about its shared anchor or carrier: " +
        part.group,
    );
  const anchor = converted.get(part.anchorPart);
  const carrier = reference.bones.find((one) => one.bone === part.bone);
  if (
    anchor === undefined ||
    carrier === undefined ||
    !group.some((one) => one.id === part.anchorPart)
  )
    throw new Error(
      "Atlas placement needs its acquired anchor and actual rig carrier: " +
        part.id,
    );
  const center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const [axis, key] of (["x", "y", "z"] as const).entries()) {
    const values = anchor.positions.filter((_, at) => at % 3 === axis);
    center[key] = (Math.min(...values) + Math.max(...values)) / 2;
  }
  const mesh = structuredClone(converted.get(part.id)!);
  for (let at = 0; at < mesh.positions.length; at += 3) {
    mesh.positions[at] += carrier.rest.position.x - center.x;
    mesh.positions[at + 1] += carrier.rest.position.y - center.y;
    mesh.positions[at + 2] += carrier.rest.position.z - center.z;
  }
  const resource: IAutoMovieHumanBodyAtlasPartResource = {
    id: part.id,
    source: {
      uri: plan.uri,
      revision: plan.revision,
      sha256: sha256(originals.get(part.id)!),
      license: plan.license,
      licenseUri: plan.licenseUri,
      attribution: plan.attribution,
      anatomicalIdentity: `${part.identity}/${part.fileId}`,
      acquisition:
        plan.acquisition +
        " Original nongeometry OBJ labels: " +
        originals
          .get(part.id)!
          .toString("utf8")
          .split(/\r?\n/)
          .filter((line) => /^(g|usemtl) /.test(line))
          .join("; ") +
        ". Rounded normal directions normalized by " +
        compiler +
        ".",
    },
    registration: {
      basis: candidateId,
      bone: part.bone,
      reference: structuredClone(carrier.rest),
      shape: {},
      protocol: `${plan.registrationProtocol} Anchor ${part.anchorPart} bbox centre ${JSON.stringify(center)}m to ${part.bone} reference rig head ${JSON.stringify(carrier.rest.position)}m; one translation for group ${part.group}. Source body ${basis.id}; body digest ${sha256(JSON.stringify(basis))}; compiler ${compiler}.`,
      qualification: "authored-reference-only",
    },
    mesh,
    compiledMeshSha256: sha256(JSON.stringify(mesh)),
  };
  const resourceFile = path.join(output, part.id + ".json");
  fs.writeFileSync(resourceFile, JSON.stringify(resource) + "\n");
  const readback = typia.assertEquals<IAutoMovieHumanBodyAtlasPartResource>(
    JSON.parse(fs.readFileSync(resourceFile, "utf8")),
  );
  if (sha256(JSON.stringify(readback.mesh)) !== resource.compiledMeshSha256)
    throw new Error(
      "Compiled atlas mesh readback identity differs: " + part.id,
    );
  resources.push(readback);
  console.log(
    part.id,
    mesh.positions.length / 3,
    "vertices",
    mesh.indices!.length / 3,
    "triangles",
    resource.source.sha256,
    resource.compiledMeshSha256,
  );
}
const candidate = {
  ...basis,
  id: candidateId,
  anatomicalCandidates: resources,
};
const inspectionDocument: IAutoMovieHumanBodyBasisDocument = {
  id: "atlas-inspection",
  name: "Explicit reference-only atlas inspection",
  basis: candidateId,
  shape: {},
  anatomicalInspection: resources.map((part) => part.id),
};
const inspected = createHumanBodyBasisBuilder(candidate)(inspectionDocument);
fs.writeFileSync(
  path.join(output, "candidate.basis.json.gz"),
  gzipSync(JSON.stringify(candidate)),
);
fs.writeFileSync(
  path.join(output, "body-document.json"),
  JSON.stringify(inspectionDocument, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(output, "receipt.json"),
  JSON.stringify(
    {
      compiler,
      originalBodyBasis: basis.id,
      originalBodyDigest: sha256(JSON.stringify(basis)),
      candidateId,
      planSha256: sha256(JSON.stringify(plan)),
      resources: resources.map((resource) => ({
        id: resource.id,
        source: resource.source.sha256,
        mesh: resource.compiledMeshSha256,
      })),
    },
    null,
    2,
  ) + "\n",
);

// Source admission reaches the real static writer and decoder in this same
// process, with its one glTF module instance. These are actual output readings,
// not fixed expected values or a substitute for rendered observation.
void (async () => {
  const qualification = await createHumanBodyAtlasExportQualification(
    candidate,
    inspectionDocument,
  );
  const asset = await exportHumanBody(
    inspected.model,
    undefined,
    undefined,
    qualification,
  );
  fs.writeFileSync(path.join(output, "body.glb"), asset.glb);
  fs.writeFileSync(
    path.join(output, "body.gltf"),
    JSON.stringify(asset.gltf.json) + "\n",
  );
  for (const [uri, bytes] of Object.entries(asset.gltf.resources)) {
    const target = path.resolve(output, uri);
    if (!target.startsWith(path.resolve(output) + path.sep))
      throw new Error(
        "Atlas static resource leaves its output directory: " + uri,
      );
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  const decoded = await new WebIO()
    .registerExtensions(gltfMaterialExtensions)
    .readBinary(asset.glb);
  const readings = decoded
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives())
    .flatMap((primitive) => {
      const record = readHumanBodyAtlasAssetCorrespondence(primitive);
      if (record === undefined) return [];
      const positions = primitive.getAttribute("POSITION")!.getArray()!;
      return record.qualification.parts.map((part) => {
        const interval = record.geometry.parts.find(
          (member) => member.id === part.id,
        )!;
        const source = inspected.model.parts.find(
          (member) => member.id === part.id,
        )!;
        if (source.geometry.type !== "mesh")
          throw new Error("Atlas output has no actual source mesh: " + part.id);
        let maximumSourceDifferenceMetres = 0;
        let maximumFloat32ReplayDifferenceMetres = 0;
        for (let at = 0; at < interval.vertexCount * 3; at++) {
          const actual = positions[interval.vertexOffset * 3 + at];
          const original = source.geometry.mesh.positions[at];
          maximumSourceDifferenceMetres = Math.max(
            maximumSourceDifferenceMetres,
            Math.abs(actual - original),
          );
          maximumFloat32ReplayDifferenceMetres = Math.max(
            maximumFloat32ReplayDifferenceMetres,
            Math.abs(actual - Math.fround(original)),
          );
        }
        return {
          part: part.part,
          sourcePart: part.id,
          vertices: interval.vertexCount,
          triangles: interval.indexCount / 3,
          maximumSourceDifferenceMetres,
          maximumFloat32ReplayDifferenceMetres,
          source: part.source,
          registration: part.registration,
          partResolution: part.partResolution,
        };
      });
    });
  fs.writeFileSync(
    path.join(output, "body-readback.json"),
    JSON.stringify(
      {
        sourceBodyBasis: basis.id,
        candidateBasis: candidateId,
        model: inspected.model.id,
        glbSha256: sha256(Buffer.from(asset.glb)),
        readings,
        renderedObservation: "not-observed",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "BODY_STATIC_READBACK",
    readings.length,
    "atlas parts",
    sha256(Buffer.from(asset.glb)),
  );
})().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
