import type { IAutoMovieMotionHumanMartialArt } from "@automovie/interface";

/*
 * The martial-art stance phrases' blocking: each form's provisional entry,
 * transfer and reset values and the held guards' hand sites
 * (MartialArtStancePhrase).
 */
export namespace MartialArtStanceForms {
  /*
   * The linked phrases offered by the martial-art law.
   */
  export type Kind = Exclude<IAutoMovieMotionHumanMartialArt.Kind, Kind2>;

  /*
   * Provisional blocking values for the shared entry, transfer and reset.
   */
  export interface IForm {
    /*
     * Lead mark ahead of the rear foot in statures.
     */
    stride: number;

    /*
     * Minimum knee bend under the fully opened pose, in degrees.
     */
    knee: number;

    /*
     * Entry and reset duration in seconds, before manner scaling.
     */
    step: number;

    /*
     * Forward and return transfer durations in seconds.
     */
    shift: readonly [forward: number, back: number];

    /*
     * Initial share of the stance span, then forward and backward changes.
     */
    weight: readonly [ready: number, forward: number, back: number];

    /*
     * Opening pelvis heading offset and further turn toward the second mark, in
     * degrees.
     */
    turn: readonly [ready: number, back: number];

    /*
     * The style's upper body path or held guard.
     */
    arms: Carriage;

    /*
     * The moving foot's arc height in statures; 0.025 when absent.
     */
    lift?: number;

    /*
     * Whether the moving foot steps out to the side instead of along the line.
     */
    lateral?: boolean;
  }

  /*
   * The arm carriage of a form: karate's switching chamber and strike line, tai
   * chi's open palms, or a held high or low fighting guard.
   */
  export type Carriage = "karate" | "taiChi" | GuardCarriage;

  /*
   * A carriage that holds a fighting guard through the phrase.
   */
  export type GuardCarriage = "highGuard" | "lowGuard" | "centreline";

  /*
   * One hand's held guard site in its shoulder's frame.
   */
  export interface IGuardSite {
    /*
     * Toward the midline from the shoulder joint, in shoulder half widths.
     */
    inward: number;

    /*
     * Above the shoulder joint, in upper-arm lengths.
     */
    up: number;

    /*
     * Ahead of the shoulder joint, in whole-arm lengths.
     */
    forward: number;
  }

  /*
   * The lead and rear hands' sites of one held guard.
   */
  export interface IGuard {
    /*
     * The leading side's hand.
     */
    lead: IGuardSite;

    /*
     * The rear side's hand.
     */
    rear: IGuardSite;
  }

  /*
   * Held guard sites, provisional readings of the coached guards that
   * `StrikingStance` cites. The Muay Thai guard holds both fists at ear height
   * just outside the jaw with the arms "projected out further" and nearly
   * vertical forearms. The taekwondo sparring guard carries the lead fist low
   * before the solar plexus and the rear fist at the lower chest, which leaves
   * the head open to the reach of kicks the stance is built for.
   */
  export const GUARDS: Record<GuardCarriage, IGuard> = {
    highGuard: {
      lead: { inward: 0.55, up: 0.6, forward: 0.45 },
      rear: { inward: 0.7, up: 0.6, forward: 0.36 },
    },
    lowGuard: {
      lead: { inward: 0.35, up: -0.55, forward: 0.5 },
      rear: { inward: 0.6, up: -0.4, forward: 0.3 },
    },
    centreline: {
      lead: { inward: 1, up: -0.35, forward: 0.62 },
      rear: { inward: 1, up: -0.45, forward: 0.32 },
    },
  };

  /*
   * The four screen forms share a clock and sole fit, with independent
   * blocking.
   */
  export const FORM: Record<Kind, IForm> = {
    karateStanceTransfer: {
      stride: 0.3,
      knee: 35,
      step: 0.55,
      shift: [0.42, 0.42],
      weight: [0.66, 0.06, 0.4],
      turn: [5, 20],
      arms: "karate",
    },
    taiChiTransfer: {
      stride: 0.35,
      knee: 23,
      step: 2,
      shift: [2.5, 2.5],
      weight: [0.43, 0.23, 0.32],
      turn: [0, 0],
      arms: "taiChi",
    },
    taekwondoStanceReset: {
      stride: 0.26,
      knee: 16,
      step: 0.64,
      shift: [0.48, 0.72],
      weight: [0.48, 0.1, 0.18],
      turn: [2, 16],
      arms: "lowGuard",
    },
    capoeiraGinga: {
      stride: -0.18,
      knee: 38,
      step: 0.5,
      shift: [0.5, 0.5],
      weight: [0.5, 0.2, 0.2],
      turn: [10, 0],
      arms: "highGuard",
    },
    sumoShiko: {
      stride: 0.2,
      knee: 55,
      step: 1.2,
      shift: [0.6, 0.6],
      weight: [0.5, 0, 0],
      turn: [0, 0],
      arms: "lowGuard",
      lift: 0.4,
      lateral: true,
    },
    wingChunStance: {
      stride: 0.12,
      knee: 25,
      step: 0.6,
      shift: [0.4, 0.4],
      weight: [0.3, 0.1, 0.1],
      turn: [0, 0],
      arms: "centreline",
    },
    muayThaiStanceReset: {
      stride: 0.28,
      knee: 41,
      step: 0.72,
      shift: [0.7, 0.6],
      weight: [0.46, 0.12, 0.25],
      turn: [2, 0],
      arms: "highGuard",
    },
  };
}

/*
 * The alternatives of `Kind2`'s site.
 */
type Kind2 = "horseStance" | "chokuZuki" | "taiChiPush";
