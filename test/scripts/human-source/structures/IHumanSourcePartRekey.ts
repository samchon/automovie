import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceLoss } from "./IHumanSourceLoss.ts";

/**
 * The generation with every part bound to the skin and its body-control rows
 * regenerated, the face landmark set carrying every body endpoint's rows, any
 * named losses, and the measured checks.
 *
 * @author Samchon
 */
export interface IHumanSourcePartRekey {
  generation: IHumanSourceGeneration;
  losses: IHumanSourceLoss[];
  checks: Record<string, number | boolean | string>;
}
