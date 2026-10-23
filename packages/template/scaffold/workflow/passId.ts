import type { IProductionGateKey } from "./IProductionGateKey";

/** Stable pass identity for dependency and diagnostic joins. */
export function passId(key: IProductionGateKey): string {
  return `${key.layer}/${key.pass}`;
}
