import { IAutoMovieCompiledShotSource, IAutoMovieGeneratedManifest, type IAutoMovieGeneratedFile } from "@automovie/interface";

import typia from "typia";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { compareCodeUnits, digestAutoMovieBytes } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";

/**
 * Read every manifest-owned shot after confirming the requested compile fingerprint.
 *
 * @evidence contracts/common.md#principled-implementation Manifest fingerprint, exact byte digest and strict compiled-shot schema qualify each sorted shot file before measurement.
 * @evidence contracts/common.md#clear-and-simple-design The oracle query shares one shot map with the engine geometry instrument and keeps timeline acquisition separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changed or malformed shots throw; duplicate compiled shot ids currently overwrite earlier entries rather than receiving an additional admission here.
 * @evidence contracts/common.md#meaningful-documentation All shot paths are read even for a narrower query, in code-unit path order, with project-owned byte fencing.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes manifest traversal/sorting and the sum of shot byte hashing, JSON parse and schema work.
 * @evidence contracts/performance.md#reuse-equivalent-work Each admitted shot is parsed once into this map; independent queries reread mutable generated output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns parsed shots/map; guarded project reads own descriptor release and no cross-query map is retained.
 */
export function oracleServiceReadCompiledShots(
  project: AutoMovieProductionProject,
  fingerprint: string
): ReadonlyMap<string, IAutoMovieCompiledShotSource> {
  const manifest: IAutoMovieGeneratedManifest | null = project.generatedManifest();
  if (manifest?.inputFingerprint !== fingerprint)
    throw new Error("Generated manifest changed during geometry query.");
  const output: Map<string, IAutoMovieCompiledShotSource> = new Map<string, IAutoMovieCompiledShotSource>();
  for (const entry of manifest.files
    .filter((file: IAutoMovieGeneratedFile) : boolean => file.path.startsWith("shots/"))
    .sort((left: IAutoMovieGeneratedFile, right: IAutoMovieGeneratedFile) : number => compareCodeUnits(left.path, right.path))) {
    const bytes: Uint8Array<ArrayBufferLike> = project.readGeneratedFile(entry.path);
    if (digestAutoMovieBytes(bytes) !== entry.digest)
      throw new Error(
        `Generated shot "${entry.path}" changed after builder freshness validation. Build the current source through the production builder before requesting oracle evidence.`,
      );
    const raw: unknown = parseAutoMovieStructuredJson({
      record: "compiled-shot",
      bytes,
    });
    const validation: typia.IValidation.IFailure | typia.IValidation.ISuccess<IAutoMovieCompiledShotSource> = typia.validateEquals<IAutoMovieCompiledShotSource>(raw);
    if (validation.success === false)
      throw new Error(
        `Generated shot "${entry.path}" is invalid. Build the current source through the production builder after correcting source.`,
      );
    output.set(validation.data.shot.id, validation.data);
  }
  return output;
}
