/**
 * One external auricle's named 3D dimensions, never a free pinna outline.
 * Superaurale/subaurale, preaurale/postaurale and otobasion landmarks are used
 * in 3D ear studies. A Korean multicentre CT cohort measured length, width,
 * protrusion and lobule on 631 adults aged 20 to 92; its distribution is a
 * study population, not a universal hard interval
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC12148551/). The separate
 * superaurale-subaurale-otobasion superius angle uses three named points
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC10432210/).
 * Conchal height and breadth use the bowl's anatomical superior, inferior,
 * anterior and posterior extrema, with its long direction referenced to the
 * auricle attachment line (https://pmc.ncbi.nlm.nih.gov/articles/PMC6018292/).
 * Tragus-to-antihelix, tragus-to-helix, conchal depth and lobule dimensions
 * are separately measured in external-ear anthropometry
 * (https://pubmed.ncbi.nlm.nih.gov/34821348/;
 * https://www.sciencedirect.com/science/article/pii/S0165587603002210).
 * A 3D auricle study classified the helix rim as rolled, broad over scapha,
 * flat or concave (https://pmc.ncbi.nlm.nih.gov/articles/PMC10432210/).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEarParameters {
  /** Superaurale to subaurale, full auricle length in mm. */
  lengthMm?: number;
  /** Preaurale to postaurale, maximum auricle breadth in mm. */
  breadthMm?: number;
  /** Otobasion superius to inferius, attachment length in mm. */
  attachmentLengthMm?: number;
  /** Auricle-to-scalp protrusion at the superaurale level, in mm. */
  superiorProjectionMm?: number;
  /** Auricle-to-scalp protrusion at the tragal level, in mm. */
  tragalProjectionMm?: number;
  /** Angle superaurale-subaurale-otobasion superius, in degrees. */
  inclinationDegrees?: number;
  /** Superior-to-inferior conchal bowl length, parallel to the ear attachment, mm. */
  conchaLengthMm?: number;
  /** Anterior-to-posterior conchal bowl breadth, orthogonal to its length, mm. */
  conchaBreadthMm?: number;
  /** Depth from conchal entrance plane to the bowl floor, mm. */
  conchaDepthMm?: number;
  /** Tragus-to-antihelix straight landmark distance, mm. */
  tragusToAntihelixMm?: number;
  /** Tragus-to-helix straight landmark distance, mm. */
  tragusToHelixMm?: number;
  /** Intertragic notch to lowest lobule extent, in mm. */
  lobuleLengthMm?: number;
  /** Maximum anterior-to-posterior lobule breadth, in mm. */
  lobuleBreadthMm?: number;
  /** Anatomical helix-rim observation, not a free outline control. */
  helixRimProfile?: "rolled" | "broad-over-scapha" | "flat" | "concave-margin";
  /** Korean CT lobule-shape categories, independent of attachment. */
  lobuleShape?: "tapering" | "square" | "pendulate";
  /** Lobe attachment to cheek; a named anatomical category. */
  lobuleAttachment?: "free" | "partly-attached" | "attached";
}
