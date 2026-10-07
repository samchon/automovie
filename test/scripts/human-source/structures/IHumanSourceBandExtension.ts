import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";

/**
 * The band-extended generation and the measured checks of the extension.
 *
 * @author Samchon
 */
export interface IHumanSourceBandExtension {
  generation: IHumanSourceGeneration;
  checks: Record<string, number | boolean | string>;
}
