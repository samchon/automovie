/** Actual candidate and descriptor populations of one automatic image scan. */
export interface IAutoMovieRecoveryCameraFeaturePopulation {
  /** Source identity for the detector counters. */
  viewId: string;

  /** Interior response maxima before quadratic/orientation/window admission. */
  rawCorners: number;

  /** Descriptor-window-valid candidates entering ANMS. */
  validCandidates: number;

  /** ANMS-selected points before actual descriptor observation. */
  selectedBeforeDescriptor: number;

  /** Retained finite nonzero normalized descriptors. */
  observedDescriptors: number;

  /** Selected points omitted for an unresolved descriptor norm. */
  zeroDescriptors: number;

  /**
   * Selected points omitted when floating sample coordinates cross their image
   * support.
   */
  invalidSupportDescriptors: number;
}
