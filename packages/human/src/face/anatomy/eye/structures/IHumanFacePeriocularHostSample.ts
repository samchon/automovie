import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";
import type { IHumanFacePeriocularMaterialEdgePoint } from "./IHumanFacePeriocularMaterialEdgePoint";

/**
 * Source-chart witness for one posterior tissue station before its requested
 * normal offset. The generated part's lazy mapping reader retains the shared
 * band and these records for its lifetime; failure witnesses can distinguish
 * a folded host projection from rounding or a source-declared endpoint.
 *
 *
 * @evidence contracts/common.md#principled-implementation Original source frame point, chart coordinate and actual skin seat retain each posterior sample before its requested offset.
 * @evidence contracts/common.md#clear-and-simple-design The shared band producer owns records and the generated part's lazy mapping closure retains their correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Declared native-edge affine parents remain separate from rounded chart UV and a legacy free spatial sample stays qualified.
 * @evidence contracts/common.md#meaningful-documentation Fields state metre point, fractional coarse column, exact edge construction and retained mapping lifetime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularHostSample is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularHostSample declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularHostSample acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularHostSample {
  /** Structured sheet row, increasing away from the lid margin. */
  row: number;

  /** Resampled sheet column, in the source cage's medial-to-lateral order. */
  column: number;

  /** Fractional index among this band's unchanged selected coarse columns. */
  sourceColumn?: number;

  /** Station before normal offset, head-frame metres; legacy seating records its free spatial sample. */
  point: number[];

  /** Rounded dimensionless chart coordinate; a declared materialEdge retains its exact parent construction. */
  materialPoint?: [number, number];

  /** Exact native-edge construction when the published boundary supplies this point. */
  materialEdge?: IHumanFacePeriocularMaterialEdgePoint;

  /** Actual host triangle and its barycentric attachment weights. */
  seat: IHumanFaceSkinSeat;
}
