import type { AutoMovieHumanBodySurfaceDimension } from "./AutoMovieHumanBodySurfaceDimension";

/**
 * Distance following the skin between named landmarks, in metres.
 *
 * The same endpoints have a shorter straight vector distance; a clinical
 * standing tape along breast skin or a scan-derived surface path must not be
 * passed off as that vector. Oranges et al. 2019, doi:10.21873/invivo.11548,
 * measure both paths separately in a breast-scanning validation study.
 * @author Samchon
 */
export type IAutoMovieHumanBodySurfaceArc = AutoMovieHumanBodySurfaceDimension<
  "tape" | "surface-scan",
  "standing"
>;
