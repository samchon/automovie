import type { IHumanSourceGenerationPartBinding } from "./IHumanSourceGenerationPartBinding.ts";

/**
 * One face part bound to the skin, with what its rows are read from: the
 * published binding, each vertex's nearest head skin point, and the vertices
 * each rigid frame carries.
 *
 * @author Samchon
 */
export interface IHumanSourceBoundPart {
  /** The binding written to the generation. */
  binding: IHumanSourceGenerationPartBinding;

  /** Whether the part moves as rigid translations rather than with the skin. */
  rigid: boolean;

  /** Part vertex count. */
  count: number;

  /** Nearest head skin triangle per part vertex, kept for rigid parts too. */
  triangles: number[];

  /** Barycentric weights of that nearest point, three per part vertex. */
  weights: number[];

  /** Part vertices per rigid frame; empty for a surface binding. */
  members: Map<string, number[]>;
}
