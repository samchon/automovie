import { AutoMovieEngineRandom, AutoMovieEngineMotionSampling } from "@automovie/engine";

import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanAffect,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRandom,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";
import { AutoMovieMotionInterval } from "../../compose/internal/AutoMovieMotionInterval";
import { HumanBound } from "../../law/internal/HumanBound";
import { affectHeldHands } from "./affectHeldHands";

/*
 * Affect displays as an additive layer: laughing, sighing, yawning, coughing,
 * sneezing, shivering, sobbing, weeping and gasping, each a short pattern of
 * trunk, shoulder, head and jaw angles over any action, starting and ending at
 * zero.
 *
 * These are joint-angle patterns because no body point is brought anywhere: the
 * display is the trunk's and head's own convulsion or stretch, the way an
 * additive animation layer carries breathing or a laugh over locomotion.
 * Planted and gripping limb goals are untouched, and the arms are solved after
 * the trunk, so contacts and held objects stay where they are. Each display is
 * the sum of its pulses under an envelope that rises and falls on minimum-jerk
 * ramps, so it is zero with zero velocity at its start and end.
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
 * - `cough`: three sharp trunk flexions, the first of 10 degrees at the chest, 4
 *   at the lumbar spine and 8 at the head and the next two smaller by the air
 *   each expels (53.2, 28.5 and 18.8 %, Harris and Lawson 1968), from 0.1 s and
 *   0.5 s apart, each rising in 0.12 s and recovering over 0.38 s, the whole
 *   ramped in over its first 2 % and out over its last 5 % (provisional).
 * - `sneeze`: an inhalation that extends the head 10 degrees and the chest 3 over
 *   70 % of the sneeze and released over the next 5 %, with a sudden flexion of
 *   the head 25 and the chest 10 in 0.1 s, recovering by the end; a sneeze
 *   shorter than the burst over its last 30 % is refused.
 * - `shiver`: the shoulders hunch 8 degrees and come forward 4, the chest flexes
 *   3, while the shoulders tremble 1.5 degrees at 4 Hz, a visible shivering
 *   burst rate below the 12 Hz Nyquist limit of a 24 Hz film (shivering muscle
 *   tremor itself is faster, near 10 Hz, and would alias), ramped in and out
 *   over 15 % of the shiver.
 * - `sob`: the chest flexes 6 degrees, the lumbar spine 4 and the head 10, ramped
 *   in over 8 % and out over 20 %, under a train of inspirations each lifting
 *   the shoulders 6 degrees and extending the chest 4, rising in 0.1 s and
 *   recovering over 0.25 s. They come 0.5 s apart at intensity 1, closer as the
 *   intensity rises to 2 and farther as it falls to 0.5, each interval varying
 *   by a seeded ±30 %. The convulsive inspirations of sobbing are Gross,
 *   Fredrickson and Levenson's (1994, Psychophysiology 31:460); the amplitudes
 *   and timings are provisional.
 * - `weep`: the head lowers 12 degrees and the chest flexes 4, with a 2 degree
 *   shoulder heave every 2.5 s and a sniff about every 3.5 s, seeded ±30 %,
 *   that lifts the head 3 degrees and the shoulders 2 (provisional).
 * - `gasp`: the head extends 12 degrees, the chest 6 and the shoulders rise 8,
 *   peaking 0.25 s in and returning to rest by the end (provisional).
 *
 * The seeded timing of a sob or weep is keyed by the display's `seed`, or its
 * kind and start, so the same display repeats in every read and order.
 *
 * Amplitudes and timings are provisional, read from no measured source, except
 * where cited; an intensity scales every amplitude.
 */
export namespace HumanAffect {
  /*
   * Each display's own length, seconds.
   */
  export const LENGTH: Readonly<
    Record<IAutoMovieMotionHumanAffect.Kind, number>
  > = {
    laugh: 1.5,
    sigh: 3.5,
    yawn: 6,
    cough: 1.7,
    sneeze: 2,
    shiver: 2,
    sob: 4,
    weep: 6,
    gasp: 1.5,
  };

  /*
   * Interval between laugh notes, seconds (Provine 1996).
   */
  export const NOTE: number = 0.21;

  /*
   * The joint angles a display adds at a time into it.
   * Parameter kind: The display.
   * Parameter t: Seconds since its start.
   * Parameter seconds: Its length, seconds.
   * Parameter intensity: Amplitude scale.
   * Parameter seed: The key of a sob's or weep's seeded timing; the kind when
   * absent.
   * Returns: Clinical degrees to add; empty outside the display.
   * When the length is not positive, a sneeze's leaves
   * no room for its burst, or a gasp's for its inspiration.
   */
  export function angles(
    kind: IAutoMovieMotionHumanAffect.Kind,
    t: number,
    seconds: number,
    intensity: number = 1,
    seed: string = kind,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    admit(kind, seconds);
    if (!(t > 0 && t < seconds)) return {};
    return pattern(kind, t, seconds, intensity, seed);
  }

