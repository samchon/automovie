import type { AutoMovieHumanBodySimpleParameter } from "./AutoMovieHumanBodySimpleParameter";

/**
 * The shape of the simple-tier expansion table: the envelope, the stature
 * and mass models, the age-specific body fat estimates and the term rows,
 * all numbers.
 *
 * A term row scales the product of piecewise-linear curves, one per simple
 * or derived parameter, into one channel; rows for the same channel add. A
 * curve holds its end values outside its points. The identity, solved and
 * measurement entries name the channels the projection reads back and the
 * inversions solve. The table is data so a relation is audited and tuned as
 * a row, never as code.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Types the relations a user can read to see what each simple parameter drives.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Declares the table form the expansion evaluates: envelope, head allowance, age-dependent head share, pediatric and adult fat estimates and product-of-curves rows.
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

  /**
   * The stature channel, solved by measurement, and the mass direction: the
   * channels a kilogram is spread over (the source's weight macro and the
   * regional fat, by sex) as term rows whose products are the direction's
   * coefficients; the mass is solved as one scalar along that direction,
   * over the envelope of the channel named `range`.
   */
  solved: {
    stature: string;
    mass: {
      range: string;
      direction: {
        channel: string;
        gain: number;
        curves: {
          parameter: AutoMovieHumanBodySimpleParameter;
          points: [number, number][];
        }[];
      }[];
    };
  };

  /** Optional tape measurements: the channel each is solved on, whose rule in `HUMAN_BODY_MEASUREMENTS` reads it. */
  measurements: {
    parameter: "waistMetres" | "hipsMetres" | "bustMetres" | "shoulderMetres";
    channel: string;
  }[];

  /** The head's height above the basis's clip ring, metres. */
  stature: { headAboveRingMetres: number };

  /** Siri's density model, age-dependent head-and-neck share and the trusted fat band. */
  mass: {
    siri: { numerator: number; offset: number };
    headAndNeck: {
      /** Jensen's male 4–20-year regression, used only through age 15 here. */
      pediatric: {
        intercept: number;
        ageYearsCoefficient: number;
        ageYearsSquaredCoefficient: number;
      };
      /** Dempster/Winter adult approximation. */
      adultFraction: number;
      /** Authored interpolation interval between the two study domains. */
      transitionAgeYears: [number, number];
    };
    fatFraction: [number, number];
  };

  /** Deurenberg's two body-fat regressions and the essential fat the definition gates subtract. */
  fat: {
    pediatric: {
      bodyMassIndex: number;
      ageYears: number;
      male: number;
      intercept: number;
    };
    adult: {
      bodyMassIndex: number;
      ageYears: number;
      male: number;
      intercept: number;
    };
    /** Authored interpolation interval; the study reports separate age domains. */
    transitionAgeYears: [number, number];
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
