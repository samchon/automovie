import type { IHumanFaceSkinChartCourse } from "./IHumanFaceSkinChartCourse";
import type { IHumanFaceSkinMaterialCourseInput } from "./IHumanFaceSkinMaterialCourseInput";
import { createHumanFaceSkinChart } from "./createHumanFaceSkinChart";
import { createHumanFaceSkinChartCourse } from "./createHumanFaceSkinChartCourse";

/**
 * Lift a source-relative relief guide through one registered material chart.
 * All stations address their original native identities in a source-owned
 * positive material disk. Forehead and glabellar dimensions convert once from
 * reference head-frame metre guides through one native reference registration. The
 * current host reads positions and physical metric from that same native
 * correspondence without choosing new nearest-sheet support.
 *
 * Actual adjacent native intervals supply the physical Euclidean metric.
 * Unsupported folds, open boundaries and ambiguous continuations refuse at
 * the chart owner. Width, normal offset and endpoint fade remain solely with
 * the relief kernel. A changed source state invalidates this entire course.
 *
 * @author Samchon
 */
export function createHumanFaceSkinMaterialCourse(
  input: IHumanFaceSkinMaterialCourseInput,
): IHumanFaceSkinChartCourse {
  const chart = createHumanFaceSkinChart({
    surface: input.surface,
    referencePositions: input.referencePositions,
    domain: input.domain,
    host: input.host,
    supportVertices: input.supportVertices,
  });
  return createHumanFaceSkinChartCourse(
    chart.compile(input.guide.map((point) => {
      const native = chart.coordinate(point.vertex);
      return point.displacement === undefined ? native : chart.offset(native, point.displacement);
    })),
  );
}
