/**
 * One captured frame artifact.
 *
 * @evidence contracts/development/design.md#principled-representation A zero-based index, clip-local second and host-reported path identify one captured output without deriving its location from an encoder pattern.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This artifact element is shared by render result records instead of duplicating frame identity fields in each wrapper.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A captured path records the adapter's actual return value rather than a fixture filename or guessed frame location.
 * @evidence contracts/development/common.md#meaningful-documentation Property comments state zero-based indexing, seconds and that the path belongs to the capture host.
 */
export interface IAutoMovieCapturedFrame {
  /**
   * Zero-based frame index.
   */
  index: number;

  /**
   * Clip-local sample time in seconds.
   */
  timeSeconds: number;

  /**
   * Host path returned by `captureFrame`.
   */
  path: string;
}
