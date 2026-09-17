/**
 * Stable procedural-geometry import surface. Each definition and mathematical
 * contract lives with its shape, shared construction, composition or inspection
 * owner. Re-exports retain the existing API without adding a forwarding layer.
 */
export type {
  IAutoMovieProfilePoint,
  IAutoMovieWallOpening,
  IAutoMovieMeshTransform,
  IAutoMovieMeshPart,
  IAutoMovieMeshGroup,
  IAutoMovieMeshAssembly,
  IAutoMovieMeshTopology,
  IAutoMovieRegionRing,
  IAutoMovieRegionTriangulation,
  IAutoMovieLoftSection,
} from "./proceduralMeshTypes";
export {
  extrudeAutoMovieProfile,
  sweepAutoMovieProfile,
} from "./proceduralConvexProfile";
export { revolveAutoMovieProfile } from "./proceduralRevolution";
export { buildAutoMoviePolyhedron } from "./proceduralPolyhedron";
export { buildAutoMovieWall } from "./proceduralWall";
export { triangulateAutoMovieRegion } from "./proceduralRegionTriangulation";
export { extrudeAutoMovieRegion } from "./proceduralRegionExtrusion";
export { loftAutoMovieSections } from "./proceduralLoft";
export {
  mergeAutoMovieMeshes,
  transformAutoMovieMesh,
  mergeAutoMovieMeshParts,
} from "./proceduralMeshAssembly";
export { inspectAutoMovieMeshTopology } from "./proceduralMeshTopology";
