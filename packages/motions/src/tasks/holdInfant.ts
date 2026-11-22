import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHoldInfant,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";

/** Seconds the arms take to bring the infant into the hold: provisional, an unhurried careful move. */
const SETTLE: number = 1;

/** The world up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** How far a back pat lifts the palm off the back between pats, metres: provisional. */
const PAT: number = 0.03;

/**
 * Hold a taken-up infant (`IAutoMovieMotionHumanHoldInfant`). The infant is
 * rigid in the holding hand from its pick-up (`AutoMovieMotionHumanHeld`),
 * so each hold is a world pose of the infant in the body's frame, read from
 * the upper chest where the body entered, and the holding hand follows from
 * it. In the cradle and the feed the infant lies across the front, face up,
 * its head toward the holding side, and the holding arm's elbow is placed
 * under its nape, so the forearm carries the head; in the cradle the other
 * hand lies under its back, in the feed it holds the bottle's teat at the
 * infant's mouth with the base above, tilted so the milk runs down. In the
 * shoulder hold the infant stands against the chest, its head by the
 * holding side's shoulder, and the other palm pats its back `pats` times a
 * second, lifting off between. A rocking sways the infant sideways. Both
 * arms are one course (`courseArmGoal`), the two hands on the infant its
 * grasp.
 *
 * Events: `held` once the hold is taken, `pat<k>` at each pat, `relax`.
 *
 * Not yet: carrying while walking (the hold as an overlay on a walk) and a
 * handover, which `handOver` owns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frames, each hold, the head support, the pats, the rocking and the events.
 * @evidence contracts/development/design.md#principled-representation World poses of the held infant in the body's frame; the holding hand follows rigidly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The infant's and the bottle's sites are their own contacts.
 */
export namespace holdInfant {
  /** The action's key. */
  export const name: AutoMovieMotionHumanActionKey = "holdInfant";

