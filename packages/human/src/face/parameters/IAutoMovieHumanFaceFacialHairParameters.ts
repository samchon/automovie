/**
 * Visible terminal facial-hair populations by anatomical skin region.
 * Phototrichogram research distinguishes cheek, chin and upper-lip body-hair
 * density, but does not supply a terminal-only norm for every site
 * (https://pubmed.ncbi.nlm.nih.gov/30580453/). A beard donor-zone study
 * reports shaft density per cm² (https://pmc.ncbi.nlm.nih.gov/articles/PMC6484564/),
 * while digital microscopy distinguishes terminal from vellus facial shafts
 * by observed diameter (https://pmc.ncbi.nlm.nih.gov/articles/PMC12629248/).
 * A photographic validation study warns against equating an image score with
 * a biological follicle count (https://pmc.ncbi.nlm.nih.gov/articles/PMC3676674/).
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
    /** Classified visible terminal shafts per square centimetre; no universal site norm. */
    terminalHairsPerCm2?: number;
    /** Mean visible shaft diameter in micrometres. */
    shaftDiameterMicrometres?: number;
    /** Current mean visible shaft length in mm, including freshly shaved zero. */
    visibleLengthMm?: number;
  }
}
