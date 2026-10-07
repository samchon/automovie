import type { IHumanFaceSkinFrame } from "../../skin/IHumanFaceSkinFrame";
import type { IHumanFacePeriocularHostSample } from "./IHumanFacePeriocularHostSample";
import type { IHumanFacePeriocularMappingReading } from "./IHumanFacePeriocularMappingReading";
import type { IAutoMovieHumanFaceAttachmentChart } from "../../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IHumanFaceConformingSheet } from "./IHumanFaceConformingSheet";

/** One immutable source sampler shared by tarsal and conjunctival sheets of the same lid.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularBand {
  /** Actual source station frames before requested tissue offsets. */
  frames: IHumanFaceSkinFrame[];
  /** Actual source sample witnesses in the same order. */
  samples: IHumanFacePeriocularHostSample[];
  /** Source grid width. */
  stride: number;
  /** Source grid height. */
  height: number;
  /** Source-declared zero-height columns. */
  collapsedColumns: Set<number>;
  /** Authored tear-film construction floor, metres; no facet-deviation allowance is added. */
  floor: number;
  /** Optional observed source-map fields reused without repeating their instrument. */
  sourceReading?: IHumanFacePeriocularMappingReading;
  /** Source chart controlling the actual host-incidence overlay. */
  chart?: IAutoMovieHumanFaceAttachmentChart;
  /** Immutable source/grid overlay reused by every tissue on this band. */
  conforming?: IHumanFaceConformingSheet;
  /** Actual host frames at the overlay's shared vertices. */
  conformingFrames?: IHumanFaceSkinFrame[];
}
