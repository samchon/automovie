import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";

/**
 * Operating an articulated thing with one hand while standing: pressing a
 * button along its axis, turning a knob about its axis, pulling or pushing a
 * drawer along its slide, or swinging a hinged door by its handle.
 *
 * The goal is the hand on the thing's moving part, and the part's motion is
 * the mechanism's own: a button's face goes in along its axis, a knob turns
 * about its axis, a slider's handle travels along its axis, a door's handle
 * turns about the vertical hinge line. The hand is shaped to the part (the
 * index fingertip on a button, a closed grip on a knob, a drawer handle or a
 * door handle) and laid on it by `AutoMovieMotionHumanTarget.hand`; on a knob
 * the hand also rolls about the knob's axis with it, the forearm's pronation
 * and supination (Magermans et al. 2005, Clin Biomech 20:591, give the
 * ranges daily tasks use). Each part's place is a target, so it can be a
 * prop's point; the part's outward normal is its axis.
 *
 * The action is one arm phrase (`AutoMovieMotionHumanArm.stroke`): the hand
 * reaches the part by `ready` in the aimed movement time to its width
 * (McIntosh et al. 2018), waits a brief moment for the grip, moves the part
 * from `strokeStart` to `strokeEnd` at the mechanism's pace (`PACE`,
 * provisional), holds it until `relax`, and returns to where it hung.
 * Events: the phrase's `ready` (contact or grip closed), `strokeStart`,
 * `stroke`, `strokeEnd` (bottom out, travel end, swing end) and `relax`
 * (release).
 *
 * Not yet: the A8 affordance kinds (`hinge`, `slider`, `knob`, `button`) in
 * the interface, which the core owns, so the mechanism is stated here; the
 * body stepping round a door and walking through it; two-handed or power
 * grips; pouring from a held container about its lip.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four mechanisms, the hand on each, the phrase and its timing, the events and what is missing, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of one arm phrase over a standing base; the mechanism is a closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the mechanism union, the pace table, the part's state and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The part's places are targets; nothing is typed in world metres by the law.
 */
export namespace operate {
  /** The action's name. */
  export const name: HumanActionName = "operate";

  /** Cancel table: the hand lets go of the part and the body stands or walks. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [{ window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /**
   * An articulated part and how it moves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and sign.
   * @evidence contracts/development/design.md#principled-representation The four one-degree-of-freedom mechanisms of household hardware.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A closed union read by `plan` and `state`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The part's place is a target with a normal; amounts are the mechanism's own.
   */
  export type Mechanism =
    | {
        /** A push button or switch pressed along its axis. */
        kind: "button";
        /** The button's face, its normal pointing out. */
        at: AutoMovieMotionTarget;
        /** How far it goes in, metres; 0.005 when absent. */
        travel?: number;
      }
    | {
        /** A knob, lid, tap or dial turned about its axis. */
        kind: "knob";
        /** The knob's centre, its normal along the axis toward the hand. */
        at: AutoMovieMotionTarget;
        /** How far it turns, degrees; positive clockwise as the hand sees it. */
        turn: number;
      }
    | {
        /** A drawer or slider moved along its axis. */
        kind: "slider";
        /** The handle, its normal along the slide toward the hand. */
        at: AutoMovieMotionTarget;
        /** How far it travels, metres; positive pulls toward the hand. */
        travel: number;
      }
    | {
        /** A door swung about a vertical hinge line by its handle. */
        kind: "hinge";
        /** The handle, its normal out of the leaf toward the hand. */
        at: AutoMovieMotionTarget;
        /** A point on the hinge line. */
        hinge: AutoMovieMotionTarget;
        /** How far the leaf swings, degrees; positive pulls it toward the hand. */
        swing: number;
      };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation The mechanism, the hand and the manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed by the author.
   */
  export interface IParams {
    /** What is operated. */
    mechanism: Mechanism;

    /** The hand; `right` when absent. */
    hand?: HumanHand.Side;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * The pace of each mechanism's movement (provisional): a button's press in
   * 0.25 s, a knob at 180 degrees a second, a slider at 0.4 m/s, a door's
   * handle at 0.6 m/s along its arc.
   */
  export const PACE: Readonly<{
    press: number;
    turn: number;
    slide: number;
    swing: number;
  }> = { press: 0.25, turn: 180, slide: 0.4, swing: 0.6 };

  /** The width of each part a hand aims at, metres (provisional). */
  export const WIDTH: Readonly<Record<Mechanism["kind"], number>> = {
    button: 0.02,
    knob: 0.05,
    slider: 0.03,
    hinge: 0.03,
  };

