

/**
 * The v1 per-record directory populations recursively captured into the temporary validation snapshot; an absent population contributes no files.
 */
export const legacyImporterProjectDirectories: readonly ["scenes", "shots", "beatEnds", "props", "actors"] = [
  "scenes",
  "shots",
  "beatEnds",
  "props",
  "actors",
] as const;
