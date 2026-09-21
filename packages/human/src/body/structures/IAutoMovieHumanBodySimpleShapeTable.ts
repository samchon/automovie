import type { AutoMovieHumanBodySimpleParameter } from "./AutoMovieHumanBodySimpleParameter";

/**
 * The shape of the simple-tier expansion table: the envelope, the stature
 * and mass models, the body fat estimate and the term rows, all numbers.
 *
 * A term row scales the product of piecewise-linear curves, one per simple
 * or derived parameter, into one channel; rows for the same channel add. A
 * curve holds its end values outside its points. The identity, solved and
 * measurement entries name the channels the projection reads back and the
 * inversions solve. The table is data so a relation is audited and tuned as
 * a row, never as code.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Types the relations a user can read to see what each simple parameter drives.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Declares the table form the expansion evaluates: envelope, head allowance, mass model, fat estimate and product-of-curves rows.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeTable {
  /** Inclusive envelope of each simple parameter, the optional ones included. */
  limits: {
    sex: [number, number];
    ageYears: [number, number];
    statureMetres: [number, number];
    massKilograms: [number, number];
    muscle: [number, number];
    waistMetres: [number, number];
    hipsMetres: [number, number];
    bustMetres: [number, number];
    shoulderMetres: [number, number];
  };

  /**
   * The identity parameters a detailed shape is projected back to: each
   * reads one channel through the inverse of its first term row, after the
   * other rows naming that channel (an age loss on the muscle) are removed.
   */
  identity: { sex: string; ageYears: string; muscle: string };

  /** The stature and mass channels, solved by measurement. */
  solved: { stature: string; mass: string };

  /** Optional tape measurements: the channel each is solved on, whose rule in `HUMAN_BODY_MEASUREMENTS` reads it. */
  measurements: {
    parameter: "waistMetres" | "hipsMetres" | "bustMetres" | "shoulderMetres";
    channel: string;
  }[];

  /** The head's height above the basis's clip ring, metres. */
  stature: { headAboveRingMetres: number };

  /** Siri's density model, the head-and-neck mass fraction and the fat fraction the model is trusted over. */
  mass: {
    siri: { numerator: number; offset: number };
    headAndNeckFraction: number;
    fatFraction: [number, number];
  };

  /** Deurenberg's body fat estimate and the essential fat by sex the definition gates subtract. */
  fat: {
    bodyMassIndex: number;
    ageYears: number;
    male: number;
    intercept: number;
    essentialBySex: [number, number][];
  };

  /** Channel weight = Σ gain · Π curve(parameter) over the rows naming that channel. */
  terms: {
    channel: string;
    gain: number;
    curves: {
      parameter: AutoMovieHumanBodySimpleParameter;
      points: [number, number][];
    }[];
  }[];
}
