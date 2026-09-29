import type { IAutoMovieHumanBodyMeasuredVolume } from "./IAutoMovieHumanBodyMeasuredVolume";

/**
 * A target bone/tissue volume or a direct CT/MRI segmentation.
 * Neither scalar uniquely determines that tissue's 3D boundary or attachment.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalVolume =
  | { readonly kind: "target"; readonly millilitres: number }
  | IAutoMovieHumanBodyMeasuredVolume;
