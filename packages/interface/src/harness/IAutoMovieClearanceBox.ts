import { IAutoMoviePropBox } from "./IAutoMoviePropBox";

/**
 * One axis-aligned model-local volume another prop may not occupy.
 *
 * The validator compares the transformed keep-out volume against the
 * transformed occupancy of every other uniquely staged, valid prop. Boxes that
 * only touch on a face do not overlap, and a clearance is tested neither
 * against its own prop nor against building geometry.
 *
 * @evidence contracts/common.md#principled-implementation The model-local box is carried through the prop's staged TRS into world bounds and tested with a strict interior-overlap predicate, so contact on a face is allowed and only shared volume is refused.
 * @evidence contracts/common.md#clear-and-simple-design Extends `IAutoMoviePropBox` with an id only, so the same box type and transform serve both occupancy and keep-out volumes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No prop pair is special-cased; the check runs against every other staged prop, skipping only props that failed forging or staging uniqueness or carry a non-finite footprint, which have no trustworthy occupancy.
 * @evidence contracts/common.md#meaningful-documentation States the frame, what the box is compared against, that face contact is not overlap, the id rule, and that its own prop and building geometry are not tested.
 * @author Samchon
 */
export interface IAutoMovieClearanceBox extends IAutoMoviePropBox {
  /** Stable, non-blank clearance identity, unique within the prop. */
  id: string;
}
