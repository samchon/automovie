import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";
import type { Pose } from "./Pose.ts";

/**
 * Measures a scoped orthographic outline, separating its raster contour from the lifted source rim.
 * Scope boundaries may follow rig groups and do not establish anatomical insertions.
 *
 * @evidence contracts/common.md#principled-implementation Separates scoped raster outlines from lifted source rims and reports their millimetre registration residuals.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface Silhouette {
  /** Region-local outline observation identifier. */
  id: string;

  /** Orthographic view name associated with the explicit projection axes. */
  view: string;

  /** Source posture of the projected geometry. */
  pose: Pose;

  /** Triangles or source partitions included, with any nonanatomical boundary rule. */
  scope: string;

  /** Declared orthographic basis directions in the source world frame. */
  projection: { right: V3; up: V3; toward: V3 };

  /** Raster observation spacing in projected millimetres. */
  resolutionMm: number;

  /** Projected outline points in millimetres, their source-world rim lift and the lift's projected residuals. */
  contours: {
    outer: boolean;
    points2d: V2[];
    rim3d: V3[];
    residualMm: { median: number; max: number };
  }[];
}
