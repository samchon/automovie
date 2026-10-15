/**
 * Records returned by the house observation derivation, and the opening-frame
 * resolver shared by threshold stations and route checks. The derived census
 * and five reference selectors use these addresses; a nullable pose keeps
 * exterior camera ownership with settings and failed interior poses visible
 * to the caller. Opening geometry comes from the built wall face and void,
 * without moving either. World coordinates are right-handed Y-up metres.
 */
import { IHouseObservation } from "./IHouseObservation";
import { IReferenceComparison } from "./IReferenceComparison";

/**
 * The derivation result.
 */
export interface IObservationDerivation {
  /** Every derived question. */
  observations: IHouseObservation[];
  /** Questions that could not be placed, with their causes. */
  failures: { id: string; cause: string }[];
  /** The five reference comparisons. */
  references: IReferenceComparison[];
}

