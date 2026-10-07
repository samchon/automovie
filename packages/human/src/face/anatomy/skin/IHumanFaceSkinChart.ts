import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";

/**
 * One source-facet chart and topologically continued inverse on the skin.
 * Projection defines the chart coordinates; compilation lifts the ordered
 * internal guide through actual adjacent triangles. It is neither global
 * nearest projection nor a geodesic. A fold, boundary or ambiguous lift
 * refuses instead of choosing a preferred nearby face.
 *
 * @evidence contracts/common.md#principled-implementation A locally nonsingular piecewise affine chart lifts an ordered path through its native triangle adjacency.
 * @evidence contracts/common.md#clear-and-simple-design Separates chart coordinate reading from one native-supported course compiler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest-face preference, anatomical axis or artificial bridge defines a lift.
 * @evidence contracts/common.md#meaningful-documentation States chart authority, inverse-path meaning and unsupported conditions.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metre points map to dimensionless source-basis coefficients.
 * @evidence contracts/modeling.md#shared-boundaries Lifted intervals follow the host's actual shared topology.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Builds no new anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no public numerical trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The shaft consumer owns geometry emission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source chart is a geometric convention, not a follicle measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart owner admits its actual source support.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal source guides are not personal authoring inputs.
 * @author Samchon
 */
export interface IHumanFaceSkinChart {
  /** Read this chart's coordinates of a finite head-frame metre point. */
  project(point: readonly number[]): IHumanFaceSkinChartCoordinate;

  /** Lift ordered chart chords to native pieces or report unsupported source. */
  compile(
    guide: readonly IHumanFaceSkinChartCoordinate[],
  ): IHumanFaceSkinChartSpan[];
}
