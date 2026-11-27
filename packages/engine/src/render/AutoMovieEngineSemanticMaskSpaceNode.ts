/**
 * Name of the viewer group holding a scene's standable ground.
 *
 * Mirrors `AutoMovieRenderSpaceGroupName` in the viewer. The engine cannot import the
 * viewer, and the mask has to be derivable without a renderer, so the one
 * constant both sides agree on is asserted by the test suite rather than shared
 * through a dependency that would invert the package layering.
 */
export const AutoMovieEngineSemanticMaskSpaceNode = "__automovie_space";
