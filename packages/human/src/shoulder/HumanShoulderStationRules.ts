import type { HumanShoulderSkinAdapter } from "./HumanShoulderSkinAdapter";

/** Pooled common cut-role proxy from all eight original shoulders.
 * Source-only fit SHA256: 5f61bf1df37071274980089a72bd25d487a2a2251de177845c6b62078a68fb97.
 * This predicts acquisition-role planes; it does not identify anatomical layers.
 */
export namespace HumanShoulderStationRules {
  /** One shared three-scalar law; no person identity or source geometry is read. */
  export const law: HumanShoulderSkinAdapter.StationLaw = {"scope":"source-conditioned-cut-role-proxy","centerConstant":0.23772188645307035,"centerShape":0.010854685618102199,"widthMm":9.999999999999991};
}
