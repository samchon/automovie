import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";

/**
 * A lifted chart interval lying on one actual native skin triangle.
 * Endpoints are head-frame metres. The frame reader follows that same
 * triangle's barycentric interval, without another nearest-point query.
 *
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
