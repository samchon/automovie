import type { V3 } from "../geometry/V3.ts";
import type { Pose } from "./Pose.ts";

/**
 * Stores a source feature curve and the geometric method supporting its provisional name.
 * Auxiliary geometry or a partition boundary must be identified by the method.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the source extraction method and auxiliary-geometry caveats with each provisional feature curve.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface FeatureLoop {
  /** Region-local feature identifier. */
  id: string;

  /** Observed geometric feature description, including any provisional anatomical name. */
  name: string;

  /** Producer's extraction category, such as aperture, crease or attachment partition. */
  kind: string;

  /** Subject-left, subject-right or central feature assignment. */
  side: "l" | "r" | "c";

  /** Source posture of every stored feature point. */
  pose: Pose;

  /** Whether the last point connects implicitly to the first. */
  closed: boolean;

  /** World-millimetre origin and declared frame directions for orientation and projection. */
  frame: { origin: V3; normal: V3; u: V3; v: V3 };

  /** Extraction protocol and any auxiliary-geometry or partition qualification. */
  method: string;

  /** Geometric observation grade, without anatomical acceptance. */
  confidence: "high" | "medium" | "low";

  /** World-frame millimetre points; closure is implicit. */
  points: V3[];
}
