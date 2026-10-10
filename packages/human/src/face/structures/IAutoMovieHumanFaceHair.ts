/**
 * Numerical instructions for generating scalp locks on a shared facial basis.
 * The basis owns anatomical growth regions and neutral correspondence. This
 * document owns lengths, fields and appearance; it contains no strand positions,
 * images or identity-dependent resource key. Empty layers mean no scalp hair.
 * Coordinates are metres in the neutral head frame: +Y superior, +Z anterior,
 * and +X anatomical left. Fields describe static styling, not follicle biology,
 * elastic-rod dynamics, hair-to-hair contact or a biological density calibration.
 *
 * Existing qualified member names are declared beside this owner and refer
 * to independently owned canonical interfaces.
 * The aliases add no runtime value or second field definition.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHair {
  /** Independently generated named populations, at most eight. */
  layers: IAutoMovieHumanFaceHair.Layer[];
}

/** Qualified compatibility names share the canonical records and emit no runtime values. */
export namespace IAutoMovieHumanFaceHair {
  /**
   * Retain IAutoMovieHumanFaceHair.Layer as the qualified name of its canonical record.
   */
  export type Layer = import("./IAutoMovieHumanFaceHair/Layer").Layer;

  /**
   * Retain IAutoMovieHumanFaceHair.Region as the qualified name of its canonical record.
   */
  export type Region = import("./IAutoMovieHumanFaceHair/Region").Region;
}
