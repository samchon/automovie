/**
 * Calibrated regional skin-colour observations, distinct from PBR albedo.
 * Face studies sample forehead, cheekbone, nose tip and chin separately;
 * regional values vary even within one person
 * (https://onlinelibrary.wiley.com/doi/full/10.1002/col.22737).
 * CIELAB coordinates require the declared D65 illuminant and CIE 1931 two-
 * degree observer. Instrument geometry, specular inclusion and contact
 * pressure still affect a reading, and a camera RGB without calibration is
 * not this quantity
 * (https://onlinelibrary.wiley.com/doi/10.1002/col.22230).
 * A future appearance solver may lower these observations to material
 * reflectance under its lighting model; copying Lab numbers into linear RGB
 * would have no physical meaning. No bitmap or paint coordinates are stored.
 *
 * @evidence contracts/common.md#principled-implementation Fixed D65/two-degree observer identity and independently observed regional Lab records preserve calibrated colorimetry rather than PBR albedo. Current skinColour rules keep the measurements without an appearance solver lowering them to reflectance.
 * @evidence contracts/common.md#clear-and-simple-design One colorimetric reference owns every named facial site, with a shared Lab shape and independently assigned anatomical sides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uncalibrated camera RGB and copied Lab components do not become linear material color; no bitmap or spatial paint enters this observation record.
 * @evidence contracts/common.md#meaningful-documentation The comment supplies illuminant/observer and instrument limitations, while fields name individual facial acquisition regions and unknown omissions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no camera calibration, Lab conversion or material solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The regional observation type owns no repeated color evaluation or shared appearance cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No color chart, image buffer, texture or instrument resource is acquired by this declaration; values belong to the document.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSkinColourParameters {
  /** Fixed colorimetric reference for every site. */
  illuminant: "D65";

  /** Fixed color-matching observer for every site. */
  observer: "CIE-1931-2-degree";

  /** Midforehead skin. */
  forehead?: IAutoMovieHumanFaceSkinColourParameters.Lab;

  /** Left upper cheekbone. */
  leftCheekbone?: IAutoMovieHumanFaceSkinColourParameters.Lab;

  /** Right upper cheekbone. */
  rightCheekbone?: IAutoMovieHumanFaceSkinColourParameters.Lab;

  /** Left central cheek. */
  leftCheek?: IAutoMovieHumanFaceSkinColourParameters.Lab;

  /** Right central cheek. */
  rightCheek?: IAutoMovieHumanFaceSkinColourParameters.Lab;

  /** Pronasale region of the nose tip. */
  noseTip?: IAutoMovieHumanFaceSkinColourParameters.Lab;

  /** Midline chin skin. */
  chin?: IAutoMovieHumanFaceSkinColourParameters.Lab;
}

export namespace IAutoMovieHumanFaceSkinColourParameters {
  /**
   * CIE L*a*b* coordinates relative to the declared D65 white.
   *
   * @evidence contracts/common.md#principled-implementation One lightness scalar and two signed opponent coordinates retain the parent's D65 colorimetric reference; they are not an intrinsic linear RGB triplet and the number types perform no range validation themselves.
   * @evidence contracts/common.md#clear-and-simple-design A reusable Lab record gives each site exactly the same colorimetric coordinate vocabulary without embedding images or material instances.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Signed a/b values are not clipped into RGB factors, and no illumination compensation or uncalibrated pixel sample is supplied by the type.
   * @evidence contracts/common.md#meaningful-documentation Members identify L* in [0,100] and the signed red-green/yellow-blue axes under the parent's declared observer.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type computes no color-space transform or reflectance estimate.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lab values define no repeated color measurement or cached material result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration allocates no chart, texture or calibrated device handle; its site owner holds three scalar values.
   *
   * @author Samchon
   */
  export interface Lab {
    /** Lightness L* in [0,100]. */
    lightness: number;

    /** Red-green coordinate a*, signed. */
    redGreen: number;

    /** Yellow-blue coordinate b*, signed. */
    yellowBlue: number;
  }
}
