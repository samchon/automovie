/**
 * One observed landmark of a reference photograph, in unit image coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Represents an authored observation marker in normalized photograph coordinates, mapped to capture pixels by shared reference layout.
 * @evidence contracts/common.md#clear-and-simple-design Keeps photo observation x/y/group separate from numerical Human measurements or hidden tissue geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A marker guides visible comparison only; its units do not supply anatomical measurements, and this type does not validate finite bounds.
 * @evidence contracts/common.md#meaningful-documentation Documents left-to-right/top-to-bottom unit image axes and group metadata without path or image bytes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no mapping; reference layout/drawing traverse marker arrays linearly.
 * @evidence contracts/performance.md#reuse-equivalent-work Matching screen/PNG layouts share capture-pixel conversion, while changed reference metadata is reread independently of numerical model keys.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page/reference owner retains marker arrays proportional to observed points; SVG/image lifetime remains outside this scalar record.
 *
 * @author Samchon
 */
export interface IHumanViewerLandmark {
  /** Horizontal position, 0 at the left edge and 1 at the right. */
  x: number;

  /** Vertical position, 0 at the top edge and 1 at the bottom. */
  y: number;

  /** Landmark group name. */
  group: string;
}
