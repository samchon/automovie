import type { IHumanFacePeriocularGrid } from "./IHumanFacePeriocularGrid";
import type { IHumanFacePeriocularMappingReading } from "./IHumanFacePeriocularMappingReading";
import type { IHumanFaceSkinFrame } from "../../skin/IHumanFaceSkinFrame";
import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/** Actual source sampler buffers and generated sheets for one mapping reading.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularMappingInput extends IHumanFacePeriocularGrid {
  /** Source-seated skin points before any requested offset, head-frame metres. */
  skin: number[];

  /** The producer's actual outer sheet, without reconstruction. */
  outer: number[];

  /** The producer's actual inner sheet, without reconstruction. */
  inner: number[];

  /** Actual sample material coordinates, or undefined for legacy spatial seating. */
  material?: number[];

  /** Actual sampled host triangle ordinals. */
  sourceTriangles: number[];

  /** Same-band immutable source observations; only source fields may be reused. */
  sourceReading?: IHumanFacePeriocularMappingReading;

  /** Actual conforming source incidence, when the producer no longer emits a coarse grid chord sheet. */
  indices?: number[];

  /** Producer frames in emitted vertex order, when source-conforming. */
  frames?: IHumanFaceSkinFrame[];

  /** Producer skin registrations in emitted vertex order, when source-conforming. */
  seats?: IHumanFaceSkinSeat[];

  /** Original requested outer normal distance, metres, without alteration. */
  outerDistanceMetres: number;

  /** Original requested inner normal distance, metres, without alteration. */
  innerDistanceMetres: number;
}
