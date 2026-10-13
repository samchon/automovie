/**
 * Name of the viewer group holding a scene's standable ground.
 *
 * Mirrors `SPACE_GROUP_NAME` in the viewer. The engine cannot import the
 * viewer, and the mask has to be derivable without a renderer, so the one
 * constant both sides agree on is asserted by the test suite rather than shared
 * through a dependency that would invert the package layering.
 */
export const AUTOMOVIE_SEMANTIC_MASK_SPACE_NODE = "__automovie_space";
