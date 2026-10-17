import path from "node:path";
import { fileURLToPath } from "node:url";

import { readInput } from "../io/readInput.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import { compileFaceFamily } from "./compileFaceFamily.ts";
import { eyeFamilies } from "./eyeFamilies.ts";
import { faceEngineModel } from "./faceEngineModel.ts";
import { faceTypes } from "./faceTypes.ts";
import { headFamily } from "./headFamily.ts";
import { mergeFacePatches } from "./mergeFacePatches.ts";
import { mouthFamilies } from "./mouthFamilies.ts";

/**
 * Compiles explicitly hashed eye, head and mouth observations into immutable private regional artifacts.
 * Input registration must agree with the manifest. One artifact preserves per-patch ownership, another
 * concatenates it for the actual comparison renderer, and source/tool hashes identify the executed graph.
 * Existing different output bytes throw through the immutable writer rather than replacing prior evidence.
 *
 * @evidence contracts/common.md#principled-implementation Verified manifest bytes fix frame, posture and private observations before the curve-family compiler evaluates them.
 * @evidence contracts/common.md#clear-and-simple-design The CLI coordinates admission and publication; adapters own regional schemas and the compiler owns geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inputs are explicit absolute-root manifests with no embedded reference catalogue, mesh transplant or identity-dependent behavior.
 * @evidence contracts/common.md#meaningful-documentation States registration, topology-preserving outputs, provenance and immutable-write failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms Each declared JSON input is hash-verified once and compiled once; serialization scans the resulting mesh arrays for the requested evidence artifacts.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled patch arrays feed both detailed and flattened outputs; no stale result cache or repeated fit is used.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous reads and atomic writer handles close in their owners; this invocation retains input and output arrays only until its process exits.
 */
