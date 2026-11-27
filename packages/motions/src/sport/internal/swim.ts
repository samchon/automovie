import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPhrase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanSwim,
  IAutoMovieMotionManner,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../../compose/internal/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../../compose/internal/AutoMovieMotionHumanJoints";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { SwimStroke } from "./SwimStroke";
import { prepareSurfaceSwimTransfer } from "./prepareSurfaceSwimTransfer";

/**
 * Swimming on a declared water plane: treading water and the front crawl. There
 * is no fluid: the root floats at the plane, a height the author declares, and
 * the limbs cycle by joint angles with their goals released, as a swing arm
 * does (`AutoMovieMotionHumanArm.swing`).
 *
 * - Treading water: upright with the mouth 5 cm above the plane (provisional),
 *   the hands sculling out and in at waist depth and the legs kicking
 *   alternately (a flutter standing in for the eggbeater, whose foot speed sets
 *   the height, Sanders 1999), one cycle a second (provisional).
 * - Front crawl: prone with the hips a chest's half depth under the plane, or as
 *   much higher as the breath needs, gliding ahead at 1 m/s (provisional). The
 *   body rolls 45 degrees (provisional) about its long axis toward each arm as
 *   it recovers, a whole-body rotation about the hips (`HumanPosture.rotation`)
 *   so the pelvis keeps the stroke's own joints. The shoulder turns one way
 *   round: its abduction runs from 180 degrees overhead to 0 at the hip and
 *   back, in front of the trunk for the pull (45 degrees of flexion at its
 *   middle, the elbow bent 40) and behind it for the recovery (20 degrees of
 *   extension, the elbow bent 90 and the forearm turned 45 degrees toward the
 *   head, so the hand hangs under the elbow clear of the plane; all
 *   provisional). Each arm pulls from overhead to the hip over 60 % of the
 *   cycle and recovers over the water, elbow high, in the rest (provisional
 *   shares). The arms are apart by the propulsive share less the index of
 *   coordination, which runs from a novice's catch-up to an elite's
 *   near-opposition with the `sequencing` skill (Chollet et al. 2000 as the
 *   research reads them; `PROPULSIVE`, `COORDINATION`). Six kicks per cycle
 *   (provisional) and a breath to the right once a cycle, the head turned 70
 *   degrees (provisional) on the rolled trunk as the right arm recovers, which
 *   brings the mouth 2 cm (provisional) over the plane: there is no bow wave
 *   whose trough a real swimmer breathes in, so the body floats as high as its
 *   own mouth needs. One cycle lasts 1.4 s (provisional).
 *
 * Events: `entryRight{i}`, `entryLeft{i}` and `breath{i}` per cycle for the
 * crawl, `cycle{i}` for treading.
 *
 * The breaststroke, the backstroke and floating are keyed strokes
 * (`SwimStroke`), planned by their own table on the same plane.
 *
 * Not drafted: the eggbeater proper, entering and leaving the water.
 */
export namespace swim {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "swim";

  /** Cancel table: a stroke changes at a cycle's end. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      swim: ["fromRelax", "smooth"],
    });

  /** A crawl cycle's seconds (provisional). */
  export const CYCLE: number = 1.4;

  /** The pull's share of the crawl cycle (provisional). */
  export const PULL: number = 0.6;

  /**
   * The crawl's propulsive share of a cycle, the pull and push that end each
   * arm's pull: 0.465, Chollet, Chalies and Chatard 2000's share at 100 m pace,
   * as the research reads it in their abstract.
   */
  export const PROPULSIVE: number = 0.465;

  /**
   * The crawl's index of coordination, the lag from one arm's propulsion's end
   * to the other's start as a share of the cycle, negated: a novice's catch-up
   * and an elite's near-opposition (-6.07 % and -1.76 % by level, Chollet et
   * al. 2000 as the research reads them), read on the `sequencing` skill axis.
   */
  export const COORDINATION: ICOORDINATION = {
    novice: -0.0607,
    elite: -0.0176,
  };

  /** The crawl's body roll toward a recovering arm, degrees (provisional). */
  export const ROLL: number = 45;

  /** The head's turn for a breath, degrees (provisional). */
  export const TURN: number = 70;

  /** Mouth clearance at a surface breath, metres (provisional). */
  export const CLEAR: number = 0.02;

