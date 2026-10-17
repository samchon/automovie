import type { V3 } from "../geometry/V3.ts";

/**
 * Identifies one guide observation on a named section, or on its explicit tracing plane.
 * A station is a measured waypoint; it is not a fitted curve control point.
 *
 * @evidence contracts/common.md#principled-implementation Separates observed waypoints, millimetre prominence and degree turning from fitted curve control points.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface CourseStation {
  /** Identifier of the observed section, or of the explicitly supplied tracing plane. */
  section: string;

  /** Observed world-frame position in millimetres. */
  p: V3;

  /** In-plane phase: zero along -v and ninety along +u, in degrees. */
  phaseDeg: number;

  /** Geometric mass height or groove depth relative to its stated local chord. */
  prominenceMm?: number;

  /** Turning angle in degrees, when the producer measures angular relief. */
  turnDeg?: number;

  /** Inline definition for a tracing station without a separately stored Section. */
  plane?: { origin: V3; normal: V3; u: V3; v: V3 };
}
