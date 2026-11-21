import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFootStrike,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanFoot } from "../posture/HumanFoot";
import { CloseStrikeLegs } from "./CloseStrikeLegs";
import { StrikingBody } from "./StrikingBody";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/** A foot strike's contact point on the foot. */
type Contact = "heel" | "sole";

/** How one technique meets its target: the contact, the foot's attitude and the travel. */
interface IForm {
  /** The point of the foot that lands. */
  contact: Contact;

  /** Where the toes point, from the line, the kicker's left and up. */
  toes: (
    line: IAutoMovieVector3,
    left: IAutoMovieVector3,
    outward: IAutoMovieVector3,
  ) => IAutoMovieVector3;

  /** Where the instep faces. */
  instep: (
    line: IAutoMovieVector3,
    left: IAutoMovieVector3,
    outward: IAutoMovieVector3,
  ) => IAutoMovieVector3;

  /** The unit direction the contact travels at the strike. */
  travel: (
    line: IAutoMovieVector3,
    left: IAutoMovieVector3,
    outward: IAutoMovieVector3,
  ) => IAutoMovieVector3;
}

/** The world's up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The world's down. */
const DOWN: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

/** Each technique's contact, foot attitude and travel. */
const FORMS: Readonly<
  Record<IAutoMovieMotionHumanFootStrike.Technique, IForm>
> = {
  side: {
    contact: "heel",
    toes: (_l, _x, outward) => Vector3.scale(outward, -1),
    instep: (line) => Vector3.scale(line, -1),
    travel: (line) => line,
  },
  back: {
    contact: "heel",
    toes: () => DOWN,
    instep: (line) => Vector3.scale(line, -1),
    travel: (line) => line,
  },
  hook: {
    contact: "heel",
    toes: (_l, _x, outward) => Vector3.scale(outward, -1),
    instep: () => UP,
    travel: (_l, _x, outward) => outward,
  },
  crescent: {
    contact: "sole",
    toes: () => UP,
    instep: (_l, _x, outward) => outward,
    travel: (_l, _x, outward) => Vector3.scale(outward, -1),
  },
  axe: {
    contact: "heel",
    toes: (line) => line,
    instep: () => UP,
    travel: () => DOWN,
  },
  stomp: {
    contact: "sole",
    toes: (line) => line,
    instep: () => UP,
    travel: () => DOWN,
  },
  sweep: {
    contact: "sole",
    toes: (line) => line,
    instep: (_l, _x, outward) => outward,
    travel: (_l, _x, outward) => Vector3.scale(outward, -1),
  },
};

/**
 * The foot strikes (`IAutoMovieMotionHumanFootStrike`): the kicking ankle
 * from its plant through a chamber to the contact and back, the support leg
 * planted on its ball, the pelvis turned, spun or lifted as the technique and
 * its modifiers ask.
 *
 * The ankle's goal is the contact point's: the foot turned to the
 * technique's attitude (`StrikingBody.foot`) and the ankle placed so the
 * heel or sole lands on the target; one beyond the leg's reach is moved
 * along the hip's line to the leg's full reach, where it lands short. The
 * chamber folds the knee in front of the hip (above it for an axe kick, on
 * the far side of the travel for a hook or a crescent), and the extension
 * aims through the target so it meets it at 0.82 of its unit, after its peak
 * speed. The knee bends toward the line between the hip and the ankle's
 * goal, raised.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the foot's goal, the reach rule, the chamber and the extension's timing source.
 * @evidence contracts/development/design.md#principled-representation One law record over the shared clock, base and lower-body primitive, with a data table of the techniques.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table and the plan registration reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The techniques differ by data in `FORMS`; timings are the cited ones or the kick's.
 */
export namespace footStrike {
  /** Action key. */
  export const name: AutoMovieMotionHumanActionKey = "footStrike";

  /** Cancel table: a foot strike chains into another from its impact. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    footStrike: [
      { window: ["impact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
  };

  /** The share of the extension unit at which the foot meets the target (Wąsik 2011). */
  export const MEET: number = 0.82;

