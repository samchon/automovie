/**
 * One cheek's compartment volumes, distinct from facial width and skin layers.
 * An MRI study measured superficial and deep cheek fat compartments in 87
 * adults and found BMI associations; it did not establish that age alone sets
 * a person's cheek volume (https://pubmed.ncbi.nlm.nih.gov/36877747/).
 * These internal cubic-centimetre observations cannot be recovered from a
 * portrait or replaced by a free malar bump, control point or vertex field.
 * The future resolver must preserve the shared zygomatic, buccal, lower-lid
 * and oral boundaries when distributing either volume.
 *
 * @evidence contracts/common.md#principled-implementation Separate superficial/deep compartment volumes record MRI observations in cubic centimetres; HUMAN_FACE_OBSERVATION_RULES currently keeps this subtree unchanged because no fat-compartment geometry or observation-to-shape conversion exists.
 * @evidence contracts/common.md#clear-and-simple-design One side's two compartments stay in this record, while CheekPair owns bilateral independence and the anatomy resolver owns admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No portrait-derived volume, age-based default, malar bump or numerical mesh control substitutes for an internal measurement; shape lowering remains absent.
 * @evidence contracts/common.md#meaningful-documentation The comment names the MRI acquisition, compartment units, population limitations, and required neighbouring boundaries for any future conversion; omission remains an unknown observation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares two optional scalar observations and executes no volume calculation or traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record coordinates no MRI requests, derived geometry, or cached population fit.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no imaging bytes or resources; the personal document owns its actual scalar values.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceCheekParameters {
  /** Superficial cheek-fat compartment volume from MRI, in cm³. */
  superficialFatVolumeCm3?: number;

  /** Deep cheek-fat compartment volume from MRI, in cm³. */
  deepFatVolumeCm3?: number;
}
