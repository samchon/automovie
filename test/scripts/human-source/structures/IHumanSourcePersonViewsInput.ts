import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceP1Pair } from "./IHumanSourceP1Pair.ts";

/**
 * Inputs of the person view split: the finished generation and the P1 pair,
 * whose face and body bases carry the content the generation does not
 * (materials, regions, articulation, contact, hair records, body rig, sag,
 * relief, overlays) on the same partitions.
 *
 * @author Samchon
 */
export interface IHumanSourcePersonViewsInput {
  generation: IHumanSourceGeneration;
  p1: IHumanSourceP1Pair;
}
