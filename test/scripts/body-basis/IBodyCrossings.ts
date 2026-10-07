import type { IBodyCrossingFinding } from "./IBodyCrossingFinding";
import type { IBodyCrossingRefusal } from "./IBodyCrossingRefusal";

/** Findings and refusals are separate answers of the normal source census. */
export interface IBodyCrossings {
  findings: IBodyCrossingFinding[];
  refused: IBodyCrossingRefusal[];
}
