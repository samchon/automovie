import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";

import { libraryCompletionBinding } from "./createLibraryCompletionEvidence";

/** Exact entry edge for an authored final screenplay's door-opening scene. */
export const shotAcceptanceCompletionBinding = (
  overrides: Partial<IAutoMovieProductionEvidenceSourceOwnerBinding> = {},
): IAutoMovieProductionEvidenceSourceOwnerBinding =>
  libraryCompletionBinding({
    branch: "shots",
    sourcePath: "src/shots/opening.ts",
    exportName: "opening",
    targetPath: "docs/final/screenplays/001-entry/001-opening.md",
    targetAnchor: "door-opens",
    ...overrides,
  });
