import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A forward or backward roll on the floor: the body crouches into a tuck
 * over its feet, rolls once round over its back as a ball rolls, without
 * flight, and rises from the tuck on its feet where the roll has carried it.
 *
 * The tuck is a set of joint angles (`TUCK`, provisional: the trunk and the
 * neck flexed, the hips and the knees folded, the arms round the shins).
 * Crouching, the joints go from the entry's into the tuck while the ankles
 * stay where they stood. Rolling, the tucked body turns once about its
 * lateral axis (forward or back), its root placed each second so its lowest
 * joint centre lies on the floor at the ankles' standing height, and carried
 * along by rolling without slipping: the root advances by the turn times
 * its height above that lowest point, integrated at plan time. Rising, the
 * crouch is played back from where the roll ends.
 *
 * Contact windows: the feet plant through the crouch and the rise, the back
 * lies on the floor over the roll's middle and the seat at its end (a
 * forward roll) or start (a backward one).
 *
 * First pass: the hands do not plant on the floor at the start (the arms
 * hold the shins), the head is not kept off the floor by the hands in a
 * backward roll, and the floor's contact is read on joint centres, not the
 * skin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three phases, how the root is placed and carried, the contact windows and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A rigid tucked body rolling without slipping on the floor: the root's place is a function of the turn read from the body itself.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the tuck, three constants, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No flight is faked: the body touches the floor at every second.
 */
export namespace roll {
  /** The action's name. */
  export const name: HumanActionKey = "roll";

  /** Cancel table: a roll is left once it stands. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: ["risen", 1], kind: "inertialize", entry: 0 }],
  };

  /** The tuck's joint angles, clinical degrees (provisional). */
  export const TUCK: Readonly<
    Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
  > = {
    spine: [30, 0, 0],
    chest: [30, 0, 0],
    neck: [35, 0, 0],
    head: [20, 0, 0],
    leftUpperLeg: [125, 0, 0],
    rightUpperLeg: [125, 0, 0],
    leftLowerLeg: [140, 0, 0],
    rightLowerLeg: [140, 0, 0],
    leftUpperArm: [70, 20, 0],
    rightUpperArm: [70, 20, 0],
    leftLowerArm: [60, 0, 0],
    rightLowerArm: [60, 0, 0],
  };

  /** Seconds to crouch into the tuck, and to rise from it (provisional). */
  export const CROUCH: number = 0.7;

  /** Seconds the turn takes (provisional). */
  export const TURN: number = 1.1;

  /** Samples of the turn the root's travel is integrated over. */
  export const SAMPLES: number = 72;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The way the body turns.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The value the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union.
   */
  export interface IParams {
    /** Which way the body turns; `forward` when absent. */
    direction?: "forward" | "backward";
  }

