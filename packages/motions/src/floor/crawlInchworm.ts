import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { crawl } from "./crawl";
import { crawlChain } from "./crawlChain";
import { crawlFrame } from "./crawlFrame";
import { floorEntry } from "./floorEntry";

/**
 * The inchworm, the crawl's `inchworm` kind: from standing the body folds
 * until its palms are flat on the floor before its feet, walks the hands
 * out one at a time to a plank, then walks the feet in one at a time to
 * the hands, a number of cycles, and rises to standing where its feet have
 * come to.
 *
 * At each instant the body's shape is the chain (`crawlChain`) solved from
 * where the hands and the feet are, so the hips sink as the hands walk out
 * and rise as the feet walk in. A cycle walks the wrists from the fold's
 * reach to the plank's and the feet after them by the same length, a
 * hand's step at most `HAND` of the arm's length and a foot's `FOOT` of the
 * leg's, each limb lifted `LIFT` on an arc while the other three bear.
 * Getting down blends from standing to the fold over `DOWN` seconds, or
 * from the displayed entry when it is entered crouched or on the knees
 * (`floorEntry`), and rising back to standing over `RISE`. The steps and
 * the timing are provisional, scaled by the square root of the hip height
 * and the manner's tempo.
 * Events: `down`, per cycle `plank<n>` and `folded<n>`, `rising`, and per
 * limb and step `<limb>Liftoff<n>` and `<limb>Touchdown<n>`, the limb one of
 * `leftHand`, `rightHand`, `leftFoot`, `rightFoot`.
 *
 * Not yet: a push-up at the plank, the spine's own flexion in the fold (the
 * trunk is held straight and the hips take the fold), and the knees bending
 * where the hamstrings would stop a straight-legged fold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the walk, the steps, the timing, the events and what is missing, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation One whole-body row over a limb schedule on one clock, its shape solved on the body at each instant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The constants and the plan the crawl law calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place follows from the body's measure and the floor; no key posture is typed.
 */
export namespace crawlInchworm {
  /** A hand's longest step as a share of the upper arm and the forearm (provisional). */
  export const HAND: number = 0.4;

  /** A foot's longest step as a share of the thigh and the shank (provisional). */
  export const FOOT: number = 0.25;

  /** One limb's step, seconds, at a 0.93 m hip height (provisional). */
  export const STEP: number = 0.5;

  /** A stepping hand's or foot's rise, metres (provisional, as `crawl.LIFT`). */
  export const LIFT: number = 0.04;

  /** How far the knee's bend point lies before the straight leg's middle, as a share of the shank. */
  export const KNEE: number = 0.25;

  /** Seconds to fold from standing to the palms on the floor (provisional). */
  export const DOWN: number = 1.5;

  /** Seconds to rise from the last fold to standing (provisional). */
  export const RISE: number = 1.5;

