import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBreath,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";

/*
 * Breathing as an additive layer: the chest, the upper chest and the lumbar
 * spine extend and the shoulder girdles rise a little with each inhalation, on
 * every action, at a seeded resting rate that exertion raises and that recovers
 * afterwards, with an occasional seeded sigh.
 *
 * Breathing is written as joint angles rather than an effector goal, because no
 * body point is brought anywhere: it is a rhythmic change of the trunk's own
 * shape. Every planted or gripping limb goal is left untouched, and the arms
 * and legs are solved by inverse kinematics after the trunk, so contacts and
 * held hand goals stay where they are.
 *
 * The law, with its sources:
 *
 * - Resting rate 12 to 20 breaths a minute, the adult normal range (Cretikos et
 *   al. 2008, Med J Aust 188:657); each performer's rate is a seeded draw from
 *   a normal of mean 15 and SD 2 truncated to that band. Children breathe
 *   faster; the centiles of Fleming et al. 2011 (Lancet 377:1011) apply below
 *   18 years, and a caller passes such a rate as `rate`.
 * - Inspiration takes 0.42 of each cycle (Ti/Ttot of quiet breathing, Tobin et
 *   al. 1983, Chest 84:202); inhalation and exhalation each follow a
 *   minimum-jerk profile, so the layer is continuous in value and velocity.
 * - Sighs: humans sigh about twelve times an hour (Ramirez 2014, Prog Brain Res
 *   209:91), so each cycle is a sigh with probability `period / 300 s`, drawn
 *   from the cycle's index; a sigh's amplitude is 2.5 times a tidal breath
 *   (provisional: a sigh is described as about two to three tidal volumes, the
 *   joint scale of that volume is unmeasured).
 * - Exertion: each declared bout raises the rate toward 43 a minute and the
 *   amplitude toward 5 times tidal at level 1, the peak breathing frequency and
 *   tidal volume of exercise to exhaustion (Loe, Steinshamn and Wisloff 2014,
 *   PLoS ONE 9:e113884). A bout's drive is `level g^3`, where its share `g`
 *   rises linearly from its start over `ONSET`, 60 s (ventilation's
 *   on-kinetics: a 15 to 20 s delay and a time constant of 40 to 60 s, Whipp
 *   and Ward 1990, Med Sci Sports Exerc 22:62), holds at 1 until it ends, and
 *   falls as `1 - u` over its recovery time, so the drive recovers as `(1 -
 *   u)^3` (the polynomial shapes are no measurement; ventilation rises and
 *   recovers roughly exponentially, and a polynomial keeps the computation
 *   exact in ECMAScript). Overlapping bouts do not add: the hardest one drives
 *   the breathing at each instant, the largest `level g^3`, so no number of
 *   bouts passes the level-1 rate and amplitude. The phase is the closed-form
 *   integral of the rate, so a rate change never jumps the phase: the drive's
 *   cube root is the upper envelope of linear pieces, whose crossings are found
 *   exactly, and the cube of a linear piece integrates in closed form.
 * - Angles at one tidal breath (provisional; no located study gives the trunk
 *   joint angles of quiet breathing): chest extension 1.5 degrees, upper chest
 *   1 degree, lumbar spine 0.5 degrees and each shoulder girdle raised 1
 *   degree.
 *
 * The phase runs on film seconds from a seeded offset, so breathing continues
 * smoothly across action boundaries. The displayed pose evaluates this layer at
 * its own film second, independent of the preceding action.
 */
export namespace HumanBreath {
  /*
   * Resting band, breaths a minute (Cretikos et al. 2008).
   */
  export const BAND: readonly [number, number] = [12, 20];

  /*
   * Share of a cycle spent inhaling (Tobin et al. 1983).
   */
  export const INSPIRATION: number = 0.42;

  /*
   * Mean interval between sighs, seconds (Ramirez 2014).
   */
  export const SIGH_INTERVAL: number = 300;

  /*
   * A sigh's amplitude in tidal breaths (provisional).
   */
  export const SIGH: number = 2.5;

  /*
   * Rate at full exertion, breaths a minute: the peak breathing frequency of
   * graded treadmill exercise to exhaustion, 44 +- 8 in men and 42 +- 8 in
   * women, their mean (Loe, Steinshamn and Wisloff 2014, PLoS ONE 9:e113884,
   * Table 2, 4631 adults).
   */
  export const EXERTION_RATE: number = 43;

  /*
   * Amplitude at full exertion, tidal breaths: the same study's peak tidal
   * volume, 2.84 L in men and 1.94 L in women (Loe et al. 2014, Table 2), over
   * a resting tidal volume of about 0.5 L (West, Respiratory Physiology: The
   * Essentials), about five resting breaths.
   */
  export const EXERTION_AMPLITUDE: number = 5;

  /*
   * Seconds over which a bout with a start comes to its full drive: ventilation
   * follows exercise onset after a 15 to 20 s delay with a time constant of
   * about 40 to 60 s (Whipp and Ward 1990, Med Sci Sports Exerc 22:62), so the
   * ramp spans the slower end.
   */
  export const ONSET: number = 60;

