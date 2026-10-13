/**
 * Internal facial tissue thickness at named anatomical regions.
 * High-frequency ultrasound distinguishes epidermis, dermis and deeper
 * subcutaneous tissue; forehead, eyelid and zygomatic readings differ by site
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC9205051/). A 967-adult ultrasound
 * study sampled soft-tissue depth at 52 craniofacial landmarks, with its own
 * adult cohort and landmark protocol (https://pubmed.ncbi.nlm.nih.gov/16563680/).
 * A separate 238-person forehead ultrasound study distinguished superficial
 * subcutaneous tissue, frontalis muscle and deep subcutaneous tissue below
 * the skin (https://pmc.ncbi.nlm.nih.gov/articles/PMC12728503/). These layers
 * are not interchangeable with epidermal or dermal thickness.
 * A colour photograph cannot determine these hidden depths. Each optional
 * field is a thickness of one named layer at a named location, not a movable
 * skin vertex, cheek control point or arbitrary relief map.
 *
 * @evidence contracts/common.md#principled-implementation Site-specific epidermal/dermal records and separate midforehead superficial/muscular/deep layers retain ultrasound acquisition quantities. Current rules keep soft-tissue observations without converting hidden thicknesses into numerical offsets.
 * @evidence contracts/common.md#clear-and-simple-design Named bilateral facial sites reuse SkinLayer while ForeheadDeepTissue owns the distinct below-dermis layers instead of another generic depth.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A colour portrait supplies no hidden tissue depth, cohort values become no universal range, and neither layer quantity is a movable vertex or relief map.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes sources, cohort/site and layer identities; fields name anatomical acquisition sites and nested members state millimetres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type performs no ultrasound segmentation or tissue geometry algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Site grouping defines no shared imaging acquisition or inverse result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no scan buffers or tissue shells; optional observations belong to the document.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSoftTissueParameters {
  /** Midforehead epidermis and dermis from in-vivo ultrasound. */
  forehead?: IAutoMovieHumanFaceSoftTissueParameters.SkinLayer;

  /** Midforehead tissue below the dermis, from layer-resolving ultrasound. */
  foreheadDeepTissue?: IAutoMovieHumanFaceSoftTissueParameters.ForeheadDeepTissue;

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
   * Layer-resolved midforehead subcutaneous and muscular thicknesses, in mm.
   *
   * @evidence contracts/common.md#principled-implementation Three named below-dermis layers preserve their anatomical order around frontalis in the same ultrasound section rather than one interchangeable soft-tissue depth.
   * @evidence contracts/common.md#clear-and-simple-design A local ForeheadDeepTissue owner groups the superficial fat, muscle and deep fat separately from SkinLayer's epidermis/dermis.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts These observations do not expose independent sculpt offsets or infer an omitted layer from total depth; the number types validate no biological range themselves.
   * @evidence contracts/common.md#meaningful-documentation Members state each layer's relationship to dermis, frontalis and periosteum and its millimetre unit.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The interface computes no layer decomposition or mechanical model.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The scalar record defines no repeated ultrasound analysis or retained solve.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No imaging task or volumetric data is acquired; the document owns three optional observations.
   *
   * @author Samchon
   */
  export interface ForeheadDeepTissue {
    /** Superficial subcutaneous tissue between dermis and frontalis, mm. */
    superficialSubcutaneousMm?: number;

    /** Frontalis muscle thickness in the same ultrasound section, mm. */
    frontalisMuscleMm?: number;

    /** Deep subcutaneous tissue behind frontalis, toward periosteum, mm. */
    deepSubcutaneousMm?: number;
  }

  /**
   * Distinct measured tissue layers in mm; neither is a renderer offset.
   *
   * @evidence contracts/common.md#principled-implementation Epidermis and dermis remain separate site-specific measured layers; their owner supplies the anatomical site and acquisition context.
   * @evidence contracts/common.md#clear-and-simple-design One reusable two-layer record serves the parent's named skin sites without conflating muscle or subcutaneous depth.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither thickness supplies a surface offset, pixel-derived hidden measurement or default for an unknown layer; physical range validation is outside this interface.
   * @evidence contracts/common.md#meaningful-documentation Fields distinguish surface epidermis from underlying dermis and explicitly use millimetres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type chooses no epidermal measurement or skin construction algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reusable field shape defines no cached imaging result or shared tissue computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration acquires no skin mesh, image or instrument; its parent owns two optional scalar values.
   *
   * @author Samchon
   */
  export interface SkinLayer {
    /** Surface epidermis thickness, mm. */
    epidermisMm?: number;

    /** Dermis below the epidermis, mm. */
    dermisMm?: number;
  }
}
