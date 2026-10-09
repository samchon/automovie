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
 * That preparation reads the actual paired views and native thickness before
 * anatomical admission: pass - for ASSEMBLY when registration does not yet
 * exist. Other stages retain their complete source, rig and mesh admission.
 * An optional sixth argument names a JSON record of shape channel weights
 * for the document, to read the same layer order on a shaped body.
 * The body-only stage uses the normal body builder with the actual paired
 * generation's endpoint source. It retains all anatomical parts and static
 * readback without constructing the face. Its body skin has no head skin,
 * so cranial containment and complete person appearance stay unverified.
 * This stage writes body-layer-order.json and body readback; joint centres
 * and person-layer-order.json belong to whole-person construction.
 * The layer-registration stage derives a recipe-bound candidate, runs the
 * existing thickness producer on its actual view and publishes registered
 * paired inputs, retaining source and producer receipts without constructing.
 */
import {
  inspectAutoMovieMeshTopology,
  validateMeshTopology,
} from "@automovie/engine";
import { createHumanBodyBasisBuilder } from "@automovie/human/body/basis/createHumanBodyBasisBuilder";
import { createHumanBodyAssemblyExportQualification } from "@automovie/human/body/export/createHumanBodyAssemblyExportQualification";
import { createHumanBodyAtlasExportQualification } from "@automovie/human/body/export/createHumanBodyAtlasExportQualification";
import { createHumanFaceOralExportQualification } from "@automovie/human/face/export/createHumanFaceOralExportQualification";
import { createHumanPersonBodyEndpointSource } from "@automovie/human/human/build/createHumanPersonBodyEndpointSource";
import { createHumanPersonGenerationBuilder } from "@automovie/human/human/build/createHumanPersonGenerationBuilder";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import { deriveHumanPersonBody } from "@automovie/human/human/document/deriveHumanPersonBody";
import { exportHumanPerson } from "@automovie/human/human/export/exportHumanPerson";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { createHumanBodyConstructionProgressObservers } from "./createHumanBodyConstructionProgressObservers";
import { writeHumanBodyConstructionRigReading } from "./writeHumanBodyConstructionRigReading";
import { HumanBodyAnatomicalArtifactWriter } from "./HumanBodyAnatomicalArtifactWriter";
import { HumanBodyAnatomicalLayerWriter } from "./HumanBodyAnatomicalLayerWriter";
import { readHumanBodyAnatomicalCompileInputs } from "./readHumanBodyAnatomicalCompileInputs";

const [assemblyFile, planFile, output, stage, layerFieldFile, shapeFile] =
  process.argv.slice(2);
if (!assemblyFile || !planFile || !output)
  throw new Error("Expected ASSEMBLY PLAN OUTPUT.");
if (
  stage !== undefined &&
  stage !== "source-admission" &&
  stage !== "layer-order" &&
  stage !== "layer-surfaces" &&
  stage !== "layer-registration" &&
  stage !== "body-only" &&
  stage !== "full"
)
  throw new Error(
    "The optional production stage is source-admission, layer-surfaces, layer-registration, layer-order, body-only or full.",
  );
if (stage === "layer-surfaces" && layerFieldFile === undefined)
  throw new Error("The layer-surfaces stage needs a layer thickness field.");
// Only the parent is reusable. Exclusive creation refuses an existing epoch
// before any input or archive record can be replaced by this attempt.
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.mkdirSync(output);
if (stage === "layer-surfaces") {
  const native = readHumanBodyAnatomicalCompileInputs(
    assemblyFile, planFile, output, layerFieldFile, shapeFile, stage,
  );
  process.exit(HumanBodyAnatomicalLayerWriter.writeNative(
    output, native.body.body.surfaces[0].positions, native.skinIndices,
    native.layerField, native.body.body.id, native.layerFieldSha256,
  ));
}
const { plan, head, body, originalAssembly, assembly, candidate, document,
  assemblyBytes, sourceRefusals, layerField, skinIndices, declared, ids, candidateId } =
  readHumanBodyAnatomicalCompileInputs(assemblyFile, planFile, output, layerFieldFile, shapeFile,
    stage === "layer-registration" ? "layer-registration" : undefined);
if (stage === "layer-registration") process.exit(0);
const hash = (bytes: string | Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const layers = new HumanBodyAnatomicalLayerWriter(output, assembly, layerField, skinIndices);

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
  const artifacts = new HumanBodyAnatomicalArtifactWriter(output);
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
      }).construct(
        deriveHumanPersonBody({ document, faceMaterials: head.face.materials }),
      );
      artifacts.writeConstructedModel("body", build.model);
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
            layerObservations: build.layerObservations,
            layerAdmission: build.layerAdmission,
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
          : layers.facesOf(build.posedSurfaces[0].positions);
      const refused = layers.writeLayerOrder(
        "body",
        build.model,
        [faces?.[0] ?? artifacts.skinOf(build.sourceSkinModel ?? build.model, "Human/skin")],
        "anatomical-source:",
        faces === undefined ? undefined : [faces[1]],
      );
      await artifacts.writeBodyAsset(build, candidate);
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
      process.exitCode = refused === 0 && build.layerAdmission?.accepted !== false ? 0 : 1;
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
          faceAdmission: personBuild.faceAdmission,
          bodyLayerObservations: bodyBuild.layerObservations,
          bodyLayerAdmission: bodyBuild.layerAdmission,
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
    artifacts.writeConstructedModel("body", bodyBuild.model);
    artifacts.writeConstructedModel("person", personBuild.model);
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
    const personSourceSkin = personBuild.sourceSkinModel ?? personBuild.model;
    const personFaces = layers.facesOfPerson(personSourceSkin, generation, document.id);
    const bodyFaces = layerField === undefined ? undefined : layers.facesOf(bodyBuild.posedSurfaces[0].positions);
    const faceSkin = artifacts.skinOf(personSourceSkin, "face:Human/skin");
    const bodyLayerRefusals = layers.writeLayerOrder(
      "body",
      bodyBuild.model,
      [bodyFaces?.[0] ?? artifacts.skinOf(bodyBuild.sourceSkinModel ?? bodyBuild.model, "Human/skin")],
      "anatomical-source:",
      bodyFaces === undefined ? undefined : [bodyFaces[1]],
    );
    const personLayerRefusals = layers.writeLayerOrder(
      "person",
      personBuild.model,
      layerField === undefined ? [personFaces[0]] : [faceSkin, personFaces[0]],
      "body:anatomical-source:",
      layerField === undefined ? undefined : [faceSkin, personFaces[1]],
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
        personBuild.admission.accepted && bodyLayerRefusals === 0 && personLayerRefusals === 0 ? 0 : 1;
      return;
    }
    await artifacts.writeBodyAsset(bodyBuild, candidate);
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
        personBuild.body.layerObservations,
      ),
      await createHumanFaceOralExportQualification(
        head.face,
        document.face,
        personBuild.model,
        "face:",
      ),
    );
    artifacts.writeAsset("person", personAsset);
    fs.writeFileSync(
      path.join(output, "person-readback.json"),
      JSON.stringify(
        await artifacts.readback(personAsset.glb, personBuild.model, "body:", personBuild.body.layerObservations),
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
