import type { IAutoMovieHumanBodyShoulderPose } from "../../../structures/IAutoMovieHumanBodyShoulderPose";

/**
 * A source profile driven by an existing thorax-relative shoulder coordinate.
 *
 * @evidence contracts/common.md#principled-implementation Thorax-relative plane, total elevation or axial rotation selects an existing public TT shoulder goal with source-neutral degrees.
 * @evidence contracts/common.md#clear-and-simple-design A shoulder-specific driver separates total arm-goal coordinates from local glenohumeral articulation axes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The source keeps its anatomical node identity separately; a total TT elevation is never reinterpreted as local GH elevation.
 * @evidence contracts/common.md#meaningful-documentation Comments identify bilateral upper-arm goal ownership, total-angle semantics, shaped neutral registration and the existing TT degree convention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Shoulder-driver metadata selects a TT coordinate without solving shoulder or girdle motion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source rest values are dependencies, not cached shoulder solutions reusable after registration changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The shoulder driver allocates no retained arm solver state or projection buffer.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceShoulderDriver {
  /** Existing thorax-relative total TT goal drives a declared source coupling. */
  kind: "public-shoulder";

  /** Left or right upper-arm TT goal identity; the source anatomical node retains its separate bone ID. */
  bone: IAutoMovieHumanBodyShoulderPose["bone"];

  /** TT source coordinate; total humerothoracic elevation is not a local GH angle. */
  axis: "plane" | "elevation" | "axialRotation";

  /** Public source rest used for omission, after the shape owner updates registration. */
  neutral: number;

  /** Plane, total elevation and axial rotation use the existing TT degree convention. */
  unit: "degrees";
}
