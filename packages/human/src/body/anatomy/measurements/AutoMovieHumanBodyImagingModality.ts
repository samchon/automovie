import type { AutoMovieHumanBodyTomographicModality } from "./AutoMovieHumanBodyTomographicModality";

/** Imaging of a length or angle; radiography cannot segment a 3D volume. @author Samchon */
export type AutoMovieHumanBodyImagingModality =
  | AutoMovieHumanBodyTomographicModality
  | "radiograph";
