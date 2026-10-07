/** Finite direct-search evidence, without an unproved global optimum claim. */
export interface IHumanSourcePatternSearchResult<T extends object> {
  parameters: number[];
  evaluation: T;
  evaluations: number;
  mesh: number;
  refusals: string[];

  /** Actual owner admission, exhausted call budget, or exhausted representation. */
  termination: "accepted" | "budget" | "representability";
}
