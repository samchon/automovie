import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRacket,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { motionHumanHeld } from "../../compose/internal/motionHumanHeld";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanPlaced } from "../../compose/internal/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTrunk } from "../../compose/internal/AutoMovieMotionHumanTrunk";
import { motionManner } from "../../compose/internal/motionManner";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { courtStroke } from "./courtStroke";
import { racketClock } from "./racketClock";
import { racketStance } from "./racketStance";

/*
 * Racket stroke dispatch and the original solo racket or golf positions. The
 * following positions use an implied handle.
 *
 * - Ready position: the feet step in sequence to two shoulder widths, the pelvis
 *   lowers by 4 % of stature and the trunk leans 15 degrees, the racket hand on
 *   the handle at waist height before the body and the other hand a hand ahead
 *   on the throat (provisional places).
 * - Split step: from the ready position's width, a small hop of 3 % of the
 *   stature (provisional) in 0.3 s, landing a quarter shoulder width wider on
 *   each side, the step that precedes every stroke (Elliott et al. 1986 place
 *   it before the serve's backswing; here before any stroke).
 * - Golf address: the trunk hinges 35 degrees at the hips over slightly flexed
 *   knees (provisional), the two hands together on the grip hanging `HANG` of
 *   the arm below the shoulders, and the waggle moves them a twentieth of the
 *   arm forward and back twice.
 *
 * Each is a phrase: into the position in 0.6 s, the stroke (the hop or the
 * waggle), held, and back in 0.6 s.
 *
 * Court strokes delegate to `courtStroke`, which can read a previously held
 * racket's frame and targets a timed contact.
 */
export namespace AutoMovieMotionHumanRacket {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "racket";

  /*
   * Cancel table.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      racket: ["fromStrokeEnd", "quick"],
      walk: ["fromRelax", "smooth"],
      run: ["fromRelax", "smooth"],
    });

  /*
   * How far below the shoulders the golfer's upper hand grips, arm lengths
   * (provisional): the elbows a little soft.
   */
  export const HANG: number = 0.8;

