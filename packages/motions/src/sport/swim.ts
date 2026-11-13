import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { SwimStroke } from "./SwimStroke";

/**
 * Swimming on a declared water plane (#3254, M25): treading water and the
 * front crawl. There is no fluid: the root floats at the plane, a height the
 * author declares, and the limbs cycle by joint angles with their goals
 * released, as a swing arm does (`AutoMovieMotionHumanArm.swing`).
 *
 * - Treading water: upright with the mouth 5 cm above the plane
 *   (provisional), the hands sculling out and in at waist depth and the legs
 *   kicking alternately (a flutter standing in for the eggbeater, whose foot
 *   speed sets the height, Sanders 1999), one cycle a second (provisional).
 * - Front crawl: prone with the hips a chest's half depth under the plane, or
 *   as much higher as the breath needs, gliding ahead at 1 m/s (provisional).
 *   The body rolls 45 degrees (provisional) about its long axis toward each
 *   arm as it recovers. The shoulder turns one way round: its abduction
 *   runs from 180 degrees overhead to 0 at the hip and back, in front of the
 *   trunk for the pull (45 degrees of flexion at its middle, the elbow bent
 *   40) and behind it for the recovery (20 degrees of extension, the elbow
 *   bent 90 and the forearm turned 45 degrees toward the head, so the hand
 *   hangs under the elbow clear of the plane; all provisional). Each arm
 *   pulls from overhead to the
 *   hip over 60 % of the cycle and recovers over the water, elbow high, in
 *   the rest (provisional shares). The arms are half a cycle apart, Chollet
 *   et al. 2000's opposition (index of coordination 0); a novice's
 *   catch-up is not drafted. Six kicks per cycle (provisional) and a breath
 *   to the right once a cycle, the head turned 70 degrees (provisional) on
 *   the rolled trunk as the right arm recovers, which brings the mouth 2 cm
 *   (provisional) over the plane: there is no bow wave whose trough a real
 *   swimmer breathes in, so the body floats as high as its own mouth needs.
 *   One cycle lasts 1.4 s (provisional).
 *
 * Events: `entryRight{i}`, `entryLeft{i}` and `breath{i}` per cycle for the
 * crawl, `cycle{i}` for treading.
 *
 * The breaststroke, the backstroke and floating are keyed strokes
 * (`SwimStroke`), planned by their own table on the same plane.
 *
 * Not drafted: the eggbeater proper, entering and leaving the water.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the plane, each stroke's phases, shares, timing, sources and provisional values, the events and what is not drafted.
 * @evidence contracts/development/design.md#principled-representation A law record of a floating root and joint-angle limb cycles over one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kinds, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The plane is the author's; depths are the body's.
 */
export namespace swim {
  /** The action's name. */
  export const name: HumanActionName = "swim";

  /** Cancel table: a stroke changes at a cycle's end. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      swim: ["fromRelax", "smooth"],
    });

  /** The strokes. */
  export type Kind = "treadWater" | "frontCrawl" | SwimStroke.Name;

  /** A crawl cycle's seconds (provisional). */
  export const CYCLE: number = 1.4;

  /** The pull's share of the crawl cycle (provisional). */
  export const PULL: number = 0.6;

  /** The crawl's body roll toward a recovering arm, degrees (provisional). */
  export const ROLL: number = 45;

  /** The head's turn for a breath, degrees (provisional). */
  export const TURN: number = 70;

  /** The mouth's height over the plane at a breath, metres (provisional). */
  export const CLEAR: number = 0.02;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The stroke, the plane's height and the cycle count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The plane is a world height the author states.
   */
  export interface IParams {
    /** The stroke. */
    kind: Kind;

    /** The water plane's world height, metres; the entry's chest height when absent. */
    water?: number;

    /** Cycles; 3 when absent. */
    cycles?: number & tags.Type<"uint32"> & tags.Minimum<1>;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * Plan a swim.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the cycle count is not a positive whole number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The root floats at the plane by the body's own mouth or chest depth; each limb's angles are periodic functions of the cycle's phase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, root row, then the stroke's limb rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Provisional shares and times are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the arm swing, the head share and the joint add.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock and a few numbers.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const cycles: number = p.cycles ?? 3;
    HumanBound.whole("cycles", cycles);
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const entry: IHumanPosture = context.entry.posture;
    const water: number = p.water ?? entry.root.y + m.chestHeight;