  /**
   * The moving part's place at a progress of its movement.
   *
   * @param mechanism The mechanism.
   * @param place The part's place at rest: its point and outward normal.
   * @param hinge The hinge line's point, for a door.
   * @param progress 0 at rest, 1 at the end of the movement.
   * @returns The point and the normal, and the roll about the normal in degrees.
   */
  export function state(
    mechanism: Mechanism,
    place: { point: IAutoMovieVector3; normal: IAutoMovieVector3 },
    hinge: IAutoMovieVector3 | undefined,
    progress: number,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3; roll: number } {
    const n: IAutoMovieVector3 = Vector3.normalize(place.normal);
    switch (mechanism.kind) {
      case "button":
        return {
          point: Vector3.add(
            place.point,
            Vector3.scale(n, -(mechanism.travel ?? 0.005) * progress),
          ),
          normal: n,
          roll: 0,
        };
      case "knob":
        return {
          point: place.point,
          normal: n,
          roll: mechanism.turn * progress,
        };
      case "slider":
        return {
          point: Vector3.add(
            place.point,
            Vector3.scale(n, mechanism.travel * progress),
          ),
          normal: n,
          roll: 0,
        };
      case "hinge": {
        // A pull turns the handle toward its normal's side about the line.
        const arm: IAutoMovieVector3 = Vector3.subtract(place.point, {
          ...hinge!,
          y: place.point.y,
        });
        const sign: number =
          Vector3.dot(Vector3.cross({ x: 0, y: 1, z: 0 }, arm), n) >= 0
            ? 1
            : -1;
        const turn = Quaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          sign * mechanism.swing * progress,
        );
        return {
          point: Vector3.add(
            { ...hinge!, y: place.point.y },
            Quaternion.rotateVector(turn, arm),
          ),
          normal: Quaternion.rotateVector(turn, n),
          roll: 0,
        };
      }
    }
  }

  /**
   * Plan an operation.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const mechanism: Mechanism = context.params.mechanism;
    const side: HumanHand.Side = context.params.hand ?? "right";
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const place = context.aim(mechanism.at, context.start);
    const hinge: IAutoMovieVector3 | undefined =
      mechanism.kind === "hinge"
        ? context.aim(mechanism.hinge, context.start).point
        : undefined;

    // The movement's length by the mechanism's pace.
    const operating: number = ((): number => {
      switch (mechanism.kind) {
        case "button":
          return PACE.press;
        case "knob":
          return Math.abs(mechanism.turn) / PACE.turn;
        case "slider":
          return Math.abs(mechanism.travel) / PACE.slide;
        case "hinge":
          return (
            (((Math.abs(mechanism.swing) * Math.PI) / 180) *
              Vector3.length(
                Vector3.subtract({ ...place.point, y: 0 }, { ...hinge!, y: 0 }),
              )) /
            PACE.swing
          );
      }
    })();
    const origin: AutoMovieMotionHumanArm.IOrigin =
      AutoMovieMotionHumanArm.origin(
        body,
        poseBones(body, context.entry.pose),
        { origin: context.entry.posture.root, yaw: context.entry.posture.yaw },
        side,
        mechanism.kind === "button" ? "indexTip" : "grip",
      );
    const distance: number = Vector3.length(
      Vector3.subtract(
        place.point,
        AutoMovieMotionHumanArm.point(context.entry.posture, origin),
      ),
    );
    const reach: number = AutoMovieMotionHumanTiming.aimed(
      distance,
      WIDTH[mechanism.kind],
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: reach,
        wait: AutoMovieMotionHumanTiming.PAUSES.brief,
        attack: operating,
        hold: AutoMovieMotionHumanTiming.PAUSES.brief,
        retract: reach,
      }),
      modifiers,
    );
    const duration: number = clock.duration;
    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });
    const surface: HumanHand.Surface =
      mechanism.kind === "button" ? "indexTip" : "grip";
    const shape: HumanHand.Shape =
      mechanism.kind === "button" ? "point" : "relaxed";
    return composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "strokeEnd",
      primitives: [
        AutoMovieMotionHumanArm.stroke({
          body,
          clock,
          side,
          origin,
          contact: {
            kind: "grip",
            support:
              mechanism.at.kind === "prop"
                ? { kind: "prop", subject: mechanism.at.subject }
                : { kind: "ground" },
          },
          path: (posture: IHumanPosture, _: number, progress: number) => {
            const now = state(mechanism, place, hinge, progress);
            const target: AutoMovieMotionHumanArm.ITarget =
              AutoMovieMotionHumanTarget.hand(body, posture, side, now, {
                surface,
                shape,
                forward:
                  mechanism.kind === "button"
                    ? { x: 0, y: 1, z: 0 }
                    : HumanFrame.point(
                        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                        { x: side === "left" ? -1 : 1, y: 0, z: 0 },
                      ),
                curl: mechanism.kind === "button" ? 0 : 40,
              });
            return now.roll === 0
              ? target
              : {
                  ...target,
                  rotation: Quaternion.multiply(
                    Quaternion.fromAxisAngle(now.normal, -now.roll),
                    target.rotation,
                  ),
                };
          },
        }),
      ],
    });
  }
}
