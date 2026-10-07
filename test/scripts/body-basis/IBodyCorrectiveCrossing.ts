import type { IBodyContactPair } from "./readBodyContacts";

/** Actual crossing and repair evidence of one corrective visit. */
export interface IBodyCorrectiveCrossing {
  id: string;
  /** Joint-path onset and full fractions, dimensionless. */
  onset: number;
  full: number;
  /** Shape-path fraction, dimensionless. */
  weight: number;
  pairs: IBodyContactPair[];
  vertices: number;
  /** Largest posed displacement, metres. */
  mostPosed: number;
  log: string[];
  verification: object[];
}
