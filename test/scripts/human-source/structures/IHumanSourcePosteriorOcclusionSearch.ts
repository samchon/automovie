import type { IHumanSourcePosteriorOcclusionEvaluation } from "./IHumanSourcePosteriorOcclusionEvaluation.ts";

/** Finite complete-crown source search; admission and optimum claims stay separate. */
export interface IHumanSourcePosteriorOcclusionSearch {
  scales: number[];
  evaluation: IHumanSourcePosteriorOcclusionEvaluation;
  evaluations: number;
  mesh: number;
  arithmeticRefusals: string[];
  termination: "accepted" | "budget" | "representability";
  qualification: string;
}
