import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";

/**
 * A lifted chart interval lying on one actual native skin triangle.
 * Endpoints are head-frame metres. The frame reader follows that same
 * triangle's barycentric interval, without another nearest-point query.
 *
 * @evidence contracts/common.md#principled-implementation A barycentric affine interval lies in its native triangle and preserves its actual supporting feature.
 * @evidence contracts/common.md#clear-and-simple-design One span retains endpoint geometry and its native frame reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No chord across separate sheets or replacement support enters.
 * @evidence contracts/common.md#meaningful-documentation States native support, units and the absence of reseating.
 * @evidence contracts/modeling.md#spatial-conventions Positions use head-frame metres and the interval fraction is dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries The chart owner joins these pieces through actual shared native edges.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Represents a course on an existing part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The shaft consumer owns its render lattice.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow assembly owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Contains geometric support rather than clinical shaft measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart and contact owners admit the construction.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal curve input.
 * @author Samchon
 */
export interface IHumanFaceSkinChartSpan {
  /** Actual native triangle ordinal in the host's complete winding. */
  triangle: number;

  /** First point of the native-supported interval, in metres. */
  start: readonly number[];

  /** Last point of that same native-supported interval, in metres. */
  end: readonly number[];

  /** Read an actual closed interval fraction in [0,1] on this native piece. */
  frameAt(fraction: number): IHumanFaceSkinFrame;
}
