
/**
 * The authored Markdown families shared by production graphs and readers.
 *
 * Contracts and population accounts describe obligations on this population;
 * they are not themselves authored work to include in an edition or reference
 * response. Keeping the family identity here lets both readers select the same
 * work without executing the graph declaration.
 *
 * The thirteen ordered names are the authored Markdown families selected by production graphs and reference readers; contracts and population accounts describe obligations and are deliberately outside this work population.
 * This registry owns shared document-family identity without evaluating a production graph or importing a runtime reader.
 * Every name identifies an actual supported authored family, and no production title or fixture adds a private namespace.
 * The comment explains which Markdown families count as authored work and why contract and account documents do not belong to editions or reference responses.
 * The registry is a thirteen-entry readonly tuple with no construction traversal beyond module initialization.
 * Graph and reference consumers share this one ordered registry; its tuple also supplies the closed authored-layer type.
 * One process-owned array retains thirteen constant strings and no project contents or handles.
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
