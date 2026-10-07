import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceGenerationLandmarks } from "./IHumanSourceGenerationLandmarks.ts";
import type { IHumanSourceGenerationPart } from "./IHumanSourceGenerationPart.ts";

/**
 * What decides which body endpoints drive head-partition data: the generation
 * before part binding, the head-only vertex mask, and the bound parts and
 * face landmarks.
 *
 * @author Samchon
 */
export interface IHumanSourceDriverInput {
  /** The generation whose skin rows, channels and correctives are read. */
  generation: IHumanSourceGeneration;

  /** Original skin vertices of the head partition alone. */
  headOnly: Uint8Array;

  /** Head-shaping body endpoints. */
  headShaping: ReadonlySet<string>;

  /** Every body endpoint name. */
  bodyKeys: ReadonlySet<string>;

  /** Parts with their regenerated body rows. */
  parts: readonly IHumanSourceGenerationPart[];

  /** Landmark sets with the face set regenerated. */
  landmarks: readonly IHumanSourceGenerationLandmarks[];
}
