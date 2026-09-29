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
