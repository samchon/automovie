import type { V3 } from "../geometry/V3.ts";
import type { Pose } from "./Pose.ts";

/**
 * Records a geometric point with its actual extraction method and confidence.
 * An anatomical name in the label remains an inference unless that protocol is established.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the extraction method and geometric confidence with each point rather than certifying a clinical landmark from its name.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface Landmark {
  /** Region-local observed point identifier. */
  id: string;

  /** Geometric point description; an anatomical name remains an inference. */
  name: string;

  /** World-frame observed position in millimetres. */
  p: V3;

  /** Source posture used to observe the point. */
  pose: Pose;

  /** Selection protocol, including any auxiliary geometry or boundary limitation. */
  method: string;

  /** Producer's geometric evidence grade. */
  confidence: "high" | "medium" | "low";

  /** Supporting measured section when the point was obtained from one. */
  section?: string;
}
