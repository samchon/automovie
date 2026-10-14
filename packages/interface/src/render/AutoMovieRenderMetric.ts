/**
 * The closed set of render costs a production can budget and a report can answer for.
 *
 * The list is closed on purpose. A budget whose metric names are free strings cannot be checked: a typo silently becomes an unbudgeted quantity, and a report cannot state that an analysis is missing because it never knew the analysis existed. Every metric here appears in every report exactly once, carrying either a measured number or the reason there is none, which is what makes the report a bounded, complete answer rather than a variable-length dump of whatever happened to be computed.
 *
 * Units:
 *
 * - `materials`, `lights`, `shadowMaps`, `nodes`, `instanceSets`, `instanceChunks` and admitted `fluidCells` count the inventory's declared logical populations, not every native scene object or allocation.
 * - `textures` counts certified upload/target representations, including conservative environment sampling-state unions; missing allocation authority leaves it null rather than an exact native census.
 * - `drawCalls` is an upper bound on the draw submissions one frame can issue, never an observed number: culling only ever lowers it.
 * - `triangles`, `vertices` and `instanceSlots` are exact for anything whose shape the design fixes, and upper bounds wherever runtime state chooses how much of it draws: a slot picks a level of detail by distance, a fern bed grows to at most its recipe's worst case, and a water quad is skipped unless all four of its cells are wet. Every such choice only lowers the number, which is the one direction a budget can be checked in.
 * - `fluidParticles` is the declared emitter cap, likewise an upper bound: a spray never exceeds it and distance thinning cuts it further.
 * - `textureBytes` bounds the represented uncompressed resident texels and attachments under supplied host facts, excluding driver overhead and encoded/CPU bytes. `geometryBytes` estimates declared prototype and surface buffers, excluding native chunk clones and instance streams; it is not a bound on all GPU geometry memory.
 *
 * @evidence contracts/common.md#principled-implementation A closed metric population matches the engine inventory and report protocol, with exact counts, conservative draw/geometry upper bounds and estimated device bytes distinguished by their measurement law.
 * @evidence contracts/common.md#clear-and-simple-design One shared vocabulary makes budgets and complete reports address the same bounded cost domains rather than free-string metrics whose typos silently disappear.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing certified texture facts remain null with gaps. LOD/culling only reduce declared geometry/submission bounds, while prototype-buffer geometryBytes and logical populations do not claim complete native GPU allocation or object counts.
 * @evidence contracts/common.md#meaningful-documentation Defines each metric's count, upper-bound or estimated-byte interpretation and why report completeness uses the closed population.
 * @author Samchon
 */
export type AutoMovieRenderMetric =
  | "triangles"
  | "vertices"
  | "drawCalls"
  | "materials"
  | "textures"
  | "textureBytes"
  | "geometryBytes"
  | "lights"
  | "shadowMaps"
  | "nodes"
  | "instanceSets"
  | "instanceSlots"
  | "instanceChunks"
  | "fluidCells"
  | "fluidParticles";
