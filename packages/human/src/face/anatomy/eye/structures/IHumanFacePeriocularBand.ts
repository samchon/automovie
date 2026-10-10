import type { IAutoMovieHumanFaceAttachmentChart } from "../../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IHumanFaceSkinFrame } from "../../skin/IHumanFaceSkinFrame";
import type { IHumanFaceConformingSheet } from "./IHumanFaceConformingSheet";
import type { IHumanFacePeriocularHostSample } from "./IHumanFacePeriocularHostSample";
import type { IHumanFacePeriocularArcLocation } from "./IHumanFacePeriocularArcLocation";
import type { IHumanFacePeriocularMappingReading } from "./IHumanFacePeriocularMappingReading";

/** One immutable source sampler shared by tarsal and conjunctival sheets of the same lid.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularBand {
  /** Actual source station frames before requested tissue offsets. */
  frames: IHumanFaceSkinFrame[];
  /** Actual source sample witnesses in the same order. */
  samples: IHumanFacePeriocularHostSample[];
  /** Near-boundary sample count; legacy sheets use this as grid width. */
  stride: number;
  /** Requested cross-band sampling count, retained by material refinement. */
  height: number;
  /** Legacy geometric endpoint quotients; a registered scalar zero is not a quotient. */
  collapsedColumns: Set<number>;
  /** Authored tear-film construction floor, metres; no facet-deviation allowance is added. */
  floor: number;
  /** Optional observed source-map fields reused without repeating their instrument. */
  sourceReading?: IHumanFacePeriocularMappingReading;
  /** Source chart controlling the actual host-incidence overlay. */
  chart?: IAutoMovieHumanFaceAttachmentChart;
  /** Unchanged selected coarse cage columns, before native-edge refinement. */
  sourceColumns?: number[];
  /** Original anterior native anchors at those coarse columns. */
  nearBoundary?: number[];
  /** Original posterior-origin far targets, including distinct zero-distance seats. */
  farBoundary?: IHumanFacePeriocularArcLocation[];
  /** Registered ordered closed material boundary, without a repeated seam vertex. */
  boundary?: number[];
  /** Immutable source/grid overlay reused by every tissue on this band. */
  conforming?: IHumanFaceConformingSheet;
  /** Actual host frames at the overlay's shared vertices. */
  conformingFrames?: IHumanFaceSkinFrame[];
}
