import type { Pose } from "./Pose.ts";

/**
 * Records a source contour topology transition in its declared physical station coordinate.
 * Adjacent evidence remains producer-defined and does not imply a reconstructed branch patch.
 *
 * @evidence contracts/common.md#principled-implementation Carries a source topology event at its physical station without claiming that a valid surface patch has been reconstructed.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface Event {
  /** Region-local transition identifier. */
  id: string;

  /** Change observed in source intersection topology. */
  kind: "split" | "merge" | "open" | "close";

  /** Source posture used for the transition observation. */
  pose: Pose;

  /** Section family whose topology changes. */
  family: string;

  /** Physical location in the family's millimetre station coordinate. */
  stationMm: number;

  /** The same location in the family's declared fractional coordinate. */
  fraction: number;

  /** Transition detection and bracketing protocol. */
  method: string;

  /** Producer-defined source evidence on the lower side of the bracket. */
  below?: unknown;

  /** Producer-defined source evidence on the upper side of the bracket. */
  above?: unknown;
}
