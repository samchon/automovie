/**
 * One lower eyelid's tissue and observed bag contributors, distinct from an
 * infraorbital hollow or a superficial fine line. A 114-patient study scored
 * six anatomical contributors to perceived lower-eye bags separately on
 * ordinal 0–4 scales: cheek descent/tear trough, orbital-fat prolapse,
 * skin laxity/sun damage, eyelid fluid, orbicularis hyperactivity, and malar
 * festoon (https://pubmed.ncbi.nlm.nih.gov/15809605/). These are correlated
 * clinical observations, not six independently sculptable bulges or universal
 * human bounds. CT in a separate 34-patient study measured orbital-fat
 * prolapse length and orbicularis oculi thickness as distinct structures
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC3321144/). CT dimensions cannot
 * be recovered from a face photograph. The 114-patient study scored patients,
 * so independently authored left/right scores extend its category meanings
 * without a separate laterality reliability estimate. Edema can vary over time and must not
 * be silently treated as an immutable identity trait.
 *
 * @evidence contracts/common.md#principled-implementation Distinct CT dimensions and six ordinal contributors retain their observation meanings rather than becoming independent bulge controls. Current lower-eyelid observation rules keep them without a registered clinical acquisition or physiological conversion into the existing coarse tissue shells.
 * @evidence contracts/common.md#clear-and-simple-design One lower-eyelid record separates measured structural lengths from correlated grades, while the parent eye owner assigns laterality.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No photograph infers hidden CT thickness, cohort score becomes a universal bound, or time-varying fluid grade becomes a fixed identity offset; anatomical lowering remains unresolved.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes tissues, acquisition/cohort limits, ordinal scores, laterality uncertainty and edema timing; each member names its contributor and units or labels.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type performs no bag decomposition, CT segmentation or tissue simulation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record defines no repeated pose/acquisition coordination or shared physiological result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This interface acquires no tissue shells, imaging bytes or clinical task; the observed record owns its optional scalars.
 *
 * @publicUnconsumed createHumanFaceAnatomicalResolver: Periorbital tissue scores and CT dimensions await a coupled lower-lid anatomical mapping.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLowerEyelidParameters {
  /** CT-observed anterior orbital-fat prolapse extent in mm. */
  orbitalFatProlapseLengthMm?: number;

  /** CT-observed lower orbicularis oculi thickness in mm. */
  orbicularisOculiThicknessMm?: number;

  /** Goldberg 0–4 contribution score for visible orbital-fat prolapse. */
  orbitalFatProlapseGrade?: 0 | 1 | 2 | 3 | 4;

  /** Goldberg 0–4 contribution of cheek descent and the hollow tear trough. */
  cheekDescentAndTearTroughGrade?: 0 | 1 | 2 | 3 | 4;

  /** Goldberg 0–4 skin-laxity and photodamage contribution score. */
  skinLaxityAndSunDamageGrade?: 0 | 1 | 2 | 3 | 4;

  /** Goldberg 0–4 contribution of active orbicularis prominence. */
  orbicularisHyperactivityGrade?: 0 | 1 | 2 | 3 | 4;

  /** Goldberg 0–4 fluid contribution at the observed time, not permanent identity. */
  fluidGrade?: 0 | 1 | 2 | 3 | 4;

  /** Goldberg 0–4 triangular malar-festoon contribution score. */
  malarFestoonGrade?: 0 | 1 | 2 | 3 | 4;
}
