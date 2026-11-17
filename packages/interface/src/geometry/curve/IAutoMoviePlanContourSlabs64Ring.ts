import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Sampled saved ring viewed by slab correspondence. The planner reads these
 * borrowed points and signed winding without changing their order.
 *
 * @evidence contracts/development/design.md#principled-representation Millimetre cyclic samples and declared material winding keep metric scoring separate from orientation compatibility.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Slab planning needs only points, winding and local sampling refusal; richer source ownership remains on the caller's ring.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unsupported ring receives infinite matching separation instead of a fabricated replacement boundary.
 * @evidence contracts/development/common.md#meaningful-documentation States the point frame, borrowed storage and unsupported matching behavior.
 */
export interface IAutoMoviePlanContourSlabs64Ring {
  /** Cyclic samples in the common model millimetre frame; admitted usable rings support source-curve separation scoring. */
  points: AutoMovieVector3Tuple[];

  /** Declared material-boundary winding, compared for exact equality when selecting continuation candidates. */
  winding: number;

  /** Sampling or representation refusal; presence excludes this ring from ordinary geometric matching while retaining its saved ordinal. */
  unsupported?: string;
}
