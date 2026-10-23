import type { IProductionGateKey } from "./IProductionGateKey";

/** Ownership assigned by the factory, independent of diagnostic locations. */
export interface IProductionClaimOwner extends IProductionGateKey {
  /** Original position in the unfiltered evidence config. */
  index: number;
  /** Distinguishes authored duties, work declarations, and review records. */
  kind: "generated" | "custom" | "review" | "verdict" | "support";
  /** The factory's primary authored H2 population for this pass. */
  authored?: true;
}
