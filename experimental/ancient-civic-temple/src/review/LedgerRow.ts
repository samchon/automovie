import { MeshAccount } from "./MeshAccount";


export interface LedgerRow {
  account: MeshAccount;
  contract: "closed" | "open-surface" | "composite-member" | "solid-assembly";
  findings: string[];
}
