import { IAutoMoviePropBox } from "./IAutoMoviePropBox";

/**
 * One axis-aligned model-local volume another prop may not occupy.
 *
 * The validator compares the transformed keep-out volume against the
 * transformed occupancy of every other uniquely staged, valid prop. Boxes that
 * only touch on a face do not overlap, and a clearance is tested neither
 * against its own prop nor against building geometry.
 *
 * @author Samchon
 */
export interface IAutoMovieClearanceBox extends IAutoMoviePropBox {
  /** Stable, non-blank clearance identity, unique within the prop. */
  id: string;
}
