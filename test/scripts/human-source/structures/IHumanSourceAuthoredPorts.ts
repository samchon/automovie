import type { IHumanSourceNasalPort } from "./IHumanSourceNasalPort.ts";

/** Owned nasal boundaries consumed by the publisher from its provider packet.
 * Other packet ports have independent registration owners.
 * @author Samchon
 */
export interface IHumanSourceAuthoredPorts {
  nose: IHumanSourceNasalPort[];
}