  /*
   * The affect layer.
   * Parameter displays: The displays, in any order; overlapping ones add.
   * Returns: The layer, named `affect`.
   * When a display's length is one `angles` refuses.
   */
  export function layer(
    displays: readonly IAutoMovieMotionHumanAffect.IDisplay[],
  ): IAutoMovieMotionHumanLayer {
    for (const d of displays) admit(d.kind, d.duration ?? LENGTH[d.kind]);
    return {
      name: "affect",

      // The jaw and the head, and the spine, the chest and the shoulder
      // girdles: every display's pulse is on those joints.
      channels: ["head", "trunk"],
      apply: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        context: IAutoMovieMotionHumanLayer.IContext,
      ): IAutoMovieMotionHumanPosture => {
        const joints: IAutoMovieMotionHumanPosture["joints"] = {
          ...posture.joints,
        };
        let active: boolean = false;
        for (const d of displays) {
          const length: number = d.duration ?? LENGTH[d.kind];
          const kind: IAutoMovieMotionHumanAffect.Kind = d.kind;
          const elapsed: number = seconds - d.at;
          const intensity: number = d.amplitude ?? 1;
          if (!(elapsed > 0 && elapsed < length)) continue;
          active = true;
          pattern(
            kind,
            elapsed,
            length,
            intensity,
            d.seed ?? `${kind}@${d.at}`,
            joints,
          );
        }
        // Between displays the layer adds nothing and holds no hand.
        return active
          ? affectHeldHands(posture, { ...posture, joints }, seconds, context)
          : posture;
      },
    };
  }

  /*
   * Refuse a length a display cannot fit: any not positive, and a sneeze too
   * short for its burst to rise within its last `1 - SNEEZE_BUILD`.
   */
  function admit(
    kind: IAutoMovieMotionHumanAffect.Kind,
    seconds: number,
  ): void {
    HumanBound.above(
      "seconds",
      seconds,
      kind === "sneeze"
        ? SNEEZE_BURST / (1 - SNEEZE_BUILD)
        : kind === "gasp"
          ? GASP_RISE
          : 0,
      "s",
    );
  }

  /*
   * Evaluate an admitted display strictly inside its own active interval.
   */
  function pattern(
    kind: IAutoMovieMotionHumanAffect.Kind,
    t: number,
    seconds: number,
    intensity: number,
    seed: string,
    into?: IAutoMovieMotionHumanPosture["joints"],
  ): IAutoMovieMotionHumanPosture["joints"] {
    const u: number = t / seconds;
    const k: number = intensity;
    const joints: IAutoMovieMotionHumanPosture["joints"] = into ?? {};
    const additive: boolean = into !== undefined;
    switch (kind) {
      case "laugh": {
        const e: number = k * ramp(u, 0.1, 0.33);
        const note: number = pulse(t % NOTE, 0.35 * NOTE, 0.65 * NOTE);
        write(joints, additive, "chest", 3 * e * note, 0, 0);
        write(joints, additive, "spine", 1.5 * e * note, 0, 0);
        write(joints, additive, "leftShoulder", 0, 3 * e * note, 0);
        write(joints, additive, "rightShoulder", 0, 3 * e * note, 0);
        write(joints, additive, "head", -5 * e, 0, 0);
        break;
      }
      case "sigh": {
        const inhale: number = INHALE.progress(u);
        const exhale: number = EXHALE.progress(u);
        const close: number = 1 - AutoMovieEngineMotionSampling.minimumJerkShare((u - 0.85) / 0.15);
        const shoulders: number = k * (6 * inhale - 8 * exhale) * close;
        write(joints, additive, "leftShoulder", 0, shoulders, 0);
        write(joints, additive, "rightShoulder", 0, shoulders, 0);
        write(joints, additive, "chest", -4 * k * inhale * (1 - exhale), 0, 0);
        write(joints, additive, "head", 4 * k * exhale * close, 0, 0);
        break;
      }
      case "yawn": {
        const e: number =
          u < INHALATION_END ? INHALE.progress(u) : 1 - EXHALE.progress(u);
        write(joints, additive, "jaw", 25 * k * e, 0, 0);
        write(joints, additive, "head", -15 * k * e, 0, 0);
        write(joints, additive, "chest", -5 * k * e, 0, 0);
        break;
      }
      case "cough": {
        let p: number = 0;
        COUGHS.forEach((size: number, i: number): void => {
          p = Math.max(p, size * pulse(t - 0.1 - 0.5 * i, 0.12, 0.38));
        });
        const e: number = k * p * ramp(u, 0.02, 0.05);
        write(joints, additive, "chest", 10 * e, 0, 0);
        write(joints, additive, "spine", 4 * e, 0, 0);
        write(joints, additive, "head", 8 * e, 0, 0);
        break;
      }
      case "sneeze": {
        const build: number = AutoMovieEngineMotionSampling.minimumJerkShare(u / SNEEZE_BUILD);
        const burst: number = pulse(
          t - SNEEZE_BUILD * seconds,
          SNEEZE_BURST,
          (1 - SNEEZE_BUILD) * seconds - SNEEZE_BURST,
        );
        const end: number = 1 - AutoMovieEngineMotionSampling.minimumJerkShare((u - SNEEZE_BUILD) / 0.05);
        write(
          joints,
          additive,
          "head",
          -10 * k * build * end + 25 * k * burst,
          0,
          0,
        );
        write(
          joints,
          additive,
          "chest",
          -3 * k * build * end + 10 * k * burst,
          0,
          0,
        );
        break;
      }
      case "shiver": {
        const e: number = k * ramp(u, 0.15, 0.15);
        const tremor: number = 1.5 * Math.sin(2 * Math.PI * 4 * t);
        write(joints, additive, "leftShoulder", 4 * e, (8 + tremor) * e, 0);
        write(joints, additive, "rightShoulder", 4 * e, (8 - tremor) * e, 0);
        write(joints, additive, "chest", 3 * e, 0, 0);
        break;
      }
      case "sob": {
        // A forward-flexed trunk and head under a train of inspirations,
        // each lifting the shoulders and extending the upper chest.
        const e: number = k * ramp(u, 0.08, 0.2);
        const interval: number =
          SOB_INTERVAL / Math.min(Math.max(k, SOB_DENSITY[0]), SOB_DENSITY[1]);
        const heave: number = train(
          stream(seed),
          t,
          interval,
          SOB_JITTER,
          SOB_RISE,
          SOB_FALL,
        );
        write(joints, additive, "chest", 6 * e - 4 * e * heave, 0, 0);
        write(joints, additive, "spine", 4 * e, 0, 0);
        write(joints, additive, "head", 10 * e, 0, 0);
        write(joints, additive, "leftShoulder", 0, 6 * e * heave, 0);
        write(joints, additive, "rightShoulder", 0, 6 * e * heave, 0);
        break;
      }
      case "weep": {
        // The head lowered over a slow heave, with an occasional sniff.
        const e: number = k * ramp(u, 0.15, 0.2);
        const slow: number =
          0.5 - 0.5 * Math.cos((2 * Math.PI * t) / WEEP_PERIOD);
        const sniff: number = train(
          stream(seed),
          t,
          WEEP_SNIFF,
          WEEP_JITTER,
          0.12,
          0.3,
        );
        write(joints, additive, "head", 12 * e - 3 * e * sniff, 0, 0);
        write(joints, additive, "chest", 4 * e, 0, 0);
        write(
          joints,
          additive,
          "leftShoulder",
          0,
          e * (2 * slow + 2 * sniff),
          0,
        );
        write(
          joints,
          additive,
          "rightShoulder",
          0,
          e * (2 * slow + 2 * sniff),
          0,
        );
        break;
      }
      case "gasp": {
        // One inspiration that peaks at GASP_RISE, then the exhalation that
        // returns to the underlying breath by the end.
        const breath: number = k * pulse(t, GASP_RISE, seconds - GASP_RISE);
        write(joints, additive, "head", -12 * breath, 0, 0);
        write(joints, additive, "chest", -6 * breath, 0, 0);
        write(joints, additive, "leftShoulder", 0, 8 * breath, 0);
        write(joints, additive, "rightShoulder", 0, 8 * breath, 0);
        break;
      }
    }
    return joints;
  }
}

