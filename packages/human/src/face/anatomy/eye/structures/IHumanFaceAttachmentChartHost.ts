import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";
import type { IAutoMovieHumanFaceAttachmentPoint } from "../../../structures/IAutoMovieHumanFaceAttachmentPoint";

/** A source material disk read through the actual skin's current topology.
 *
 * @author Samchon
 */
export interface IHumanFaceAttachmentChartHost {
  /** Dimensionless chart coordinates of one registered host-view vertex. */
  coordinate(vertex: number): [number, number];

  /** Material coordinate of a source-owned attachment on one actual host triangle. */
  coordinateAt(point: IAutoMovieHumanFaceAttachmentPoint): [number, number];

  /** Exact resident attachment for a registered station vertex, without a UV round trip. */
  vertexSeat(vertex: number): IHumanFaceSkinSeat;

  /** Validated original attachment, retaining source triangle identity and weights. */
  sourceSeat(point: IAutoMovieHumanFaceAttachmentPoint): IHumanFaceSkinSeat;

  /** Actual skin triangle and barycentric weights; points outside the disk refuse. */
  seat(point: readonly number[]): IHumanFaceSkinSeat;
}
