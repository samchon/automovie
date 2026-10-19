import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { IAutoMovieBicubicAtlasGeometry } from "../../../packages/interface/src/model/IAutoMovieBicubicAtlasGeometry.ts";
import type { IAutoMovieMesh } from "../../../packages/interface/src/model/IAutoMovieMesh.ts";
import { compileRecoveryAtlas } from "./compileRecoveryAtlas.ts";
import { observeRecoveryAtlas } from "./observeRecoveryAtlas.ts";
import { writeRecoveryArtifact } from "./writeRecoveryArtifact.ts";

/**
 * Compile a source-free public atlas recipe into independently generated geometry.
 * Usage: recoveryAtlas compile atlas.json output-directory, or observe an
 * observation-spec.json into a separate new output directory. Compile input contains
 * schema=automovie-recovery-atlas-v1, geometry, coverage and chart ownership.
 * Observe owns private original-mesh admission, correspondence and patch fitting.
 * Compile opens only the resulting public atlas and cannot infer replacements
 * for absent coefficients; an engine invocation never receives source incidence.
 *
 * @evidence contracts/common.md#principled-implementation The public bicubic geometry contract drives its canonical engine realizer; the recipe model and compiled mesh model retain one input-byte identity and separate actual processing qualification.
 * @evidence contracts/common.md#clear-and-simple-design Separate recipe, generated geometry and compile manifests expose both viewer recipe consumption and independent evaluation without duplicating coefficient authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original mesh input is confined to the explicit observation command; compile reads only public coefficients and preserves its actual engine mesh without source fallback or quality-driven face deletion.
 * @evidence contracts/common.md#meaningful-documentation States the source-free input boundary, command, frozen epoch requirement, units, immutable files and qualification limits.
 * @evidence contracts/performance.md#efficient-algorithms Compile admission and hashing are linear in publication bytes; one engine call performs adaptive generation. The separate observation owner documents fitting costs, and bounded artifact serialization avoids a whole output string.
 * @evidence contracts/performance.md#reuse-equivalent-work The single engine result supplies generated mesh, primitive ownership and processing findings; camera changes consume the same recipe or compiled artifact.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One input publication and explicitly vertex-bounded engine output remain live for the command; synchronous handles close, immutable output belongs to the caller and no process is spawned.
 */
export function recoveryAtlas(args: string[]): void {
  const [command, inputFile, outputDirectory]: string[] = args;
  const sourceEpoch: string | undefined = process.env.RUN_SOURCE_EPOCH;
  if (
    (command !== "compile" && command !== "observe") ||
    !inputFile ||
    !outputDirectory ||
    args.length !== 3 ||
    !sourceEpoch ||
    !/^[a-f0-9]{40,64}$/i.test(sourceEpoch)
  )
    throw new Error(
      "Usage: recoveryAtlas compile|observe input.json new-output-directory with RUN_SOURCE_EPOCH",
    );
  if (command === "observe") {
    observeRecoveryAtlas(inputFile, outputDirectory, sourceEpoch);
    return;
  }
  const bytes: Buffer = fs.readFileSync(inputFile),
    inputSha256: string = createHash("sha256").update(bytes).digest("hex");
  const input: {
    schema: string;
    geometry: IAutoMovieBicubicAtlasGeometry;
    coverage: unknown;
    charts: unknown;
  } = JSON.parse(bytes.toString("utf8")) as {
    schema: string;
    geometry: IAutoMovieBicubicAtlasGeometry;
    coverage: unknown;
    charts: unknown;
  };
  if (
    input.schema !== "automovie-recovery-atlas-v1" ||
    !input.coverage ||
    !Array.isArray(input.charts)
  )
    throw new Error(
      "An atlas publication needs explicit chart ownership and coverage",
    );
  const output: string = path.resolve(outputDirectory);
  if (fs.existsSync(output))
    throw new Error("An atlas compilation directory must be new");
  fs.mkdirSync(output, { recursive: true });
  const started: number = performance.now();
  console.error(
    JSON.stringify({
      phase: "atlas-engine-start",
      sourceEpoch,
      inputSha256,
      memory: process.memoryUsage(),
    }),
  );
  const generated: ReturnType<typeof compileRecoveryAtlas> =
    compileRecoveryAtlas(input.geometry);
  const provenance: object = {
    sourceEpoch,
    inputSha256,
    inputKeys: ["geometry"],
    sourceMeshOpenedForReconstruction: false,
    publicContract: "IAutoMovieBicubicAtlasGeometry",
    engine:
      "realizeAutoMovieBicubicAtlas64 -> tessellateAutoMovieBicubicAtlas64",
    outputUnits: "m",
    generatedAt: new Date().toISOString(),
  };
  const recipeFile: string = path.join(output, "recipe-model.json"),
    compiledFile: string = path.join(output, "compiled-model.json");
  const recipePublication: ReturnType<typeof writeRecoveryArtifact> =
    writeRecoveryArtifact(recipeFile, {
      schema: "automovie-recovery-engine-model-v1",
      model: generated.recipeModel,
      coverage: input.coverage,
      charts: input.charts,
      provenance,
    });
  const compiledPublication: ReturnType<typeof writeRecoveryArtifact> =
    writeRecoveryArtifact(compiledFile, {
      schema: "automovie-recovery-engine-model-v1",
      model: generated.compiledModel,
      coverage: input.coverage,
      charts: input.charts,
      primitiveRanges: generated.primitiveRanges,
      realization: generated.realization,
      provenance,
    });
  const mesh: IAutoMovieMesh | undefined =
    generated.compiledModel.parts[0]?.geometry.type === "mesh"
      ? generated.compiledModel.parts[0].geometry.mesh
      : undefined;
  const manifest: object = {
    schema: "automovie-recovery-atlas-compilation-v1",
    provenance,
    coverage: input.coverage,
    realization: generated.realization,
    recipe: { path: recipeFile, ...recipePublication },
    compiled: { path: compiledFile, ...compiledPublication },
    counts: {
      vertices: (mesh?.positions.length ?? 0) / 3,
      triangles: (mesh?.indices?.length ?? 0) / 3,
    },
    callPath: [
      "recoveryAtlas",
      "IAutoMovieBicubicAtlasGeometry",
      "realizeAutoMovieBicubicAtlas64",
      "tessellateAutoMovieBicubicAtlas64",
      "IAutoMovieModel",
      "viewer.buildGeometry -> realizeAutoMovieGeometry(display)",
    ],
    elapsedMs: performance.now() - started,
    memory: {
      current: process.memoryUsage(),
      processMaximumRssKiB: process.resourceUsage().maxRSS,
    },
  };
  const publication: ReturnType<typeof writeRecoveryArtifact> =
    writeRecoveryArtifact(path.join(output, "compile.json"), manifest);
  console.log(
    JSON.stringify({
      phase: "atlas-engine-complete",
      ...manifest,
      manifestSha256: publication.sha256,
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  recoveryAtlas(process.argv.slice(2));
