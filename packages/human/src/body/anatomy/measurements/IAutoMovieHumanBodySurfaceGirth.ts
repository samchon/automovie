import type { AutoMovieHumanBodySurfaceDimension } from "./AutoMovieHumanBodySurfaceDimension";

/**
 * A skin circumference observed by tape or validated surface scan.
 * Calipers measure a straight breadth and are excluded from observed girths.
 * @author Samchon
 */
export type IAutoMovieHumanBodySurfaceGirth =
  AutoMovieHumanBodySurfaceDimension<"tape" | "surface-scan">;
