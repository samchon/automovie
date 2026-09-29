import type { AutoMovieHumanBodySurfaceDimension } from "./AutoMovieHumanBodySurfaceDimension";

/** A straight skin-landmark distance, never a hidden bone length. @author Samchon */
export type IAutoMovieHumanBodySurfaceDistance =
  AutoMovieHumanBodySurfaceDimension<"tape" | "caliper" | "surface-scan">;
