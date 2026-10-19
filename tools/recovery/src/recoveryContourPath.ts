import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { tessellateAutoMovieContourPath64 as T } from "../../../packages/engine/src/geometry/curve/tessellateAutoMovieContourPath64.ts";
import type { IAutoMovieModel } from "../../../packages/interface/src/model/IAutoMovieModel.ts";
import { writeRecoveryArtifact } from "./writeRecoveryArtifact.ts";

/**
 * Compile a bounded saved polygon/path publication through the engine.
 * Usage: recoveryContourPath input.json new-output-directory, with RUN_SOURCE_EPOCH.
 * The input supplies ordered evaluated curves and path instructions, never faces.
 * Each subject receives independently generated geometry and actual boundary lines.
 *
 * @evidence contracts/common.md#principled-implementation The fuchs1977-pair-path-v1 publication supplies only physical polygons and combinatorial path instructions; tessellateAutoMovieContourPath64 owns every new vertex, index and normal.
 * @evidence contracts/common.md#clear-and-simple-design One bounded CLI admits and hashes the immutable publication, compiles each declared subject and publishes its model and generation report in a fresh directory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source path, source geometry, external triangle list, optimizer replacement or failed-quality geometry filtering enters generation; unsupported-pair counts remain explicit.
 * @evidence contracts/common.md#meaningful-documentation States command, source epoch, source-free publication boundary, bounded file admission and the distinction between path consumption and successful source recovery.
 * @evidence contracts/performance.md#efficient-algorithms File admission is linear in at most 32 MiB input; subjects compile sequentially with engine O(V+T) work and incremental output serialization.
 * @evidence contracts/performance.md#reuse-equivalent-work The input bytes provide one hash for every output; each subject invokes the engine once and reuses that exact result for geometry, construction and ownership reports.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input bytes and parsed polygons remain live for the bounded command; each generated subject transfers to immutable files before the next iteration. Synchronous handles close and no child process or cache is created.
 */
export function recoveryContourPath(args: string[]): void {
  const [inputFile, outputDirectory]: string[] = args;
  const sourceEpoch: string | undefined = process.env.RUN_SOURCE_EPOCH;
  if (
    args.length !== 2 ||
    !inputFile ||
    !outputDirectory ||
    !sourceEpoch ||
    !/^[a-f0-9]{40,64}$/i.test(sourceEpoch)
  )
    throw new Error(
      "Usage: recoveryContourPath input.json new-output-directory with RUN_SOURCE_EPOCH",
    );
  if (fs.statSync(inputFile).size > 32 * 1024 * 1024)
    throw new Error(
      "A path publication exceeds the declared 32 MiB input limit",
    );
  const bytes: Buffer = fs.readFileSync(inputFile),
    inputSha256: string = createHash("sha256").update(bytes).digest("hex");
  const input: {
    schema: string;
    units: string;
    frame: string;
    condition: string;
    observationsHash: string;
    subjects: (Parameters<typeof T>[0] & {
      id: string;
      unsupportedPairCount: number;
    })[];
  } = JSON.parse(bytes.toString("utf8")) as {
    schema: string;
    units: string;
    frame: string;
    condition: string;
    observationsHash: string;
    subjects: (Parameters<typeof T>[0] & {
      id: string;
      unsupportedPairCount: number;
    })[];
  };
  if (
    input.schema !== "fuchs1977-pair-path-v1" ||
    input.units !== "mm" ||
    input.frame !== "+X subject-left, +Y up, +Z front" ||
    !input.condition ||
    !/^[a-f0-9]{64}$/i.test(input.observationsHash) ||
    !Array.isArray(input.subjects) ||
    input.subjects.length === 0 ||
    new Set(
      input.subjects.map(
        (subject: (typeof input.subjects)[number]): string => subject.id,
      ),
    ).size !== input.subjects.length
  )
    throw new Error("A complete source-free path publication is required");
  for (const subject of input.subjects)
    if (
      !/^[a-zA-Z0-9._-]+$/.test(subject.id) ||
      subject.id === "." ||
      subject.id === ".." ||
      !Number.isSafeInteger(subject.unsupportedPairCount) ||
      subject.unsupportedPairCount < 0
    )
      throw new Error(
        "Subjects need safe unique identities and explicit unsupported counts",
      );
  const output: string = path.resolve(outputDirectory);
  if (fs.existsSync(output))
    throw new Error("A path compilation directory must be new");
  fs.mkdirSync(output, { recursive: true });
  const started: number = performance.now(),
    results: object[] = [];
  for (const subject of input.subjects) {
    const generated: ReturnType<typeof T> = T({
      ...subject,
      topologyDomain: `contour-path.${inputSha256}.${subject.id}`,
    });
    const model: IAutoMovieModel = {
      id: `recovery.paths.${subject.id}`,
      name: null,
      origin: "generated",
      parts: [
        {
          id: "recovery.paths",
          name: null,
          geometry: { type: "mesh", mesh: generated.mesh },
          material: null,
          attachedBone: null,
          transform: null,
        },
      ],
      skeleton: null,
      body: null,
      materials: [],
      asset: null,
    };
    const provenance: object = {
      sourceEpoch,
      inputSha256,
      observationsHash: input.observationsHash,
      condition: input.condition,
      inputKeys: ["polygons", "pairs"],
      sourceMeshOpenedForReconstruction: false,
      engine: "tessellateAutoMovieContourPath64",
      callPath: [
        "recoveryContourPath",
        "saved polygons + P/Q paths",
        "tessellateAutoMovieContourPath64",
        "IAutoMovieModel",
        "viewer",
      ],
      generatedAt: new Date().toISOString(),
    };
    const file: string = path.join(output, `${subject.id}.json`);
    const published: ReturnType<typeof writeRecoveryArtifact> =
      writeRecoveryArtifact(file, {
        schema: "automovie-recovery-engine-model-v1",
        model,
        construction: { units: "m", lines: generated.construction },
        primitiveRanges: generated.pairs,
        diagnostics: generated.diagnostics,
        coverage: {
          complete: false,
          selectedPairs: subject.pairs.length,
          unsupportedPairs: subject.unsupportedPairCount,
          qualification:
            "Localized ordinary closed-pair surfacing pilot; source fidelity and full-source coverage unverified",
        },
        provenance,
      });
    results.push({
      subject: subject.id,
      file,
      ...published,
      counts: {
        vertices: generated.mesh.positions.length / 3,
        triangles: generated.mesh.indices!.length / 3,
      },
      pairs: generated.pairs,
      diagnostics: generated.diagnostics,
    });
    console.log(
      JSON.stringify({
        phase: "contour-path-engine-subject",
        subject: subject.id,
        ...published,
        vertices: generated.mesh.positions.length / 3,
        triangles: generated.mesh.indices!.length / 3,
      }),
    );
  }
  writeRecoveryArtifact(path.join(output, "compile.json"), {
    schema: "automovie-recovery-path-compilation-v1",
    sourceEpoch,
    inputSha256,
    condition: input.condition,
    results,
    elapsedMs: performance.now() - started,
    memory: {
      current: process.memoryUsage(),
      processMaximumRssKiB: process.resourceUsage().maxRSS,
    },
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  recoveryContourPath(process.argv.slice(2));
