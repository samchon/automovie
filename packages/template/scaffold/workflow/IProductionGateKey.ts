import type { AuthoredLayer } from "./AuthoredLayer";
import type { ProductionGatePass } from "./ProductionGatePass";

/** Names one independently completed layer and pass. */
export interface IProductionGateKey {
  /** Names the authored layer covered by this record. */
  layer: AuthoredLayer;
  /** Naturalness is available only for scripts and screenplay. */
  pass: ProductionGatePass;
}
