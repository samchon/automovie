import { Quaternion, Vector3 } from "@automovie/engine";
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
  IAutoMovieMotionHumanChiSau,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { StrikingBody } from "../striking/StrikingBody";

/** The shared geometry of the two rolling contacts. */
interface IRoll {
  /** Each of this performer's sides' contact centre, world metres. */
  centre: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>;

  /**
   * The roll's in-line axis, shared by both partners: from the first subject
   * toward the second.
   */
  line: IAutoMovieVector3;

  /** This performer's forward, toward the partner. */
  forward: IAutoMovieVector3;

  /** This performer's left. */
  left: IAutoMovieVector3;

  /**
   * The roll phase offset of each of this performer's sides, radians, shared by
   * the side's two forearms.
   */
  phase: Readonly<Record<AutoMovieHumanSide, number>>;
}

/** The world's up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Wing chun's rolling chi sau (`IAutoMovieMotionHumanChiSau`): both wrists held
 * on the two contacts between the partners, each partner's left wrist over the
 * partner's right, the contacts rolling a small vertical circle in the line
 * half a cycle apart, so the wrists stay one wrist's thickness apart through
 * every roll.
 *
 * Both partners derive the same contacts from the two placed marks: the middle
 * between their roots at the mean of their lower chest heights, a shoulder's
 * width apart across the line. Everyone's left forearm lies on top, so on each
 * side one forearm is over the other. The arms blend in from the entry's goals
 * over `BLEND` seconds and end the roll on its own goals, open-handed; the feet
 * stay planted.
 */
export namespace chiSau {
  /** Action key. */
  export const name: AutoMovieMotionHumanActionKey = "chiSau";

  /** Cancel table: none; the drill runs to its end. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** One roll cycle, seconds (provisional). */
  export const CYCLE: number = 1.2;

  /** The roll circle's radius as a share of stature (provisional). */
  export const RADIUS: number = 0.035;

  /**
   * The contacts' half spacing across the line as a share of stature
   * (provisional).
   */
  export const HALF: number = 0.07;

  /** A wrist's radius as a share of stature, from the joint to its surface. */
  export const WRIST: number = 0.015;

  /** The arms' blend in and out, seconds. */
  export const BLEND: number = 0.5;

