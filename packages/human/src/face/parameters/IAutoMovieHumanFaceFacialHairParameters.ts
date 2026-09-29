/**
 * Visible terminal facial-hair populations by anatomical skin region.
 * Phototrichogram research distinguishes cheek, chin and upper-lip density,
 * and reports site and cohort differences
 * (https://doi.org/10.1111/ics.12510). A photographic validation study
 * measured beard density but warned against equating an image score with a
 * biological follicle count (https://pmc.ncbi.nlm.nih.gov/articles/PMC3676674/).
 * The cited upper-lip site was sampled as one region. Left/right subdivision
 * preserves an individual's asymmetry but has no separate bilateral cohort
 * interval from that study.
 * This type carries no follicle coordinates, beard cards or private textures.
 * Vellus facial hair belongs to skin appearance and is not removed by a null
 * visible-beard document.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceFacialHairParameters {
  /** Anatomical-left moustache region above the upper vermilion. */
  leftUpperLip?: IAutoMovieHumanFaceFacialHairParameters.Site;
  /** Anatomical-right moustache region above the upper vermilion. */
  rightUpperLip?: IAutoMovieHumanFaceFacialHairParameters.Site;
  /** Mental eminence below the lower lip. */
  chin?: IAutoMovieHumanFaceFacialHairParameters.Site;
  /** Anatomical left cheek. */
  leftCheek?: IAutoMovieHumanFaceFacialHairParameters.Site;
  /** Anatomical right cheek. */
  rightCheek?: IAutoMovieHumanFaceFacialHairParameters.Site;
  /** Left mandibular margin. */
  leftJaw?: IAutoMovieHumanFaceFacialHairParameters.Site;
  /** Right mandibular margin. */
  rightJaw?: IAutoMovieHumanFaceFacialHairParameters.Site;
}

export namespace IAutoMovieHumanFaceFacialHairParameters {
  /**
   * Terminal-hair population at one skin region.
   * @author Samchon
   */
  export interface Site {
    /** Visible terminal shafts per square centimetre. */
    terminalHairsPerCm2?: number;
    /** Mean visible shaft diameter in micrometres. */
    shaftDiameterMicrometres?: number;
    /** Current mean visible shaft length in mm, including freshly shaved zero. */
    visibleLengthMm?: number;
  }
}
