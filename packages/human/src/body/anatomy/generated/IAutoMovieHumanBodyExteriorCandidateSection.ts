import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Final Float32 section plane and source-owned component selection seed. Emitted-surface readback uses the same point, normal and seed as the solver.
 *
 * @evidence contracts/common.md#principled-implementation A common source-rest plane point/unit normal and component seed preserve the final Float32 instrument's actual section.
 * @evidence contracts/common.md#clear-and-simple-design Plane and component-selection witness stay together for readback of the same solver cut.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The seed follows actual source-owned component selection rather than an independently inferred anatomical loop.
 * @evidence contracts/common.md#meaningful-documentation Fields define metre station, horizontal/segment-derived unit normal and nearest-loop seed meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Section witnesses perform no plane intersection or contour-selection algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recorded solver/readback operands are outputs without shared future section caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three vectors own no triangle contour buffers or active measurement handle.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateSection {
  /** Station on the rule's landmark segment, in metres in the source-rest frame, where the plane through the shaped witness vertex meets it. */
  readonly point: IAutoMovieVector3;

  /** Unit normal of the instrument's cutting plane in the source-rest frame. Horizontal girth rules use +Y; perpendicular rules derive their normal from the oriented landmark segment used by that instrument. */
  readonly normal: IAutoMovieVector3;

  /** Position whose nearest closed loop, by centroid distance across every cut surface, is the measured component; currently equal to `point`. */
  readonly seed: IAutoMovieVector3;
}
