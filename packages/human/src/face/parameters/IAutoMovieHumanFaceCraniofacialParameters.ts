/**
 * Distances between named craniofacial landmarks on one neutral head.
 * Landmark-pair fields are straight 3D millimetre distances, while the named
 * profile angle and signed projection use their stated protocols. None is a
 * width-scale morph or pixel span. Cranial euryon, frontotemporale and
 * opisthocranion require coverage beyond a frontal face photograph. The 3D
 * Facial Norms study used spreading calipers for those head distances and
 * stereophotogrammetry for visible face and tragion distances; it did not assert that every distance
 * can be recovered from one portrait (Weinberg et al., 2016,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4841054/, Table 2).
 * Vertex-to-gnathion head height is a separate direct anthropometric
 * landmark distance; a scalp photograph containing hair cannot substitute
 * its silhouette apex for vertex (https://pubmed.ncbi.nlm.nih.gov/20954452/;
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC7363725/).
 * A separate 3D photogrammetric protocol measures the soft-tissue
 * nasion-subnasale-pogonion angle to retain midface/chin profile balance,
 * which the listed linear widths and depths alone do not identify
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC4384937/). Its example subject
 * is not a population range.
 * Dentofacial stereophotogrammetry also measures the sagittal position of
 * soft-tissue pogonion against a coronal plane contacting the pupils in
 * natural head orientation, as stated in the available abstract
 * (https://pubmed.ncbi.nlm.nih.gov/28339510/).
 * That signed projection is independent of the profile angle and is not a
 * world-coordinate chin-vertex offset.
 * The retained field name says corneal plane, but the full acquisition method
 * is not registered; the measurement registry returns that source gap rather
 * than substituting corneal vertices for the pupil reference.
 *
 * @evidence contracts/common.md#principled-implementation Named neutral landmark distances, one profile angle and a signed projection stay distinct observations. The craniofacial registry reads supported final-skin instruments and reports missing landmarks/rules or the unread full pupil-reference method; every entry is report-only with no face shape channel.
 * @evidence contracts/common.md#clear-and-simple-design One neutral-head record owns the related scalar observations while the shared head instruments and face measurement registry own computation, rather than independent width-scale morph controls here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hair silhouettes, pixel spans and a frontal portrait do not replace unavailable cranial landmarks; the retained corneal-plane field name does not certify a pupil-referenced clinical method or an automatic geometry offset.
 * @evidence contracts/common.md#meaningful-documentation Fields state landmark pairs, millimetres/degrees, independent left/right depths and anterior-positive projection; the comment separates direct acquisition, neutral state, protocol limitations and current unregistered projection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This observation interface performs no head search, landmark inversion or geometric traversal; those algorithms belong to the actual measurement registry consumers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type defines no computed head-result cache, identity key or invalidation policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no skin mesh or study data; the observation document owns its optional scalar fields.
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

  /** Hair-excluded cranial vertex to soft-tissue gnathion, head height in mm. */
  vertexToGnathionMm?: number;

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

  /** Soft-tissue nasion-subnasale-pogonion 3D angle, in degrees. */
  nasionSubnasalePogonionAngleDegrees?: number;

  /** Retained field name for the pupil-referenced coronal-plane projection, anterior-positive mm; full method remains unregistered. */
  pogonionFromCornealPlaneMm?: number;

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
