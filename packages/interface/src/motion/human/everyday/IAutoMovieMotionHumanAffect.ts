/**
 * Affect displays as an additive layer: laughing, sighing, yawning,
 * coughing, sneezing, shivering, sobbing, weeping and gasping, each a short pattern of trunk, shoulder,
 * head and jaw angles over any action, starting and ending at zero.
 *
 * These are joint-angle patterns because no body point is brought anywhere:
 * the display is the trunk's and head's own convulsion or stretch, the way
 * an additive animation layer carries breathing or a laugh over locomotion.
 * Planted and gripping limb goals are untouched, and the arms are solved
 * after the trunk, so contacts and held objects stay where they are. Each
 * display is the sum of its pulses under an envelope that rises and falls
 * on minimum-jerk ramps, so it is zero with zero velocity at its start and
 * end.
 *
 * - `laugh`: a train of laugh notes about 210 ms apart (Provine 1996,
 *   American Scientist 84:38), each a 3 degree trunk flexion and 3 degree
 *   shoulder lift pulse, over a 5 degree head extension; a laugh of `seconds`
 *   repeats notes while it lasts, fading over its last third.
 * - `sigh`: a deep inhalation over 40 % of the sigh raising the shoulders 6
 *   degrees and extending the chest 4, then an exhalation that lets the
 *   shoulders fall 2 degrees below rest and the head drop 4.
 * - `yawn`: the jaw opens 25 degrees and the head extends 15 with the chest
 *   extending 5, peaking at 40 % of the yawn (a yawn lasts about six
 *   seconds, Provine 1986, Ethology 72:109; profile provisional).
 * - `cough`: three sharp trunk flexions of 10 degrees with the head 8, 0.5 s
 *   apart, each rising in 0.12 s and recovering over 0.38 s (provisional).
 * - `sneeze`: an inhalation that extends the head 10 degrees over 70 % of
 *   the sneeze, then a sudden flexion of the head 25 and the chest 10 in 0.1
 *   s, recovering by the end (provisional).
 * - `shiver`: the shoulders hunch 8 degrees while they tremble 1.5 degrees
 *   at 4 Hz, a visible shivering burst rate below the 12 Hz Nyquist limit of
 *   a 24 Hz film (shivering muscle tremor itself is faster, near 10 Hz, and
 *   would alias; provisional).
 * - `sob`: a train of short convulsive inspirations, each lifting the
 *   shoulders and extending the upper chest, over a trunk and head flexed
 *   forward; the intervals vary by a seeded draw, and the intensity scales
 *   both the amplitudes and how dense the train is (provisional).
 * - `weep`: quieter, slower crying: the head lowered, a slow shoulder heave
 *   and an occasional sniff at seeded times (provisional).
 * - `gasp`: one sudden deep inspiration that extends the head and raises the
 *   shoulders within a quarter second, then a recovering exhalation
 *   (provisional).
 *
 * Amplitudes and timings are provisional except where cited; an intensity
 * scales every amplitude.
 *
 * @evidence contracts/development/common.md#meaningful-documentation seconds: How long, seconds; the display's own length when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. intensity: Amplitude scale; 1 when absent.
 * @evidence contracts/development/design.md#principled-representation seconds: How long, seconds; the display's own length when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. intensity: Amplitude scale; 1 when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanAffect.ts (HumanAffect.angles, kind); everyday/HumanAffect.ts (HumanAffect.layer, displays); everyday/HumanAffect.ts (HumanAffect.LENGTH).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanAffect.angles.
 */
export namespace IAutoMovieMotionHumanAffect {
  /**
   * A display, one of the nine affect patterns the namespace documents.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the closed set of displays; each one's pattern is documented on the namespace.
   * @evidence contracts/development/design.md#principled-representation A string union over the nine displays, so an unknown display cannot be written; `angles` switches over it exhaustively.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by `IDisplay`, `LENGTH`, `angles` and the affect test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No shortcut present: one discriminant for all displays, no per-consumer member.
   */
  export type Kind =
    | "laugh"
    | "sigh"
    | "yawn"
    | "cough"
    | "sneeze"
    | "shiver"
    | "sob"
    | "weep"
    | "gasp";

  /**
   * One display at a film time, as the affect layer schedules it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit (film seconds, seconds, a scale) and the meaning of an absent length or intensity.
   * @evidence contracts/development/design.md#principled-representation A display's kind, its start on the film timebase, its length in seconds, an amplitude scale and the key of its seeded timing; positive length is validated at runtime by `angles`, intensity is not range-checked.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by `layer` and the affect test; the optional length, intensity and seed default to `LENGTH`, 1 and the display's kind and start.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No shortcut present: the optional members default independently and combine into no meaningless state.
   */
  export interface IDisplay {
    /** The display. */
    kind: IAutoMovieMotionHumanAffect.Kind;

    /** Film second it starts. */
    at: number;

    /** How long, seconds, positive; the display's own length when absent (`HumanAffect.LENGTH`, per kind: a laugh is brief, a weep long). */
    seconds?: number;

    /** Amplitude scale; 1 when absent: every joint angle of the display (`HumanAffect`) is multiplied by it, so 0.5 is a suppressed or quiet display and 2 an exaggerated one. For a sob it also sets the interval of its inspirations, 0.5 s at 1, shorter above and longer below, within [0.5, 2] (provisional beyond that range). */
    intensity?: number;

    /** The key of a sob's or weep's seeded irregular timing; the display's kind and start when absent, so equal displays repeat. */
    seed?: string;
  }
}
