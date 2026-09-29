/**
 * Imaging-derived tongue size, distinct from its performed displacement.
 * MRI has measured tongue volume in adult cohorts (for example 70 adults
 * aged 20 to 37, https://pubmed.ncbi.nlm.nih.gov/19901040/). A frontal face
 * photograph does not supply this internal dimension. A separate MRI study
 * measured coronal width and height at the start of the posterior tongue
 * base, with neck extended and mouth closed
 * (https://academic.oup.com/sleep/article/45/2/zsab295/6486313). This section
 * is not the whole tongue's maximum width or thickness, and its subject
 * cohort included adults with obstructive sleep apnoea. A tip-to-vallecula
 * MRI length is another published protocol, with a different posterior
 * boundary (https://pmc.ncbi.nlm.nih.gov/articles/PMC4236604/). These
 * measurements must retain their own acquisition identity instead of being
 * relabelled universal length, width and thickness sliders.
 * Together they still do not determine a surface or permit direct section sculpting.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceTongueParameters {
  /** Whole segmented tongue volume in cubic centimetres from MRI. */
  volumeCm3?: number;
  /** Tip to vallecula straight distance on sagittal CT/MRI, in mm. */
  tipToValleculaLengthMm?: number;
  /** Posterior-base coronal MRI at the start of the base, neck extended. */
  posteriorBaseCoronal?: {
    /** Left-to-right cross-section extent in mm, not whole-tongue breadth. */
    widthMm?: number;
    /** Superior-to-inferior cross-section extent in mm, not whole-tongue thickness. */
    heightMm?: number;
  };
}
