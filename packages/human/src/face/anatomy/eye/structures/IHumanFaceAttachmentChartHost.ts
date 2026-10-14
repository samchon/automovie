import type { IAutoMovieHumanFaceAttachmentPoint } from "../../../structures/IAutoMovieHumanFaceAttachmentPoint";
import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/** A source material disk read through the actual skin's current topology.
 *
 *
 * @evidence contracts/common.md#principled-implementation Dimensionless chart coordinates and actual host triangle seats preserve the source disk's incidence independently of spatial-nearest projection.
 * @evidence contracts/common.md#clear-and-simple-design The concrete createHumanFaceAttachmentChartHost owns admission/copies while consumers choose metric skin frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The contract offers no coordinate snapping, nearest fallback or renamed source topology.
 * @evidence contracts/common.md#meaningful-documentation Methods document source-vertex versus material-point queries, barycentric identity and outside-disk refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceAttachmentChartHost is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceAttachmentChartHost declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceAttachmentChartHost itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceAttachmentChartHost {
  /** Dimensionless chart coordinates of one registered host-view vertex.
   * @evidence contracts/common.md#principled-implementation A registered host-view vertex names its dimensionless material location.
   * @evidence contracts/common.md#clear-and-simple-design The concrete chart reader's ordinal table owns lookup and coordinate copies.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent source vertex refuses instead of choosing a nearby chart point.
   * @evidence contracts/common.md#meaningful-documentation The method identifies dimensionless chart coordinates and registered vertex authority.
   * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceAttachmentChartHost.coordinate is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceAttachmentChartHost.coordinate declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceAttachmentChartHost.coordinate itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
   */
  coordinate(vertex: number): [number, number];

  /** Material coordinate of a source-owned attachment on one actual host triangle.
   * @evidence contracts/common.md#principled-implementation Actual host-triangle barycentric weights interpolate the source material coordinate.
   * @evidence contracts/common.md#clear-and-simple-design The chart reader owns original seat admission before coordinate evaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No metric distance, nearest UV or topology replacement supplies this material point.
   * @evidence contracts/common.md#meaningful-documentation The method states source-owned attachment and actual host triangle meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceAttachmentChartHost.coordinateAt is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceAttachmentChartHost.coordinateAt declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceAttachmentChartHost.coordinateAt itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
   */
  coordinateAt(point: IAutoMovieHumanFaceAttachmentPoint): [number, number];

  /** Exact resident attachment for a registered station vertex, without a UV round trip.
   * @evidence contracts/common.md#principled-implementation A registered vertex returns its exact resident source corner attachment.
   * @evidence contracts/common.md#clear-and-simple-design The concrete reader owns source incidence rather than round-tripping through UV.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing incidence refuses without approximate chart lookup.
   * @evidence contracts/common.md#meaningful-documentation The method states exact resident attachment and the absence of a UV round trip.
   * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceAttachmentChartHost.vertexSeat is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceAttachmentChartHost.vertexSeat declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceAttachmentChartHost.vertexSeat itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
   */
  vertexSeat(vertex: number): IHumanFaceSkinSeat;

  /** Validated original attachment, retaining source triangle identity and weights.
   * @evidence contracts/common.md#principled-implementation A source continuation retains its original triangle identity and complete admitted weights.
   * @evidence contracts/common.md#clear-and-simple-design The concrete reader validates and copies the supplied source attachment.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamp or nearest attachment can replace invalid weights or an absent host triangle.
   * @evidence contracts/common.md#meaningful-documentation The method states retained source triangle and weight ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceAttachmentChartHost.sourceSeat is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceAttachmentChartHost.sourceSeat declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceAttachmentChartHost.sourceSeat itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
   */
  sourceSeat(point: IAutoMovieHumanFaceAttachmentPoint): IHumanFaceSkinSeat;

  /** Actual skin triangle and barycentric weights; points outside the disk refuse.
   * @evidence contracts/common.md#principled-implementation A dimensionless material point selects an actual source triangle and barycentric seat.
   * @evidence contracts/common.md#clear-and-simple-design The chart reader owns location and original disk-domain admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Outside points refuse rather than expanding or snapping the disk.
   * @evidence contracts/common.md#meaningful-documentation The method names actual triangle/weights and unsupported-point behavior.
   * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceAttachmentChartHost.seat is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceAttachmentChartHost.seat declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceAttachmentChartHost.seat itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
   */
  seat(point: readonly number[]): IHumanFaceSkinSeat;
}
