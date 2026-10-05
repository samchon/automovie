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
    thighMetres: [number, number];
    upperArmMetres: [number, number];
    calfMetres: [number, number];
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

  /** Optional exterior girths and rig shoulder-centre distance: each channel is solved by its own `HUMAN_BODY_MEASUREMENTS` rule. */
  measurements: {
    parameter:
      | "waistMetres"
      | "hipsMetres"
      | "bustMetres"
      | "shoulderMetres"
      | "thighMetres"
      | "upperArmMetres"
      | "calfMetres";
    channel: string;
  }[];

  /** Siri's density model and the trusted fat band. */
  mass: {
    siri: { numerator: number; offset: number };
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

    /**
     * Fat-free mass index (kg/m²) one unit of the muscle parameter adds over
     * the regression's body at the same stature and mass, by sex: the fat
     * the definition gates read is the regression's less the mass that
     * muscle displaces (`100 · Δ · muscle / BMI` points). Deurenberg's
     * regression knows no muscularity, so without this an athlete reads the
     * fat of an untrained body of the same mass index.
     */
    muscleFatFreeMassIndex: [number, number][];
  };

  /**
   * The ages over which a body becomes able to build muscle, as curves over
   * sex: before `startAgeYears` training adds no measurable muscle, from
   * `endAgeYears` it adds an adult's, linearly between. The derived
   * `developedMuscle` is the muscle parameter times this ramp; relations
   * calibrated on adult training read it instead of `muscle`, and so does
   * the fat-free mass the definition gates subtract.
   */
  maturity: {
    startAgeYears: [number, number][];
    endAgeYears: [number, number][];
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
