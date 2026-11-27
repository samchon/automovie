import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBaseball,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../../compose/internal/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHand } from "../../compose/internal/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../../compose/internal/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTrunk } from "../../compose/internal/AutoMovieMotionHumanTrunk";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { exercise } from "../../exercise/internal/exercise";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { baseballGroundBall } from "./baseballGroundBall";

/**
 * Baseball and softball positions without the bat's swing or the pitch : the
 * catcher's crouch, fielding a ground ball, and the batting stance with its
 * load. The glove hand is the left; no glove or bat is held.
 *
 * - Catcher's crouch: the hips sink to a half squat (`exercise.drop`, provisional
 *   for a catcher) with the trunk pitched 20 degrees, the glove presented palm
 *   forward 0.6 of the arm ahead of the crouched chest and the protected
 *   throwing fist behind the right leg (Baseball Canada, Playing Catcher, part
 *   1, https://baseball.ca/?alias=playing-catcher-part-1&lang=english).
 * - Ground ball: a squat to parallel thighs with the trunk inclined, the spine
 *   taking what the folded hips leave the pelvis
 *   (`AutoMovieMotionHumanTrunk.sunk`), until the shoulders stand where the
 *   reaching arm takes the glove, which stands on its fingertips on the floor
 *   0.3 of the arm ahead of them, open forward and up, the throwing hand above
 *   it to cover the ball (provisional places).
 * - Batting stance: the left foot steps out to two shoulder widths, the knees
 *   give 3 % of the stature, both fists stacked on the implied bat's handle
 *   `HANDS` of the arm ahead of the right shoulder; the load at the stroke
 *   draws the hands a tenth of the arm back (provisional; the load precedes the
 *   stride, Welch et al. 1995).
 *
 * Each is a phrase: into the position in 0.8 s, held, and back to standing in
 * 0.8 s (provisional).
 *
 * Not drafted: the swing, the bunt and the check swing (the implement strike
 * owner's, whose file does not exist yet), the pitch (a row of the throw law),
 * the windmill pitch, the catcher's throw and base running slides.
 */
