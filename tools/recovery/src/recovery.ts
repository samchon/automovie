import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RecoveryMeshSections as R } from "./RecoveryMeshSections.ts";
import { reconstructRecovery } from "./reconstructRecovery.ts";

/**
 * Generic command seam for fixed meshes to saved cubics and saved cubics to engine models.
 * Extraction accepts a JSON specification with units mm, frame, pose, meshes containing
 * path/sha256, and the RecoveryMeshSections policy. Mesh JSON contains vertices and triangles.
 * extract-prefix accepts a fourth argument giving a fixed automatic station count and explicitly
 * publishes incomplete coverage. Reconstruction opens only the saved curve artifact.
 * RUN_SOURCE_EPOCH identifies a frozen source commit.
 *
 * @evidence contracts/common.md#principled-implementation Complete-byte hashes admit each fixed input; independent extract and reconstruct commands make source-free geometry consumption observable.
 * @evidence contracts/common.md#clear-and-simple-design The CLI owns filesystem admission and immutable full or station-prefix publication; extraction and the existing engine own numerical operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject name, rig field, source control table or normal field is read. Existing output bytes are never overwritten.
 * @evidence contracts/common.md#meaningful-documentation States full extraction, explicit incomplete prefix extraction and curve-only reconstruction, with input schema, physical units and pre-execution source epoch requirement.
 * @evidence contracts/performance.md#efficient-algorithms JSON parsing and mesh assembly are linear in input bytes and geometry; downstream operators document extraction and tessellation costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Each input is read and hashed once; the generated model and construction share one completed engine result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous reads close their handles; arrays live for one command and immutable outputs are caller-owned.
 */
export function recovery(args: string[]): void {
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
  const sourceEpoch: string | undefined = process.env.RUN_SOURCE_EPOCH;
  if (!sourceEpoch || !/^[a-f0-9]{40,64}$/i.test(sourceEpoch))
    throw new Error("A frozen pre-execution RUN_SOURCE_EPOCH is required");
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
    const bundle: R.Bundle = R.extract(
      { ...spec.policy, verticesMm, triangles },
      (phase: string, completed: number, total: number): void => {
        console.error(
          JSON.stringify({
            phase,
            completed,
            total,
            elapsedMs: performance.now() - loaded,
          }),
        );
      },
      sectionLimit,
    );
    const extracted: number = performance.now();
    artifact = {
      ...bundle,
      registration: {
        units: spec.units,
        frame: spec.frame,
        pose: spec.pose,
        uncertainty: spec.uncertainty ?? [],
      },
      provenance: {
        sourceEpoch,
        sourceKind: "isolated-research-snapshot",
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
    const result: ReturnType<typeof reconstructRecovery> = reconstructRecovery(
      bundle,
      { observeWork: true },
    );
    artifact = {
      schema: "human-reference-engine-model-v1",
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
        sourceKind: "isolated-research-snapshot",
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
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(artifact), { flag: "wx" });
  console.log(
    JSON.stringify({
      file: outputPath,
      sha256: createHash("sha256")
        .update(fs.readFileSync(outputPath))
        .digest("hex"),
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  recovery(process.argv.slice(2));
