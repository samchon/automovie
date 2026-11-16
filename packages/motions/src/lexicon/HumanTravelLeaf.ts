import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { bendLower } from "../everyday/bendLower";
import { pickUpPosture } from "../handling/pickUpPosture";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanTravelLeafWalk } from "./HumanTravelLeafWalk";

/**
 * Opening a door by its handle and holding it: the hand reaches the
 * handle, closes on it and goes with it while the leaf swings, the person
 * standing, and walking round with the leaf when the arm alone would lose
 * the handle. Register `HumanTravelLeaf.openDoor` to use it.
 *
 * The leaf's swing is the scene's: the door is a prop whose handle moves
 * within it (`IHumanProp.point`, as `HumanObject.prop` gives an archetype's
 * articulated contact), and the hand follows the handle at every instant.
 * The hand turns to the handle's frame and closes on the door's own
 * colliders (`HumanMountRider.hold`, `HumanMountRider.closed`), reaching it
 * over `TAKE` seconds on the minimum-jerk profile (Flash and Hogan 1985).
 * A handle the standing arm does not reach as the hand takes it, such as a
 * car door's below the shoulder, is taken leaning toward it, the body
 * lowered as a pick up lowers it. While the arm's own fit keeps the wrist
 * within `HOLD` of the hold from where the person stands the feet stay
 * there; otherwise the person walks with the leaf, backward and round it,
 * facing it, keeping the place relative to it the handle was taken from,
 * at the handle's pace (`HumanTravelLeafWalk`). A swing the hand still
 * loses, faster or farther than the person can walk with it, is refused as
 * a `reach` refusal on `handle` naming the largest swing followed. First
 * pass: the closure is the one at the instant the hand arrives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who moves the leaf, how the hand follows it, when the person leans and walks, timing, refusal and closure limitation; the law comment states each hold check's exact-FK scope and reuse of a completed standing support decision.
 * @evidence contracts/development/design.md#principled-representation A law record over the stand, with one arm's goal on a prop's moving point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law, its parameters and its named constants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No door is special-cased: the handle, its frame, its width and the leaf's colliders are the prop's own.
 */
export namespace HumanTravelLeaf {
  /**
   * Parameters of opening a scene door by one of its moving handle points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its scene identifier, timebase or hand default; seconds includes the reach and must exceed TAKE.
   * @evidence contracts/development/design.md#principled-representation References the performance's actual prop and point by identifier, with action duration in seconds and an optional closed side union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The four fields are all consumed by openDoor; handle geometry and motion remain with the scene prop rather than this parameter record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No door, handle path or hand pose is built into the parameters; the existing duration bound rejects a hold that ends before the reach finishes.
   */
  export interface IParams {
    /** The door: its prop's subject id in the performance. */
    door: string;

    /** The handle taken: one of the prop's points, such as a door's `pull` or `push`. */
    handle: string;

    /** Seconds the hand holds the handle, from the start of the reach; more than the reach's `TAKE`. */
    seconds: number & tags.ExclusiveMinimum<0.6> & HumanUnit<"s">;

    /** The hand; the right when absent. */
    side?: "left" | "right";
  }

  /** How far the arm's fit may leave the wrist from where the hold asks it, metres (the campaign's 5 mm contact bound). */
  export const HOLD: number = 0.005;

  /** Seconds the hand takes to reach the handle (provisional). */
  export const TAKE: number = 0.6;

  /** The most of the arm's length, shoulder to wrist, the handle may be from the shoulder (provisional: the elbow is not locked straight). */
  export const REACH: number = 0.97;

