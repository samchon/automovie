import type { IHumanSourceBodyReproduction } from "./IHumanSourceBodyReproduction.ts";
import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";

/**
 * The generation and body rows after the body field producers ran, with each
 * producer's receipt.
 *
 * @author Samchon
 */
export interface IHumanSourceFieldRegeneration {
  /** The generation with the regenerated rows, stamps and availability. */
  generation: IHumanSourceGeneration;

  /** The body rows with the regenerated view rows and records. */
  bodyRows: IHumanSourceBodyReproduction;

  /** Producer receipts, written to the generation manifest. */
  receipts: Record<string, unknown>[];
}
