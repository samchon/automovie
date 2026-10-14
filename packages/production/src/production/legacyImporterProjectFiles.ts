

/**
 * The v1 top-level records captured for temporary validation; automovie.json is required while the remaining slate slices are optional.
 */
export const legacyImporterProjectFiles: readonly ["automovie.json", "script.json", "scene.json", "notes.json", "film.json"] = [
  "automovie.json",
  "script.json",
  "scene.json",
  "notes.json",
  "film.json",
] as const;
