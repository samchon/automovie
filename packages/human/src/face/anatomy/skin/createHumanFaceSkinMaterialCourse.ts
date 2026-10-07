import { createHumanFaceSkinChart } from "./createHumanFaceSkinChart";
import { createHumanFaceSkinChartCourse } from "./createHumanFaceSkinChartCourse";
import type { IHumanFaceSkinChartCourse } from "./IHumanFaceSkinChartCourse";
import type { IHumanFaceSkinMaterialCourseInput } from "./IHumanFaceSkinMaterialCourseInput";

/**
 * Lift a source-relative relief guide through one registered material chart.
 * The first registration's first native incident facet defines the tangent
 * chart frame. This native ordinal choice is an authored construction
 * convention, not a measured crease orientation. All registered endpoints
 * must retain their native identities in that chart. Forehead and glabellar
 * dimensions project their original off-surface guides in the same chart;
 * they do not introduce independently chosen nearest-sheet correspondences.
 *
 * Actual adjacent native intervals supply the physical Euclidean metric.
 * Unsupported folds, open boundaries and ambiguous continuations refuse at
 * the chart owner. Width, normal offset and endpoint fade remain solely with
 * the relief kernel. A changed source state invalidates this entire course.
 *
 * @evidence contracts/common.md#principled-implementation A registered native-facet tangent chart and actual adjacency produce one continuous source-supported path before physical arc and Euclidean distance are read.
 * @evidence contracts/common.md#clear-and-simple-design Shares chart lifting and physical metric across every regional relief owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native identity validation replaces discontinuous independent nearest projections without changing requested guide dimensions or source geometry.
 * @evidence contracts/common.md#meaningful-documentation States seed convention, off-surface dimensions, ownership and unsupported chart domains.
 * @evidence contracts/modeling.md#spatial-conventions Native course positions and its physical metric remain head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries The existing chart walker joins intervals at actual native shared edges.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no separate part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The calling relief owner retains its traits.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits internal course spans only.
 * @evidenceExclude contracts/modeling.md#rendered-observation The calling relief owners observe their output.
 * @evidence contracts/anatomy.md#anatomical-source The chart frame and guide are authored source conventions, not clinical crease measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source chart admission belongs to the native walker.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes internal source registrations without public sculpt inputs.
 * @author Samchon
 */
export function createHumanFaceSkinMaterialCourse(
  input: IHumanFaceSkinMaterialCourseInput,
): IHumanFaceSkinChartCourse {
  const anchor = input.supportVertices[0];
  const corner = anchor === undefined ? -1 : input.indices.indexOf(anchor);
  if (corner < 0)
    throw new Error("Skin relief registration has no native support facet.");
  const chart = createHumanFaceSkinChart({
    positions: input.positions,
    indices: input.indices,
    host: input.host,
    seedTriangle: Math.floor(corner / 3),
    supportVertices: input.supportVertices,
  });
  return createHumanFaceSkinChartCourse(
    chart.compile(input.guide.map((point) => chart.project(point))),
  );
}
