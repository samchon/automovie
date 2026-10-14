import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";

/**
 * One native-supported brow course addressed by accumulated distance.
 * Its first positive span and supporting facet define the emergence frame;
 * each interval retains its actual native barycentric point and normal
 * reading. Frame lookup does not choose another nearest surface feature.
 *
 *
 * @evidence contracts/common.md#principled-implementation Accumulated positive native-span distance and the first span's tangent/facet normal define the emergence frame on the actual skin course.
 * @evidence contracts/common.md#clear-and-simple-design Root-frame values accompany one frameAt reader delegated to createHumanFaceSkinChartCourse's compiled native intervals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Frame lookup retains native barycentric support instead of nearest-surface reseating; callers must retain the original immutable host state.
 * @evidence contracts/common.md#meaningful-documentation Members state metre stations, unit first-span tangent, perpendicular facet normal and the closed valid lookup interval.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Native-supported brow metric course is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Native-supported brow metric course specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Native-supported brow metric course acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
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
   *
   * @evidence contracts/common.md#principled-implementation A finite station within the compiled native course selects its original metric span and the same supporting facet's barycentric frame.
   * @evidence contracts/common.md#clear-and-simple-design The brow course forwards the shared skin-chart course reader rather than exposing a second nearest-surface lookup algorithm.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Lookup refuses out-of-range stations and depends on immutable captured host state; it does not reseat onto another sheet or use final offset-shaft length.
   * @evidence contracts/common.md#meaningful-documentation The member declares the closed metre-station interval and the parent describes the native support and emergence frame.
   * @evidence contracts/performance.md#efficient-algorithms The actual shared implementation linearly finds the first containing positive span, then computes one fraction and invokes that span's frame callback.
   * @evidence contracts/performance.md#reuse-equivalent-work Compiled span lengths and cumulative stations are reused for all lookups; endpoint copies preserve their metric while original host callbacks remain authoritative.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned frame is caller-owned; this function-valued member retains only the compiled course closure's spans and host callbacks for the course lifetime.
   */
  frameAt(distanceMetres: number): IHumanFaceSkinFrame;
}
