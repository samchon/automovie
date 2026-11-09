/**
 * Actual candidate and descriptor populations of one automatic image scan.
 *
 * @evidence contracts/development/design.md#principled-representation Detector, window admission, spatial selection and descriptor observation have separate actual counters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify the source and explain each preselection, retained and omitted population.
 */
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

  /** Selected points omitted when floating sample coordinates cross their image support. */
  invalidSupportDescriptors: number;
}