  /** A side kick's launch to contact, seconds: the middle of Pieter and Pieter's 0.70 to 0.84 s. */
  export const SIDE: number = 0.77;

  /** The round kick's preparation, chamber and extension to contact, seconds (Gavagan and Sayers 2017). */
  export const KICK: number = 0.074 + 0.25 * 1.02;

  /** The round kick's recoil, seconds (Gavagan and Sayers 2017). */
  export const RECOIL: number = 0.65;

  /** A jump's added time and its height, a share of the leg (provisional). */
  export const JUMP: readonly [seconds: number, height: number] = [0.15, 0.25];

  /**
   * Plan a foot strike.
   *
   * @param context The action's context.
   * @returns The plan, whose decisive instant is `impact`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the plan's events.
   * @evidence contracts/development/implementation.md#principled-implementation Two minimum-jerk units carry the ankle through the chamber to the contact, a third back to the plant; the lower body turns, spins and hops on the strike's share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Timing, the target and the form, the contact goal and the chamber, then the lower body and the kicking leg.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target beyond reach is missed at full reach; provisional shares are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms The goal is solved once; each posture costs the lowering and leg fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the kick's timing, the close strike's lower body and the shared clock and base.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan retains its fixed geometry until release.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFootStrike.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanFootStrike.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const lead: AutoMovieHumanSide = StrikingTarget.lead(context.entry);
    const rear: AutoMovieHumanSide = StrikingStance.rear({ lead });
    const side: AutoMovieHumanSide = p.leg === "lead" ? lead : rear;
    const support: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const form: IForm = FORMS[p.technique];

    // Timing: the side kick's own execution, else the kick's, a spin and a
    // jump adding theirs, skill scaling as the kick's.
    const strike: number = StrikingSkill.strike(context.skill);
    const spinTime: number = p.spin === true ? KICK : 0;
    const jumpTime: number = p.jump === true ? JUMP[0] : 0;
    const shown: number =
      ((p.technique === "side" ? SIDE : KICK) + spinTime + jumpTime) * strike;
    const recoil: number = RECOIL * StrikingSkill.recovery(context.skill);
    const duration: number = shown + recoil;
    const chamber: number =
      spinTime * strike + 0.5 * (shown - spinTime * strike);
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(duration, [
      { name: "launch", seconds: 0 },
      { name: "chamber", seconds: chamber },
      { name: "impact", seconds: shown },
      { name: "recovered", seconds: duration },
    ]);
    const share = (seconds: number): number =>
      seconds <= shown
        ? minimumJerk.share(seconds / shown)
        : 1 - minimumJerk.share((seconds - shown) / recoil);

    // The target, the line and the form's directions.
    const target: IAutoMovieVector3 = StrikingTarget.aim(
      context,
      p.at,
      context.start,
      (): number => m.hipHeight,
    );
    const line: IAutoMovieVector3 = StrikingTarget.line(
      entry.root,
      target,
      entry.yaw,
    );
    const left: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(UP, line));
    const outward: IAutoMovieVector3 = Vector3.scale(
      left,
      side === "left" ? 1 : -1,
    );
    const travel: IAutoMovieVector3 = form.travel(line, left, outward);
    const rotation: IAutoMovieQuaternion = StrikingBody.foot(
      form.toes(line, left, outward),
      form.instep(line, left, outward),
    );

    // The lower body: a side kick turns the kicking hip to the target, a back
    // kick turns away on the support ball, a spin turns a whole turn first.
    const sign: number = side === "left" ? -1 : 1;
    const turn: number = p.technique === "side" ? 90 * sign : 0;
    const away: number = p.technique === "back" ? 180 * sign : 0;
    const whole: number = p.spin === true ? 360 * sign : 0;
    const spun = (seconds: number): number =>
      whole *
        minimumJerk.share(
          Math.min(1, seconds / Math.max(1e-6, spinTime * strike)),
        ) +
      away * share(seconds);
    const lift: number = JUMP[1] * (m.thigh + m.shank);
    const hop = (seconds: number): number =>
      p.jump === true && seconds > chamber && seconds < shown + 0.5 * JUMP[0]
        ? lift *
          Math.sin(
            (Math.PI * (seconds - chamber)) / (shown + 0.5 * JUMP[0] - chamber),
          )
        : 0;
    const feet: ReturnType<typeof StrikingTarget.feet> = StrikingTarget.feet(
      context.entry,
    );
    const lower: IAutoMovieMotionHumanPrimitive = CloseStrikeLegs(
      body,
      entry,
      feet,
      support,
      {
        duration,
        turn,
        lean: 0,
        shift: { x: 0, y: 0, z: 0 },
        share,
        spin: spun,
        hop,
      },
    );

    // The ankle's goal: the contact on the target, or the leg's full reach.
    const hip: IAutoMovieVector3 = HumanTrunk.resolve(
      body,
      lower.write(entry, shown),
      undefined,
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}UpperLeg`]),
    ).get(`${side}UpperLeg`)!.worldPosition;
    const offset: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      form.contact,
      {
        ankle: { x: 0, y: 0, z: 0 },
        rotation,
      },
    );
    let ankle: IAutoMovieVector3 = Vector3.subtract(target, offset);
    const reach: number = m.thigh + m.shank;
    if (Vector3.distance(ankle, hip) > reach)
      ankle = Vector3.add(
        hip,
        Vector3.scale(Vector3.normalize(Vector3.subtract(ankle, hip)), reach),
      );

    // The chamber: the knee folded before the hip, above it for an axe, on
    // the far side of the travel for a sweep across the target.
    const across: boolean =
      p.technique === "hook" || p.technique === "crescent";
    const folded: IAutoMovieVector3 =
      p.technique === "axe"
        ? Vector3.add(
            hip,
            Vector3.add(
              Vector3.scale(UP, 0.6 * reach),
              Vector3.scale(line, 0.3 * reach),
            ),
          )
        : across
          ? Vector3.subtract(ankle, Vector3.scale(travel, 0.5 * reach))
          : Vector3.add(
              hip,
              Vector3.add(
                Vector3.scale(DOWN, 0.45 * reach),
                Vector3.scale(line, 0.25 * reach),
              ),
            );
    const through: IAutoMovieVector3 = Vector3.add(
      folded,
      Vector3.scale(
        Vector3.subtract(ankle, folded),
        1 / minimumJerk.share(MEET),
      ),
    );
    const knee: IAutoMovieVector3 = Vector3.add(
      Vector3.lerp(hip, ankle, 0.5),
      Vector3.scale(UP, 0.25 * m.thigh),
    );
    const planted: IAutoMovieHumanLimbGoal | undefined =
      entry.limbs[`${side}Leg`];
    const start: IAutoMovieVector3 = planted?.point ?? feet[side].ankle;
    const startBend: IAutoMovieVector3 =
      planted?.bend ?? Vector3.add(hip, Vector3.scale(line, m.thigh));
    const extend: number = (shown - chamber) / MEET;
    const leg: IAutoMovieMotionHumanPrimitive = {
      channels: [`${side}Leg`],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        let point: IAutoMovieVector3;
        let bend: IAutoMovieVector3;
        if (seconds <= chamber) {
          const s: number = minimumJerk.share(seconds / chamber);
          point = Vector3.lerp(start, folded, s);
          bend = Vector3.lerp(startBend, knee, s);
        } else if (seconds <= shown) {
          point = Vector3.lerp(
            folded,
            through,
            minimumJerk.share((seconds - chamber) / extend),
          );
          bend = knee;
        } else {
          const s: number = minimumJerk.share((seconds - shown) / recoil);
          point = Vector3.lerp(ankle, start, s);
          bend = Vector3.lerp(knee, startBend, s);
        }
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            [`${side}Leg`]: { point, bend, rotation, planted: false },
          },
        };
      },
    };

    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      {
        part: `${support}Foot`,
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ];
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
        clock,
        primitives: [lower, leg],
      });
    return { ...composed, contact: shown };
  }
}
