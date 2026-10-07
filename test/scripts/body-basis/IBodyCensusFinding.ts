import type { IBodyCensusDocument } from "./IBodyCensusDocument";

/** A named actual source census input as its receipt records it. */
export interface IBodyCensusFinding {
  name: string;
  document: IBodyCensusDocument;
}