export function runFace(arguments_: string[]): void {
  const value = (flag: string): string => {
    const index: number = arguments_.indexOf(flag);
    if (index < 0 || !arguments_[index + 1])
      throw new Error(`Required argument: ${flag}`);
    return arguments_[index + 1];
  };
  const manifestPath: string = value("--manifest"),
    output: string = value("--output"),
    sourceCommit: string = value("--source-commit");
  if (!/^[a-f0-9]{40}$/.test(sourceCommit))
    throw new Error("Exact frozen generating source commit required");
  if (!path.isAbsolute(output))
    throw new Error("Private version output must be absolute");
  const manifest: ReturnType<typeof readManifest> = readManifest(manifestPath);
  const load = <T>(id: string): T => {
    const input: T & {
      gate?: string;
      frame?: string;
      pose?: string;
      observations?: { gate?: string; frame?: string; pose?: string };
    } = readInput(manifest, id);
    const registration: { gate?: string; frame?: string; pose?: string } =
      input.observations ?? input;
    if (
      registration.gate !== manifest.gate ||
      registration.frame !== manifest.frame ||
      (registration.pose !== undefined && registration.pose !== manifest.pose)
    )
      throw new Error(`Network registration differs from the manifest: ${id}`);
    return input;
  };
  const fitMm: number = arguments_.includes("--fit-mm")
    ? Number(value("--fit-mm"))
    : 0.05;
  const resolutionMm: number = arguments_.includes("--resolution-mm")
    ? Number(value("--resolution-mm"))
    : 0.5;
  const families: faceTypes.Family[] = [];
  const eyePhaseStride: number = arguments_.includes("--eye-phase-stride")
    ? Number(value("--eye-phase-stride"))
    : 1;
  if (manifest.files.eyeAnnular)
    families.push(
      ...eyeFamilies(
        load<Parameters<typeof eyeFamilies>[0]>("eyeAnnular"),
        eyePhaseStride,
      ),
    );
  if (manifest.files.faceChart)
    families.push(
      headFamily(load<Parameters<typeof headFamily>[0]>("faceChart")),
    );
  if (manifest.files.mouthNetwork)
    families.push(
      ...mouthFamilies(
        load<Parameters<typeof mouthFamilies>[0]>("mouthNetwork"),
      ),
    );
  if (!families.length)
    throw new Error(
      "Manifest needs eyeAnnular, faceChart or mouthNetwork observations",
    );
  const patches: faceTypes.Result[] = families.map(
    (family: faceTypes.Family): faceTypes.Result =>
      compileFaceFamily(family, fitMm, resolutionMm),
  );
  const toolDirectory: string = path.dirname(fileURLToPath(import.meta.url));
  const tools: { file: string; sha256: string }[] = [
    "runFace.ts",
    "faceEngineModel.ts",
    "faceTypes.ts",
    "compileFaceFamily.ts",
    "eyeFamilies.ts",
    "headFamily.ts",
    "mouthFamilies.ts",
    "mergeFacePatches.ts",
    "../fit/fitCurve.ts",
    "../nosemouth/buildMouthNetwork.ts",
    "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieCurveGrid64.ts",
    "../../../../packages/engine/src/geometry/curve/IAutoMovieCurveGrid64.ts",
  ].map((name: string): { file: string; sha256: string } => {
    const file: string = path.resolve(toolDirectory, name);
    return { file, sha256: sha256(file) };
  });
  const artifact: object = {
    schema: "reference-local-face-surface-v1",
    gate: manifest.gate,
    units: manifest.units,
    frame: manifest.frame,
    pose: manifest.pose,
    input: {
      manifest: manifestPath,
      sha256: sha256(manifestPath),
      files: manifest.files,
    },
    method:
      "Complete engine cubic contracts feed engine Bernstein/PCHIP tensor grids; engine-generated mesh and actual construction feed the repository viewer.",
    tools,
    sourceCommit,
    fitMm,
    resolutionMm,
    eyePhaseStride,
    patches,
    qualification: {
      actualViewerAccepted: false,
      assembledFaceAccepted: false,
      limits: [
        "Private source-derived research artifact; no original mesh triangles, weights or observed vertex normals are consumed.",
        "Each patch retains separate topology ownership. Background and feature collars require an explicit joint trim before assembly; overlapping surfaces do not count as a complete face.",
        "A source reference collision remains an unresolved source defect and is not an accepted anatomical target.",
      ],
    },
  };
  const saved: ReturnType<typeof writeArtifact> = writeArtifact(
    output,
    "face.json",
    artifact,
  );
  writeArtifact(
    output,
    "engine-model.json",
    faceEngineModel(
      patches,
      Object.fromEntries(
        Object.entries(manifest.files).map(
          ([id, file]: [string, { path: string; sha256: string }]): [
            string,
            string,
          ] => [id, file.sha256],
        ),
      ),
      sourceCommit,
    ),
  );
  const display: ReturnType<typeof writeArtifact> = writeArtifact(
    output,
    "reconstruction.json",
    {
      ...mergeFacePatches(patches),
      source: {
        manifest: manifestPath,
        sha256: sha256(manifestPath),
        files: manifest.files,
      },
      tool: tools,
    },
  );
  for (const patch of patches)
    writeArtifact(output, `patches/${patch.id}.json`, {
      ...mergeFacePatches([patch]),
      source: {
        manifest: manifestPath,
        sha256: sha256(manifestPath),
        files: manifest.files,
      },
      tool: tools,
    });
  console.log(
    JSON.stringify({
      gate: manifest.gate,
      ...saved,
      display,
      patches: patches.map((patch: faceTypes.Result): object => ({
        id: patch.id,
        vertices: patch.vertices.length,
        triangles: patch.triangles.length,
        maxFitBoundMm: patch.qualification.maxFitBoundMm,
        maximumKnotResidualMm: patch.qualification.maximumKnotResidualMm,
        c0CurveJoins: patch.qualification.c0CurveJoins,
        zeroAreaCells: patch.qualification.zeroAreaCells,
      })),
    }),
  );
}

runFace(process.argv.slice(2));