/*
 * An envelope rising on a minimum-jerk ramp over the first `rise` of a display
 * and falling over its last `fall`, shares of its length.
 */
function ramp(u: number, rise: number, fall: number): number {
  return Math.min(
    AutoMovieEngineMotionSampling.minimumJerkShare(u / rise),
    AutoMovieEngineMotionSampling.minimumJerkShare((1 - u) / fall),
  );
}

/*
 * One pulse at `x` seconds after its start: zero before it, a minimum-jerk rise
 * over `up` seconds and a fall over `down`.
 */
function pulse(x: number, up: number, down: number): number {
  return x <= 0
    ? 0
    : x < up
      ? AutoMovieEngineMotionSampling.minimumJerkShare(x / up)
      : 1 - AutoMovieEngineMotionSampling.minimumJerkShare((x - up) / down);
}

/*
 * Write one bone's angles, or add them to the bone's own.
 */
function write(
  joints: IAutoMovieMotionHumanPosture["joints"],
  additive: boolean,
  bone: AutoMovieHumanoidBone,
  x: number,
  y: number,
  z: number,
): void {
  if (!additive) joints[bone] = [x, y, z];
  else {
    const was: readonly [number, number, number] = joints[bone] ?? ZERO;
    joints[bone] = [was[0] + x, was[1] + y, was[2] + z];
  }
}

