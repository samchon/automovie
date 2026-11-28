/**
 * Detector counts for one admitted RGB image, from response maxima through
 * retained normalized descriptors.
 */
export interface IAutoMovieRecoveryCameraFeaturePopulation {
  /** Original capture ID of the image whose detector counts are reported. */
  viewId: string;

  /**
   * Interior response maxima before localization, orientation and
   * descriptor-window admission.
   */
  rawCorners: number;

  /**
   * Oriented window-valid detector candidates entering adaptive spatial
   * suppression.
   */
  validCandidates: number;

  /** Candidates selected under the feature cap before descriptor evaluation. */
  selectedBeforeDescriptor: number;

  /** Retained nonzero normalized descriptors available for matching. */
  observedDescriptors: number;

  /**
   * Selected candidates omitted because their descriptor gradient norm did not
   * resolve.
   */
  zeroDescriptors: number;

  /**
   * Selected candidates omitted when a descriptor sample falls outside its
   * image-level support.
   */
  invalidSupportDescriptors: number;
}
