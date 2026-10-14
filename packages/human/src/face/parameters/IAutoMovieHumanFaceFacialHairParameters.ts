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
 * @evidence contracts/common.md#principled-implementation Named terminal-shaft site observations preserve visible density/calibre/length separately from numerical emitted shaft targets. The facialHair observation rule keeps this record; its upper-lip laterality does not establish separate cohort limits or a density-to-count conversion.
 * @evidence contracts/common.md#clear-and-simple-design Independent moustache, chin, cheek and jaw regions reuse Site while renderer-specific profiles own their emitted populations and grooming separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A photographic score is not a biological follicle count, no private texture/root coordinates author the observation, and null visible terminal hair does not remove vellus skin appearance.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes terminal/vellus hair, site-specific studies and bilateral extension limits; fields explicitly name each anatomical skin region.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no root distribution, phototrichogram analysis or beard geometry generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Site observation grouping owns no repeated emitted-shaft evaluation or measured-density cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no follicle images or beard meshes; the personal observation document owns its optional Site records.
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
   *
   * @evidence contracts/common.md#principled-implementation Optional terminal density, mean visible diameter and current visible length keep square-centimetre, micrometre and millimetre quantities distinct; zero visible length records shaving rather than zero biological density.
   * @evidence contracts/common.md#clear-and-simple-design One reusable Site carries population observations without numerical renderer budgets or per-root data.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No universal terminal-only site norm or follicle count is inferred from a score, shaft diameter or missing field; this number schema itself performs no physical-range validation.
   * @evidence contracts/common.md#meaningful-documentation Members state terminal classification, density denominator, mean calibre, current visible length and freshly shaved zero.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record computes no hair classification, density estimate or strand allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It coordinates no repeated microscopy result or emitted population reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no microscopy buffers or scalp resource; the containing document holds three optional scalars.
   *
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
