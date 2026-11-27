// The engine internals the test programme reads directly. They are not part of the public surface: a host reaches the engine through the main entry. Each folder's barrel holds that folder's exports.

export { markAutoMovieSlip } from "./validation/internal/markAutoMovieSlip";
export { unsupportedAutoMovieMaterialExtensions } from "./validation/internal/unsupportedAutoMovieMaterialExtensions";
export { validateUniqueIds } from "./validation/internal/validateUniqueIds";
export { violation } from "./validation/internal/violation";
export { validateExpression } from "./validation/internal/validateExpression";
export { appendGraphCycles } from "./validation/internal/appendGraphCycles";
export { validatePose } from "./validation/internal/validatePose";
export { collectDeclaredIds } from "./validation/internal/collectDeclaredIds";
export * from "./film/internal";
export { trianglesOf } from "./geometry/planar-region/internal/trianglesOf";
