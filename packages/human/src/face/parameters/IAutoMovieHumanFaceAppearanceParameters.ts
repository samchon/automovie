/**
 * Optical authoring values, deliberately outside anthropometric shape.
 * Linear RGB albedo and perceptual roughness follow the glTF metallic-roughness
 * material interpretation (https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).
 * These are renderer parameters under calibrated illumination, not measured
 * melanin, haemoglobin or iris-cell concentrations. A photograph without known
 * illuminant and exposure cannot certify the intrinsic albedo. Values change
 * appearance without supplying a personal image, spatial paint or mesh.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAppearanceParameters {
  /** Shared head-skin albedo, with no per-vertex pigmentation authoring. */
  skin?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Vermilion albedo and roughness. */
  lips?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Left iris appearance, independently authored. */
  leftIris?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Right iris appearance, independently authored. */
  rightIris?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Visible scleral appearance outside the corneal limbus. */
  sclera?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Left eyebrow fibre appearance. */
  leftBrow?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Right eyebrow fibre appearance. */
  rightBrow?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Left eyelash fibre appearance. */
  leftLashes?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Right eyelash fibre appearance. */
  rightLashes?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Pigmented hair-shaft appearance; greying belongs to hair biology. */
  hair?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Pigmented visible moustache and beard shafts. */
  facialHair?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Visible dental enamel and prosthetic crown finish. */
  teeth?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Visible tongue mucosal finish. */
  tongue?: IAutoMovieHumanFaceAppearanceParameters.Finish;
  /** Inner cheek and vestibular oral lining finish. */
  oralLining?: IAutoMovieHumanFaceAppearanceParameters.Finish;
}

export namespace IAutoMovieHumanFaceAppearanceParameters {
  /**
   * One surface's linear reflected-colour factor and microsurface response.
   * @author Samchon
   */
  export interface Finish {
    /** Red linear RGB factor in [0,1]. */
    red: number;
    /** Green linear RGB factor in [0,1]. */
    green: number;
    /** Blue linear RGB factor in [0,1]. */
    blue: number;
    /** Perceptual roughness in [0,1], not a skin age or anatomy measure. */
    roughness: number;
  }
}
