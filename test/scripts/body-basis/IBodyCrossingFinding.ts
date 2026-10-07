import type { IBodyCrossingDocument } from "./IBodyCrossingDocument";
import type { IBodyContactPair } from "./readBodyContacts";

/** A source state whose posed body crosses itself, with actual contact pairs. */
export interface IBodyCrossingFinding {
  name: string;
  document: IBodyCrossingDocument;
  pairs: IBodyContactPair[];
}
