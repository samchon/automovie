import { BODY_POSE_DEFECT_ZONES } from "./bodyPoseDefectZone";
import type { IBodyPoseDefects } from "./IBodyPoseDefects";

/** One census row: a named shape and pose, and either its defects or the builder's refusal. */
export interface IBodyPoseDefectRow {
  shape: string;
  pose: string;
  defects: IBodyPoseDefects | null;

  /** The builder's refusal message when the state cannot be built. */
  refused?: string;
}

/**
 * The census as a Markdown table: one row per shape and pose, and per zone the
 * worst new fold in degrees, the count of edges past the fold cut-off, the
 * smallest and largest triangle area ratio and the counts of crushed and
 * stretched triangles; then the whole skin's area and volume ratios.
 *
 * Each zone cell reads `fold/folds min-max crushed+stretched`, and a zone with
 * no defect at all reads `-`, so the eye finds the zones a pose damaged. A
 * refused state prints its message in place of the cells.
 */
export function formatBodyPoseDefectTable(
  rows: readonly IBodyPoseDefectRow[],
): string {
  const header =
    "| shape | pose | " +
    BODY_POSE_DEFECT_ZONES.join(" | ") +
    " | area | volume |";
  const rule = "|" + " --- |".repeat(BODY_POSE_DEFECT_ZONES.length + 4);
  const lines = rows.map((row) => {
    if (row.defects === null)
      return `| ${row.shape} | ${row.pose} | refused: ${row.refused ?? ""} |`;
    const cells = BODY_POSE_DEFECT_ZONES.map((zone) => {
      const one = row.defects!.zones[zone];
      return one.folds === 0 && one.crushed === 0 && one.stretched === 0
        ? "-"
        : `${one.worstFold.toFixed(0)}/${one.folds} ` +
            `${one.minAreaRatio.toFixed(2)}-${one.maxAreaRatio.toFixed(2)} ` +
            `${one.crushed}+${one.stretched}`;
    });
    return (
      `| ${row.shape} | ${row.pose} | ` +
      cells.join(" | ") +
      ` | ${row.defects.areaRatio.toFixed(3)} | ` +
      `${row.defects.volumeRatio.toFixed(3)} |`
    );
  });
  return [header, rule, ...lines].join("\n") + "\n";
}
