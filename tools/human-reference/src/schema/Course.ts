import type { V3 } from "../geometry/V3.ts";
import type { CourseStation } from "./CourseStation.ts";
import type { Pose } from "./Pose.ts";

/**
 * Measures a longitudinal guide as source-supported pieces, retaining every unjoined gap.
 * Confidence grades the producer's geometric evidence, not clinical anatomy or a fitted surface.
 *
 * @evidence contracts/common.md#principled-implementation Retains source-supported pieces and named gaps instead of joining unsupported stations with chords.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface Course {
  /** Region-local identifier retained by downstream curve consumers. */
  id: string;

  /** Geometric description; anatomical names remain provisional inferences. */
  name: string;

  /** Observation method category, without implied patch adjacency. */
  kind:
    | "midline"
    | "lateral"
    | "extreme"
    | "mass-apex"
    | "groove"
    | "landmark-track"
    | "fixed-phase"
    | "silhouette-generator";

  /** Posture in which every waypoint and source-supported piece was observed. */
  pose: Pose;

  /** Section family supplying the guide's waypoints. */
  family: string;

  /** Extraction and linking protocol, including any source partition or auxiliary geometry. */
  method: string;

  /** Producer's geometric evidence grade, without clinical certification. */
  confidence: "high" | "medium" | "low";

  /** Measured support for the declared grade, such as persistence or prominence. */
  confidenceBasis: string;

  /** Ordered measured waypoints, before fitting or joining between stations. */
  stations: CourseStation[];

  /** World millimetre polylines on the source; no segment connects distinct pieces. */
  pieces: V3[][];

  /** Unjoined waypoint intervals and their reasons; consumers must not draw across them. */
  gaps?: { from: string; to: string; reason: string }[];
}
