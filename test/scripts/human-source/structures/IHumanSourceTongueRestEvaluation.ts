/** Exact source contacts and explicitly sampled analytic lining readings. */
export interface IHumanSourceTongueRestEvaluation {
  penetratingCrowns: string[];
  crossingCrowns: string[];
  penetrationSquaredMetres: number;
  tipGapMetres: number;
  tipHeightWithinIncisors: boolean;
  lateralGapsMetres: number[];
  dorsumPalateGapMetres: number;
  sampledPalateMinimumMetres: number;
  symmetryMaximumMetres: number;
  excessSquaredMetres: number;
  sampledFeasible: boolean;
  qualification: string;
}
