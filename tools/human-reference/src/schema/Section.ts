import type { V3 } from "../geometry/V3.ts";
import type { LoopRecord } from "./LoopRecord.ts";
import type { Pose } from "./Pose.ts";

/**
 * Couples a measured contour with its physical station, posture and right-handed plane.
 * Status describes the observed intersection, not reconstruction or anatomical acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Binds contour measurements to their physical station, source posture and complete plane instead of treating a point list as an interchangeable profile.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface Section {
  /** Region-local section identifier retained through fitting and surface qualification. */
  id: string;

  /** Station family defining this plane's physical and phase coordinates. */
  family: string;

  /**
   * Fraction follows the family's definition. Physical stations declare mm;
   * angular families declare deg instead. An absent coordinate is not zero.
   */
  station: {
    fraction: number;
    mm?: number;
    deg?: number;
    definition: string;
  };

  /** Source posture at which this intersection was measured. */
  pose: Pose;

  /** Origin is world millimetres; unit axes satisfy u cross v = normal. */
  plane: { origin: V3; normal: V3; u: V3; v: V3 };

  /** Observed contour isolation and closure, without a reconstructed-surface acceptance claim. */
  status: "closed" | "merged" | "clipped" | "open" | "absent";

  /** Geometric reason for nonstandard isolation or missing intersection. */
  statusNote?: string;

  /** Source-supported contours, retaining selected and neighbouring observations explicitly. */
  loops: LoopRecord[];
}
