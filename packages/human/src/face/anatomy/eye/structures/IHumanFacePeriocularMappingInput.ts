import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceSkinFrame } from "../../skin/IHumanFaceSkinFrame";
import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";
import type { IHumanFacePeriocularGrid } from "./IHumanFacePeriocularGrid";
import type { IHumanFacePeriocularMappingReading } from "./IHumanFacePeriocularMappingReading";

/** Actual source sampler buffers and generated sheets for one mapping reading.
 *
 *
 * @evidence contracts/common.md#principled-implementation Actual source, outer/inner sheets and optional conforming incidence retain the same producer seats/frames and local publication origin.
 * @evidence contracts/common.md#clear-and-simple-design readHumanFacePeriocularMapping owns observations and may reuse only the unchanged same-band source reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent material remains unknown and no reconstructed coarse sheet replaces a conformed domain.
 * @evidence contracts/common.md#meaningful-documentation Fields state frames/units, original requested distances, native parents and source-only reuse.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularMappingInput is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularMappingInput declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularMappingInput acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
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

  /** Outer and inner shell's actual shared local-publication origin; source skin retains its original frame. */
  publicationOrigin?: IAutoMovieVector3;

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
