import type { AutoMovieHumanBodyTomographicModality } from "./AutoMovieHumanBodyTomographicModality";
import type { IAutoMovieHumanBodyMeasuredAngle } from "./IAutoMovieHumanBodyMeasuredAngle";

/**
 * A 3D bone-axis angle or a fictional target of that same angle.
 *
 * Femoral neck anteversion compares an axial neck direction with the
 * condylar frame; a single planar radiograph cannot recover both 3D axes.
 * CT and MRI use both proximal neck and distal condylar views in the direct
 * comparison by Hesham et al. 2017, doi:10.1097/BPO.0000000000000712.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTomographicAngle =
  | { readonly kind: "target"; readonly degrees: number }
  | (IAutoMovieHumanBodyMeasuredAngle & {
      readonly modality: AutoMovieHumanBodyTomographicModality;
    });
