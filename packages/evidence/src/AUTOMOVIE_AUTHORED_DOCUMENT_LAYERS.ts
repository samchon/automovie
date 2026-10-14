
/**
 * The authored Markdown families shared by production graphs and readers.
 *
 * Contracts and population accounts describe obligations on this population; they are not themselves authored work to include in an edition or reference response. Keeping the family identity here lets both readers select the same work without executing the graph declaration.
 *
 * The thirteen ordered names supply the closed authored-layer type and shared graph, binder and reference-reader membership. Production titles and fixtures do not add private families, and selecting these identities does not evaluate a production graph or import a runtime reader.
 *
 * Module initialization retains one fixed thirteen-entry tuple. Consumers share it without project traversal, cached document results, source contents or handles.
 */
export const AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS: readonly [
  "briefs", "instances", "maps", "materials", "models", "motions", "research",
  "screenplays", "scripts", "settings", "spaces", "systems", "treatments",
] = [
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
