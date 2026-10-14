import type { IAutoMovieHumanFaceAttachmentChart } from "../../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IHumanFaceSkinFrame } from "../../skin/IHumanFaceSkinFrame";
import type { IHumanFaceConformingSheet } from "./IHumanFaceConformingSheet";
import type { IHumanFacePeriocularHostSample } from "./IHumanFacePeriocularHostSample";
import type { IHumanFacePeriocularArcLocation } from "./IHumanFacePeriocularArcLocation";
import type { IHumanFacePeriocularMappingReading } from "./IHumanFacePeriocularMappingReading";

/** One source sampler shared by tarsal and conjunctival sheets of the same lid.
 * Its geometry/registration remains fixed while its owner lazily populates
 * conforming overlays, frames and source observations for the same band.
 *
 *
 * @evidence contracts/common.md#principled-implementation Fixed source samples/frames and original near/far targets define one shared lid material domain.
 * @evidence contracts/common.md#clear-and-simple-design buildHumanFacePeriocularBand owns registration while tissue construction lazily adds reusable overlay/frames/source observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registered zero arc does not collapse a native column and numerical deviation never increases the tear-film floor.
 * @evidence contracts/common.md#meaningful-documentation The prose states fixed source geometry, mutable owner-populated caches, legacy quotients and metric floor.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularBand is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularBand declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularBand acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
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
