import type { IHumanSourceTongueRestParameters } from "./IHumanSourceTongueRestParameters.ts";
import type { IHumanSourceTongueRestEvaluation } from "./IHumanSourceTongueRestEvaluation.ts";

/** Source fit candidate with sampled lining and explicit whole-admission gaps. */
export interface IHumanSourceTongueRestSearch {
  parameters: IHumanSourceTongueRestParameters;
  evaluation: IHumanSourceTongueRestEvaluation;
  evaluations: number;
  mesh: number;
  refusals: string[];
  termination: "accepted" | "budget" | "representability";
}
