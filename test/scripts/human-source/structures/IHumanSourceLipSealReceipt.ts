import type { IHumanSourceLipClosureRows } from "./IHumanSourceLipClosureRows.ts";

/**
 * Source-neutral lip closure authored through the existing margin gain owner.
 *
 * @author Samchon
 */
export interface IHumanSourceLipSealReceipt {
  /** Authoring method identity. */
  revision: string;

  /** Actual published companion channel whose mapped rows were used. */
  closureChannel: string;

  /** Corresponding source endpoint. */
  endpoint: string;

  /** Central closure ratio measured on the actual source rest. */
  centralGain: number;

  /** Canonical current-skin vermilion chain registration used before closure. */
  marginRegistration: Record<string, unknown>;

  /** Actual current-provider recipe, original shift and head rows used to close. */
  closurePreparation: IHumanSourceLipClosureRows;

  /** Original contact tolerance, retained in metres. */
  toleranceMetres: number;

  /** Every margin vertex's signed opening before authoring, metres. */
  gapsBeforeMetres: number[];

  /** Same geometric reading on the authored skin, metres. */
  gapsAfterMetres: number[];

  /** Canonical root vertices moved, ascending. */
  movedSourceVertices: number[];

  /** Largest source displacement, metres. */
  maximumDisplacementMetres: number;

  /** Source preparation and consumer limits of the result. */
  qualification: string;
}
