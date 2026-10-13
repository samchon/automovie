/**
 * One inspected animation take addressable inside an external motion asset.
 *
 * @evidence contracts/common.md#principled-implementation Stable asset-scoped take identity and original glTF animation index address one inspected animation independently of its optional source name; finite duration is measured from its animation data.
 * @evidence contracts/common.md#clear-and-simple-design Identity, source index, optional name and duration describe the inventory entry without embedding channels or selecting an adoption target.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate or missing display names do not select another take, and adoption cannot choose an animation absent from the source-index inventory.
 * @evidence contracts/common.md#meaningful-documentation Gives asset-scoped stable id, zero-based animation index, null unnamed semantics and inspected duration in seconds.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionTake {
  /** Stable take id within this asset record. */
  id: string;

  /** Zero-based glTF animation index. */
  animationIndex: number;

  /** Source-authored animation name, or null when unnamed. */
  sourceName: string | null;

  /** Inspected finite duration in seconds. */
  durationSeconds: number;
}
