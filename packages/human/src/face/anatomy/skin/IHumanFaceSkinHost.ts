import type { IHumanFaceExactSkinSeat } from "./IHumanFaceExactSkinSeat";
import type { IHumanFaceProjectedSkinCourse } from "./IHumanFaceProjectedSkinCourse";
import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";
import type { IHumanFaceSkinSeat } from "./IHumanFaceSkinSeat";

/**
 * The face skin as a host for what grows on it or is pressed into it.
 *
 * One host is compiled for one state of one skin surface. It answers where a
 * free point lands on the skin, what the skin is at a seat, and on which side
 * of the skin a point lies. Brow shafts, skin relief and the surface readings
 * take their skin position and their skin normal from here, so the face has
 * one definition of "on the skin" and "away from the skin".
 *
 * @author Samchon
 */
export interface IHumanFaceSkinHost {
  /**
   * Triangle and barycentric coordinates of the skin point nearest to a free point.
   */
  seat(point: readonly number[]): IHumanFaceSkinSeat;

  /**
   * Read the skin position and normals at an existing seat in this host's state.
   */
  frame(seat: IHumanFaceSkinSeat): IHumanFaceSkinFrame;

  /**
   * Read exact source correspondence through the same native frame owner.
   * Position retains rational barycentrics until one final binary64 rounding;
   * the existing normal field reads their represented weight values.
   */
  frameExact(seat: IHumanFaceExactSkinSeat): IHumanFaceSkinFrame;

  /**
   * Native vertex identities of one host triangle, in its winding order.
   */
  corners(triangle: number): number[];

  /**
   * Signed distance to the nearest skin feature, positive on its outward side.
   * The open sheet's sign is meaningful within its local feature size.
   */
  signedDistance(point: readonly number[]): number;

  /** Smooth outward normals in position-aligned triples; nonzero incident-area sums are normalized and unsupported sums retain zero. Coincident source copies share an area sum. */
  normals: readonly number[];

  /**
   * Compile a finite source-projected guide on this immutable native geometry.
   * Native feature transitions determine the course, independently of relief width.
   */
  compileProjectedCourse(
    guide: readonly (readonly number[])[],
  ): IHumanFaceProjectedSkinCourse;
}
