import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";

/**
 * The generation with every macro defined once, and the measured cut
 * mismatch before and after per macro endpoint.
 *
 * @author Samchon
 */
export interface IHumanSourceMacroDefinition {
  generation: IHumanSourceGeneration;
  checks: Record<string, number | boolean | string>;
}