export namespace AutoMovieMotionHumanBaseball {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "baseball";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      throwObject: ["fromRelax", "quick"],
      run: ["fromRelax", "quick"],
    });

  /**
   * How far ahead of the chest the catcher presents the glove, arm lengths
   * (provisional).
   */
  export const PRESENT: number = 0.6;

  /**
   * How far ahead of the shoulders the fielder's glove meets the floor, arm
   * lengths (provisional).
   */
  export const AHEAD: number = 0.3;

  /**
   * The share of the straight arm's length from the fielder's shoulder to the
   * glove's wrist (provisional): the elbow a little soft.
   */
  export const REACH: number = 0.95;

  /**
   * The most a fielder's trunk inclines, degrees: the top of the search for the
   * ground ball's inclination.
   */
  export const INCLINED: number = 130;

  /**
   * How far ahead of the right shoulder the batter's fists hold the handle, arm
   * lengths (provisional): the elbows fold no closer than their flexion range.
   */
  export const HANDS: number = 0.45;

  /**
   * A baseball action's timetable: 0.8 s to get ready, a 0.3 s attack, the hold
   * and a 0.8 s return, the manner's timing applied.
   *
   * @param hold The held seconds.
   * @param modifiers The manner's timing.
   * @returns The clock.
   */
  export function timetable(
    hold: number,
    modifiers: IAutoMovieMotionManner.IModifiers,
  ): IAutoMovieMotionClock {
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: 0.8,
        attack: 0.3,
        hold,
        retract: 0.8,
      }),
      modifiers,
    );
    return clock;
  }
  /**
   * Plan a baseball position.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBaseball.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanBaseball.IParams = context.params;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const m: IAutoMovieMotionHumanActionContext["body"]["measure"] =
      body.measure;
    const hold: number = p.hold ?? 1;
    HumanBound.least("hold", hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    const clock: IAutoMovieMotionClock = timetable(hold, modifiers);
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const into: (s: number) => number = (s: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], s);
    // The span the arms are planned over: the reach to the place, the hold and the return.
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
    const rest: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanArmAngles.IAngles = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanArmAngles.IAngles =>
      AutoMovieMotionHumanArm.angles(context.entry.pose, side);
    const crouch: (
      depth: number,
      pitch: number,
      legs?: readonly AutoMovieHumanSide[],
    ) => IAutoMovieMotionHumanPrimitive = (
      depth: number,
      pitch: number,
      legs?: readonly AutoMovieHumanSide[],
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanTrunk.crouch({
        body,
        standing: entry,
        clock,
        rise: ["start", "ready"],
        fall: ["relax", "end"],
        depth: depth * modifiers.extent,
        pitch,
        ...(legs === undefined ? {} : { legs }),
      });
    /** Build a placed arm over the prepared baseball clock. */
    const placed: (
      side: AutoMovieHumanSide,
      place: IAutoMovieMotionHumanPlaced.IArm["place"],
      shape: IAutoMovieMotionHumanHand.Shape,
      bend: IAutoMovieMotionHumanPlaced.IArm["bend"],
      together?: IAutoMovieMotionHumanArmPlanned.ITogether,
    ) => IAutoMovieMotionHumanPrimitive[] = (
      side: AutoMovieHumanSide,
      place: IAutoMovieMotionHumanPlaced.IArm["place"],
      shape: IAutoMovieMotionHumanHand.Shape,
      bend: IAutoMovieMotionHumanPlaced.IArm["bend"],
      together?: IAutoMovieMotionHumanArmPlanned.ITogether,
    ): IAutoMovieMotionHumanPrimitive[] => {
      return AutoMovieMotionHumanPlaced.arm({
        body,
        side,
        from: 0,
        to: clock.duration,
        rest: rest(side),
        weight: into,
        span,
        // The clock is the law's own, lengthened by a slower tempo: an arm
        // planned alone takes a group of its own that says so.
        together:
          together ??
          AutoMovieMotionHumanArmPlanned.together(
            context.handover,
            true,
            context.tempo,
          ),
        place,
        surface: shape === "fist" ? "grip" : "palm",
        shape,
        bend,
      });
    };
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    let contacts: IAutoMovieMotionHumanContactWindow[] =
      AutoMovieMotionHumanBase.plants();
    const arm: number = m.upperArm + m.forearm;

    // The ground ball's crouch and both gloved hands.
    const groundBall: () => IAutoMovieMotionHumanPrimitive[] =
      baseballGroundBall({
        local,
        entry,
        arm,
        body,
        m,
        modifiers,
        context,
        crouch,
        placed,
      });
    switch (p.kind) {
      case "catcherCrouch": {
        // Keep the hand guarded at the proximal edge of the thigh. The
        // thigh and forearm radii give a passage around its outer side as
        // the thigh swings forward under the catcher.
        const thigh: IAutoMovieMotionHumanActionContext["body"]["surfaces"]["regions"]["thighOuterRight"] =
          body.surfaces.regions.thighOuterRight;
        const target: IAutoMovieVector3 = {
          x: thigh.point.x - m.forearmRadius,
          y: 0,
          z: -m.thighRadius - m.forearmRadius,
        };
        const grip: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
          body,
          "right",
          "grip",
          "fist",
        );
        const rotation: IAutoMovieQuaternion = HumanHand.align(grip, {
          normal: { x: 0, y: 0, z: -1 },
          forward: { x: 0, y: 1, z: 0 },
        });
        const wrist: IAutoMovieMotionHumanHand.IWrist = HumanHand.place(
          body,
          "right",
          "grip",
          target,
          rotation,
          "fist",
        );
        const guard: IAutoMovieHumanLimbGoal = {
          point: wrist.point,
          rotation,
          contact: grip.point,
          bend: { ...wrist.point, x: wrist.point.x - m.upperArm },
          on: thigh.bone,
        };
        primitives.push(
          crouch(exercise.drop(m, "half"), 20),
          ...placed(
            "left",
            (
              posture: IAutoMovieMotionHumanPosture,
              _seconds: number,
              resolution?: baseballGroundBall.IFK,
            ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => ({
              // Ahead of the crouched chest, not of the standing one.
              point: Vector3.add(
                AutoMovieMotionHumanPlaced.joint(
                  body,
                  posture,
                  "chest",
                  resolution,
                ),
                local(posture, { x: 0, y: 0, z: PRESENT * arm }),
              ),
              facing: local(posture, { x: 0, y: 0, z: 1 }),
              forward: { x: 0, y: 1, z: 0 },
            }),
            "flat",
            "forward",
          ),
          AutoMovieMotionHumanArm.carried({
            body,
            side: "right",
            from: 0,
            to: clock.duration,
            rest: rest("right"),
            weight: into,
            span,
            together: AutoMovieMotionHumanArmPlanned.together(
              context.handover,
              true,
              context.tempo,
            ),
            goal: (): IAutoMovieHumanLimbGoal => guard,
          }),
          AutoMovieMotionHumanHand.shape({
            side: "right",
            shape: "fist",
            from: 0,
            to: clock.duration,
            weight: into,
          }),
        );
        break;
      }
      case "groundBall": {
        primitives.push(...groundBall());
        break;
      }
      case "battingStance": {
        const leftward: IAutoMovieVector3 = local(entry, { x: 1, y: 0, z: 0 });
        const apart: number = Vector3.dot(
          Vector3.subtract(
            context.entry.feet.left.ankle,
            context.entry.feet.right.ankle,
          ),
          leftward,
        );
        const out: number = Math.max(0, 4 * m.shoulderHalfWidth - apart);
        const from: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: context.entry.feet.left.ankle,
          rotation: context.entry.feet.left.rotation,
        };

        // The crouch plants the right foot; the left steps out on its own.
        primitives.push(
          crouch(0.03 * m.stature, 10, ["right"]),
          AutoMovieMotionHumanLeg.place({
            body,
            side: "left",
            from: 0,
            to: clock.duration,
            placement: (
              _: IAutoMovieMotionHumanPosture,
              s: number,
            ): IAutoMovieMotionHumanFoot.IPlacement =>
              AutoMovieMotionHumanLeg.arc(
                from,
                {
                  ankle: Vector3.add(from.ankle, Vector3.scale(leftward, out)),
                  rotation: from.rotation,
                },
                0.03 * m.stature,
                into(s),
              ),
            planted: (s: number): boolean => into(s) <= 0 || into(s) >= 1,
          }),
        );
        for (const side of ["left", "right"] as const)
          primitives.push(
            ...placed(
              side,
              (posture: IAutoMovieMotionHumanPosture, s: number) => {
                // Ahead of the right shoulder's joint, far enough that the folded elbows reach it.
                const handle: IAutoMovieVector3 = Vector3.add(
                  AutoMovieMotionHumanPlaced.joint(
                    body,
                    posture,
                    "rightUpperArm",
                  ),
                  local(posture, {
                    x: 0,
                    y: 0,
                    z:
                      (HANDS -
                        0.1 * clock.progress("strokeStart", "stroke", s)) *
                      arm,
                  }),
                );
                return {
                  point: {
                    ...handle,
                    y: handle.y - (side === "left" ? m.hand / 2 : 0),
                  },
                  facing: local(posture, {
                    x: side === "left" ? 1 : -1,
                    y: 0,
                    z: 0,
                  }),
                  forward: { x: 0, y: 1, z: 0 },
                };
              },
              "fist",
              "folded",
            ),
          );
        // The right foot stands throughout; the left bears between its step
        // out and its step back.
        contacts = [
          {
            part: "rightFoot",
            kind: "plant",
            from: 0,
            to: 1,
            support: { kind: "ground" },
          },
          {
            part: "leftFoot",
            kind: "plant",
            from: clock.at("ready") / clock.duration,
            to: clock.at("relax") / clock.duration,
            support: { kind: "ground" },
          },
        ];
        break;
      }
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, contacts),
      clock,
      primitives,
      contact: "stroke",
    });
  }
}
