import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { IAutoMovieRecoveryRegistration } from "@automovie/interface/recovery";

import { AutoMovieRecoveryMeshSections as R } from "../../internal/AutoMovieRecoveryMeshSections";
import { observeAutoMovieRecovery } from "../../observeAutoMovieRecovery";
import { prepareAutoMovieRecoveryInput } from "../../prepareAutoMovieRecoveryInput";
import { reconstructAutoMovieRecoveryModel } from "../../reconstructAutoMovieRecoveryModel";
import { writeAutoMovieRecoveryArtifact } from "./writeAutoMovieRecoveryArtifact";

/**
 * Generic command seam for fixed meshes to saved cubics and saved cubics to engine models.
 * Extraction accepts a JSON specification with units mm, frame, pose, meshes containing
 * path/sha256, and the AutoMovieRecoveryMeshSections policy. Mesh JSON contains vertices and triangles.
 * extract-prefix accepts a fourth argument giving a fixed automatic station count and explicitly
 * publishes incomplete coverage. Reconstruction opens only the saved curve artifact.
 * source epoch argument identifies a frozen source commit.
 *
 * @evidence contracts/common.md#principled-implementation Complete-byte hashes admit each fixed input; independent extract and reconstruct commands make source-free geometry consumption observable.
 * @evidence contracts/common.md#clear-and-simple-design The CLI owns byte admission and atomic publication, public recovery operations own terminal states and orchestration, and existing engine operations retain shared curve and surface computation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject name, rig field, source control table or normal field is read. Existing output bytes are never overwritten.
 * @evidence contracts/common.md#meaningful-documentation States full extraction, explicit incomplete prefix extraction and curve-only reconstruction, with input schema, physical units and pre-execution source epoch requirement.
 * @evidence contracts/performance.md#efficient-algorithms JSON parsing and mesh assembly are linear in input bytes and geometry; downstream operators document extraction and tessellation costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Each input is read and hashed once; the generated model and construction share one completed engine result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous reads close their handles; arrays live for one command and immutable outputs are caller-owned.
 */
