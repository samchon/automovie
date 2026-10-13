import type { AutoMovieHumanBodySurfaceDimension } from "./AutoMovieHumanBodySurfaceDimension";

/**
 * A straight skin-landmark distance, never a hidden bone length.
 *
 * @evidence contracts/common.md#principled-implementation The exterior scalar specialization names a straight skin-landmark distance with tape, caliper or scan provenance.
 * @evidence contracts/common.md#clear-and-simple-design The common surface-dimension owner supplies target/observation structure while this alias defines straight-distance semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An exterior skin distance cannot silently serve as a hidden bony length or internal attachment path.
 * @evidence contracts/common.md#meaningful-documentation The declaration identifies straight exterior ownership; inherited members give metres, method, posture and uncertainty.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Surface-distance typing performs no vertex search, landmark fitting or bone inference.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The distance alias holds no completed exterior landmark calculation for reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Straight-distance metadata retains no scan points, fitted landmarks or device handles.
 * @author Samchon
 */
export type IAutoMovieHumanBodySurfaceDistance =
  AutoMovieHumanBodySurfaceDimension<"tape" | "caliper" | "surface-scan">;
