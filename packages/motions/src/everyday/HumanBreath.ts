import { type IAutoMovieRandom, minimumJerk } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";

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
 * - Resting rate 12 to 20 breaths a minute, the adult normal range
 *   (Cretikos et al. 2008, Med J Aust 188:657); each performer's rate is a
 *   seeded draw from a normal of mean 15 and SD 2 truncated to that band.
 *   Children breathe faster; the centiles of Fleming et al. 2011 (Lancet
 *   377:1011) apply below 18 years, and a caller passes such a rate as `rate`.
 * - Inspiration takes 0.42 of each cycle (Ti/Ttot of quiet breathing, Tobin
 *   et al. 1983, Chest 84:202); inhalation and exhalation each follow a
 *   minimum-jerk profile, so the layer is continuous in value and velocity.
 * - Sighs: humans sigh about twelve times an hour (Ramirez 2014, Prog Brain
 *   Res 209:91), so each cycle is a sigh with probability `period / 300 s`,
 *   drawn from the cycle's index; a sigh's amplitude is 2.5 times a tidal
 *   breath (provisional: a sigh is described as about two to three tidal
 *   volumes, the joint scale of that volume is unmeasured).
 * - Exertion: each declared bout raises the rate toward 40 a minute and the
 *   amplitude toward 3 times tidal at level 1 (exercise ventilation reaches
 *   rates near 40 to 50 a minute with tidal volumes several times resting;
 *   provisional scale), and recovers as `(1 - u)^3` over its recovery time
 *   (provisional polynomial; ventilation recovery is roughly exponential, and
 *   a polynomial keeps the computation exact in ECMAScript). The phase is the
 *   closed-form integral of the rate, so a rate change never jumps the phase.
 * - Angles at one tidal breath (provisional; no located study gives the trunk
 *   joint angles of quiet breathing): chest extension 1.5 degrees, upper
 *   chest 1 degree, lumbar spine 0.5 degrees and each shoulder girdle raised
 *   1 degree.
 *
 * The phase runs on film seconds from a seeded offset, so breathing continues
 * smoothly across action boundaries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, its sources, its units and frames, and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation Pure functions and constants over the interface's vectors and the engine's streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The functions and constants the everyday laws and their tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses engine and interface types; no consumer is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form evaluation of the cited law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One small function per quantity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Out-of-range inputs throw; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call, or linear in the requests a call builds.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanBreath {
  /** Layer options. */
  export interface IOptions {
    /** Breaths a minute at rest; a seeded draw from the adult band when absent. */
    rate?: number;

    /** Bouts of exertion. */
    exertion?: IExertion[];
  }

  /** One bout of exertion, ending at `at`. */
  export interface IExertion {
    /** Film second the bout ends and recovery starts. */
    at: number;

    /** Level in [0, 1]: 0 at rest, 1 at hard exercise. */
    level: number;

    /** Recovery seconds; 60 when absent (provisional). */
    recovery?: number;
  }

  /** Resting band, breaths a minute (Cretikos et al. 2008). */
  export const BAND: readonly [number, number] = [12, 20];

  /** Share of a cycle spent inhaling (Tobin et al. 1983). */
  export const INSPIRATION: number = 0.42;

  /** Mean interval between sighs, seconds (Ramirez 2014). */
  export const SIGH_INTERVAL: number = 300;

  /** A sigh's amplitude in tidal breaths (provisional). */
  export const SIGH: number = 2.5;

  /** Rate at full exertion, breaths a minute (provisional). */
  export const EXERTION_RATE: number = 40;

  /** Amplitude at full exertion, tidal breaths (provisional). */
  export const EXERTION_AMPLITUDE: number = 3;

  /** Clinical degrees at one tidal breath (provisional). */
  export const TIDAL: Readonly<
    Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
  > = {
    chest: [-1.5, 0, 0],
    upperChest: [-1, 0, 0],
    spine: [-0.5, 0, 0],
    leftShoulder: [0, 1, 0],
    rightShoulder: [0, 1, 0],
  };

  /**
   * A performer's resting rate from a stream: N(15, 2) truncated to the
   * adult band by redrawing, up to 16 tries, then the band's middle.
   *
   * @param random The stream.
   * @returns Breaths a minute.
   */
  export function restingRate(random: IAutoMovieRandom): number {
    for (let k: number = 0; k < 16; k++) {
      const u: number = Math.max(1e-12, random.float(2 * k));
      const v: number = random.float(2 * k + 1);
      const rate: number =
        15 + 2 * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      if (rate >= BAND[0] && rate <= BAND[1]) return rate;
    }
    return 16;
  }

  /**
   * The breathing state at a film second.
   *
   * @param seconds Film seconds.
   * @param rate Resting breaths a minute.
   * @param exertion Bouts of exertion.
   * @param phase0 Phase at film second 0, cycles.
   * @param sigh The stream deciding which cycles are sighs.
   * @returns The rate, the cycle phase and the lung volume in tidal breaths.
   */
  export function state(
    seconds: number,
    rate: number,
    exertion: readonly IExertion[],
    phase0: number,
    sigh: IAutoMovieRandom,
  ): { rate: number; phase: number; volume: number } {
    HumanBound.above("rate", rate, 0, "breaths per minute");
    let perMinute: number = rate;
    let cycles: number = phase0 + (rate * seconds) / 60;
    let amplitude: number = 1;
    for (const bout of exertion) {
      HumanBound.within("exertion.level", bout.level, 0, 1);
      const recovery: number = bout.recovery ?? 60;
      HumanBound.above("exertion.recovery", recovery, 0, "s");
      const extra: number = bout.level * (EXERTION_RATE - rate);

      // The extra rate decays as (1 - u)^3 over the recovery and is held at
      // its peak before the bout ends; its integral is closed-form.
      if (seconds <= bout.at) {
        perMinute += extra;
        cycles += (extra * seconds) / 60;
        amplitude += bout.level * (EXERTION_AMPLITUDE - 1);
        continue;
      }
      const u: number = Math.min(1, (seconds - bout.at) / recovery);
      const left: number = (1 - u) ** 3;
      perMinute += extra * left;
      cycles +=
        (extra * (Math.max(0, bout.at) + (recovery * (1 - (1 - u) ** 4)) / 4)) /
        60;
      amplitude += bout.level * (EXERTION_AMPLITUDE - 1) * left;
    }
    const cycle: number = Math.floor(cycles);
    const f: number = cycles - cycle;
    const shape: number =
      f < INSPIRATION
        ? minimumJerk(f / INSPIRATION).s
        : 1 - minimumJerk((f - INSPIRATION) / (1 - INSPIRATION)).s;
    const period: number = 60 / perMinute;
    const sighs: boolean =
      sigh.float(Math.max(0, cycle)) < period / SIGH_INTERVAL;
    return {
      rate: perMinute,
      phase: cycles,
      volume: shape * amplitude * (sighs ? SIGH : 1),
    };
  }

  /**
   * The breathing layer.
   *
   * @param options The rate and exertion; both optional.
   * @returns The layer, named `breath`.
   */
  export function layer(options: IOptions = {}): IHumanLayer {
    return {
      name: "breath",

      // The spine, the chest and the shoulder girdles (`TIDAL`).
      channels: ["trunk"],
      apply: (
        posture: IHumanPosture,
        seconds: number,
        context: IHumanLayer.IContext,
      ): IHumanPosture => {
        const rate: number =
          options.rate ?? restingRate(context.random("breath.rate"));
        const phase0: number = context.random("breath.phase").float(0);
        const volume: number = state(
          seconds,
          rate,
          options.exertion ?? [],
          phase0,
          context.random("breath.sigh"),
        ).volume;
        return add(posture, volume);
      },
    };
  }

  /**
   * A posture with a lung volume's trunk angles added.
   *
   * @param posture The posture.
   * @param volume Volume in tidal breaths above the end of exhalation.
   * @returns The posture with breathing added; its limb goals unchanged.
   */
  export function add(posture: IHumanPosture, volume: number): IHumanPosture {
    const joints: IHumanPosture["joints"] = { ...posture.joints };
    for (const [bone, angles] of Object.entries(TIDAL) as [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][]) {
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