  /**
   * Plan a roll.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the entry is not standing on both feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The crouch keeps the ankles where they stood by placing the root against the ankles the posture puts; the roll places it against the lowest joint centre and carries it by the integral of the turn times its height above that point, the speed of a ball rolling without slipping.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The tucked body's table, the three phases, the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A body not on both feet is refused; the travel is integrated, not guessed.
   * @evidence contracts/development/implementation.md#efficient-algorithms `SAMPLES` posture resolves at plan time and one per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the posture resolver's heading and the entry's feet.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the table.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body = context.body;
    const sign: number = context.params.direction === "backward" ? -1 : 1;
    const feet = context.entry.feet;
    if (!(feet.left.planted && feet.right.planted))
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: "not on both feet",
        feasible: { kind: "alternatives", values: ["standing"] },
        reason: "a roll crouches from both feet on the floor",
        fix: "stand before the roll",
      });
    const entry: IHumanPosture = context.entry.posture;
    const ankles: IAutoMovieVector3 = {
      x: (feet.left.ankle.x + feet.right.ankle.x) / 2,
      y: (feet.left.ankle.y + feet.right.ankle.y) / 2,
      z: (feet.left.ankle.z + feet.right.ankle.z) / 2,
    };
    const floor: number = ankles.y;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: sign },
    );

    // A posture of the joints blended toward the tuck, turned, at the origin.
    const joints = (share: number): IHumanPosture["joints"] => {
      const out: IHumanPosture["joints"] = { ...entry.joints };
      for (const [bone, angles] of Object.entries(TUCK) as [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ][]) {
        const was: readonly [number, number, number] = entry.joints[bone] ?? [
          0, 0, 0,
        ];
        out[bone] = [
          was[0] + (angles[0] - was[0]) * share,
          was[1] + (angles[1] - was[1]) * share,
          was[2] + (angles[2] - was[2]) * share,
        ];
      }
      return out;
    };
    const posed = (share: number, turn: number): IHumanPosture => ({
      ...entry,
      root: { x: 0, y: 0, z: 0 },
      pitch: entry.pitch + sign * turn,
      joints: joints(share),
      limbs: {},
    });
    const centres = (posture: IHumanPosture): IAutoMovieVector3[] =>
      [...poseBones(body, resolveHumanPosture(body, posture)).values()].map(
        (b) => b.worldPosition,
      );
    const ankleMid = (posture: IHumanPosture): IAutoMovieVector3 => {
      const bones = poseBones(body, resolveHumanPosture(body, posture));
      const l: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
      const r: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
      return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2, z: (l.z + r.z) / 2 };
    };

    // The crouch: the ankles kept where they stood.
    const crouched = (share: number, at: IAutoMovieVector3): IHumanPosture => {
      const posture: IHumanPosture = posed(share, 0);
      const local: IAutoMovieVector3 = ankleMid(posture);
      return {
        ...posture,
        root: { x: at.x - local.x, y: at.y - local.y, z: at.z - local.z },
      };
    };

    // The roll's table: the root's height above the lowest centre and its
    // travel along the floor, both by the turn.
    const heights: number[] = [];
    for (let k: number = 0; k <= SAMPLES; k++) {
      const lowest: number = Math.min(
        ...centres(posed(1, (360 * k) / SAMPLES)).map(
          (p: IAutoMovieVector3): number => p.y,
        ),
      );
      heights.push(-lowest);
    }
    const travels: number[] = [0];
    const step: number = (2 * Math.PI) / SAMPLES;
    for (let k: number = 1; k <= SAMPLES; k++)
      travels.push(travels[k - 1]! + ((heights[k - 1]! + heights[k]!) / 2) * step);
    const table = (values: number[], turn: number): number => {
      const at: number = (turn / 360) * SAMPLES;
      const k: number = Math.min(SAMPLES - 1, Math.floor(at));
      return values[k]! + (values[k + 1]! - values[k]!) * (at - k);
    };
    const start: IAutoMovieVector3 = crouched(1, ankles).root;
    const rolled = (turn: number): IHumanPosture => {
      const posture: IHumanPosture = posed(1, turn);
      const along: number = table(travels, turn);
      return {
        ...posture,
        root: {
          x: start.x + forward.x * along,
          y: floor + table(heights, turn) - heights[0]! + start.y - floor,
          z: start.z + forward.z * along,
        },
      };
    };
    const end: IAutoMovieVector3 = ((): IAutoMovieVector3 => {
      const local: IAutoMovieVector3 = ankleMid(posed(1, 0));
      const root: IAutoMovieVector3 = rolled(360).root;
      return { x: root.x + local.x, y: root.y + local.y, z: root.z + local.z };
    })();

    const duration: number = 2 * CROUCH + TURN;
    const share = (seconds: number): number => seconds / duration;
    const contacts: IHumanContactWindow[] = [
      ...(["leftFoot", "rightFoot"] as const).flatMap(
        (part: "leftFoot" | "rightFoot"): IHumanContactWindow[] => [
          {
            part,
            kind: "plant",
            from: 0,
            to: share(CROUCH),
            support: { kind: "ground" },
          },
          {
            part,
            kind: "plant",
            from: share(CROUCH + TURN),
            to: 1,
            support: { kind: "ground" },
          },
        ],
      ),
      {
        part: "back",
        kind: "lie",
        from: share(CROUCH + 0.3 * TURN),
        to: share(CROUCH + 0.7 * TURN),
        support: { kind: "ground" },
      },
      {
        part: "seat",
        kind: "lie",
        from: share(CROUCH + (sign > 0 ? 0.7 : 0.1) * TURN),
        to: share(CROUCH + (sign > 0 ? 0.9 : 0.3) * TURN),
        support: { kind: "ground" },
      },
    ];
    return {
      duration,
      events: [
        { name: "tucked", share: share(CROUCH) },
        { name: "over", share: share(CROUCH + TURN / 2) },
        { name: "rolled", share: share(CROUCH + TURN) },
        { name: "risen", share: 1 },
      ],
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= CROUCH)
          return crouched(minimumJerk(t / CROUCH).s, ankles);
        if (t <= CROUCH + TURN)
          return rolled(360 * minimumJerk((t - CROUCH) / TURN).s);
        return crouched(
          1 - minimumJerk((t - CROUCH - TURN) / CROUCH).s,
          end,
        );
      },
    };
  }
}