  /**
   * Open a door by its handle, standing or following its leaf. Each holds
   * check lends one lazy exact-FK reader through its actual posture fit and
   * displayed wrist read, then releases it synchronously. Every distinct
   * hold check performs its actual fit. A successful complete standing pass
   * settles that plan's support decision without repeating the same pass;
   * no handle sample or fitted wrist is shared across differing inputs.
   */
  export const openDoor: IHumanActionLaw<IParams> = {
    name: "openDoor",
    interrupts: {
      walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    },
    yields: ["head"],
    plan: (context: IHumanActionContext<IParams>): IHumanActionPlan => {
      const body: IHumanBody = context.body;
      const side: "left" | "right" = context.params.side ?? "right";
      const seconds: number = context.params.seconds;
      if (!(seconds > TAKE))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "seconds",
          value: seconds,
          feasible: {
            kind: "range",
            minimum: TAKE,
            maximum: null,
            unit: "s",
            open: "minimum",
          },
          reason: `a door is held after the hand has reached it, which takes ${TAKE} s`,
          fix: "hold the door longer",
        });
      const door: IHumanActionContext.IProp = context.prop(context.params.door);
      const id: string = context.params.handle;
      const rest:
        | { point: IAutoMovieVector3; normal: IAutoMovieVector3 }
        | undefined = door.prop.points[id];
      if (rest === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "handle",
          value: id,
          feasible: {
            kind: "alternatives",
            values: Object.keys(door.prop.points),
          },
          reason: `${context.params.door} has no point ${id} to take hold of`,
          fix: "name one of the door's points",
        });
      const affordance: IAutoMovieAffordance | undefined =
        door.prop.affordances?.find(
          (a: IAutoMovieAffordance): boolean => a.id === id,
        );

      // The handle at a film second: the moving point the door knows, or its rest point carried by the door's frame; its axis is its rest frame's +X carried by the door's frame.
      const handle = (
        film: number,
      ): Parameters<typeof HumanMountRider.hold>[3] => {
        const frame: IHumanProp.IFrame = door.frame(film);
        const moved:
          | { point: IAutoMovieVector3; normal: IAutoMovieVector3 }
          | undefined = door.prop.point?.(id, film);
        const turn: IAutoMovieQuaternion | undefined =
          affordance?.frame.rotation;
        return {
          point:
            moved?.point ??
            Vector3.add(
              frame.position,
              Quaternion.rotateVector(frame.rotation, rest.point),
            ),
          normal:
            moved?.normal ??
            Quaternion.rotateVector(frame.rotation, rest.normal),
          ...(turn === undefined
            ? {}
            : {
                axis: Quaternion.rotateVector(
                  Quaternion.multiply(frame.rotation, turn),
                  { x: 1, y: 0, z: 0 },
                ),
              }),
          ...(affordance?.aperture === undefined
            ? {}
            : { radius: affordance.aperture / 2 }),
        };
      };
      // The body stands while it opens, its sway signed in the opening
      // hand's frame, so a left-handed opening mirrors a right one.
      const standing: IHumanActionPlan = stand.plan(
        { ...context, params: { seconds } },
        side,
      );
      const start: IHumanPosture = standing.posture(0);

      // The hand keeps the side of the handle's axis it took it from, the
      // side the body faced as the hand arrived, however the body turns with
      // the leaf after.
      const taken: Parameters<typeof HumanMountRider.hold>[3] = handle(
        context.start + TAKE,
      );
      const facing: IAutoMovieVector3 = Quaternion.rotateVector(
        resolveHumanPosture.heading(start),
        { x: 0, y: 0, z: 1 },
      );
      const across: 1 | -1 =
        taken.axis !== undefined &&
        Vector3.dot(Vector3.cross(taken.axis, taken.normal), facing) < 0
          ? -1
          : 1;
      const grip = (
        film: number,
      ): Parameters<typeof HumanMountRider.hold>[3] => ({
        ...handle(film),
        across,
      });

      // The wrist must stay within the arm's reach of the shoulder.
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture(body, { ...start, limbs: {} }),
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`]),
      );
      const shoulder: IAutoMovieVector3 = bones.get(
        `${side}UpperArm`,
      )!.worldPosition;
      const arm: number =
        Vector3.length(
          Vector3.subtract(
            bones.get(`${side}LowerArm`)!.worldPosition,
            shoulder,
          ),
        ) +
        Vector3.length(
          Vector3.subtract(
            bones.get(`${side}Hand`)!.worldPosition,
            bones.get(`${side}LowerArm`)!.worldPosition,
          ),
        );
      // Where the hold puts the wrist on the handle at a second.
      const wristAt: (t: number, posture: IHumanPosture, target?: Parameters<typeof HumanMountRider.hold>[3]) => IAutoMovieVector3 = (
        t: number,
        posture: IHumanPosture,
        target: Parameters<typeof HumanMountRider.hold>[3] = grip(context.start + t),
      ): IAutoMovieVector3 =>
        HumanMountRider.hold(
          body,
          side,
          posture,
          target,
          1,
          {},
        ).arm.point;

      // A handle the standing arm does not reach as the hand takes it, such
      // as a car door's below the shoulder, is taken leaning toward it, the
      // body lowered over the reach as a pick up lowers it.
      const taking: IAutoMovieVector3 = wristAt(TAKE, start);
      const lowered: pickUpPosture.IStance | null =
        Vector3.length(Vector3.subtract(taking, shoulder)) <=
        REACH * arm
          ? null
          : // Lowered until the wrist the hold asks is within the bend's near
            // full extension of the arm (`bendLower.REACH`), the reach the
            // bend lowers a palm to.
            pickUpPosture.lowered(
              context,
              side,
              taking,
              bendLower.REACH * arm,
            );
      const base: (t: number) => IHumanPosture = (t: number): IHumanPosture =>
        lowered === null
          ? standing.posture(t)
          : lowered.at(minimumJerk(Math.min(1, t / TAKE)).s);

      // Whether the arm keeps the hand on the handle from a posture: its own
      // fit shows the wrist within `HOLD` of where the hold asks it.
      const handBone: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
      const holds: (posture: IHumanPosture, t: number) => boolean = (posture: IHumanPosture, t: number): boolean => {
        const goal: IHumanPosture.IGoal = HumanMountRider.hold(
          body,
          side,
          posture,
          grip(context.start + t),
          1,
          {},
        ).arm;
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution();
        const wrist: IAutoMovieVector3 = poseBones(
          body,
          resolveHumanPosture.seeded(
            body,
            { ...posture, limbs: { [`${side}Arm`]: goal } },
            undefined,
            {},
            resolution,
          ).pose,
          resolution(),
          handBone,
        ).get(`${side}Hand`)!.worldPosition;
        return Vector3.length(Vector3.subtract(wrist, goal.point)) <= HOLD;
      };
      const readings: number[] = [];
      for (let t: number = TAKE; t <= seconds + 1e-9; t += 1 / 24)
        readings.push(t);

      // Standing while the arm holds the handle from there throughout;
      // otherwise walking with the leaf (`HumanTravelLeafWalk`).
      const holdsStanding: boolean = readings.every(
        (t: number): boolean => holds(base(t), t),
      );
      const walked: IHumanActionPlan | null = holdsStanding
        ? null
        : HumanTravelLeafWalk.plan({
            context,
            seconds,
            take: TAKE,
            handle: (
              t: number,
            ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
              const target: Parameters<typeof HumanMountRider.hold>[3] = grip(context.start + t);
              return { point: wristAt(t, base(t), target), normal: target.normal };
            },
          });
      const shown: (t: number, channels?: Parameters<IHumanActionPlan["posture"]>[1]) => IHumanPosture = (t: number, channels?: Parameters<IHumanActionPlan["posture"]>[1]): IHumanPosture => {
        if (walked === null) return base(t);
        const walking: IHumanPosture = walked.posture(
          Math.min(walked.duration, t),
          lowered === null ? channels : undefined,
        );
        return lowered === null
          ? walking
          : lowered.lower(walking, minimumJerk(Math.min(1, t / TAKE)).s);
      };

      // A swing the walk cannot follow is refused with the largest followed.
      const heading: (v: IAutoMovieVector3) => number = (v: IAutoMovieVector3): number =>
        (Math.atan2(v.x, v.z) * 180) / Math.PI;
      const takenHeading: number = heading(taken.normal);
      const swing: (t: number) => number = (t: number): number =>
        Math.abs(
          ((((heading(grip(context.start + t).normal) -
            takenHeading) %
            360) +
            540) %
            360) -
            180,
        );
      const lost: number | undefined = holdsStanding ? undefined : readings.find(
        (t: number): boolean => !holds(shown(t), t),
      );
      if (lost !== undefined) {
        const followed: number = swing(Math.max(TAKE, lost - 1 / 24));
        throw new HumanRefusal({
          kind: "reach",
          axis: "handle",
          value: swing(lost),
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: followed,
            unit: "degrees",
          },
          reason: `the hand loses the handle at ${lost.toFixed(2)} s, the door swung ${swing(lost).toFixed(1)} degrees, ${walked === null ? "where the leaf does not turn" : "faster or farther than the person can walk round with it"}; the largest swing followed is ${followed.toFixed(1)} degrees`,
          fix: `open the door at most ${followed.toFixed(1)} degrees, or swing it more slowly`,
        });
      }
      const closed: IHumanPosture["joints"] =
        (door.prop.shapes ?? []).length === 0
          ? {}
          : HumanMountRider.closed(
              body,
              side,
              shown(TAKE),
              grip(context.start + TAKE),
              door.prop.shapes!,
              door.frame(context.start + TAKE),
            );
      // The walk's plants, read on the action's clock.
      const plants: IHumanContactWindow[] =
        walked === null
          ? standing.contacts
          : walked.contacts
              .filter(
                (c: IHumanContactWindow): boolean =>
                  c.part === "leftFoot" || c.part === "rightFoot",
              )
              .map(
                (c: IHumanContactWindow): IHumanContactWindow => ({
                  ...c,
                  from: Math.min(1, (c.from * walked.duration) / seconds),
                  to: Math.min(1, (c.to * walked.duration) / seconds),
                }),
              )
              .filter((c: IHumanContactWindow): boolean => c.to > c.from);
      const contacts: IHumanContactWindow[] = [
        ...plants,
        // The hand bears on the door, which the scene moves; a `grip` would make the door ride the hand instead.
        {
          part: `${side}Hand`,
          kind: "plant",
          from: TAKE / seconds,
          to: 1,
          support: { kind: "prop", subject: context.params.door },
        },
      ];
      return {
        ...standing,
        events: [{ name: "taken", share: TAKE / seconds }],
        contacts,
        posture: (t: number, channels?: Parameters<IHumanActionPlan["posture"]>[1]): IHumanPosture => {
          const at: number = Math.min(seconds, Math.max(0, t));
          const heldDemand: boolean = channels === undefined || channels.includes(`${side}Arm`) || channels.includes(`${side}Hand`);
          const posture: IHumanPosture = shown(at, heldDemand ? undefined : channels);
          if (!heldDemand) return posture;
          const held: ReturnType<typeof HumanMountRider.hold> =
            HumanMountRider.hold(
              body,
              side,
              posture,
              grip(context.start + at),
              minimumJerk(Math.min(1, at / TAKE)).s,
              closed,
            );
          return {
            ...posture,
            joints: { ...posture.joints, ...held.fingers },
            limbs: { ...posture.limbs, [`${side}Arm`]: held.arm },
          };
        },
      };
    },
  };
}
