import type { AutoMovieHumanBodyTomographicModality } from "./AutoMovieHumanBodyTomographicModality";
import type { IAutoMovieHumanBodyMeasuredLength } from "./IAutoMovieHumanBodyMeasuredLength";

/**
 * A 3D imaging-derived length or a fictional target of the same quantity.
 *
 * Sphere fitting to a whole articular head requires 3D geometry; a single
 * projected radiographic circle does not establish its 3D sphere radius.
 * Shao et al. 2024, doi:10.1038/s41598-024-72123-6, map serial CT head
 * slices into 3D before fitting a femoral-head sphere.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTomographicLength =
  | { readonly kind: "target"; readonly millimetres: number }
  | (IAutoMovieHumanBodyMeasuredLength & {
      readonly modality: AutoMovieHumanBodyTomographicModality;
    });
