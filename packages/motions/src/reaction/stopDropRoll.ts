import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCollapse,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFirefight,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { collapse } from "./collapse";

/**
 * Stop, drop and roll (`IAutoMovieMotionHumanFirefight.IStopDropRoll`): the
 * NFPA's steps to safety for burning clothes (NFPA, Steps to Safety,
 * https://www.saskatoon.ca/sites/default/files/STEPSTOSAFETY__1-pager_FIRES.pdf):
 * stop, drop gently, cover the face with the hands, and roll back and forth.
 *
 * The drop is the protective forward collapse (`collapse`) into the prone
 * lie, the hands brought over the face as the body goes down. The rolls
 * then turn the lying body about its long axis, a half turn onto one side
 * and back, alternating sides, each on a half sine. The body is a lying
 * cross-section half as deep as the chest and as wide as the shoulders: its
 * long axis rides at the height that cross-section rests at when turned, and
 * travels sideways by the arc it rolls, so the body rolls on the floor
 * rather than about a fixed line. The hands stay on the face, carried by
 * the head, throughout.
 */
export namespace stopDropRoll {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "stopDropRoll";

  /** Cancel table: none; the drill rolls to its end. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** How long the body stands stopped before it drops, seconds: authored. */
  export const STOP: number = 0.3;

  /** How long one roll onto a side and back takes, seconds: authored. */
  export const ROLL: number = 0.9;

  /** How far each roll turns the body, degrees: onto its side. */
  export const TURN: number = 90;

  /** How long the hands take to come over the face, seconds: authored. */
  export const COVER: number = 0.4;

  /**
   * Plan stop, drop and roll.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `rolls` when not a positive whole number.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFirefight.IStopDropRoll>,
  ): IAutoMovieMotionHumanActionPlan {
    const rolls: number = context.params.rolls ?? 4;
    if (!(Number.isInteger(rolls) && rolls > 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "rolls",
        value: rolls,
        reason: "the rolls are a positive whole number",
        fix: "give how many times the body rolls onto a side and back",
      });
    const body: IAutoMovieMotionHumanBody = context.body;

    // The drop: the protective forward collapse into the prone lie.
    const params: IAutoMovieMotionHumanCollapse.IParams = {
      direction: "forward",
      tone: "protective",
      seconds: 0,
    };
    const drop: IAutoMovieMotionHumanActionPlan = collapse.plan({
      ...context,
      params,
    });
    const down: number = drop.duration;
    const duration: number = STOP + down + rolls * ROLL;
    const lying: IAutoMovieMotionHumanPosture = drop.posture(down);

    // The lying cross-section and the side the body rolls toward.
    const deep: number = body.measure.chestDepth / 2;
    const wide: number = body.measure.shoulderHalfWidth;
    const heading: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      lying.yaw,
    );
    const right: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
      x: -1,
      y: 0,
      z: 0,
    });
    const rest: (theta: number) => number = (theta: number): number =>
      Math.sqrt(
        deep * deep * Math.cos(theta) ** 2 + wide * wide * Math.sin(theta) ** 2,
      );

    // Each roll onto a side and back, the sides alternating.
    const angle: (seconds: number) => number = (seconds: number): number => {
      const into: number = seconds - STOP - down;
      if (into <= 0) return 0;
      const k: number = Math.min(rolls - 1, Math.floor(into / ROLL));
      const u: number = Math.min(1, (into - k * ROLL) / ROLL);
      return (k % 2 === 0 ? 1 : -1) * TURN * Math.sin(Math.PI * u);
    };
    const rolled: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const degrees: number = angle(seconds);
      const theta: number = (degrees * Math.PI) / 180;
      // The long axis rises to the turned cross-section's rest and travels
      // sideways by the arc the body rolls along the floor.
      const lift: number = rest(theta) - deep;
      const arc: number = theta * ((deep + wide) / 2);
      return {
        ...lying,
        root: Vector3.add(
          lying.root,
          Vector3.add({ x: 0, y: lift, z: 0 }, Vector3.scale(right, arc)),
        ),
        roll: lying.roll + degrees,
      };
    };

    // The hands over the face, carried by the head.
    const cover: (
      posture: IAutoMovieMotionHumanPosture,
      weight: number,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      weight: number,
    ): IAutoMovieMotionHumanPosture => {
      if (weight <= 0) return posture;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const side of ["left", "right"] as const)
        limbs[`${side}Arm`] = face(body, side);
      return mixHumanPosture(posture, { ...posture, limbs }, weight);
    };
    const events: IAutoMovieMotionEvent[] = [
      { name: "stop", share: 0 },
      { name: "drop", share: STOP / duration },
      { name: "down", share: (STOP + down) / duration },
      { name: "end", share: 1 },
    ];
    return {
      duration,
      events,
      contacts: drop.contacts.map(
        (
          c: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...c,
          from: (STOP + c.from * down) / duration,
          to: c.to >= 1 ? 1 : (STOP + c.to * down) / duration,
        }),
      ),
      physicalWindow: null,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const covered: number = Math.min(1, Math.max(0, (t - STOP) / COVER));
        if (t <= STOP) return context.entry.posture;
        if (t <= STOP + down) return cover(drop.posture(t - STOP), covered);
        return cover(rolled(t), 1);
      },
    };
  }
}

/** A hand over the face, in the head's frame: the palm on the cheek, the fingers up. */
function face(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): IAutoMovieHumanLimbGoal {
  const out: number = side === "left" ? 1 : -1;
  const head: number = body.measure.headRadius;
  return {
    point: { x: out * 0.6 * head, y: -1.1 * head, z: 1.1 * head },
    bend: { x: out * 2.5 * head, y: -3 * head, z: 0.5 * head },
    rotation: HumanHand.rotation(side, {
      fingers: { x: 0, y: 1, z: 0 },
      palm: { x: 0, y: 0, z: -1 },
    }),
    on: "head",
  };
}
