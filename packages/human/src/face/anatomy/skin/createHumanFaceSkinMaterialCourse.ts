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
 * @evidence contracts/common.md#principled-implementation Registered source material coordinates and actual adjacency produce one continuous native path before current physical arc and Euclidean distance are read.
 * @evidence contracts/common.md#clear-and-simple-design Shares chart lifting and physical metric across every regional relief owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native identity validation replaces discontinuous independent nearest projections without changing requested guide dimensions or source geometry.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes source-native stations, reference-metre offsets, current metric and unsupported chart domains.
 * @evidence contracts/modeling.md#spatial-conventions Native course positions and its physical metric remain head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries The existing chart walker joins intervals at actual native shared edges.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no separate part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The calling relief owner retains its traits.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits internal course spans only.
 * @evidenceExclude contracts/modeling.md#rendered-observation The calling relief owners observe their output.
 * @evidence contracts/anatomy.md#anatomical-source Native material stations and dimensioned reference guides are authored source conventions, not clinical crease measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source chart admission belongs to the native walker.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes internal source registrations without public sculpt inputs.
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