  /*
   * A bout's recovery seconds when it names none: the same span as the onset,
   * ventilation's off-kinetics mirroring its on-kinetics (Whipp and Ward
   * 1990).
   */
  export const RECOVERY: number = 60;

  /*
   * Clinical degrees at one tidal breath (provisional).
   */
  export const TIDAL: Readonly<
    Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
  > = {
    chest: [-1.5, 0, 0],
    upperChest: [-1, 0, 0],
    spine: [-0.5, 0, 0],
    leftShoulder: [0, 1, 0],
    rightShoulder: [0, 1, 0],
  };

  /*
   * A performer's resting rate from a stream: N(15, 2) truncated to the adult
   * band by redrawing, up to 16 tries, then the band's middle.
   * Parameter random: The stream.
   * Returns: Breaths a minute.
   */
  export function restingRate(random: IAutoMovieRandom): number {
    for (let k: number = 0; k < 16; k++) {
      const u: number = Math.max(1e-12, random.float(2 * k));
      const v: number = random.float(2 * k + 1);
      const rate: number =
        15 + 2 * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      if (rate >= BAND[0] && rate <= BAND[1]) return rate;
    }
    return (BAND[0] + BAND[1]) / 2;
  }

  /*
   * The breathing state at a film second.
   * Parameter seconds: Film seconds.
   * Parameter rate: Resting breaths a minute.
   * Parameter exertion: Bouts of exertion.
   * Parameter phase0: Phase at film second 0, cycles.
   * Parameter sigh: The stream deciding which cycles are sighs.
   * Returns: The rate, the cycle phase and the lung volume in tidal breaths.
   * When the rate is not positive, or a bout's level
   * lies outside [0, 1], its recovery is not positive or it ends before it
   * starts.
   */
  export function state(
    seconds: number,
    rate: number,
    exertion: readonly IAutoMovieMotionHumanBreath.IExertion[],
    phase0: number,
    sigh: IAutoMovieRandom,
  ): IAutoMovieMotionHumanBreath.IStateResult {
    HumanBound.above("rate", rate, 0, "breaths per minute");
    const bouts: IBout[] = exertion.map(
      (bout: IAutoMovieMotionHumanBreath.IExertion): IBout => {
        HumanBound.within("exertion.level", bout.level, 0, 1);
        const recovery: number = bout.recovery ?? RECOVERY;
        HumanBound.above("exertion.recovery", recovery, 0, "s");
        if (bout.from !== undefined)
          HumanBound.least("exertion.at", bout.at, bout.from, "s");
        return {
          weight: Math.cbrt(bout.level),
          from: bout.from ?? -Infinity,
          at: bout.at,
          recovery,
        };
      },
    );

    // The hardest bout's drive at this second, and its integral since film
    // second 0: the rate's excess integrates to the phase.
    const drive: number = envelope(bouts, seconds) ** 3;
    const driven: number =
      seconds >= 0 ? integral(bouts, 0, seconds) : -integral(bouts, seconds, 0);
    const perMinute: number = rate + (EXERTION_RATE - rate) * drive;
    const cycles: number =
      phase0 + (rate * seconds + (EXERTION_RATE - rate) * driven) / 60;
    const amplitude: number = 1 + (EXERTION_AMPLITUDE - 1) * drive;
    const cycle: number = Math.floor(cycles);
    const f: number = cycles - cycle;
    const shape: number =
      f < INSPIRATION
        ? AutoMovieEngineMotionSampling.minimumJerkShare(f / INSPIRATION)
        : 1 - AutoMovieEngineMotionSampling.minimumJerkShare((f - INSPIRATION) / (1 - INSPIRATION));
    const period: number = 60 / perMinute;
    const sighs: boolean =
      sigh.float(Math.max(0, cycle)) < period / SIGH_INTERVAL;
    return {
      rate: perMinute,
      phase: cycles,
      volume: shape * amplitude * (sighs ? SIGH : 1),
    };
  }

  /*
   * The breathing layer.
   * Parameter options: The rate and exertion; both optional.
   * Returns: The layer, named `breath`.
   */
  export function layer(
    options: IAutoMovieMotionHumanBreath.IOptions = {},
  ): IAutoMovieMotionHumanLayer {
    const layer: IAutoMovieMotionHumanLayer = {
      name: "breath",

      // The spine, the chest and the shoulder girdles (`TIDAL`).
      channels: ["trunk"],

      // Read on the film clock when the pose is shown (`isNative`).
      clock: "film",
      apply: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        context: IAutoMovieMotionHumanLayer.IContext,
      ): IAutoMovieMotionHumanPosture => {
        const rate: number =
          options.rate ?? restingRate(context.random("breath.rate"));
        const phase0: number = context.random("breath.phase").float(0);
        const volume: number = HumanBreath.state(
          seconds,
          rate,
          options.exertion ?? [],
          phase0,
          context.random("breath.sigh"),
        ).volume;
        return add(posture, volume);
      },
    };
    return layer;
  }

  /*
   * Whether the layer still uses the native respiratory contribution: it
   * declares the film clock (`IAutoMovieMotionHumanLayer.clock`) and adds no
   * weighted blend of its own.
   * Parameter layer: A layer from the performance.
   * Returns: Whether this is a native breath layer.
   */
  export function isNative(layer: IAutoMovieMotionHumanLayer): boolean {
    return layer.clock === "film" && layer.blend === undefined;
  }

  /*
   * A posture with a lung volume's trunk angles added.
   * Parameter posture: The posture.
   * Parameter volume: Volume in tidal breaths above the end of exhalation.
   * Returns: The posture with breathing added; its limb goals unchanged.
   */
  export function add(
    posture: IAutoMovieMotionHumanPosture,
    volume: number,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    for (const [bone, angles] of TIDAL_ENTRIES) {
      const base: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      joints[bone] = [
        base[0] + volume * angles[0],
        base[1] + volume * angles[1],
        base[2] + volume * angles[2],
      ];
    }
    return { ...posture, joints };
  }
}

