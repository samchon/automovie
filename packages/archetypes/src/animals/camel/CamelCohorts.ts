/*
 * Whole dromedary reference means from one measured Mauritanian sample.
 *
 * Diop et al. 2020, REMVT 73:247-254, doi:10.19182/remvt.31948, Table II,
 * printed p.250, reports five automatically classified groups of 131 adult
 * females. Their individual group counts, masses and within-group ranges are
 * not supplied. The pooled reference is the separate overall mean. Uniform
 * selection of these five prototypes is an authored catalogue policy, not a
 * measured morphotype frequency or continuous population distribution.
 */
export namespace CamelCohorts {
  /** The overall point and the five source-defined adult-female morphotypes. */
  export type Name =
    | "mauritanian-adult-female"
    | "maur1"
    | "maur2"
    | "maur3"
    | "maur4"
    | "maur5";

  /*
   * One complete body-reference vector in metres, without an unknown mass.
   */
  export interface IMeasures {
    /*
     * Ground to withers, excluding the hump, metres.
     */
    withers: number;
    /*
     * Chest circumference excluding the hump, metres.
     */
    girth: number;
    /*
     * Shoulder point to ischial point, metres.
     */
    body: number;
    /*
     * Larynx to neck attachment at the brisket, metres.
     */
    neck: number;
    /*
     * Mid-neck circumference, metres.
     */
    neckGirth: number;
    /*
     * Occipital crest to nose tip, metres.
     */
    head: number;
    /*
     * Tape path between ears via the occipital crest, used as a coarse
     * diameter.
     */
    headBreadth: number;
  }

  /*
   * Previous pooled reference, retained explicitly for canonical construction.
   */
  export const DEFAULT: Name = "mauritanian-adult-female";

  /*
   * Every explicit source-reference choice; the pooled mean is not a
   * morphotype.
   */
  export const NAMES: readonly Name[] = [
    DEFAULT,
    "maur1",
    "maur2",
    "maur3",
    "maur4",
    "maur5",
  ];

  /*
   * Authored equal-choice palette of the five measured group means only.
   */
  export const DRAW: readonly Name[] = [
    "maur1",
    "maur2",
    "maur3",
    "maur4",
    "maur5",
  ];

  /*
   * Diop Table II centimetre means converted once to metres; Maur3 neck girth
   * preserves the printed extra digit.
   */
  export const MEASURES: Readonly<Record<Name, Readonly<IMeasures>>> = {
    "mauritanian-adult-female": {
      withers: 1.847,
      girth: 1.978,
      body: 1.471,
      neck: 1.084,
      neckGirth: 0.656,
      head: 0.515,
      headBreadth: 0.215,
    },
    maur1: {
      withers: 1.893,
      girth: 2.008,
      body: 1.501,
      neck: 1.108,
      neckGirth: 0.663,
      head: 0.528,
      headBreadth: 0.219,
    },
    maur2: {
      withers: 1.779,
      girth: 1.884,
      body: 1.431,
      neck: 1.025,
      neckGirth: 0.658,
      head: 0.501,
      headBreadth: 0.213,
    },
    maur3: {
      withers: 1.871,
      girth: 1.947,
      body: 1.393,
      neck: 1.09,
      neckGirth: 0.6236,
      head: 0.509,
      headBreadth: 0.207,
    },
    maur4: {
      withers: 1.766,
      girth: 2.054,
      body: 1.468,
      neck: 1.066,
      neckGirth: 0.682,
      head: 0.508,
      headBreadth: 0.216,
    },
    maur5: {
      withers: 1.961,
      girth: 2.041,
      body: 1.678,
      neck: 1.179,
      neckGirth: 0.643,
      head: 0.53,
      headBreadth: 0.215,
    },
  };
}