export function recovery(args: string[], sourceEpoch: string): void {
  const [command, inputPath, outputPath, prefixCount]: string[] = args;
  if (
    !inputPath ||
    !outputPath ||
    (command !== "extract" &&
      command !== "extract-prefix" &&
      command !== "reconstruct")
  )
    throw new Error(
      "Usage: recovery.ts extract|extract-prefix|reconstruct input.json output.json [prefixSections]",
    );
  const sectionLimit: number | undefined =
    command === "extract-prefix" ? Number(prefixCount) : undefined;
  if (
    sectionLimit !== undefined &&
    (!Number.isSafeInteger(sectionLimit) || sectionLimit < 2)
  )
    throw new Error("An explicit integer prefix section count is required");
  if (!sourceEpoch || !/^[a-f0-9]{40,64}$/i.test(sourceEpoch))
    throw new Error("A frozen pre-execution source epoch argument is required");
  const bytes: Buffer = fs.readFileSync(inputPath);
  const started: number = performance.now();
  const inputHash: string = createHash("sha256").update(bytes).digest("hex");
  let artifact: object;
  if (command === "extract" || command === "extract-prefix") {
    const spec: {
      units: string;
      frame: string;
      pose: string;
      uncertainty?: string[];
      registration?: IAutoMovieRecoveryRegistration;
      meshes: { path: string; sha256: string }[];
      policy: R.Bundle["policy"];
    } = JSON.parse(bytes.toString("utf8"));
    if (
      spec.units !== "mm" ||
      !spec.frame ||
      !spec.pose ||
      !spec.meshes?.length
    )
      throw new Error(
        "Explicit millimetre registration, pose and fixed mesh files are required",
      );
    const verticesMm: R.Input["verticesMm"] = [],
      triangles: R.Input["triangles"] = [];
    for (const source of spec.meshes) {
      const sourcePath: string = path.resolve(
        path.dirname(inputPath),
        source.path,
      );
      const sourceBytes: Buffer = fs.readFileSync(sourcePath);
      if (
        createHash("sha256").update(sourceBytes).digest("hex") !== source.sha256
      )
        throw new Error("Fixed source mesh hash mismatch");
      const mesh: {
        vertices: R.Input["verticesMm"];
        triangles: R.Input["triangles"];
      } = JSON.parse(sourceBytes.toString("utf8"));
      const offset: number = verticesMm.length;
      for (const vertex of mesh.vertices) verticesMm.push(vertex);
      for (const t of mesh.triangles)
        triangles.push([t[0] + offset, t[1] + offset, t[2] + offset]);
    }
    const loaded: number = performance.now();
    console.error(
      JSON.stringify({
        phase: "admitted",
        sourceCounts: {
          vertices: verticesMm.length,
          triangles: triangles.length,
        },
        elapsedMs: loaded - started,
      }),
    );
    let admittedInput: R.Input = { ...spec.policy, verticesMm, triangles };
    if (spec.registration !== undefined) {
      const admitted: ReturnType<typeof prepareAutoMovieRecoveryInput> = prepareAutoMovieRecoveryInput({ registration: spec.registration, verticesMm, triangles, policy: spec.policy });
      if (!("value" in admitted)) throw new Error(admitted.diagnostics.join("; "));
      if (admitted.value.registration.units !== spec.units || admitted.value.registration.frame !== spec.frame || admitted.value.registration.evaluatedPose !== spec.pose)
        throw new Error("The explicit registration must agree with the source specification units, frame and evaluated pose");
      admittedInput = admitted.value.observation;
    }
    const observed: ReturnType<typeof observeAutoMovieRecovery> = observeAutoMovieRecovery(
      admittedInput,
      { sectionLimit, onProgress: (phase: string, completed: number, total: number): void => {
        console.error(
          JSON.stringify({
            phase,
            completed,
            total,
            elapsedMs: performance.now() - loaded,
          }),
        );
      } },
    );
    if (!("value" in observed)) throw new Error(observed.diagnostics.join("; "));
    const bundle: R.Bundle = observed.value;
    const extracted: number = performance.now();
    artifact = {
      ...bundle,
      operation: { schema: observed.schema, operator: observed.operator, status: observed.status },
      registration: spec.registration ?? {
        units: spec.units,
        frame: spec.frame,
        pose: spec.pose,
        uncertainty: spec.uncertainty ?? [],
        qualification: "legacy registration does not record applied transforms or evaluated component policy",
      },
      provenance: {
        sourceEpoch,
        sourceKind: "public-recovery-package",
        inputHash,
        sources: spec.meshes,
        generatedAt: new Date().toISOString(),
        elapsedMs: {
          sourceReadAndAdmission: loaded - started,
          extractionAndFitting: extracted - loaded,
        },
        sourceCounts: {
          vertices: verticesMm.length,
          triangles: triangles.length,
        },
      },
    };
    console.log(JSON.stringify(bundle.summary));
  } else {
    const bundle: R.Bundle = JSON.parse(bytes.toString("utf8"));
    const reconstructed: ReturnType<typeof reconstructAutoMovieRecoveryModel> = reconstructAutoMovieRecoveryModel(
      bundle,
      { observeWork: true },
    );
    if (!("value" in reconstructed)) throw new Error(reconstructed.diagnostics.join("; "));
    const result: typeof reconstructed.value = reconstructed.value;
    artifact = {
      schema: "automovie-recovery-model-v1",
      operation: { schema: reconstructed.schema, operator: reconstructed.operator, status: reconstructed.status },
      membership: result.membership,
      model: result.model,
      construction: { units: "m", lines: result.construction },
      diagnostics: result.diagnostics,
      unresolved: result.unresolved,
      stripObservations: result.stripObservations,
      primitiveRanges: result.primitiveRanges,
      interactionObservations: result.interactionObservations,
      ...(bundle.coverage ? { coverage: bundle.coverage } : {}),
      counts: {
        vertices: result.model.parts.reduce(
          (s: number, p: (typeof result.model.parts)[number]): number =>
            s +
            (p.geometry.type === "mesh"
              ? p.geometry.mesh.positions.length / 3
              : 0),
          0,
        ),
        triangles: result.model.parts.reduce(
          (s: number, p: (typeof result.model.parts)[number]): number =>
            s +
            (p.geometry.type === "mesh"
              ? p.geometry.mesh.indices!.length / 3
              : 0),
          0,
        ),
      },
      provenance: {
        sourceCommit: sourceEpoch,
        sourceKind: "public-recovery-package",
        inputKeys: ["curveBundle"],
        inputHashes: { curveBundle: inputHash },
        observeWork: true,
        engineOperators: [
          "tessellateAutoMovieContourLoft64",
          "AutoMovieContourLoftCurves64.tessellate",
          "tessellateAutoMovieContourStrip64",
        ],
        generatedAt: new Date().toISOString(),
        elapsedMs: performance.now() - started,
      },
    };
    console.log(
      JSON.stringify({
        parts: result.model.parts.length,
        diagnostics: result.diagnostics.length,
        unresolved: result.unresolved.length,
        displayedUnqualifiedStrips: result.stripObservations.filter(
          (strip: (typeof result.stripObservations)[number]): boolean =>
            !strip.qualified,
        ).length,
      }),
    );
  }
  const publication: ReturnType<typeof writeAutoMovieRecoveryArtifact> = writeAutoMovieRecoveryArtifact(outputPath, artifact);
  console.log(
    JSON.stringify({
      file: outputPath,
      ...publication,
    }),
  );
}
