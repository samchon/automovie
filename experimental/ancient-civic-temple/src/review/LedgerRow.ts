import { MeshAccount } from "./MeshAccount";


/** Topology account of one model or composite solid with the closure contract it is held to. */
export interface LedgerRow {
  /** Mesh topology account. */
  account: MeshAccount;
  /**
   * Closure the mesh must satisfy: a closed solid, an open top surface, one member of a closed
   * composite, or an assembly of closed parts.
   */
  contract: "closed" | "open-surface" | "composite-member" | "solid-assembly";
  /** Contract violations; empty when the mesh satisfies its contract. */
  findings: string[];
}
