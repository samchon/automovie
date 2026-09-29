/**
 * MRI-segmented tongue size, distinct from its performed displacement.
 * MRI has measured tongue volume in adult cohorts (for example 70 adults
 * aged 20 to 37, https://pubmed.ncbi.nlm.nih.gov/19901040/). A frontal face
 * photograph does not supply this internal dimension. Published length,
 * breadth and thickness protocols use different posterior boundaries and
 * acquisition planes, so no ungrounded universal section control is exposed.
 * Volume alone does not determine a surface or permit direct section sculpting.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceTongueParameters {
  /** Whole segmented tongue volume in cubic centimetres from MRI. */
  volumeCm3?: number;
}
