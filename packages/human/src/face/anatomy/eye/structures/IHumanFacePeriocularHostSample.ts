import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";
import type { IHumanFacePeriocularMaterialEdgePoint } from "./IHumanFacePeriocularMaterialEdgePoint";

/**
 * Source-chart witness for one posterior tissue station before its requested
 * normal offset. Retained only while constructing a shell, these records let
 * a failed geometric admission distinguish a folded host projection from
 * rounding or a source-declared zero-height endpoint.
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
