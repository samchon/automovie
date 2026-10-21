/**
 * Curve coefficient contracts, admission, evaluation and parent-context assembly.
 * This barrel re-exports each owner without introducing computation or state.
 */
export * from "./IAutoMovieCurve64";
export * from "./IAutoMovieCurveAssembly64";
export * from "./AutoMovieCurveParentContext";
export * from "./assertAutoMovieCurve64";
export * from "./assertAutoMovieCurveBoundary64";
export * from "./evaluateAutoMovieBernstein64";
export * from "./evaluateAutoMovieCurve64";
export * from "./generateAutoMovieCurveAssembly64";
export * from "./AutoMoviePchip64";
export * from "./AutoMoviePchipField64";
export * from "./AutoMovieCurveMath64";
export * from "./rootsAutoMovieCubicBernstein64";
export * from "./AutoMovieBernstein64";
export * from "./AutoMovieClampedTailField64";
export * from "./AutoMovieCubicOval64";
export * from "./generateAutoMovieSupportCurve64";
export * from "./measureAutoMovieCubicCurveLength64";
export * from "./IAutoMovieContourLoft64";
export * from "./IAutoMovieCurveGrid64";
export * from "./AutoMovieContourLoftCurves64";
export * from "./AutoMovieLocalHermiteField64";
export * from "./tessellateAutoMovieContourLoft64";
export * from "./tessellateAutoMovieContourStrip64";
export * from "./tessellateAutoMovieCurveGrid64";
export * from "./tessellateAutoMovieLocalHermite64";
export * from "./tessellateAutoMovieBicubicAtlas64";
export * from "./tessellateAutoMovieParametricAtlas64";
export * from "./prepareAutoMovieBicubicAtlasBoundary64";
export * from "./AutoMovieCanonicalBoundary64";
export * from "./evaluateAutoMovieHermiteGregory64";
export * from "./tessellateAutoMovieContourPath64";
export * from "./evaluateAutoMovieImplicitProjection64";
export { generateAutoMovieContourLoft64 } from "./generateAutoMovieContourLoft64";
export type { IAutoMovieContourLoftEmission64 } from "./IAutoMovieContourLoftEmission64";
export type { IAutoMovieContourLoftSink64 } from "./IAutoMovieContourLoftSink64";