  /**
   * Plan chi sau.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the partner is the performer.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanChiSau.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanChiSau.IParams = context.params;
    if (p.partner === context.subject)
      throw new HumanRefusal({
        kind: "participant",
        axis: "partner",
        value: p.partner,
        reason: "chi sau needs two different performers",
        fix: "name the other performer as the partner",
      });
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const cycles: number = p.count ?? 4;
    const duration: number = p.duration ?? cycles * CYCLE;
    const blend: number = Math.min(BLEND, duration / 4);
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(duration, [
      { name: "joined", seconds: blend },
      { name: "parted", seconds: duration - blend },
    ]);
    const first: boolean = context.subject < p.partner;

    // The roll reads the partner's placed root, so it is built on first use
    // and dropped when placement settles.
    // Each partner reads the other's root, whose posture reads this one's:
    // while this roll is being built, a read of it gives the arms as they
    // are, which leaves the root it was asked for unchanged.
    let roll: IRoll | undefined;
    let building: boolean = false;
    const build = (): IRoll | null => {
      if (roll !== undefined) return roll;
      if (building) return null;
      building = true;
      try {
        return (roll = lay());
      } finally {
        building = false;
      }
    };
    const lay = (): IRoll => {
      const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
        p.partner,
      );
      const there: IAutoMovieVector3 = partner.root(context.start).position;
      const here: IAutoMovieVector3 = entry.root;
      const forward: IAutoMovieVector3 = Vector3.normalize({
        x: there.x - here.x,
        y: 0,
        z: there.z - here.z,
      });
      const left: IAutoMovieVector3 = Vector3.normalize(
        Vector3.cross(UP, forward),
      );
      const stature: number =
        0.5 * (body.measure.stature + partner.body.measure.stature);
      const height: number =
        0.5 * (body.measure.chestHeight + partner.body.measure.chestHeight) -
        0.03 * stature;
      const middle: IAutoMovieVector3 = {
        x: 0.5 * (here.x + there.x),
        y: height,
        z: 0.5 * (here.z + there.z),
      };
      // The first subject's left is side A, rolling at phase 0; the second
      // subject's right is the same side.
      const mine = (side: AutoMovieHumanSide): number =>
        (side === "left") === first ? 0 : Math.PI;
      return {
        centre: {
          left: Vector3.add(middle, Vector3.scale(left, HALF * stature)),
          right: Vector3.add(middle, Vector3.scale(left, -HALF * stature)),
        },
        line: first ? forward : Vector3.scale(forward, -1),
        forward,
        left,
        phase: { left: mine("left"), right: mine("right") },
      };
    };

    const stature: number = body.measure.stature;
    const arm = (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => {
      const limb: `${AutoMovieHumanSide}Arm` = `${side}Arm`;
      // The arm leaves from the entry's goal, or from its displayed wrist and
      // elbow when the entry wrote none.
      const shown: ReturnType<typeof poseBones> = poseBones(
        body,
        context.entry.pose,
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}LowerArm`, `${side}Hand`]),
      );
      const from: IAutoMovieHumanLimbGoal = entry.limbs[limb] ?? {
        point: shown.get(`${side}Hand`)!.worldPosition,
        bend: shown.get(`${side}LowerArm`)!.worldPosition,
        rotation: shown.get(`${side}Hand`)!.worldRotation,
      };
      const goal = (seconds: number, r: IRoll): IAutoMovieHumanLimbGoal => {
        const theta: number =
          (2 * Math.PI * cycles * seconds) / duration + r.phase[side];
        const radius: number = RADIUS * stature;
        const contact: IAutoMovieVector3 = Vector3.add(
          r.centre[side],
          Vector3.add(
            Vector3.scale(UP, radius * Math.sin(theta)),
            Vector3.scale(r.line, radius * (Math.cos(theta) - 1)),
          ),
        );
        // Everyone's left forearm lies on top.
        const over: number = side === "left" ? 1 : -1;
        const point: IAutoMovieVector3 = Vector3.add(
          contact,
          Vector3.scale(UP, over * WRIST * stature),
        );
        const outward: IAutoMovieVector3 = Vector3.scale(
          r.left,
          side === "left" ? 1 : -1,
        );
        const bend: IAutoMovieVector3 = Vector3.add(
          point,
          Vector3.scale(
            Vector3.normalize(
              Vector3.add(
                Vector3.add(
                  Vector3.scale(r.forward, -0.7),
                  Vector3.scale(UP, -0.5),
                ),
                Vector3.scale(outward, 0.3),
              ),
            ),
            body.measure.forearm,
          ),
        );
        // The fingers point at the partner; the upper forearm's palm faces
        // down (fook sau), the lower one's up (taan sau).
        return {
          point,
          bend,
          rotation: StrikingBody.fist(
            body,
            side,
            r.forward,
            Vector3.scale(UP, -over),
          ),
        };
      };
      // The hand lies open on the partner's forearm, the thumb along it.
      const open: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
        side,
        "flat",
      );
      return {
        channels: [limb, `${side}Hand`],
        from: 0,
        to: duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanPosture => {
          const r: IRoll | null = build();
          if (r === null) return posture;
          const target: IAutoMovieHumanLimbGoal = goal(seconds, r);
          // The arms join the roll and end it on its own goals; the action
          // that follows takes them from there.
          const w: number = clock.progress("start", "joined", seconds);
          const placed: IAutoMovieHumanLimbGoal =
            w >= 1
              ? target
              : {
                  point: Vector3.lerp(from.point, target.point, w),
                  bend: Vector3.lerp(from.bend, target.bend, w),
                  ...(from.rotation === undefined
                    ? { rotation: target.rotation }
                    : {
                        rotation: Quaternion.slerp(
                          from.rotation,
                          target.rotation!,
                          w,
                        ),
                      }),
                };
          return {
            ...posture,
            joints: { ...posture.joints, ...open },
            limbs: { ...posture.limbs, [limb]: placed },
          };
        },
      };
    };

    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: "rightFoot",
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
        primitives: [arm("left"), arm("right")],
      });
    return {
      ...composed,
      prepare: (): void => {
        roll = undefined;
        build();
      },
    };
  }
}
