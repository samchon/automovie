/**
 * Optical authoring values, deliberately outside anthropometric shape.
 * Linear RGB albedo and perceptual roughness follow the glTF metallic-roughness
 * material interpretation (https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).
 * These are renderer parameters under calibrated illumination, not measured
 * melanin, haemoglobin or iris-cell concentrations. A photograph without known
 * illuminant and exposure cannot certify the intrinsic albedo. Values change
 * appearance without supplying a personal image, spatial paint or mesh.
 *
 * @evidence contracts/common.md#principled-implementation Named surface Finish records separate linear RGB reflectance factors and perceptual roughness from anthropometric geometry. Clinical appearance observations are kept unchanged by observation rules; current rendered materials and the facial-hair producer consume their own explicit numerical finishes.
 * @evidence contracts/common.md#clear-and-simple-design Each named tissue or bilateral fibre/iris surface reuses one Finish shape, avoiding per-vertex painting or another anatomical parameter hierarchy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No photograph, melanin estimate or per-person texture is converted into albedo here; an observation record does not claim a completed appearance solver or shape change.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes linear reflectance and perceptual roughness from anatomy and uncalibrated photography, and members assign each optional finish to its actual tissue/side.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares optional finish records and selects no shading or color-conversion algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no renderer requests or shared computed material instances.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration acquires no texture, material handle or GPU resource; the document and actual renderer own their values and resources.
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
   *
   * @evidence contracts/common.md#principled-implementation Three linear color factors and one perceptual roughness scalar retain the same bounded optical vocabulary across named facial finishes; number types themselves do not validate the documented [0,1] ranges.
   * @evidence contracts/common.md#clear-and-simple-design The four scalars form one reusable surface response with no geometry fields or independent renderer wrapper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record introduces no default color, exposure correction, spatial paint or anatomical inference; consumers must admit their numerical inputs.
   * @evidence contracts/common.md#meaningful-documentation Each channel states linear RGB and [0,1], while roughness is explicitly perceptual rather than a skin-age or anatomy measure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This Finish interface executes no optical calculation or array processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A Finish value defines no computed-result equivalence or material-instance cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural record allocates no renderer resource or texture bytes; producers own the actual four-scalar object.
   *
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
