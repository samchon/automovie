import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";

/**
 * Opening a door by its handle and holding it: the hand reaches the
 * handle, closes on it and goes with it while the leaf swings, the feet
 * standing where they stood. Register `HumanTravelLeaf.openDoor` to use it.
 *
 * The leaf's swing is the scene's: the door is a prop whose handle moves
 * within it (`IHumanProp.point`, as `HumanObject.prop` gives an archetype's
 * articulated contact), and the hand follows the handle at every instant.
 * The hand turns to the handle's frame and closes on the door's own
 * colliders (`HumanMountRider.hold`, `HumanMountRider.closed`), reaching it
 * over `TAKE` seconds on the minimum-jerk profile (Flash and Hogan 1985).
 * A handle that travels beyond `REACH` of the arm's length from the
 * shoulder at any of `SAMPLES` instants is refused as a `reach` refusal on
 * `handle`, with the farthest share of the arm it would need. First pass:
 * the body does not step or lean with the leaf, and the closure is the
 * one at the instant the hand arrives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who moves the leaf, how the hand follows it, the timing and its source, the refusal and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law record over the stand, with one arm's goal on a prop's moving point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law, its parameters and its named constants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No door is special-cased: the handle, its frame, its width and the leaf's colliders are the prop's own.
 */
export namespace HumanTravelLeaf {
  /** Parameters of opening a door. */
  export interface IParams {
    /** The door: its prop's subject id in the performance. */
    door: string;

    /** The handle taken: one of the prop's points, such as a door's `pull` or `push`. */
    handle: string;

    /** Seconds the hand holds the handle, from the start of the reach; more than the reach's `TAKE`. */
    seconds: number & tags.ExclusiveMinimum<0.6>;

    /** The hand; the right when absent. */
    side?: "left" | "right";
  }

  /** Seconds the hand takes to reach the handle (provisional). */
  export const TAKE: number = 0.6;

  /** The most of the arm's length, shoulder to wrist, the handle may be from the shoulder (provisional: the elbow is not locked straight). */
  export const REACH: number = 0.97;

  /** Instants of the hold at which the handle's reach is checked. */
  export const SAMPLES: number = 24;

  /** Open a door by its handle, standing. */
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
      const rest: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } | undefined =
        door.prop.points[id];
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
      const grip = (
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
      const standing: IHumanActionPlan = stand.plan({
        ...context,
        params: { seconds },
      });

      // The handle must stay within the arm's reach of the standing shoulder.
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture(body, { ...standing.posture(0), limbs: {} }),
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
      let farthest: number = 0;
      for (let k: number = 0; k <= SAMPLES; ++k)
        farthest = Math.max(
          farthest,
          Vector3.length(
            Vector3.subtract(
              grip(context.start + TAKE + (k / SAMPLES) * (seconds - TAKE))
                .point,
              shoulder,
            ),
          ) / arm,
        );
      if (farthest > REACH)
        throw new HumanRefusal({
          kind: "reach",
          axis: "handle",
          value: farthest,
          feasible: { kind: "range", minimum: 0, maximum: REACH, unit: "" },
          reason: `the handle goes ${farthest.toFixed(2)} of the arm's length from the shoulder as the door swings, beyond the ${REACH} an arm reaches without locking`,
          fix: "stand nearer the handle, or open the door less",
        });
      const closed: IHumanPosture["joints"] =
        (door.prop.shapes ?? []).length === 0
          ? {}
          : HumanMountRider.closed(
              body,
              side,
              standing.posture(TAKE),
              grip(context.start + TAKE),
              door.prop.shapes!,
              door.frame(context.start + TAKE),
            );
      const contacts: IHumanContactWindow[] = [
        ...standing.contacts,
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
        posture: (t: number): IHumanPosture => {
          const at: number = Math.min(seconds, Math.max(0, t));
          const posture: IHumanPosture = standing.posture(at);
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