/*
 * One admitted bout: the cube root of its level, its start (`-Infinity` when
 * under way since before the film), its end and its recovery, seconds.
 */
interface IBout {
  /*
   * The cube root of the bout's level, so `weight × share` cubed is its drive.
   */
  weight: number;

  /*
   * Film second the bout starts.
   */
  from: number;

  /*
   * Film second the bout ends.
   */
  at: number;

  /*
   * Seconds the drive takes to recover.
   */
  recovery: number;
}

/*
 * A bout's share of its full drive at a second, the cube root of its drive over
 * its level: rising over `ONSET` from its start, 1 until it ends, falling over
 * its recovery. Linear between its knots.
 */
function share(bout: IBout, t: number): number {
  return Math.max(
    0,
    Math.min(
      1,
      (t - bout.from) / HumanBreath.ONSET,
      1 - (t - bout.at) / bout.recovery,
    ),
  );
}

/*
 * The largest bout's `weight × share` at a second, the cube root of the hardest
 * bout's drive; 0 without bouts.
 */
function envelope(bouts: readonly IBout[], t: number): number {
  let most: number = 0;
  for (const bout of bouts) most = Math.max(most, bout.weight * share(bout, t));
  return most;
}

/*
 * The integral of the hardest bout's drive from `lo` to `hi`, seconds: the
 * envelope's cube integrated exactly. Between the bouts' knots (start, full
 * drive, end, recovered, and where a short bout's rise meets its fall) each
 * bout's `weight × share` is linear; between those and the crossings of two
 * bouts' lines inside them the envelope is one line `v`, whose cube integrates
 * to `(b - a)(v_a^3 + v_a^2 v_b + v_a v_b^2 + v_b^3) / 4`. Cost O(B^3) in the B
 * bouts, a handful.
 */
function integral(bouts: readonly IBout[], lo: number, hi: number): number {
  if (bouts.length === 0 || !(hi > lo)) return 0;
  const knots: number[] = [lo, hi];
  for (const bout of bouts) {
    const own: number[] = [
      bout.from,
      bout.from + HumanBreath.ONSET,
      bout.at,
      bout.at + bout.recovery,
      (1 + bout.from / HumanBreath.ONSET + bout.at / bout.recovery) /
        (1 / HumanBreath.ONSET + 1 / bout.recovery),
    ];
    for (const t of own) if (t > lo && t < hi) knots.push(t);
  }
  knots.sort((a: number, b: number): number => a - b);
  let total: number = 0;
  for (let k: number = 1; k < knots.length; k++) {
    const a: number = knots[k - 1]!;
    const b: number = knots[k]!;
    if (!(b > a)) continue;

    // Where two bouts' lines cross inside this span, the envelope changes line.
    const cuts: number[] = [a, b];
    for (let i: number = 0; i < bouts.length; i++)
      for (let j: number = i + 1; j < bouts.length; j++) {
        const da: number =
          bouts[i]!.weight * share(bouts[i]!, a) -
          bouts[j]!.weight * share(bouts[j]!, a);
        const db: number =
          bouts[i]!.weight * share(bouts[i]!, b) -
          bouts[j]!.weight * share(bouts[j]!, b);
        if (da * db < 0) cuts.push(a + ((b - a) * da) / (da - db));
      }
    cuts.sort((x: number, y: number): number => x - y);
    for (let c: number = 1; c < cuts.length; c++) {
      const p: number = cuts[c - 1]!;
      const q: number = cuts[c]!;
      const vp: number = envelope(bouts, p);
      const vq: number = envelope(bouts, q);
      total +=
        ((q - p) * (vp ** 3 + vp * vp * vq + vp * vq * vq + vq ** 3)) / 4;
    }
  }
  return total;
}

/*
 * The tidal angle table's entries, listed once.
 */
const TIDAL_ENTRIES: readonly [
  AutoMovieHumanoidBone,
  readonly [number, number, number],
][] = Object.entries(HumanBreath.TIDAL) as [
  AutoMovieHumanoidBone,
  readonly [number, number, number],
][];
