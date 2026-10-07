import type { IHumanSourceGenerationInput } from "./IHumanSourceGenerationInput.ts";

/** Stored normal producer's failed-qualified component checkpoint.
 * @author Samchon
 */
export interface IHumanSourceAuthoredStageReceipt {
  schema: string;
  completeGeneration: boolean;
  fullStageAccepted: boolean;
  inspectionOnly: boolean;
  completedComponents: string[];
  refusedComponents: string[];
  activeRootVertices: number;
  cutVertices: number;
  headVertices: number;
  bodyVertices: number;
  endpointStates: number;
  inputs: IHumanSourceGenerationInput[];
  files: Record<string, string>;
}
