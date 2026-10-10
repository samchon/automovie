import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";

/**
 * One native-supported brow course addressed by accumulated distance.
 * Its first positive span and supporting facet define the emergence frame;
 * each interval retains its actual native barycentric point and normal
 * reading. Frame lookup does not choose another nearest surface feature.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowCourse {
  /** Total distance on the unpitched native-supported course, metres. */
  lengthMetres: number;
  /** Unit direction of its first positive native-supported span. */
  rootTangent: readonly number[];
  /** Outward normal of that span's supporting facet, perpendicular to rootTangent. */
  rootNormal: readonly number[];
  /**
   * Read a station in [0,lengthMetres] on this course and host state.
   */
  frameAt(distanceMetres: number): IHumanFaceSkinFrame;
}
