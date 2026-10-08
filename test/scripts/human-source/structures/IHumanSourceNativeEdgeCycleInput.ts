import type { IHumanSourceAttachmentTopology } from "./IHumanSourceAttachmentTopology.ts";

/** Inputs to the shared deterministic native station-path owner.
 *
 * @author Samchon
 */
export interface IHumanSourceNativeEdgeCycleInput {
  /** Actual oriented host incidence, optionally restricted to an admitted annulus. */
  topology: IHumanSourceAttachmentTopology;
  /** Distinct resident anchors, in the source-authored closed row order. */
  stations: readonly number[];
  /** Other anchors and interior witnesses that no intermediate path may cross. */
  forbidden: ReadonlySet<number>;
  /** Shared occupied paths; this owner records every newly visited cycle vertex. */
  occupied: Set<number>;
}
