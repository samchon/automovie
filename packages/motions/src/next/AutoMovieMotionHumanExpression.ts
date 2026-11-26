import { HumanAffect as HumanAffectSource } from "../perform/expression/HumanAffect";
import { HumanBreath as HumanBreathSource } from "../perform/expression/HumanBreath";
import { expressionAffect as expressionAffectLaw } from "../perform/expression/expressionAffect";
import { expressionBreath as expressionBreathLaw } from "../perform/expression/expressionBreath";

/**
 * An overlay: what the body's own signals add to any whole-body action, as
 * additive layers over the trunk, shoulders, head and face rather than goals of
 * the hands or feet. Affect is a display on a clock (a laugh, a sigh, a yawn, a
 * cough); breath is the continuous rhythm of the chest.
 *
 * Both methods are layer builders, not chain actions: each returns an
 * `IAutoMovieMotionHumanLayer` that a performance lays over the actions it
 * spans, so the family has no `Chain` parameter and the runtime namespace holds
 * plain functions. The layer writes joint angles, so every planted or gripping
 * limb goal stays where it is.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `affect`: The affect displays as one layer: each display added over the body
 *   at its film second for its length, by {@link HumanAffect.layer}.
 * - `breath`: The breathing layer: the chest, the upper chest and the lumbar
 *   spine extend and the shoulder girdles rise a little with each inhalation,
 *   by {@link HumanBreath.layer}.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanAffect`: Affect displays as an additive layer: laughing, sighing,
 *   yawning, coughing, sneezing, shivering, sobbing, weeping and gasping, each
 *   a short pattern of trunk, shoulder, head and jaw angles over any action,
 *   starting and ending at zero.
 * - `HumanBreath`: Breathing as an additive layer: the chest, the upper chest and
 *   the lumbar spine extend and the shoulder girdles rise a little with each
 *   inhalation, on every action, at a seeded resting rate that exertion raises
 *   and that recovers afterwards, with an occasional seeded sigh.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanExpression} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanExpression {
  /**
   * The affect displays as one layer: each display added over the body at its
   * film second for its length, by {@link HumanAffect.layer}.
   *
   * @param params The displays.
   * @returns The layer that adds the displays.
   * @throws {HumanRefusal} For a display whose length is not above the
   *   display's floor (0 s, more for a sneeze or a gasp).
   */
  export const affect: typeof expressionAffectLaw = expressionAffectLaw;

  /**
   * The breathing layer: the chest, the upper chest and the lumbar spine extend
   * and the shoulder girdles rise a little with each inhalation, by
   * {@link HumanBreath.layer}.
   *
   * @param params The rate and the exertion bouts; the defaults when absent.
   * @returns The layer that breathes.
   */
  export const breath: typeof expressionBreathLaw = expressionBreathLaw;

  /**
   * Affect displays as an additive layer: laughing, sighing, yawning, coughing,
   * sneezing, shivering, sobbing, weeping and gasping, each a short pattern of
   * trunk, shoulder, head and jaw angles over any action, starting and ending
   * at zero.
   *
   * These are joint-angle patterns because no body point is brought anywhere:
   * the display is the trunk's and head's own convulsion or stretch, the way an
   * additive animation layer carries breathing or a laugh over locomotion.
   * Planted and gripping limb goals are untouched, and the arms are solved
   * after the trunk, so contacts and held objects stay where they are. Each
   * display is the sum of its pulses under an envelope that rises and falls on
   * minimum-jerk ramps, so it is zero with zero velocity at its start and end.
   *
   * - `laugh`: a train of laugh notes about 210 ms apart (Provine 1996, American
   *   Scientist 84:38), each rising over 35 % of the interval and falling over
   *   the rest, a 3 degree chest and 1.5 degree lumbar flexion and a 3 degree
   *   shoulder lift pulse, over a 5 degree head extension; a laugh of `seconds`
   *   repeats notes while it lasts, rising over its first tenth and fading over
   *   its last third.
   * - `sigh`: a deep inhalation over 40 % of the sigh raising the shoulders 6
   *   degrees and extending the chest 4, then an exhalation that lets the
   *   shoulders fall 2 degrees below rest and the head drop 4, closing back to
   *   rest over the last 15 %.
   * - `yawn`: the jaw opens 25 degrees and the head extends 15 with the chest
   *   extending 5, peaking at 40 % of the yawn (a yawn lasts about six seconds,
   *   Provine 1986, Ethology 72:109; profile provisional).
   * - `cough`: three sharp trunk flexions, the first of 10 degrees at the chest,
   *   4 at the lumbar spine and 8 at the head and the next two smaller by the
   *   air each expels (53.2, 28.5 and 18.8 %, Harris and Lawson 1968), from 0.1
   *   s and 0.5 s apart, each rising in 0.12 s and recovering over 0.38 s, the
   *   whole ramped in over its first 2 % and out over its last 5 %
   *   (provisional).
   * - `sneeze`: an inhalation that extends the head 10 degrees and the chest 3
   *   over 70 % of the sneeze and released over the next 5 %, with a sudden
   *   flexion of the head 25 and the chest 10 in 0.1 s, recovering by the end;
   *   a sneeze shorter than the burst over its last 30 % is refused.
   * - `shiver`: the shoulders hunch 8 degrees and come forward 4, the chest
   *   flexes 3, while the shoulders tremble 1.5 degrees at 4 Hz, a visible
   *   shivering burst rate below the 12 Hz Nyquist limit of a 24 Hz film
   *   (shivering muscle tremor itself is faster, near 10 Hz, and would alias),
   *   ramped in and out over 15 % of the shiver.
   * - `sob`: the chest flexes 6 degrees, the lumbar spine 4 and the head 10,
   *   ramped in over 8 % and out over 20 %, under a train of inspirations each
   *   lifting the shoulders 6 degrees and extending the chest 4, rising in 0.1
   *   s and recovering over 0.25 s. They come 0.5 s apart at intensity 1,
   *   closer as the intensity rises to 2 and farther as it falls to 0.5, each
   *   interval varying by a seeded ±30 %. The convulsive inspirations of
   *   sobbing are Gross, Fredrickson and Levenson's (1994, Psychophysiology
   *   31:460); the amplitudes and timings are provisional.
   * - `weep`: the head lowers 12 degrees and the chest flexes 4, with a 2 degree
   *   shoulder heave every 2.5 s and a sniff about every 3.5 s, seeded ±30 %,
   *   that lifts the head 3 degrees and the shoulders 2 (provisional).
   * - `gasp`: the head extends 12 degrees, the chest 6 and the shoulders rise 8,
   *   peaking 0.25 s in and returning to rest by the end (provisional).
   *
   * The seeded timing of a sob or weep is keyed by the display's `seed`, or its
   * kind and start, so the same display repeats in every read and order.
   *
   * Amplitudes and timings are provisional, read from no measured source,
   * except where cited; an intensity scales every amplitude.
   */
  export import HumanAffect = HumanAffectSource;

  /**
   * Breathing as an additive layer: the chest, the upper chest and the lumbar
   * spine extend and the shoulder girdles rise a little with each inhalation,
   * on every action, at a seeded resting rate that exertion raises and that
   * recovers afterwards, with an occasional seeded sigh.
   *
   * Breathing is written as joint angles rather than an effector goal, because
   * no body point is brought anywhere: it is a rhythmic change of the trunk's
   * own shape. Every planted or gripping limb goal is left untouched, and the
   * arms and legs are solved by inverse kinematics after the trunk, so contacts
   * and held hand goals stay where they are.
   *
   * The law, with its sources:
   *
   * - Resting rate 12 to 20 breaths a minute, the adult normal range (Cretikos et
   *   al. 2008, Med J Aust 188:657); each performer's rate is a seeded draw
   *   from a normal of mean 15 and SD 2 truncated to that band. Children
   *   breathe faster; the centiles of Fleming et al. 2011 (Lancet 377:1011)
   *   apply below 18 years, and a caller passes such a rate as `rate`.
   * - Inspiration takes 0.42 of each cycle (Ti/Ttot of quiet breathing, Tobin et
   *   al. 1983, Chest 84:202); inhalation and exhalation each follow a
   *   minimum-jerk profile, so the layer is continuous in value and velocity.
   * - Sighs: humans sigh about twelve times an hour (Ramirez 2014, Prog Brain Res
   *   209:91), so each cycle is a sigh with probability `period / 300 s`, drawn
   *   from the cycle's index; a sigh's amplitude is 2.5 times a tidal breath
   *   (provisional: a sigh is described as about two to three tidal volumes,
   *   the joint scale of that volume is unmeasured).
   * - Exertion: each declared bout raises the rate toward 43 a minute and the
   *   amplitude toward 5 times tidal at level 1, the peak breathing frequency
   *   and tidal volume of exercise to exhaustion (Loe, Steinshamn and Wisloff
   *   2014, PLoS ONE 9:e113884). A bout's drive is `level g^3`, where its share
   *   `g` rises linearly from its start over `ONSET`, 60 s (ventilation's
   *   on-kinetics: a 15 to 20 s delay and a time constant of 40 to 60 s, Whipp
   *   and Ward 1990, Med Sci Sports Exerc 22:62), holds at 1 until it ends, and
   *   falls as `1 - u` over its recovery time, so the drive recovers as `(1 -
   *   u)^3` (the polynomial shapes are no measurement; ventilation rises and
   *   recovers roughly exponentially, and a polynomial keeps the computation
   *   exact in ECMAScript). Overlapping bouts do not add: the hardest one
   *   drives the breathing at each instant, the largest `level g^3`, so no
   *   number of bouts passes the level-1 rate and amplitude. The phase is the
   *   closed-form integral of the rate, so a rate change never jumps the phase:
   *   the drive's cube root is the upper envelope of linear pieces, whose
   *   crossings are found exactly, and the cube of a linear piece integrates in
   *   closed form.
   * - Angles at one tidal breath (provisional; no located study gives the trunk
   *   joint angles of quiet breathing): chest extension 1.5 degrees, upper
   *   chest 1 degree, lumbar spine 0.5 degrees and each shoulder girdle raised
   *   1 degree.
   *
   * The phase runs on film seconds from a seeded offset, so breathing continues
   * smoothly across action boundaries. The displayed pose evaluates this layer
   * at its own film second, independent of the preceding action.
   */
  export import HumanBreath = HumanBreathSource;
}
