import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";

/**
 * Stores one measured plane intersection, with implicit last-to-first closure.
 * Positive area orders a closed loop counterclockwise in its section frame;
 * that convention does not certify outer-versus-cavity surface orientation.
 *
 * @evidence contracts/common.md#principled-implementation Retains both world and section coordinates, skin and convex-tape measurements, closure and selection, so orientation conventions are not mistaken for cavity classification.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface LoopRecord {
  /** Selection relative to the producing region, without an anatomical ownership claim. */
  role: "selected" | "other" | "branch-child" | "clipped-arc";

  /** Whether the last point connects implicitly to the first along the measured source contour. */
  closed: boolean;

  /** World-frame skin intersections in millimetres. */
  points: V3[];

  /** The same points in the declared section plane, in millimetres. */
  uv: V2[];

  /** Measured skin path length, including the closing edge when closed. */
  perimeter: number;

  /** Convex tape path in millimetres; null for an open contour. */
  convexPerimeter: number | null;

  /** Signed plane area in square millimetres; null for an open contour. */
  area: number | null;

  /** Range of the section's u coordinate, in millimetres. */
  breadthU: number;

  /** Range of the section's v coordinate, in millimetres. */
  depthV: number;

  /** Whether a phase-zero source-triangle point was inserted between cut-edge points. */
  phase0Inserted?: boolean;
}
