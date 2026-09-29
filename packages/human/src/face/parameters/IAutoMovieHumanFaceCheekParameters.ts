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
 * @author Samchon
 */
export interface IAutoMovieHumanFaceCheekParameters {
  /** Superficial cheek-fat compartment volume from MRI, in cm³. */
  superficialFatVolumeCm3?: number;
  /** Deep cheek-fat compartment volume from MRI, in cm³. */
  deepFatVolumeCm3?: number;
}
