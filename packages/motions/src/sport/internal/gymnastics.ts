import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanGymnastics,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanLegPhrase } from "../../compose/AutoMovieMotionHumanLegPhrase";
import { AutoMovieMotionHumanPlaced } from "../../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionManner } from "../../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../../law/HumanBound";
import { HumanFrame } from "../../posture/HumanFrame";
import { humanPostureHeading } from "../../posture/humanPostureHeading";

/**
 * A handstand kicked up from standing, held and stepped down.
 *
 * The hands are placed on the floor a shoulder width apart, as far ahead of the
 * feet as the standing legs let the hips go with the trunk pitched 120 degrees
 * over the hands (provisional). Over the first half of the entry the body folds
 * forward and the hands come down under the shoulders, which stand the arms'
 * reach above the wrists; over the second the trunk swings about the shoulders,
 * which stay where they are, and the legs follow straight until the body stands
 * inverted with the hips over the shoulders and the shoulders over the base of
 * the hands. The exit is the entry reversed: over its first half the legs swing
 * back down about the shoulders while the hands still bear, until the feet
 * stand where they left the floor, and over its second the trunk unfolds over
 * the feet. The entry and the exit take 1.5 s each (provisional) and the hold
 * is the author's. Balance in the hold is by the wrists first (Kerwin and
 * Trewartha 2001); no sway is drafted yet.
 *
 * Events: `handsDown` at the entry's middle, `inverted` (`ready`), `release` at
 * the exit's middle, when the feet bear again and the hands leave the floor,
 * with the phrase instants.
 *
 * Other laws plan the floor rolls, the cartwheel (`cartwheel`), the salto
 * (`salto`), the round-off (`roundOff`), the handspring (`handspring`) and the
 * vault (`vault`). Not drafted: bars and rings, which need swings about a bar
 * support.
 */
