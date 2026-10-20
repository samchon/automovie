/**
 * Actual candidate and descriptor populations of one automatic image scan.
 *
 * @evidence contracts/common.md#principled-implementation Detector, window admission, spatial selection and descriptor observation have separate actual counters.
 * @evidence contracts/common.md#clear-and-simple-design The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/common.md#meaningful-documentation Members identify the source and explain each preselection, retained and omitted population.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased record performs no computation; producing operations document their work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration defines no cache or shared effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Plain values belong to the caller; the declaration acquires no handle or running task.
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
