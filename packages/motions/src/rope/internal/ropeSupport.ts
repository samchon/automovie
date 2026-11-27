import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanRope,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../../actions/internal/support";
import { getUp } from "../../floor/internal/getUp";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { ropeLine } from "./ropeLine";

/*
 * Climbs and descents of an upright rope fitted by the shared support law: a
 * climb moves one hand up a step at a time and re-sets the foot lock below the
 * lower hand one foot after the other; a descent lets the hands and the lock
 * down the same way from where the hands hold, each move no faster than the
 * speed bound, and lands on the floor one foot at a time. Every contact is a
 * point of the named line. The cadence it states, STEP and BEAT, is the level
 * traverse's too ( opeTraverse).
 */
export namespace ropeSupport {
  /*
   * One hand's move along the rope, arm lengths (provisional: a hand-over-hand
   * pull).
   */
  export const STEP: number = 0.45;

  /*
   * Seconds per hand or foot move on the rope (provisional).
   */
  export const BEAT: number = 0.6;

  /*
   * Climb or descend an upright rope.
   * Parameter context: The action's context, standing at the rope's foot or hanging
   * on it.
   * Parameter p: The climb or the descent.
   * Returns: The crossing.
   * If the rope is too short for the rise or the
   * descent's start.
   */
  export function upright(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRope.IParams>,
    p: UprightP,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const measure: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const line: ropeLine.ILine = ropeLine.read(context, p.rope, p.line);
    const arm: number = measure.upperArm + measure.forearm;
    const step: number = STEP * arm;
    const floor: number = line.floor;
    const start: number = floor + measure.shoulderHeight + 0.5 * arm;
    const entry: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const top: number =
      p.kind === "climb"
        ? start + Math.max(0, p.rise)
        : Math.max(
            entry.get("leftHand")!.worldPosition.y,
            entry.get("rightHand")!.worldPosition.y,
          );
    if (top > line.high.y)
      throw ropeLine.refusal(
        p.kind === "climb" ? "rise" : "line",
        p.kind === "climb" ? p.rise : p.line,
        `the rope is ${(top - line.high.y).toFixed(3)} m too short`,
      );

    const staged: Map<string, IAutoMovieVector3> = new Map();
    const forward: IAutoMovieVector3 = HumanFrame.forward(
      context.entry.posture.yaw,
    );
    const lateral: IAutoMovieVector3 = HumanFrame.forward(
      context.entry.posture.yaw + 90,
    );
    const at = (
      key: string,
      point: IAutoMovieVector3,
    ): IAutoMovieMotionTarget => {
      staged.set(key, point);
      return { kind: "prop", subject: p.rope, point: key };
    };
    const on = (
      key: string,
      height: number,
      offset: number,
    ): IAutoMovieMotionTarget =>
      at(
        key,
        Vector3.add(
          ropeLine.atHeight(line, height),
          Vector3.scale(lateral, offset),
        ),
      );
    const hand = (
      side: AutoMovieHumanSide,
      height: number,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Hand`,
      kind: "grip",
      target: on(`${side}Hand${height.toFixed(3)}`, height, 0),
    });
    const lock = (
      side: AutoMovieHumanSide,
      height: number,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Foot`,
      kind: "bear",
      target: on(
        `${side}Foot${height.toFixed(3)}`,
        height,
        side === "left" ? SPLIT : -SPLIT,
      ),
    });
    // The floor under the rope: where the climb stood, or behind the rope for
    // a descent's landing.
    const ground = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Foot`,
      kind: "bear",
      target:
        p.kind === "climb"
          ? {
              kind: "point",
              frame: "world",
              at: entry.get(`${side}Toes`)!.worldPosition,
              normal: { x: 0, y: 1, z: 0 },
            }
          : at(
              `${side}FootFloor`,
              Vector3.add(
                { ...ropeLine.atHeight(line, floor), y: floor },
                Vector3.add(
                  Vector3.scale(forward, -STAND_OFF),
                  Vector3.scale(lateral, side === "left" ? STANCE : -STANCE),
                ),
              ),
            ),
    });
    const locked = (
      right: number,
      left: number,
    ): IAutoMovieMotionHumanSupport.IContact[] => {
      const height: number = Math.min(right, left) - LOCK * measure.hipHeight;
      return [lock("left", height), lock("right", height)];
    };

    if (p.kind === "climb") {
      // Grip, lock, then each cycle the lower hand passes the upper by a
      // step and the lock is drawn up below the lower hand.
      let right: number = start;
      let left: number = start - step;
      const climb: IAutoMovieMotionHumanSupport.IStance[] = [
        {
          contacts: [ground("left"), ground("right")],
          seconds: BEAT,
          event: "floor",
          prefer: getUp.POSES.stood,
        },
        {
          contacts: [
            ground("left"),
            ground("right"),
            hand("right", right),
            hand("left", left),
          ],
          seconds: BEAT,
          event: "grip",
        },
        {
          contacts: [
            hand("right", right),
            hand("left", left),
            ...locked(right, left),
          ],
          seconds: BEAT,
          event: "lock",
          prefer: CLIMB,
        },
      ];
      while (Math.min(right, left) < top - step) {
        const held: IAutoMovieMotionHumanSupport.IContact[] = locked(
          right,
          left,
        );
        if (right <= left) right += 2 * step;
        else left += 2 * step;
        climb.push({
          contacts: [hand("right", right), hand("left", left), ...held],
          seconds: BEAT,
          event: `hand${climb.length}`,
          prefer: CLIMB,
        });
        climb.push({
          contacts: [
            hand("right", right),
            hand("left", left),
            ...locked(right, left),
          ],
          seconds: BEAT,
          event: `lock${climb.length}`,
          prefer: CLIMB,
        });
      }
      return {
        ...support.plan({
          ...context,
          params: { stances: oneFootAtATime(climb) },
          aim: ropeLine.aim(context, p.rope, staged, line),
        }),
        base: { kind: "standing" },
      };
    }

    // A descent from where the entering hands hold the rope: each cycle the
    // upper hand passes the lower by a step downward and the lock is let
    // down below it, each move no faster than the bound, until the feet
    // reach the floor and the hands let go.
    const speed: number = p.speed ?? SPEED;
    if (!(speed > 0))
      throw ropeLine.refusal(
        "speed",
        speed,
        "a descent needs a positive speed bound",
      );
    const seconds: number = Math.max(BEAT, (2 * step) / speed);
    let right: number = entry.get("rightHand")!.worldPosition.y;
    let left: number = entry.get("leftHand")!.worldPosition.y;
    const descent: IAutoMovieMotionHumanSupport.IStance[] = [
      {
        contacts: [
          hand("right", right),
          hand("left", left),
          ...locked(right, left),
        ],
        seconds: BEAT,
        event: "onRope",
        prefer: CLIMB,
      },
    ];
    while (Math.max(right, left) - 2 * step >= start - step) {
      if (right >= left) right -= 2 * step;
      else left -= 2 * step;
      const held: IAutoMovieMotionHumanSupport.IContact[] = descent
        .at(-1)!
        .contacts.filter((c: IAutoMovieMotionHumanSupport.IContact): boolean =>
          c.part.endsWith("Foot"),
        );
      descent.push({
        contacts: [hand("right", right), hand("left", left), ...held],
        seconds,
        event: `hand${descent.length}`,
        prefer: CLIMB,
      });
      descent.push({
        contacts: [
          hand("right", right),
          hand("left", left),
          ...locked(right, left),
        ],
        seconds,
        event: `lock${descent.length}`,
        prefer: CLIMB,
      });
    }
    // The feet come down to the floor one at a time.
    const lockedRight: IAutoMovieMotionHumanSupport.IContact | undefined =
      descent
        .at(-1)!
        .contacts.find(
          (c: IAutoMovieMotionHumanSupport.IContact): boolean =>
            c.part === "rightFoot",
        );
    descent.push(
      {
        contacts: [
          ground("left"),
          ...(lockedRight === undefined ? [] : [lockedRight]),
          hand("right", right),
          hand("left", left),
        ],
        seconds,
        event: "floorLeft",
      },
      {
        contacts: [
          ground("left"),
          ground("right"),
          hand("right", right),
          hand("left", left),
        ],
        seconds,
        event: "floor",
      },
      {
        contacts: [ground("left"), ground("right")],
        seconds: BEAT,
        event: "release",
        prefer: getUp.POSES.stood,
      },
    );
    return {
      ...support.plan({
        ...context,
        params: { stances: oneFootAtATime(descent) },
        aim: ropeLine.aim(context, p.rope, staged, line),
      }),
      base: { kind: "standing" },
    };
  }

  /*
   * Insert, wherever both feet change between two stances, a stance in which
   * only the left foot has moved: a climber re-sets one foot of the lock after
   * the other, so two hands and a foot always bear between moves.
   * Parameter stances: The stances in order.
   * Returns: The stances with the intermediate ones.
   */
  function oneFootAtATime(
    stances: readonly IAutoMovieMotionHumanSupport.IStance[],
  ): IAutoMovieMotionHumanSupport.IStance[] {
    const out: IAutoMovieMotionHumanSupport.IStance[] = [];
    const foot = (
      stance: IAutoMovieMotionHumanSupport.IStance,
      part: OneFootAtATimeFootPart,
    ): IAutoMovieMotionHumanSupport.IContact | undefined =>
      stance.contacts.find(
        (c: IAutoMovieMotionHumanSupport.IContact): boolean => c.part === part,
      );
    const same = (
      a: IAutoMovieMotionHumanSupport.IContact | undefined,
      b: IAutoMovieMotionHumanSupport.IContact | undefined,
    ): boolean => JSON.stringify(a?.target) === JSON.stringify(b?.target);
    stances.forEach(
      (stance: IAutoMovieMotionHumanSupport.IStance, i: number): void => {
        const before: IAutoMovieMotionHumanSupport.IStance | undefined =
          stances[i - 1];
        const right: IAutoMovieMotionHumanSupport.IContact | undefined =
          before === undefined ? undefined : foot(before, "rightFoot");
        if (
          before !== undefined &&
          right !== undefined &&
          foot(stance, "leftFoot") !== undefined &&
          !same(foot(before, "leftFoot"), foot(stance, "leftFoot")) &&
          !same(right, foot(stance, "rightFoot"))
        )
          out.push({
            contacts: [
              ...stance.contacts.filter(
                (c: IAutoMovieMotionHumanSupport.IContact): boolean =>
                  c.part !== "rightFoot",
              ),
              right,
            ],
            seconds: stance.seconds ?? BEAT,
            event: `${stance.event ?? `stance${i}`}Left`,
            ...(stance.prefer === undefined ? {} : { prefer: stance.prefer }),
          });
        out.push(stance);
      },
    );
    return out;
  }
}

/*
 * The locked feet below the lower hand, hip heights (provisional: the hands
 * overhead and the knees drawn up to the lock, the hips well below the hands).
 */
const LOCK: number = 1.5;

/*
 * The fastest descent when none is asked, metres per second (provisional).
 */
const SPEED: number = 1;

/*
 * How far behind the rope a descent's feet land, metres (provisional: a
 * forearm's length).
 */
const STAND_OFF: number = 0.3;

/*
 * The landing feet's half spacing, metres (provisional).
 */
const STANCE: number = 0.12;

/*
 * The climbing pose: the hands up the rope in front with the elbows bent, the
 * feet drawn up into the lock (provisional angles, degrees).
 */
const CLIMB: IAutoMovieMotionHumanLieDown.IPose = {
  pitch: 0,
  roll: 0,
  joints: {
    ...HumanHand.shape("left", "fist"),
    ...HumanHand.shape("right", "fist"),
    leftUpperLeg: [60, 5, 0],
    rightUpperLeg: [60, 5, 0],
    leftLowerLeg: [90, 0, 0],
    rightLowerLeg: [90, 0, 0],
    leftUpperArm: [150, 15, 0],
    rightUpperArm: [150, 15, 0],
    leftLowerArm: [50, 0, 0],
    rightLowerArm: [50, 0, 0],
  },
};
/*
 * A foot's offset from the rope in a lock, metres (provisional: the rope
 * between the feet).
 */
const SPLIT: number = 0.04;

/*
 * The alternatives of `OneFootAtATimeFootPart`'s site.
 */
type OneFootAtATimeFootPart = "leftFoot" | "rightFoot";

/*
 * The alternatives of `UprightP`'s site.
 */
type UprightP =
  | IAutoMovieMotionHumanRope.IClimb
  | IAutoMovieMotionHumanRope.IDescend;