  /**
   * A tread's or a crawl's stroke cues: a tread cycles every `period`; a crawl
   * enters the right arm each `period`, the left arm `lag` of a period later,
   * and breathes midway through the recovery after the `PULL`.
   *
   * @param prone Whether the stroke is the prone crawl.
   * @param cycles The whole cycles.
   * @param period The cycle's seconds.
   * @param lag The left arm's lag, a share of the period.
   * @returns The clock, relaxed at its end.
   */
  export function strokes(
    prone: boolean,
    cycles: number,
    period: number,
    lag: number,
  ): IAutoMovieMotionClock {
    const instants: IAutoMovieMotionClockInstant[] = [];
    for (let i: number = 0; i < cycles; i++)
      if (prone)
        instants.push(
          { name: `entryRight${i + 1}`, seconds: i * period },
          { name: `entryLeft${i + 1}`, seconds: (i + lag) * period },
          {
            name: `breath${i + 1}`,
            seconds: (i + PULL + (1 - PULL) / 2) * period,
          },
        );
      else instants.push({ name: `cycle${i + 1}`, seconds: i * period });
    const duration: number = cycles * period;
    return AutoMovieMotionClock(duration, [
      ...instants,
      { name: "relax", seconds: duration },
    ]);
  }
  /**
   * Plan a swim.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the cycle count is not a positive whole number.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSwim.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanSwim.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const cycles: number = HumanBound.whole("count", p.count ?? 3);
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    const { entry, connect } = prepareSurfaceSwimTransfer(
      context,
      modifiers.tempo,
    );
    const water: number = p.water ?? entry.root.y + m.chestHeight;

    // The strokes written as keyed postures are planned by their own table.
    if (p.kind !== "treadWater" && p.kind !== "frontCrawl")
      return connect(
        SwimStroke.plan(
          {
            body,
            entry,
            stroke: p.kind,
            water,
            cycles,
            tempo: modifiers.tempo,
          },
          CLEAR,
        ),
      );
    const prone: boolean = p.kind === "frontCrawl";
    const period: number = (prone ? CYCLE : 1) * modifiers.tempo;
    // The left arm's entry follows the right's by the share the index of
    // coordination leaves: its propulsion starts that index's lag after the
    // right's ends.
    const lag: number = prone
      ? PROPULSIVE -
        HumanSkill.quantity(
          context.skill,
          "sequencing",
          COORDINATION.novice,
          COORDINATION.elite,
        )
      : 0;
    const clock: IAutoMovieMotionClock = strokes(prone, cycles, period, lag);
    const duration: number = clock.duration;
    const phase: (s: number, offset?: number) => number = (
      s: number,
      offset: number = 0,
    ): number => {
      const u: number = s / period + offset;
      return u - Math.floor(u);
    };
    const hipsRest: IAutoMovieVector3 | undefined = prone
      ? body.rest.get("hips")!
      : undefined;
    const forward: IAutoMovieVector3 | undefined = prone
      ? HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
          { x: 0, y: 0, z: 1 },
        )
      : undefined;
    const mouth: number = prone
      ? 0
      : HumanTrunk.region(body, entry, "mouth").point.y - entry.root.y;
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];

    // The root floats: upright with the mouth above the plane, or prone with the hips under it.
    const proneHeading: IAutoMovieQuaternion | undefined = prone
      ? humanPostureHeading({
          ...entry,
          pitch: 90,
        })
      : undefined;
    const hipOffset: IAutoMovieVector3 | undefined = prone
      ? Quaternion.rotateVector(proneHeading!, hipsRest!)
      : undefined;
    const turn: ReturnType<typeof Quaternion.prepareAxisAngle> | undefined =
      prone
        ? Quaternion.prepareAxisAngle(
            Quaternion.rotateVector(proneHeading!, { x: 0, y: 1, z: 0 }),
          )
        : undefined;
    // The body's roll about its long axis, a whole-body rotation about the
    // hips: toward the right at the right arm's mid recovery.
    const roll: (s: number) => number = (s: number): number =>
      -ROLL *
      Math.sin(2 * Math.PI * (phase(s) - (PULL + (1 - PULL) / 2) + 0.25));
    const rolled: (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
      about: IAutoMovieVector3,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
      about: IAutoMovieVector3,
    ): IAutoMovieMotionHumanPosture => ({
      ...posture,
      rotation: {
        about,
        turn: turn!(degrees),
      },
    });
    const turned: (
      joints: IAutoMovieMotionHumanPosture["joints"],
      w: number,
    ) => IAutoMovieMotionHumanPosture["joints"] = (
      joints: IAutoMovieMotionHumanPosture["joints"],
      w: number,
    ): IAutoMovieMotionHumanPosture["joints"] => {
      const out: IAutoMovieMotionHumanPosture["joints"] = { ...joints };
      const delta: IAutoMovieMotionHumanJoints.Angles =
        AutoMovieMotionHumanHead.share(2, -TURN * w);
      for (const bone of ["neck", "head"] as const) {
        const at: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
        const by: readonly [number, number, number] = delta[bone]!;
        out[bone] = [at[0] + by[0], at[1] + by[1], at[2] + by[2]];
      }
      return out;
    };
    // The hips' depth: a chest's half depth, or as shallow as the breathing mouth needs.
    const depth: number = prone
      ? ((): number => {
          const breath: IAutoMovieMotionHumanPosture = {
            ...entry,
            pitch: 90,
            joints: turned(entry.joints, 1),
          };
          const hips: IAutoMovieVector3 = Vector3.add(breath.root, hipOffset!);
          const rise: number =
            HumanTrunk.region(body, rolled(breath, -ROLL, hips), "mouth").point
              .y - hips.y;
          return Math.min(m.chestDepth / 2, rise - CLEAR);
        })()
      : 0;
    primitives.push({
      channels: ["root", "trunk"],
      reads: ["root", "trunk"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        s: number,
      ): IAutoMovieMotionHumanPosture => {
        if (!prone)
          return {
            ...posture,
            root: { ...posture.root, y: water + 0.05 - mouth },
          };
        const pitched: IAutoMovieMotionHumanPosture = {
          ...posture,
          pitch: 90,
        };
        const hips: IAutoMovieVector3 = Vector3.add(
          { x: entry.root.x, y: water - depth, z: entry.root.z },
          Vector3.scale(forward!, (1.0 * s) / modifiers.tempo),
        );
        return rolled(
          {
            ...pitched,
            root: Vector3.subtract(hips, hipOffset!),
          },
          roll(s),
          hips,
        );
      },
    });

    // The legs kick by joint angles with their goals released.
    const kicks: number = prone ? 6 : 2;
    const kickPhase: number = 2 * Math.PI * (kicks / 2);
    const hipFlexion: number = prone ? 0 : 30;
    const kneeFlexion: number = prone ? 15 : 60;
    const ankleFlexion: number = prone ? -40 : 0;
    for (const side of ["left", "right"] as const) {
      const limb: PlanLimb = `${side}Leg`;
      const offset: number = side === "left" ? 0 : 1 / kicks;
      primitives.push({
        channels: [limb],
        reads: [limb],
        from: 0,
        to: duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          s: number,
        ): IAutoMovieMotionHumanPosture => {
          const k: number = Math.sin(kickPhase * phase(s, offset));
          const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
            ...posture.limbs,
          };
          delete limbs[limb];
          return {
            ...posture,
            limbs,
            joints: {
              ...posture.joints,
              [`${side}UpperLeg`]: [
                hipFlexion + 15 * k * modifiers.extent,
                0,
                0,
              ],
              [`${side}LowerLeg`]: [kneeFlexion + 15 * Math.max(0, k), 0, 0],
              [`${side}Foot`]: [ankleFlexion, 0, 0],
            },
          };
        },
      });
    }

    if (prone) {
      for (const side of ["right", "left"] as const) {
        const offset: number = side === "right" ? 0 : -lag;
        primitives.push(
          AutoMovieMotionHumanArm.swing(
            side,
            0,
            duration,
            (
              _: IAutoMovieMotionHumanPosture,
              s: number,
            ): IAutoMovieMotionHumanArmPhrase.ISwing => {
              const u: number = phase(s, offset);
              if (u < PULL) {
                const w: number = u / PULL;
                const sine: number = Math.sin(Math.PI * w);
                return {
                  upper: [
                    45 * sine,
                    180 * (0.5 + 0.5 * Math.cos(Math.PI * w)),
                    0,
                  ],
                  elbow: 40 * sine,
                };
              }
              const w: number = (u - PULL) / (1 - PULL);
              const sine: number = Math.sin(Math.PI * w);
              return {
                upper: [
                  -20 * sine,
                  180 * (0.5 - 0.5 * Math.cos(Math.PI * w)),
                  45 * sine,
                ],
                elbow: 90 * sine,
              };
            },
          ),
        );
      }
      primitives.push(
        AutoMovieMotionHumanJoints.add({
          channels: ["head"],
          from: 0,
          to: duration,
          delta: (s: number): IAutoMovieMotionHumanJoints.Angles => {
            const u: number = phase(s);
            const w: number =
              u < PULL ? 0 : Math.sin((Math.PI * (u - PULL)) / (1 - PULL));
            return AutoMovieMotionHumanHead.share(2, -TURN * w);
          },
        }),
      );
    } else {
      for (const side of ["right", "left"] as const)
        primitives.push(
          AutoMovieMotionHumanArm.swing(
            side,
            0,
            duration,
            (
              _: IAutoMovieMotionHumanPosture,
              s: number,
            ): IAutoMovieMotionHumanArmPhrase.ISwing => ({
              upper: [30, 45 + 20 * Math.sin(2 * Math.PI * phase(s)), 0],
              elbow: 60,
            }),
          ),
        );
    }
    return connect(
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, entry, []),
        clock,
        primitives,
      }),
    );
  }
}

/** The alternatives of `PlanLimb`'s site. */
type PlanLimb = "leftLeg" | "rightLeg";

/** The record of `ICOORDINATION`'s site. */
type ICOORDINATION = { novice: number; elite: number };