    // The strokes written as keyed postures are planned by their own table.
    if (p.kind !== "treadWater" && p.kind !== "frontCrawl")
      return SwimStroke.plan({
        body,
        entry,
        stroke: p.kind,
        water,
        cycles,
        tempo: modifiers.tempo,
      });
    const period: number =
      (p.kind === "frontCrawl" ? CYCLE : 1) * modifiers.tempo;
    const instants: AutoMovieMotionClock.IInstant[] = [];
    for (let i: number = 0; i < cycles; i++)
      if (p.kind === "frontCrawl") {
        instants.push(
          { name: `entryRight${i + 1}`, seconds: i * period },
          { name: `entryLeft${i + 1}`, seconds: (i + 0.5) * period },
          {
            name: `breath${i + 1}`,
            seconds: (i + PULL + (1 - PULL) / 2) * period,
          },
        );
      } else instants.push({ name: `cycle${i + 1}`, seconds: i * period });
    const duration: number = cycles * period;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      duration,
      [...instants, { name: "relax", seconds: duration }],
    );
    const phase = (s: number, offset: number = 0): number => {
      const u: number = s / period + offset;
      return u - Math.floor(u);
    };
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const mouth: number =
      HumanTrunk.region(body, entry, "mouth").point.y - entry.root.y;
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];

    // The root floats: upright with the mouth above the plane, or prone with the hips under it.
    const prone: boolean = p.kind === "frontCrawl";
    // The body's roll about its long axis, a twist of the pelvis: toward the right at the right arm's mid recovery.
    const roll = (s: number): number =>
      -ROLL *
      Math.sin(2 * Math.PI * (phase(s) - (PULL + (1 - PULL) / 2) + 0.25));
    const turned = (
      joints: IHumanPosture["joints"],
      w: number,
    ): IHumanPosture["joints"] => {
      const out: IHumanPosture["joints"] = { ...joints };
      const delta = AutoMovieMotionHumanHead.share(2, -TURN * w);
      for (const bone of ["neck", "head"] as const) {
        const at = joints[bone] ?? [0, 0, 0];
        const by = delta[bone]!;
        out[bone] = [at[0] + by[0], at[1] + by[1], at[2] + by[2]];
      }
      return out;
    };
    // The hips' depth: a chest's half depth, or as shallow as the breathing mouth needs.
    const depth: number = ((): number => {
      const breath: IHumanPosture = {
        ...entry,
        pitch: entry.pitch + 90,
        joints: { ...turned(entry.joints, 1), hips: [0, 0, -ROLL] },
      };
      const hips: IAutoMovieVector3 = Vector3.add(
        breath.root,
        Quaternion.rotateVector(resolveHumanPosture.heading(breath), hipsRest),
      );
      const rise: number =
        HumanTrunk.region(body, breath, "mouth").point.y - hips.y;
      return Math.min(m.chestDepth / 2, rise - CLEAR);
    })();
    primitives.push({
      channels: ["root", "trunk"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, s: number): IHumanPosture => {
        if (!prone)
          return {
            ...posture,
            root: { ...posture.root, y: water + 0.05 - mouth },
          };
        const pitched: IHumanPosture = {
          ...posture,
          pitch: posture.pitch + 90,
          joints: { ...posture.joints, hips: [0, 0, roll(s)] },
        };
        const hips: IAutoMovieVector3 = Vector3.add(
          { x: entry.root.x, y: water - depth, z: entry.root.z },
          Vector3.scale(forward, (1.0 * s) / modifiers.tempo),
        );
        return {
          ...pitched,
          root: Vector3.subtract(
            hips,
            Quaternion.rotateVector(
              resolveHumanPosture.heading(pitched),
              hipsRest,
            ),
          ),
        };
      },
    });

    // The legs kick by joint angles with their goals released.
    const kicks: number = prone ? 6 : 2;
    for (const side of ["left", "right"] as const) {
      const limb: "leftLeg" | "rightLeg" = `${side}Leg`;
      primitives.push({
        channels: [limb],
        from: 0,
        to: duration,
        write: (posture: IHumanPosture, s: number): IHumanPosture => {
          const k: number = Math.sin(
            2 *
              Math.PI *
              (kicks / 2) *
              phase(s, side === "left" ? 0 : 1 / kicks),
          );
          const limbs = { ...posture.limbs };
          delete limbs[limb];
          return {
            ...posture,
            limbs,
            joints: {
              ...posture.joints,
              [`${side}UpperLeg`]: [
                (prone ? 0 : 30) + 15 * k * modifiers.extent,
                0,
                0,
              ],
              [`${side}LowerLeg`]: [
                (prone ? 15 : 60) + 15 * Math.max(0, k),
                0,
                0,
              ],
              [`${side}Foot`]: [prone ? -40 : 0, 0, 0],
            },
          };
        },
      });
    }

    if (prone) {
      for (const side of ["right", "left"] as const)
        primitives.push(
          AutoMovieMotionHumanArm.swing(
            side,
            0,
            duration,
            (_: IHumanPosture, s: number) => {
              const u: number = phase(s, side === "right" ? 0 : 0.5);
              if (u < PULL) {
                const w: number = u / PULL;
                return {
                  upper: [
                    45 * Math.sin(Math.PI * w),
                    180 * (0.5 + 0.5 * Math.cos(Math.PI * w)),
                    0,
                  ],
                  elbow: 40 * Math.sin(Math.PI * w),
                };
              }
              const w: number = (u - PULL) / (1 - PULL);
              return {
                upper: [
                  -20 * Math.sin(Math.PI * w),
                  180 * (0.5 - 0.5 * Math.cos(Math.PI * w)),
                  45 * Math.sin(Math.PI * w),
                ],
                elbow: 90 * Math.sin(Math.PI * w),
              };
            },
          ),
        );
      primitives.push(
        AutoMovieMotionHumanJoints.add({
          channels: ["head"],
          from: 0,
          to: duration,
          delta: (s: number): AutoMovieMotionHumanJoints.Angles => {
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
            (_: IHumanPosture, s: number) => ({
              upper: [30, 45 + 20 * Math.sin(2 * Math.PI * phase(s)), 0],
              elbow: 60,
            }),
          ),
        );
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, entry, []),
      clock,
      primitives,
    });
  }
}
