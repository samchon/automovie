





/**
 * One captured frame artifact.
 *
 * @evidence contracts/common.md#principled-implementation A zero-based index, clip-local second and host-reported path identify one captured output without deriving its location from an encoder pattern.
 * @evidence contracts/common.md#clear-and-simple-design This artifact element is shared by render result records instead of duplicating frame identity fields in each wrapper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A captured path records the adapter's actual return value rather than a fixture filename or guessed frame location.
 * @evidence contracts/common.md#meaningful-documentation Property comments state zero-based indexing, seconds and that the path belongs to the capture host.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The one captured artifact record declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The per-frame metadata identity describes an identity boundary and performs no request coordination or result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased frame record acquires no file; renderVideo and renderSequenceVideo publish scalar/path metadata while capture hosts retain responsibility for written frame files.
 *
 * @author Samchon
 */
export interface IAutoMovieCapturedFrame {
  /**
   * Zero-based frame index.
   *
   * @author Samchon
   */
  index: number;

  /**
   * Clip-local sample time in seconds.
   *
   * @author Samchon
   */
  timeSeconds: number;

  /**
   * Host path returned by `captureFrame`.
   *
   * @author Samchon
   */
  path: string;
}