/*
 * The share of a sigh or yawn's length taken by inhalation.
 */
const INHALATION_END: number = 0.4;

/*
 * One normalized clock for the sigh and yawn, independent of their lengths.
 */
const BREATH_DISPLAY_CLOCK: IAutoMovieMotionClock = motionClock(1, [
  { name: "inhaled", seconds: INHALATION_END },
]);

/*
 * Minimum-jerk progress up to the end of inhalation.
 */
const INHALE: AutoMovieMotionInterval.IPrepared = motionClock.prepare(
  BREATH_DISPLAY_CLOCK,
  "start",
  "inhaled",
);

/*
 * Minimum-jerk progress from the end of inhalation to the display's end.
 */
const EXHALE: AutoMovieMotionInterval.IPrepared = motionClock.prepare(
  BREATH_DISPLAY_CLOCK,
  "inhaled",
  "end",
);

/*
 * The angles of a bone the record holds none for.
 */
const ZERO: readonly [number, number, number] = [0, 0, 0];

/*
 * Each of a bout's three coughs relative to the first: the first three coughs
 * of a bout expel 53.2, 28.5 and 18.8 % of the air (Harris and Lawson 1968, as
 * relayed), so each flexes the trunk by its expulsion's share of the first's.
 */
const COUGHS: readonly number[] = [1, 28.5 / 53.2, 18.8 / 53.2];

/*
 * The seeded draw stream of one display's irregular timing.
 */
function stream(seed: string): IAutoMovieRandom {
  return AutoMovieEngineRandom.createRandom(AutoMovieEngineRandom.deriveSeed("affect", seed));
}

/*
 * A train of pulses at seeded irregular times: the first at a third of the
 * nominal interval and each next after the nominal interval scaled by a draw in
 * 1 ± jitter. The value is the largest active pulse, so overlapping pulses stay
 * continuous, as the cough's do. Linear in the pulses before `t`.
 */
function train(
  random: IAutoMovieRandom,
  t: number,
  interval: number,
  jitter: number,
  up: number,
  down: number,
): number {
  let value: number = 0;
  let at: number = interval / 3;
  for (let i: number = 0; at < t; ++i) {
    value = Math.max(value, pulse(t - at, up, down));
    at += interval * (1 + jitter * (2 * random.float(i) - 1));
  }
  return value;
}

/*
 * A sob's nominal interval between inspirations at intensity 1, seconds
 * (provisional).
 */
const SOB_INTERVAL: number = 0.5;

/*
 * The intensity range that scales a sob's density, so its shortest interval,
 * 0.175 s, stays under the 12 Hz Nyquist limit of 24 Hz film.
 */
const SOB_DENSITY: readonly [number, number] = [0.5, 2];

/*
 * How far each sob interval varies from the nominal, a share (provisional).
 */
const SOB_JITTER: number = 0.3;

/*
 * A sob inspiration's rise and fall, seconds (provisional).
 */
const SOB_RISE: number = 0.1;

/*
 * A sob inspiration's recovery, seconds (provisional).
 */
const SOB_FALL: number = 0.25;

/*
 * A weep's slow heave period, seconds (provisional).
 */
const WEEP_PERIOD: number = 2.5;

/*
 * A weep's nominal interval between sniffs, seconds (provisional).
 */
const WEEP_SNIFF: number = 3.5;

/*
 * How far each sniff interval varies, a share (provisional).
 */
const WEEP_JITTER: number = 0.3;

/*
 * How long a gasp's inspiration takes to peak, seconds (provisional).
 */
const GASP_RISE: number = 0.25;

/*
 * The share of a sneeze its inhalation takes (provisional).
 */
const SNEEZE_BUILD: number = 0.7;

/*
 * How long a sneeze's burst takes to rise, seconds (provisional).
 */
const SNEEZE_BURST: number = 0.1;
