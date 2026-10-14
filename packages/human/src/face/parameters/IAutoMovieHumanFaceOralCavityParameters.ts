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
 * @evidence contracts/common.md#principled-implementation The cubic-centimetre field records residual oral-cavity-proper space under its tongue/dental acquisition pose, distinct from tongue volume and broader cavity capacity. Current observation rules keep it while clinical palate/floor-of-mouth boundaries and the common-basis inverse remain unregistered.
 * @evidence contracts/common.md#clear-and-simple-design One scalar owns this specific observed residual volume; tongue dimensions, dentition and numerical lining geometry stay with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A photograph, arbitrary wall coordinates or the earlier broader MRI cavity cannot substitute for the declared CBCT proper-space quantity; coarse lining geometry is not a clinical volume certificate.
 * @evidence contracts/common.md#meaningful-documentation The comment states the acquisition pose, residual-space meaning, cubic centimetres, incompatible broader measures and required coupled tongue/dentition/lining contact.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface computes no segmentation, cavity integral or contact solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The scalar observation coordinates no repeated cavity measurement or shared inverse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no CBCT volume or oral mesh handle; its document owns the optional measured scalar.
 *
 * @publicUnconsumed createHumanFaceAnatomicalResolver: Oral space has no validated common-basis inverse or joint tongue/dentition admission yet.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralCavityParameters {
  /** CBCT-segmented oral cavity proper residual space, in cm³. */
  properSpaceVolumeCm3?: number;
}
