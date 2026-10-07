import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";

/**
 * One native-supported brow course addressed by accumulated distance.
 * Its first positive span and supporting facet define the emergence frame;
 * each interval retains its actual native barycentric point and normal
 * reading. Frame lookup does not choose another nearest surface feature.
 *
 * @evidence contracts/common.md#principled-implementation Metric stations and the initial facet come from the same lifted source-chart intervals.
 * @evidence contracts/common.md#clear-and-simple-design One course result connects source support, length and emergence orientation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no authored length, replacement skin point or anatomical tolerance.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes surface-course length from the final offset shaft length.
 * @evidence contracts/modeling.md#spatial-conventions Distances and positions use head-frame metres; initial directions are unit vectors.
 * @evidence contracts/modeling.md#shared-boundaries Every station reads the host that compiled the native feature-supported course.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Creates no new anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries the existing band-derived course without introducing a length control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The shaft and brow assembly consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source-derived geometry supplies no measured follicle trajectory.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing profile and contact owners retain admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This internal course carries no personal guide input.
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
   *
   * @evidence contracts/common.md#principled-implementation The positive span containing the accumulated distance reads its retained actual native barycentric interval through the shared host.
   * @evidence contracts/common.md#clear-and-simple-design One metric query retains the projected course and skin owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No free-guide parameter or out-of-course clamp substitutes for a station.
   * @evidence contracts/common.md#meaningful-documentation States the closed metric domain and one-host reading.
   * @evidence contracts/modeling.md#spatial-conventions Input and returned position are head-frame metres; normals are unit vectors.
   * @evidence contracts/modeling.md#shared-boundaries Reads the same host that compiled the course.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
   * @evidenceExclude contracts/modeling.md#rendered-observation The shaft consumer observes its actual mesh.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Performs geometric correspondence without a clinical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range Existing profile and contact admission retain their bounds.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Provides no personal guide input.
   */
  frameAt(distanceMetres: number): IHumanFaceSkinFrame;
}