  /** The limbs that bear, in the order their plant windows are written. */
  export const LIMBS = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ] as const;

  /** A limb that bears in the inchworm. */
  export type Limb = (typeof LIMBS)[number];

  /**
   * Plan an inchworm.
   *
   * @param context The crawl's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the cycle count is not a positive integer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and the refusal; the namespace gives the law.
   * @evidence contracts/development/implementation.md#principled-implementation The body's shape at each instant is solved from where its hands and feet are, so the hips rise and fall with the walk and the plank is straight because the chain is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A step schedule, one whole-body row reading the chain, and the plant windows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts One limb moves at a time, so three always bear; the feet come in by exactly what the hands went out, so each cycle ends in the fold it began in.
   * @evidence contracts/development/implementation.md#efficient-algorithms The chain is built once per plan; each instant solves it in closed form and scans.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `crawlChain`, `crawlFrame`, `HumanFoot.pivot` and the arm's palm goal and carry.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan holds only its schedule and the chain.
   */
  export function plan(
    context: IHumanActionContext<crawl.IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const cycles: number = context.params.cycles ?? 3;
    HumanBound.whole("cycles", cycles);
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);

    // Entered crouched over the hands (where a bear crawl ends) or on the
    // knees, the inchworm measures from a stance over the entry's feet and
    // gets down from the entry.
    const { standing, entered }: floorEntry.IStart = floorEntry.start(
      context,
      "inchworm",
      "feet",
      (): IHumanPosture =>
        stand.plan({ ...context, params: { seconds: 1 } }).posture(0),
    );
    const yaw: number = standing.yaw;
    const frame: HumanFrame.IFrame = {
      origin: { ...standing.root, y: 0 },
      yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const sides = ["left", "right"] as const;
    const DEG: number = 180 / Math.PI;
    const chain: crawlChain.IChain = crawlChain.of(
      body,
      standing,
      frame,
      forward,
    );
    const wu: number = (chain.wrists.left.z + chain.wrists.right.z) / 2;
    const travel: number = Math.max(0, chain.plank - chain.folding);

    // The schedule: one limb at a time, the hands out, then the feet in.
    const step: number = STEP * Math.sqrt(m.hipHeight / 0.93) * modifiers.tempo;
    const hands: number = Math.max(
      1,
      Math.ceil(travel / (HAND * (m.upperArm + m.forearm))),
    );
    const feet: number = Math.max(
      1,
      Math.ceil(travel / (FOOT * (m.thigh + m.shank))),
    );
    const mu0: number = (chain.balls.left.z + chain.balls.right.z) / 2;
    const start: Record<Limb, number> = {
      leftHand: mu0 + chain.folding - wu,
      rightHand: mu0 + chain.folding - wu,
      leftFoot: chain.balls.left.z,
      rightFoot: chain.balls.right.z,
    };
    const moves: Record<Limb, IMove[]> = {
      leftHand: [],
      rightHand: [],
      leftFoot: [],
      rightFoot: [],
    };
    const instants: AutoMovieMotionClock.IInstant[] = [
      { name: "down", seconds: DOWN },
    ];
    const now: Record<Limb, number> = { ...start };
    let clockAt: number = DOWN;
    const go = (limb: Limb, length: number): void => {
      const n: number = moves[limb].length + 1;
      moves[limb].push({
        from: clockAt,
        z0: now[limb],
        z1: now[limb] + length,
      });
      instants.push(
        { name: `${limb}Liftoff${n}`, seconds: clockAt },
        { name: `${limb}Touchdown${n}`, seconds: clockAt + step },
      );
      now[limb] += length;
      clockAt += step;
    };
    for (let c: number = 1; c <= cycles; c++) {
      for (let i: number = 0; i < hands; i++)
        for (const side of sides) go(`${side}Hand`, travel / hands);
      instants.push({ name: `plank${c}`, seconds: clockAt });
      for (let i: number = 0; i < feet; i++)
        for (const side of sides) go(`${side}Foot`, travel / feet);
      instants.push({ name: `folded${c}`, seconds: clockAt });
    }
    const rising: number = clockAt;
    instants.push({ name: "rising", seconds: rising });
    const duration: number = rising + RISE;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      duration,
      instants,
    );
    // A limb's place along the heading and its lift at an instant.
    const place = (limb: Limb, seconds: number): crawlChain.IPlanar => {
      let z: number = start[limb];
      for (const move of moves[limb]) {
        if (seconds < move.from) break;
        if (seconds < move.from + step) {
          const k: number = minimumJerk((seconds - move.from) / step).s;
          return {
            u: move.z0 + (move.z1 - move.z0) * k,
            v: 4 * LIFT * k * (1 - k),
          };
        }
        z = move.z1;
      }
      return { u: z, v: 0 };
    };

    // The standing the body rises to, moved on with its feet.
    const moved = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(p, Vector3.scale(forward, cycles * travel));
    const ended: IHumanPosture = {
      ...standing,
      root: moved(standing.root),
      limbs: { ...standing.limbs },
    };
    for (const side of sides) {
      const leg: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
      ended.limbs[`${side}Leg`] = {
        ...leg,
        point: moved(leg.point),
        bend: moved(leg.bend),
      };
    }

    const whole: IAutoMovieMotionHumanPrimitive = {
      channels: [
        "root",
        "trunk",
        "head",
        "leftLeg",
        "rightLeg",
        "leftHand",
        "rightHand",
        "leftArm",
        "rightArm",
      ],
      from: 0,
      to: duration,
      write: floorEntry.down(
        body,
        entered,
        DOWN,
        (seconds: number): number =>
          seconds < rising ? clock.progress("start", "down", seconds) : 1,
        (posture: IHumanPosture, seconds: number): IHumanPosture => {
          const w: number =
            seconds < rising
              ? clock.progress("start", "down", seconds)
              : 1 - clock.progress("rising", "end", seconds);
          const rest: IHumanPosture = seconds < rising ? standing : ended;
          const feetAt: Record<"left" | "right", crawlChain.IPlanar> = {
            left: place("leftFoot", seconds),
            right: place("rightFoot", seconds),
          };
          const palmsAt: Record<"left" | "right", crawlChain.IPlanar> = {
            left: place("leftHand", seconds),
            right: place("rightHand", seconds),
          };
          const pose: crawlChain.IShape = chain.shape(
            (feetAt.left.u + feetAt.right.u) / 2,
            (palmsAt.left.u + palmsAt.right.u) / 2 + wu,
          );
          const pitch: number =
            Math.atan2(
              pose.shoulders.u - pose.hips.u,
              pose.shoulders.v - pose.hips.v,
            ) *
              DEG -
            chain.lean;
          const target: IHumanPosture = crawlFrame.posed(yaw, w, pitch, 0, 0);
          const hips: IAutoMovieVector3 = HumanFrame.point(frame, {
            x: 0,
            y: pose.hips.v,
            z: pose.hips.u,
          });
          const out: IHumanPosture = {
            ...target,
            root: Vector3.lerp(
              rest.root,
              crawlFrame.rootFor(body, target, hips),
              w,
            ),
            limbs: {},
            joints: { ...posture.joints, ...target.joints },
          };
          // Each foot pivoted on its ball, the ball kept on its place when the
          // ankle's range will not meet the foot's turn; the knee bent toward
          // the front of the leg.
          const knee: number = KNEE * m.shank;
          for (const side of sides) {
            const placement: HumanFoot.IPlacement = HumanFoot.pivot(
              body,
              side,
              "mtp",
              HumanFrame.point(frame, {
                x: chain.balls[side].x,
                y: chain.balls[side].y + feetAt[side].v,
                z: feetAt[side].u,
              }),
              yaw,
              -pose.heel,
            );
            const bend: IAutoMovieVector3 = HumanFrame.point(frame, {
              x: chain.balls[side].x,
              y:
                (pose.hips.v + pose.ankle.v) / 2 -
                knee * Math.cos(pose.lam / DEG),
              z:
                (pose.hips.u + pose.ankle.u) / 2 +
                knee * Math.sin(pose.lam / DEG),
            });
            const from: IHumanPosture.IGoal = rest.limbs[`${side}Leg`]!;
            out.limbs[`${side}Leg`] = {
              point: Vector3.lerp(from.point, placement.ankle, w),
              rotation: Quaternion.slerp(
                from.rotation ?? HumanFrame.turn(yaw),
                placement.rotation,
                w,
              ),
              bend: Vector3.lerp(from.bend, bend, w),
              contact: HumanFoot.offset(body, side, "mtp"),
            };
            out.joints[`${side}Toes`] = [pose.heel * w, 0, 0];
          }
          // Each palm flat on the floor under its shoulder's lateral place.
          for (const side of sides) {
            const hand: AutoMovieMotionHumanArm.ITarget =
              AutoMovieMotionHumanTarget.hand(
                body,
                out,
                side,
                {
                  point: HumanFrame.point(frame, {
                    x: chain.palms[side],
                    y: palmsAt[side].v,
                    z: palmsAt[side].u,
                  }),
                  normal: { x: 0, y: 1, z: 0 },
                },
                { surface: "palm", shape: "flat", forward },
              );
            out.joints = { ...out.joints, ...HumanHand.shape(side, "flat") };
            out.limbs[`${side}Arm`] = AutoMovieMotionHumanArm.goal(
              body,
              side,
              hand,
            );
          }
          if (w >= 1) return out;
          return AutoMovieMotionHumanArm.carry(
            body,
            out,
            {
              left: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
              right: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
            },
            w,
          );
        },
      ),
    };

    // Each hand planted from the fold to the rise between its steps, each
    // foot throughout between its steps.
    const contacts: IHumanContactWindow[] = [];
    for (const limb of LIMBS) {
      const hand: boolean = limb.endsWith("Hand");
      let from: number = hand ? DOWN : 0;
      const close = (to: number): void => {
        contacts.push({
          part: limb,
          kind: "plant",
          from: from / duration,
          to: to / duration,
          support: { kind: "ground" },
        });
      };
      for (const move of moves[limb]) {
        close(move.from);
        from = move.from + step;
      }
      close(hand ? rising : duration);
    }

    // The inchworm rises to standing, whatever base it was entered on.
    return {
      ...composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
        clock,
        contact: "down",
        primitives: [whole],
      }),
      base: { kind: "standing" },
    };
  }

  /**
   * One step of a limb.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation When it lifts and where it goes along the heading.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by the schedule.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The step's length follows from the chain's reaches.
   */
  interface IMove {
    /** When the limb lifts, seconds. */
    from: number;

    /** Where it lifts from along the heading, metres in the floor frame. */
    z0: number;

    /** Where it sets down. */
    z1: number;
  }
}