export namespace gymnastics {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "gymnastics";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
    });

  /**
   * The trunk's pitch when the hands touch down, degrees (provisional): the
   * hips above the shoulders, the legs still standing.
   */
  export const DOWN: number = 120;

  /**
   * The share of the straight leg's length from the ankle to the hip when the
   * hands touch down (provisional).
   */
  export const LEG: number = 0.95;

  /**
   * The share of the straight arm's length the shoulders stand above the wrists
   * (provisional): the elbows a little soft.
   */
  export const REACH: number = 0.98;

  /** The entry's and the exit's seconds (provisional). */
  export const ENTER: number = 1.5;

  /**
   * The gymnastics's timetable: entered over `ENTER`, held `hold`, left over
   * `ENTER`, the manner's tempo and hold factor applied, with its own cues.
   *
   * @param hold The held seconds.
   * @param modifiers The manner's timing.
   * @returns The clock.
   */
  export function timetable(
    hold: number,
    modifiers: IAutoMovieMotionManner.IModifiers,
  ): IAutoMovieMotionClock {
    const timed: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: ENTER,
        attack: 0,
        hold,
        retract: ENTER,
      }),
      modifiers,
    );
    // The exit mirrors the entry: the legs swing down over the hands first,
    // the feet landing at `release` half way through, and the trunk unfolds
    // over the standing feet after it.
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(timed.duration, [
      ...timed.instants,
      { name: "handsDown", seconds: timed.at("ready") / 2 },
      { name: "inverted", seconds: timed.at("ready") },
      {
        name: "release",
        seconds: (timed.at("relax") + timed.duration) / 2,
      },
    ]);
    return clock;
  }
  /**
   * Plan a handstand.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGymnastics.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanGymnastics.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const hold: number = p.hold ?? 2;
    HumanBound.least("hold", hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    const clock: IAutoMovieMotionClock = timetable(hold, modifiers);
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { x: entry.root.x, y: 0, z: entry.root.z },
      yaw: entry.yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: 1 },
    );
    // The wrist of a palm laid flat on the floor, from the palm's point.
    const laid: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.wrist(
      body,
      "left",
      { point: { x: 0, y: 0, z: 0 }, facing: { x: 0, y: -1, z: 0 }, forward },
    );
    const height: number = laid.y + REACH * (m.upperArm + m.forearm);
    const girdle: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.girdle(body);
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const standing: IAutoMovieVector3 = Vector3.add(
      entry.root,
      Quaternion.rotateVector(humanPostureHeading(entry), hipsRest),
    );
    // The hips from the shoulders at the hands' touchdown, in the entry's frame.
    const carried: IAutoMovieVector3 = Quaternion.rotateVector(
      humanPostureHeading({ yaw: 0, pitch: DOWN, roll: 0 }),
      Vector3.subtract(hipsRest, girdle),
    );
    // The hips go as far ahead of the ankles as the planted legs reach at that height.
    const ankles: number =
      (HumanFrame.local(frame, context.entry.feet.left.ankle).z +
        HumanFrame.local(frame, context.entry.feet.right.ankle).z) /
      2;
    const drop: number = height + carried.y - m.ankleHeight;
    const leg: number = LEG * (m.thigh + m.shank);
    const ahead: number =
      ankles + Math.sqrt(Math.max(0, leg * leg - drop * drop)) - carried.z;
    const shoulders: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: height,
      z: ahead,
    });
    // The shoulders stand over the middle of the hand's base, between the wrist and the palm.
    const hands: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: 0,
      z: ahead - Vector3.dot(laid, forward) / 2,
    });
    const down: IAutoMovieVector3 = Vector3.add(
      shoulders,
      Quaternion.rotateVector(
        humanPostureHeading({ yaw: entry.yaw, pitch: DOWN, roll: 0 }),
        Vector3.subtract(hipsRest, girdle),
      ),
    );
    // The pitch that stands the hips straight above the shoulders.
    const inverted: number = AutoMovieMotionHumanPlaced.pitch(body, -Infinity);
    // The share of the way into the inverted pose: the fold over the entry's
    // first half and the swing over its second, then the swing undone over
    // the exit's first half and the fold over its second, so at every
    // instant the hands or the feet bear.
    const fold: (s: number) => number = (s: number): number =>
      clock.envelope(["start", "handsDown"], ["release", "end"], s);
    const swing: (s: number) => number = (s: number): number =>
      clock.envelope(["handsDown", "inverted"], ["relax", "release"], s);
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root", "trunk"],
        from: 0,
        to: clock.duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          s: number,
        ): IAutoMovieMotionHumanPosture => {
          const folded: number = fold(s);
          const swung: number = swing(s);
          const pitched: IAutoMovieMotionHumanPosture = {
            ...posture,
            pitch: posture.pitch + DOWN * folded + (inverted - DOWN) * swung,
          };

          // The two places agree wherever the swing is nil and the fold full,
          // at `handsDown` and at `release`, so the change of support is
          // continuous.
          return {
            ...pitched,
            root:
              swung > 0
                ? AutoMovieMotionHumanPlaced.root(pitched, girdle, shoulders)
                : Vector3.subtract(
                    Vector3.lerp(standing, down, folded),
                    Quaternion.rotateVector(
                      humanPostureHeading(pitched),
                      hipsRest,
                    ),
                  ),
          };
        },
      },
    ];
    for (const side of ["left", "right"] as const) {
      primitives.push(
        ...AutoMovieMotionHumanPlaced.arm({
          body,
          side,
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          weight: fold,
          place: (
            posture: IAutoMovieMotionHumanPosture,
          ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => ({
            point: HumanFrame.point(
              { origin: hands, yaw: posture.yaw },
              {
                x: (side === "left" ? 1 : -1) * m.shoulderHalfWidth,
                y: 0,
                z: 0,
              },
            ),
            facing: { x: 0, y: -1, z: 0 },
            forward,
          }),
          bend: "raised",
        }),
      );
      const stance: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: context.entry.feet[side].ankle,
        rotation: context.entry.feet[side].rotation,
      };
      const ankleRest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      primitives.push(
        AutoMovieMotionHumanLeg.place({
          body,
          side,
          from: 0,
          to: clock.duration,
          placement: (
            posture: IAutoMovieMotionHumanPosture,
            s: number,
          ): IAutoMovieMotionHumanFoot.IPlacement => {
            // The straight leg's ankle and foot as the pitched body carries them.
            const turn: IAutoMovieQuaternion = humanPostureHeading(posture);
            const carried: IAutoMovieMotionHumanFoot.IPlacement = {
              ankle: Vector3.add(
                posture.root,
                Quaternion.rotateVector(turn, ankleRest),
              ),
              rotation: turn,
            };
            return AutoMovieMotionHumanLegPhrase.between(
              stance,
              carried,
              swing(s),
            );
          },
          planted: (s: number): boolean => swing(s) <= 0,
        }),
      );
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, [
        {
          part: "leftHand",
          kind: "plant",
          from: clock.at("handsDown") / clock.duration,
          to: clock.at("release") / clock.duration,
          support: { kind: "ground" },
        },
        {
          part: "rightHand",
          kind: "plant",
          from: clock.at("handsDown") / clock.duration,
          to: clock.at("release") / clock.duration,
          support: { kind: "ground" },
        },
      ]),
      clock,
      primitives,
      contact: "inverted",
    });
  }
}
