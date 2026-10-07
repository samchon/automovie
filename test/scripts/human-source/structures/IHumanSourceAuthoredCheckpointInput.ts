import type { IHumanSourceCompactedTopology } from "./IHumanSourceCompactedTopology.ts";
import type { IHumanSourceAuthoredSkin } from "./IHumanSourceAuthoredSkin.ts";
import type { IHumanSourceGenerationInput } from "./IHumanSourceGenerationInput.ts";

/** Verified preparation onto which an immutable inspection checkpoint is read.
 * @author Samchon
 */
export interface IHumanSourceAuthoredCheckpointInput {
  directory: string;
  root: IHumanSourceCompactedTopology;
  skin: IHumanSourceAuthoredSkin;
  inputs: IHumanSourceGenerationInput[];
  /** Complete state count of the freshly verified replay. */
  endpointStates: number;
}
