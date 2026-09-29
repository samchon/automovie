/**
 * Distances between named craniofacial landmarks on one neutral head.
 * All values are straight 3D millimetre distances, not width-scale morphs or
 * pixel spans. Cranial euryon, frontotemporale and opisthocranion require
 * coverage beyond a frontal face photograph. The 3D Facial Norms study used
 * spreading calipers for those head distances and stereophotogrammetry for
 * visible face and tragion distances; it did not assert that every distance
 * can be recovered from one portrait (Weinberg et al., 2016,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4841054/, Table 2).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceCraniofacialParameters {
  /** Right-to-left euryon, maximum cranial breadth; needs covered lateral head. */
  maximumCranialWidthMm?: number;
  /** Right-to-left frontotemporale, minimum frontal breadth. */
  minimumFrontalWidthMm?: number;
  /** Glabella to opisthocranion, maximum cranial length. */
  maximumCranialLengthMm?: number;
  /** Right-to-left zygion, maximum facial breadth. */
  bizygomaticWidthMm?: number;
  /** Right-to-left gonion, mandibular angle breadth. */
  bigonialWidthMm?: number;
  /** Right-to-left tragion, cranial base breadth. */
  tragionWidthMm?: number;
  /** Nasion to gnathion, morphological face height. */
  faceHeightMm?: number;
  /** Nasion to stomion, upper facial height with apposed lips. */
  upperFaceHeightMm?: number;
  /** Subnasale to gnathion, lower facial height. */
  lowerFaceHeightMm?: number;
  /** Nasion to left tragion, 3DFN upper facial depth. */
  upperFaceDepthLeftMm?: number;
  /** Nasion to right tragion, explicit asymmetry beyond 3DFN's left sample. */
  upperFaceDepthRightMm?: number;
  /** Subnasale to left tragion, 3DFN middle facial depth. */
  middleFaceDepthLeftMm?: number;
  /** Subnasale to right tragion, explicit asymmetry beyond 3DFN's left sample. */
  middleFaceDepthRightMm?: number;
  /** Gnathion to left tragion, 3DFN lower facial depth. */
  lowerFaceDepthLeftMm?: number;
  /** Gnathion to right tragion, explicit asymmetry beyond 3DFN's left sample. */
  lowerFaceDepthRightMm?: number;
}