  /*
   * Plan a racket or golf position.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRacket.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanRacket.IParams = context.params;
    if (
      p.kind !== "readyPosition" &&
      p.kind !== "splitStep" &&
      p.kind !== "golfAddress"
    )
      return courtStroke(context, p.kind, {
        ...(p.contactAt === undefined ? {} : { contact: p.contactAt }),
        ...(p.implement === undefined ? {} : { implement: p.implement }),
      });
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const m: IAutoMovieMotionHumanActionContext["body"]["measure"] =
      body.measure;
    const hold: number = p.hold ?? 0.6;
    HumanBound.least("hold", hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers = motionManner(
      context,
      p.manner,
    );
    const side: AutoMovieHumanSide = p.hand ?? "right";
    const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
    const clock: IAutoMovieMotionClock = racketClock(p.kind, hold, modifiers);
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const into: (s: number) => number = (s: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], s);
    const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: clock.at("start"),
      ready: clock.at("ready"),
      relax: clock.at("relax"),
      end: clock.at("end"),
    };
    const local: (
      posture: IAutoMovieMotionHumanPosture,
      v: IAutoMovieVector3,
    ) => IAutoMovieVector3 = (
      posture: IAutoMovieMotionHumanPosture,
      v: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, v);
    const leftward: IAutoMovieVector3 = local(entry, { x: 1, y: 0, z: 0 });
    const arm: number = m.upperArm + m.forearm;
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    let held: IAutoMovieMotionHumanHeld.IHeld | undefined;
    let contacts: IAutoMovieMotionHumanContactWindow[] =
      AutoMovieMotionHumanBase.plants();
    const grip: (
      hand: AutoMovieHumanSide,
      place: (
        posture: IAutoMovieMotionHumanPosture,
        s: number,
      ) => IAutoMovieVector3,
      bend: PlanGripBend,
    ) => IAutoMovieMotionHumanPrimitive[] = (
      hand: AutoMovieHumanSide,
      place: (
        posture: IAutoMovieMotionHumanPosture,
        s: number,
      ) => IAutoMovieVector3,
      bend: PlanGripBend2,
    ): IAutoMovieMotionHumanPrimitive[] =>
      AutoMovieMotionHumanPlaced.arm({
        body,
        side: hand,
        from: 0,
        to: clock.duration,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, hand),
        weight: into,
        span,
        // The clock is the law's own and a slower tempo lengthens it, except
        // a split step's, whose stroke start is fixed.
        together: AutoMovieMotionHumanArm.together(
          context.handover,
          p.kind !== "splitStep",
          context.tempo,
        ),
        surface: "grip",
        shape: "fist",
        place: (posture: IAutoMovieMotionHumanPosture, s: number) => ({
          point: place(posture, s),
          facing: local(posture, { x: hand === "left" ? 1 : -1, y: 0, z: 0 }),
          forward: local(posture, { x: 0, y: 0, z: 1 }),
        }),
        bend,
      });

    if (p.kind === "readyPosition" || p.kind === "splitStep") {
      const stance: ReturnType<typeof racketStance> = racketStance(
        context,
        clock,
        side,
        leftward,
        p.kind === "splitStep",
        modifiers.extent,
      );
      contacts = stance.contacts;
      if (p.implement !== undefined)
        held = motionHumanHeld(context, side, p.implement);
      primitives.push(
        ...stance.primitives,
        ...grip(
          side,
          (posture: IAutoMovieMotionHumanPosture) =>
            AutoMovieMotionHumanPlaced.grid(body, posture, side, {
              height: "waist",
              lateral: "centre",
              distance: "mid",
            }),
          "front",
        ),
        ...grip(
          other,
          // A hand's length ahead of the racket hand along the heading, on the racket's throat.
          (posture: IAutoMovieMotionHumanPosture) =>
            AutoMovieEngineVector3.add(
              AutoMovieMotionHumanPlaced.grid(body, posture, side, {
                height: "waist",
                lateral: "centre",
                distance: "mid",
              }),
              local(posture, { x: 0, y: 0, z: m.hand }),
            ),
          "front",
        ),
      );
    } else {
      primitives.push(
        AutoMovieMotionHumanTrunk.crouch({
          body,
          standing: entry,
          clock,
          rise: ["start", "ready"],
          fall: ["relax", "end"],
          depth: 0.02 * m.stature,
          pitch: 35 * modifiers.extent,
        }),
      );
      const waggle: (s: number) => number = (s: number): number =>
        0.05 *
        arm *
        motionClock.wave(clock, ["strokeStart", "strokeEnd"], 2, s);
      for (const hand of ["left", "right"] as const)
        primitives.push(
          ...grip(
            hand,
            (posture: IAutoMovieMotionHumanPosture, s: number) => {
              // Hanging below the shoulders: their midpoint dropped by `HANG` of the arm, which leaves the lower hand's wrist inside the arm's reach through the waggle.
              const shoulder: IAutoMovieVector3 =
                AutoMovieMotionHumanPlaced.shoulders(body, posture);
              return AutoMovieEngineVector3.add(
                { x: shoulder.x, y: shoulder.y - arm * HANG, z: shoulder.z },
                AutoMovieEngineVector3.add(
                  local(posture, { x: 0, y: 0, z: waggle(s) }),
                  local(posture, {
                    x: (hand === "left" ? 0.5 : -0.5) * m.hand * 0.3,
                    y: hand === side ? -m.hand * 0.4 : 0,
                    z: 0,
                  }),
                ),
              );
            },
            "forward",
          ),
        );
    }
    const plan: IAutoMovieMotionHumanActionPlan =
      composeMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(clock.duration, entry, contacts),
        clock,
        primitives,
        contact: "stroke",
      });
    return held === undefined
      ? plan
      : {
          ...plan,
          contacts: [...plan.contacts, motionHumanHeld.grip(held)],
          holds: [motionHumanHeld.hold(context, held)],
        };
  }
}

/*
 * The alternatives of `PlanGripBend2`'s site.
 */
type PlanGripBend2 = "front" | "forward";

/*
 * The alternatives of `PlanGripBend`'s site.
 */
type PlanGripBend = "front" | "forward";
