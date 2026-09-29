/**
 * Internal facial tissue thickness at named anatomical regions.
 * High-frequency ultrasound distinguishes epidermis, dermis and deeper
 * subcutaneous tissue; forehead, eyelid and zygomatic readings differ by site
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC9205051/). A 967-adult ultrasound
 * study sampled soft-tissue depth at 52 craniofacial landmarks, with its own
 * adult cohort and landmark protocol (https://pubmed.ncbi.nlm.nih.gov/16563680/).
 * A colour photograph cannot determine these hidden depths. Each optional
 * region is an aggregate thickness at a named location, not a movable skin
 * vertex, cheek control point or arbitrary relief map.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSoftTissueParameters {
  /** Midforehead epidermis and dermis from in-vivo ultrasound. */
  forehead?: IAutoMovieHumanFaceSoftTissueParameters.SkinLayer;
  /** Left central upper-eyelid tissue. */
  leftUpperEyelid?: IAutoMovieHumanFaceSoftTissueParameters.SkinLayer;
  /** Right central upper-eyelid tissue. */
  rightUpperEyelid?: IAutoMovieHumanFaceSoftTissueParameters.SkinLayer;
  /** Left zygomatic eminence skin, above malar subcutaneous tissue. */
  leftZygoma?: IAutoMovieHumanFaceSoftTissueParameters.SkinLayer;
  /** Right zygomatic eminence skin, above malar subcutaneous tissue. */
  rightZygoma?: IAutoMovieHumanFaceSoftTissueParameters.SkinLayer;
  /** Nasal-dorsum epidermis and dermis. */
  nasalDorsum?: IAutoMovieHumanFaceSoftTissueParameters.SkinLayer;
  /** Midline pogonion epidermis and dermis. */
  chin?: IAutoMovieHumanFaceSoftTissueParameters.SkinLayer;
}

export namespace IAutoMovieHumanFaceSoftTissueParameters {
  /**
   * Distinct measured tissue layers in mm; neither is a renderer offset.
   * @author Samchon
   */
  export interface SkinLayer {
    /** Surface epidermis thickness, mm. */
    epidermisMm?: number;
    /** Dermis below the epidermis, mm. */
    dermisMm?: number;
  }
}