  /** The hold may be left at its end. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  };

  /** Plan the hold. */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHoldInfant.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const seconds: number = params.seconds ?? 4;
    HumanBound.within("seconds", seconds, 0.5, 600);
    const side: AutoMovieHumanSide =
      params.hand ??
      (entry.holds.left === params.prop && entry.holds.right !== params.prop
        ? "left"
        : "right");
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const yaw: number = entry.posture.yaw;
    const axes: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
      v: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, v);
    const forward: IAutoMovieVector3 = axes({ x: 0, y: 0, z: 1 });
    const toward: IAutoMovieVector3 = axes({
      x: side === "left" ? 1 : -1,
      y: 0,
      z: 0,
    });
    const infant: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      side,
      params.prop,
    );
    const bottle: IAutoMovieMotionHumanHeld.IHeld | undefined =
      params.hold === "feed"
        ? params.bottle === undefined
          ? refuse("feed", "a feed holds a bottle in the other hand")
          : AutoMovieMotionHumanHeld.of(context, other, params.bottle)
        : undefined;
    const site: (
      held: IAutoMovieMotionHumanHeld.IHeld,
      id: string,
    ) => IAutoMovieVector3 = (
      held: IAutoMovieMotionHumanHeld.IHeld,
      id: string,
    ): IAutoMovieVector3 =>
      held.affordances.find((a): boolean => a.id === id)?.frame.translation ??
      refuse(id, `${held.prop} declares no ${id}`);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>(["chest", `${side}UpperArm`]),
    );
    const chest: IAutoMovieVector3 = bones.get("chest")!.worldPosition;
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;

    // The infant's pose in the hold: its seat's place, its body's line
    // (seat to head) and its face's facing.
    const pose: IInfantPose =
      params.hold === "shoulder"
        ? {
            seat: Vector3.add(
              Vector3.add(chest, Vector3.scale(forward, 0.12)),
              Vector3.add(
                Vector3.scale(UP, -0.22),
                Vector3.scale(toward, 0.08),
              ),
            ),
            line: UP,
            face: Vector3.scale(forward, -1),
          }
        : {
            seat: Vector3.add(
              Vector3.add(chest, Vector3.scale(forward, 0.28)),
              Vector3.add(
                Vector3.scale(UP, params.hold === "feed" ? -0.2 : -0.24),
                Vector3.scale(toward, -0.12),
              ),
            ),
            line: Vector3.normalize(
              Vector3.add(
                toward,
                Vector3.scale(UP, params.hold === "feed" ? 0.5 : 0.15),
              ),
            ),
            face: Vector3.normalize(
              Vector3.add(UP, Vector3.scale(forward, -0.25)),
            ),
          };
    const sway: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 =>
      params.rock === undefined
        ? { x: 0, y: 0, z: 0 }
        : Vector3.scale(
            toward,
            params.rock.amplitude *
              Math.sin(
                2 * Math.PI * params.rock.frequency * Math.max(0, t - SETTLE),
              ),
          );
    const placed: (t: number) => IAutoMovieRigidTransform = (
      t: number,
    ): IAutoMovieRigidTransform => {
      const rotation: IAutoMovieQuaternion = basis(pose.line, pose.face);
      return { position: Vector3.add(pose.seat, sway(t)), rotation };
    };
    const world: (
      frame: IAutoMovieRigidTransform,
      local: IAutoMovieVector3,
    ) => IAutoMovieVector3 = (
      frame: IAutoMovieRigidTransform,
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local),
      );

    const duration: number = SETTLE + seconds;
    const rate: number = params.pats ?? 1.5;
    const events: IAutoMovieMotionEvent[] = [
      { name: "held", share: SETTLE / duration },
    ];
    if (params.hold === "shoulder")
      for (let k: number = 1; SETTLE + k / rate <= duration; k++)
        events.push({ name: `pat${k}`, share: (SETTLE + k / rate) / duration });
    events.push({ name: "relax", share: 1 });

    const posture: (time: number) => IAutoMovieMotionHumanPosture = (
      time: number,
    ): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const frame: IAutoMovieRigidTransform = placed(t);
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
        ...entry.posture.limbs,
      };
      // The holding hand carries the infant as it was taken up.
      const hand: IAutoMovieQuaternion = Quaternion.multiply(
        frame.rotation,
        Quaternion.inverse(infant.frame.rotation),
      );
      const socket: IAutoMovieVector3 = Vector3.subtract(
        frame.position,
        Quaternion.rotateVector(hand, infant.frame.position),
      );
      const grip: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
        body,
        side,
        "grip",
      );
      const nape: IAutoMovieVector3 = world(frame, site(infant, "nape"));
      limbs[`${side}Arm`] = {
        point: Vector3.subtract(
          socket,
          Quaternion.rotateVector(hand, grip.point),
        ),
        rotation: hand,
        contact: grip.point,
        ...(params.hold === "shoulder"
          ? {
              bend: Vector3.add(Vector3.lerp(socket, shoulder, 0.5), {
                x: 0,
                y: -0.15,
                z: 0,
              }),
            }
          : { bend: nape, elbow: "placed" as const }),
      };
      limbs[`${other}Arm`] =
        bottle !== undefined
          ? teat(
              body,
              other,
              bottle,
              world(frame, site(infant, "mouth")),
              frame,
            )
          : palm(
              body,
              other,
              world(frame, site(infant, "back")),
              Quaternion.rotateVector(frame.rotation, { x: 0, y: 0, z: -1 }),
              params.hold === "shoulder"
                ? PAT *
                    (0.5 -
                      0.5 *
                        Math.cos(2 * Math.PI * rate * Math.max(0, t - SETTLE)))
                : 0,
            );
      return { ...entry.posture, limbs };
    };
    const plan: IAutoMovieMotionHumanActionPlan = {
      duration,
      events,
      contacts: [],
      posture,
    };
    return courseArmGoal({
      body,
      plan,
      side,
      rest: AutoMovieMotionHumanArm.angles(entry.pose, side),
      ...(bottle === undefined ? { grasp: ["hand"] as const } : {}),
      with: [
        {
          side: other,
          rest: AutoMovieMotionHumanArm.angles(entry.pose, other),
          ...(bottle === undefined ? { grasp: ["hand"] as const } : {}),
        },
      ],
      span: { start: 0, ready: SETTLE, relax: duration, end: duration },
    });
  }

  /** An infant's pose in a hold. */
  interface IInfantPose {
    /** The seat's place, world metres. */
    seat: IAutoMovieVector3;

    /** The unit line from the seat to the head. */
    line: IAutoMovieVector3;

    /** The unit way the face faces. */
    face: IAutoMovieVector3;
  }

  /** The rotation that takes the infant's `+Y` to `line` and its `+Z` toward `face`. */
  function basis(
    line: IAutoMovieVector3,
    face: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    return HumanHand.align(
      { normal: { x: 0, y: 1, z: 0 }, forward: { x: 0, y: 0, z: 1 } },
      {
        normal: line,
        forward: Vector3.normalize(
          Vector3.subtract(face, Vector3.scale(line, Vector3.dot(face, line))),
        ),
      },
    );
  }

  /** A palm laid on a site facing `normal`, off it by `lift`. */
  function palm(
    body: IAutoMovieMotionHumanActionContext["body"],
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    lift: number,
  ): IAutoMovieHumanLimbGoal {
    const frame: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
      body,
      side,
      "palm",
    );
    const rotation: IAutoMovieQuaternion = HumanHand.align(frame, {
      normal: Vector3.scale(normal, -1),
      forward: UP,
    });
    const at: IAutoMovieVector3 = Vector3.add(
      point,
      Vector3.scale(normal, lift),
    );
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      at,
      Quaternion.rotateVector(rotation, frame.point),
    );
    return {
      point: wrist,
      rotation,
      contact: frame.point,
      bend: Vector3.add(wrist, { x: 0, y: -0.2, z: 0 }),
    };
  }

  /** The bottle's teat at the mouth, its base above toward the feet, from the other hand. */
  function teat(
    body: IAutoMovieMotionHumanActionContext["body"],
    side: AutoMovieHumanSide,
    bottle: IAutoMovieMotionHumanHeld.IHeld,
    mouth: IAutoMovieVector3,
    infant: IAutoMovieRigidTransform,
  ): IAutoMovieHumanLimbGoal {
    const tip: IAutoMovieVector3 =
      bottle.affordances.find((a): boolean => a.id === "teat")?.frame
        .translation ?? refuse("bottle", `${bottle.prop} declares no teat`);
    // The bottle's line from its base to its teat points into the mouth,
    // from above the face and toward the feet.
    const down: IAutoMovieVector3 = Vector3.normalize(
      Vector3.add(
        Quaternion.rotateVector(infant.rotation, { x: 0, y: 0, z: -0.8 }),
        Quaternion.rotateVector(infant.rotation, { x: 0, y: 0.6, z: 0 }),
      ),
    );
    const rotation: IAutoMovieQuaternion = basis(down, UP);
    const position: IAutoMovieVector3 = Vector3.subtract(
      mouth,
      Quaternion.rotateVector(rotation, tip),
    );
    const hand: IAutoMovieQuaternion = Quaternion.multiply(
      rotation,
      Quaternion.inverse(bottle.frame.rotation),
    );
    const socket: IAutoMovieVector3 = Vector3.subtract(
      position,
      Quaternion.rotateVector(hand, bottle.frame.position),
    );
    const grip: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
      body,
      side,
      "grip",
    );
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      socket,
      Quaternion.rotateVector(hand, grip.point),
    );
    return {
      point: wrist,
      rotation: hand,
      contact: grip.point,
      bend: Vector3.add(wrist, { x: 0, y: -0.2, z: 0 }),
    };
  }

  /** A refusal for a missing input or site. */
  function refuse(axis: string, reason: string): never {
    throw new HumanRefusal({
      kind: "affordance",
      axis,
      value: null,
      reason,
      fix: "give the hold the props and sites it reads",
    });
  }
}
