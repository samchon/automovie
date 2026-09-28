import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import type { IAutoMovieGeneratedManifest } from "@automovie/interface";
import {
  AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
  digestAutoMovieBytes,
  inspectAutoMovieLibraryProjectState,
  materializeAutoMovieLibraryFiles,
} from "@automovie/production";

import {
  createLibraryCompletionEvidence,
  libraryCompletionBinding,
} from "./createLibraryCompletionEvidence";

/** Reopen a typed zero-payload publication entirely from memory. */
export const inspectLibraryCompletionPublication = (
  bindings: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[],
  include: boolean = true,
): string[] => {
  const binding = libraryCompletionBinding();
  const inputFingerprint = `sha256:${"2".repeat(64)}` as const;
  const result = materializeAutoMovieLibraryFiles({
    production: "completion",
    builder: AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
    inputFingerprint,
    results: include
      ? [
          {
            branch: "productionSources",
            owner: "docs/settings/delivery.md#delivery",
            source: binding.sourcePath,
            export: binding.exportName,
            sourceDigest: binding.sourceDigest,
            contribution: { environments: [], models: [], contexts: [] },
          },
        ]
      : [],
  });
  const manifest: IAutoMovieGeneratedManifest = {
    version: 1,
    builder: {
      packageVersion: "0.0.0",
      protocolVersion: AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
    },
    inputFingerprint,
    files: [...result.files].map(([file, bytes]) => ({
      path: file,
      digest: digestAutoMovieBytes(bytes),
      owner: "builder",
      sourceTargets: ["library"],
    })),
  };
  return inspectAutoMovieLibraryProjectState({
    production: "completion",
    builder: AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
    inputFingerprint,
    authoringEvidence: createLibraryCompletionEvidence(bindings),
    manifest,
    readFile: (file) => result.files.get(file)!,
  }).problems.map((problem) => problem.code);
};
