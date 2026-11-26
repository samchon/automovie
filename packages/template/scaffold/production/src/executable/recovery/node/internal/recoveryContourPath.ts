import { AutoMovieEngineCurve } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { writeAutoMovieRecoveryArtifact } from "../artifact/writeAutoMovieRecoveryArtifact";

/**
 * Compile a bounded saved polygon/path publication through the engine. Usage:
 * recoveryContourPath input.json new-output-directory, with source epoch
 * argument. The input supplies ordered evaluated curves and path instructions,
 * never faces. Each subject receives independently generated geometry and
 * actual boundary lines.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The fuchs1977-pair-path-v1 publication supplies only physical polygons and combinatorial path instructions; tessellateAutoMovieContourPath64 owns every new vertex, index and normal. No source path, source geometry, external triangle list, optimizer replacement or failed-quality geometry filtering enters generation; unsupported-pair counts remain explicit.
 * @evidence contracts/development/implementation.md#efficient-algorithms The CLI checks a 32 MiB metadata limit before reading and hashing the input once. The separate whole-file read does not enforce that limit if the file grows or is replaced. Input bytes and parsed polygons stay live through the command. Subjects compile sequentially with engine O(V+T) work. Each subject reuses one engine result for geometry, construction and ownership reports and publishes it before the next subject. Synchronous file operations own their handles.
 * @evidence contracts/development/common.md#meaningful-documentation States command, source epoch, source-free publication boundary, bounded file admission and the distinction between path consumption and successful source recovery.
 */
export function recoveryContourPath(args: string[], sourceEpoch: string): void {
  const [inputFile, outputDirectory]: string[] = args;
  if (
    args.length !== 2 ||
    !inputFile ||
    !outputDirectory ||
    !sourceEpoch ||
    !/^[a-f0-9]{40,64}$/i.test(sourceEpoch)
  )
    throw new Error(
      "Usage: recoveryContourPath input.json new-output-directory with source epoch argument",
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
    subjects: (Parameters<typeof AutoMovieEngineCurve.tessellateContourPath64>[0] & {
      id: string;
      unsupportedPairCount: number;
    })[];
  } = JSON.parse(bytes.toString("utf8")) as {
    schema: string;
    units: string;
    frame: string;
    condition: string;
    observationsHash: string;
    subjects: (Parameters<typeof AutoMovieEngineCurve.tessellateContourPath64>[0] & {
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
    const generated: ReturnType<typeof AutoMovieEngineCurve.tessellateContourPath64> = AutoMovieEngineCurve.tessellateContourPath64({
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
    const published: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
      writeAutoMovieRecoveryArtifact(file, {
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
  writeAutoMovieRecoveryArtifact(path.join(output, "compile.json"), {
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
