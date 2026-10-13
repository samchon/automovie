/**
 * The authored Markdown families shared by production graphs and readers.
 *
 * Contracts and population accounts describe obligations on this population;
 * they are not themselves authored work to include in an edition or reference
 * response. Keeping the family identity here lets both readers select the same
 * work without executing the graph declaration.
 */
export const AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS = [
  "briefs",
  "instances",
  "maps",
  "materials",
  "models",
  "motions",
  "research",
  "screenplays",
  "scripts",
  "settings",
  "spaces",
  "systems",
  "treatments",
] as const;

/**
 * One authored Markdown family selected by a graph, edition, or reference read.
 */
export type AutoMovieAuthoredDocumentLayer =
  (typeof AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS)[number];
