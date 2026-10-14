import type { IHumanFaceSkinChart as IHumanFaceSkinChartImported } from "./IHumanFaceSkinChart";
import type { IHumanFaceSkinChartCoordinate as IHumanFaceSkinChartCoordinateImported } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartCourse } from "./IHumanFaceSkinChartCourse";
import type { IHumanFaceSkinMaterialCourseInput } from "./IHumanFaceSkinMaterialCourseInput";
import type { IHumanFaceSkinMaterialGuidePoint as IHumanFaceSkinMaterialGuidePointImported } from "./IHumanFaceSkinMaterialGuidePoint";
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
 * @evidence contracts/common.md#principled-implementation Ordered native guide vertices map through one admitted positive material disk; optional reference-metre offsets register on that same reference, then exact chart walking supplies current physical intervals and Euclidean metrics.
 * @evidence contracts/common.md#clear-and-simple-design This adapter joins the existing chart and metric-course owners; width, offset displacement and endpoint fade remain with the relief kernel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No current-state nearest reseating or width-sensitive sampling replaces source correspondence; missing support, folds, open boundaries and ambiguous continuation propagate refusal.
 * @evidence contracts/common.md#meaningful-documentation The prose separates native registration/reference offsets from physical metrics and states unchanged correspondence, limitations and invalidation after source changes.
 * @evidence contracts/performance.md#efficient-algorithms The adapter maps G stations once, includes full disk/adjacency and reference-host costs from createHumanFaceSkinChart, walks actual reached facets and measures S returned spans; it reconstructs no second metric owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Every station uses the same chart and its lazy reference host; compiled spans retain lengths and native frame callbacks for later reads. A changed source/reference/host requires a new course.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Intermediate station coordinates are invocation-local; returned metric spans retain their chart/frame closures until the consumer releases the course, with no published result on compilation failure or external resource.
 *
 * @author Samchon
 */
export function createHumanFaceSkinMaterialCourse(
  input: IHumanFaceSkinMaterialCourseInput,
): IHumanFaceSkinChartCourse {
  const chart: IHumanFaceSkinChartImported = createHumanFaceSkinChart({
    surface: input.surface,
    referencePositions: input.referencePositions,
    domain: input.domain,
    host: input.host,
    supportVertices: input.supportVertices,
  });
  return createHumanFaceSkinChartCourse(
    chart.compile(
      input.guide.map(
        (
          point: IHumanFaceSkinMaterialGuidePointImported,
        ): IHumanFaceSkinChartCoordinateImported => {
          const native: IHumanFaceSkinChartCoordinateImported =
            chart.coordinate(point.vertex);
          return point.displacement === undefined
            ? native
            : chart.offset(native, point.displacement);
        },
      ),
    ),
  );
}
