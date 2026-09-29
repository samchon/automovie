/**
 * Observed space around the tongue within the oral cavity proper.
 * A contrast-coated CBCT study in twenty adults separately segmented tongue
 * tissue and the residual space between tongue dorsum and palate, beneath the
 * tongue and above the floor of mouth, and between tongue and teeth. The
 * subjects placed the tongue tip against the lingual surfaces of the lower
 * incisors (https://pmc.ncbi.nlm.nih.gov/articles/PMC5996000/). This volume
 * changes with tongue posture and dental occlusion. It is distinct from
 * total cavity capacity (tongue plus proper space) and from the earlier MRI
 * study's broader cavity including oropharynx
 * (https://pubmed.ncbi.nlm.nih.gov/1928821/). A photograph cannot observe it.
 * The numeric input never supplies arbitrary oral-wall coordinates or a
 * cavity cross-section; the future resolver must enforce tongue, palate,
 * dentition and lining contact together.
 *
 * @publicUnconsumed createHumanFaceAnatomicalResolver: Oral space has no validated common-basis inverse or joint tongue/dentition admission yet.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralCavityParameters {
  /** CBCT-segmented oral cavity proper residual space, in cm³. */
  properSpaceVolumeCm3?: number;
}
