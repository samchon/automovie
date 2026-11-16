import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { pickUp } from "./pickUp";
import { putDownTarget } from "./putDownTarget";

/**
 * Setting a held prop down at a place and letting go.
 *
 * The goal is the prop's resting frame, not the hand: the author names
 * where the prop's origin goes (and optionally its heading), and the hand is
 * placed wherever holds the prop there, by the rigid hand-to-prop offset the
 * grip has kept since it closed (the prop's displayed frame and the hand's at
 * the start, so whatever the grasp was, the same grasp lays the prop down).
 * With `on`, the prop is put on a bone of the performer's own body instead,
 * at its frame on that bone as the body stands at the start, and is worn
 * there from `placed` (`IHumanActionPlan.wears`). With `onto`, it is set on
 * another prop's socket, its own socket laid on it, and rides that socket
 * from `placed` as the other prop's articulations pose it
 * (`IHumanActionPlan.mounts`): an arrow nocked on a bow's string, drawn
 * back with it. A prop is put down as it
 * rested: its resting rotation is the one it was
 * declared with, turned about the vertical to the asked heading, so a bottle
 * carried at a tilt still lands upright. The arm keeps the configuration it
 * carried the prop in (`IHumanPosture.IGoal.reference`). Inverse kinematics solves the arm; the rest of the body holds the posture
 * it was entered in.
 *
 * Phases: a transport of the hand to the placing frame, timed by the
 * reach-to-grasp movement time over the travel (`HumanPrehension`), its last
 * 0.05 m straight down so the prop lands rather than slides (provisional
 * setback); the release, the fingers opening flat over 0.2 s (provisional) as
 * the grip ends, which leaves the prop where it was placed; and the hand's
 * return to where the arm hangs, rising the same 0.05 m first, over another
 * movement time.
 *
 * Events: `placed` when the prop reaches its frame, `release` when the grip
 * ends. The hand grips the prop until `release` (until `placed` when it is
 * put on a bone, which wears it from there). A placing frame beyond the
 * arm's reach is refused, as is a put down that names neither `at` nor `on`.
 */
export namespace putDown {
  /** The action's name. */
  export const name: HumanActionName = "putDown";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["release", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [
      { window: ["release", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /** Parameters. */
  export interface IParams {
    /** The held prop's subject id. */
    prop: string;

    /** Where the prop's origin goes, world metres; required unless `on` or `onto` is given. */
    at?: IAutoMovieVector3;

    /** The bone of the performer's own body the prop is put on, worn there from `placed` with its frame `offset` in the bone's posed frame (a hat on the head, a pistol in a hip holster); set down at `at` when absent. */
    on?: {
      /** The bone. */
      bone: AutoMovieHumanoidBone;

      /** The prop's frame in the bone's posed frame, metres. */
      offset: IHumanProp.IFrame;
    };

    /**
     * The other prop's socket the prop is set on, riding it from `placed`
     * as that prop's articulations pose it (an arrow nocked by its `nock` on
     * a bow's string, drawn back with it, `IHumanActionPlan.mounts`): the
     * prop's own socket `via` laid on the other's `point`, the prop's origin
     * when `via` is absent.
     */
    onto?: { prop: string; point: string; via?: string };

    /** The prop's heading about +Y at rest, degrees; its current heading when absent. */
    yaw?: number;

    /** The holding hand; `right` when absent. */
    hand?: HumanHand.Side;
  }

  /** The final vertical stretch of the placing transport, metres; provisional. */
  export const SETBACK: number = 0.05;

  /** Time the fingers take to open at the release, seconds; provisional. */
  export const OPEN: number = 0.2;

  /**
   * Plan a put down.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the placing frame lies beyond the arm's reach.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const side: HumanHand.Side = context.params.hand ?? "right";
    const body: IHumanBody = context.body;
    const held: IHumanPosture = context.entry.posture;

    // The hand-to-prop offset the grip keeps, from the displayed frames now.
    const hand: IAutoMovieResolvedBone = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
    ).get(`${side}Hand`)!;
    const prop: IHumanProp.IFrame = context
      .prop(context.params.prop)
      .frame(context.start);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      hand.worldRotation,
    );
    const offset: IHumanProp.IFrame = {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(prop.position, hand.worldPosition),
      ),
      rotation: Quaternion.multiply(inverse, prop.rotation),
    };

    // The prop's resting frame, then the hand that holds it there.
    const heading = (q: IAutoMovieQuaternion): number => {
      const f: IAutoMovieVector3 = Quaternion.rotateVector(q, {
        x: 0,
        y: 0,
        z: 1,
      });
      return (Math.atan2(f.x, f.z) * 180) / Math.PI;
    };
    // A prop is put down as it rested: its declared rest rotation turned
    // about the vertical to the heading, never the tilt the carrying hand
    // happens to give it now.
    const authored: IAutoMovieQuaternion = context.prop(context.params.prop)
      .prop.frame.rotation;
    const declaredHeading: number = heading(authored);
    const unhold: IAutoMovieQuaternion = Quaternion.inverse(offset.rotation);
    const holding: (yaw: number) => HumanHand.IWrist = (yaw: number): HumanHand.IWrist => {
      const rest: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            yaw - declaredHeading,
          ),
          authored,
        ),
      );
      const r: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(rest, unhold),
      );
      return {
        point: Vector3.subtract(
          context.params.at!,
          Quaternion.rotateVector(r, offset.position),
        ),
        rotation: r,
      };
    };

    // An authored heading is kept; otherwise the prop may rest at whichever
    // heading the arm can lay it down at exactly.
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      held,
      side,
    );
    const on = context.params.on;
    const onto: IParams["onto"] = context.params.onto;
    const wearing: IHumanProp.IFrame | undefined = putDownTarget.of(
      context,
      context.entry.pose,
    );
    if (wearing === undefined && context.params.at === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "at",
        value: "absent",
        feasible: { kind: "alternatives", values: ["at", "on", "onto"] },
        reason:
          "a put down names where the prop goes: a place, a bone or another prop's socket",
        fix: "give `at`, a world point, `on`, a bone of the performer and the prop's frame on it, or `onto`, another prop's socket",
      });
    const chosen: HumanHand.IWrist =
      wearing !== undefined
        ? ((): HumanHand.IWrist => {
            const r: IAutoMovieQuaternion = Quaternion.normalize(
              Quaternion.multiply(
                wearing.rotation,
                Quaternion.inverse(offset.rotation),
              ),
            );
            return {
              point: Vector3.subtract(
                wearing.position,
                Quaternion.rotateVector(r, offset.position),
              ),
              rotation: r,
            };
          })()
        : context.params.yaw === undefined
          ? HumanGrasp.reachable(
              body,
              held,
              side,
              bend,
              (turn: number): HumanHand.IWrist =>
                holding(heading(prop.rotation) + turn),
              undefined,
              undefined,
              undefined,
              undefined,
              // A turn that puts the wrist beyond the arm, which the reach
              // below refuses, is tried only when every turn does.
              pickUp.reaches(context, side),
            ).wrist
          : holding(context.params.yaw);

    // The arm keeps the configuration it carried the prop in.
    const reference: IHumanPosture.IReference = resolveHumanPosture.reference(
      context.entry.pose,
      side === "left" ? "leftArm" : "rightArm",
    );
    const rotation: IAutoMovieQuaternion = chosen.rotation;
    const place: IAutoMovieVector3 = chosen.point;

    // A socket placement is a contact task: the source socket must remain
    // on the receiver when the wrist cannot retain the whole attitude.
    const tool: StrikingHeld.ITool | undefined =
      onto?.via === undefined
        ? undefined
        : StrikingHeld.of(context, side, context.params.prop, {
            tip: onto.via,
          });
    const frame: StrikingHeld.IHandFrame = {
      point: Vector3.add(
        place,
        Quaternion.rotateVector(
          rotation,
          HumanHand.offset(body, side, "grip").point,
        ),
      ),
      rotation,
    };
    if (tool !== undefined)
      StrikingRoll.reachable(
        context,
        tool,
        frame,
        0,
        held,
        "take the prop by a grasp that places its socket on the receiver",
      );
    const constraint: IHumanPosture.IGoal | undefined =
      tool === undefined
        ? undefined
        : StrikingHeld.goal(context, tool, frame, 0, bend);
    pickUp.reachable(context, side, place);

    // Timing: carry down, open, return.
    const hanging: IHumanPosture["limbs"] = { ...held.limbs };
    delete hanging[side === "left" ? "leftArm" : "rightArm"];
    const handBones: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
    const home: IAutoMovieResolvedBone = poseBones(
      body,
      resolveHumanPosture.seeded(body, { ...held, limbs: hanging }, undefined, {}, undefined, handBones).pose,
      undefined,
      handBones,
    ).get(`${side}Hand`)!;
    const down: number = HumanPrehension.duration(
      context.skill,
      context.random("place"),
      Vector3.length(Vector3.subtract(place, hand.worldPosition)),
      0,
    );
    const back: number = HumanPrehension.nominal(
      Vector3.length(Vector3.subtract(home.worldPosition, place)),
      0,
    );
    const duration: number = down + OPEN + back;
    const carry: HumanPrehension.ITransport = HumanPrehension.transport(
      hand.worldPosition,
      place,
      { x: 0, y: -1, z: 0 },
      SETBACK,
      { from: hand.worldRotation, to: rotation },
      down,
    );

    // The return is a placing transport played backwards: it leaves straight
    // up for the setback and ends at rest where the arm hangs.
    const retreat: HumanPrehension.ITransport = HumanPrehension.transport(
      home.worldPosition,
      place,
      { x: 0, y: -1, z: 0 },
      SETBACK,
      { from: home.worldRotation, to: rotation },
      back,
    );
    const closed: IHumanPosture["joints"] = HumanGrip.fingers(
      context.entry.pose,
      side,
    );
    const flat: IHumanPosture["joints"] = HumanHand.shape(side, "flat");
    const relaxed: IHumanPosture["joints"] = HumanHand.shape(side, "relaxed");
    const openAt: ReturnType<typeof HumanPrehension.prepareShape> = HumanPrehension.prepareShape({ entry: closed, open: flat, closed: flat }, 1);
    const returnShape: ReturnType<typeof HumanPrehension.prepareShape> = HumanPrehension.prepareShape({ entry: flat, open: relaxed, closed: relaxed }, 1);
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
    const part: IHumanContactWindow["part"] =
      side === "left" ? "leftHand" : "rightHand";
    return {
      duration,
      events: [
        { name: "placed", share: down / duration },
        { name: "release", share: (down + OPEN) / duration },
      ],
      contacts: [
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
        {
          part,
          kind: "grip",
          from: 0,
          to: down / duration,
          support: { kind: "prop", subject: context.params.prop },
        },
      ],
      ...(onto === undefined
        ? {}
        : {
            mounts: [
              {
                prop: context.params.prop,
                onto: onto.prop,
                point: onto.point,
                from: down / duration,
              },
            ],
          }),
      ...(on === undefined || onto !== undefined
        ? {}
        : {
            wears: [
              {
                prop: context.params.prop,
                bone: on.bone,
                from: down / duration,
              },
            ],
          }),
      contact: down,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        let wrist: IAutoMovieVector3;
        let turned: IAutoMovieQuaternion;
        let digits: IHumanPosture["joints"];
        if (t <= down) {
          wrist = carry.wrist(t);
          turned = carry.turn(t);
          digits = closed;
        } else if (t <= down + OPEN) {
          wrist = place;
          turned = rotation;
          digits = openAt((t - down) / OPEN);
        } else {
          const r: number = t - down - OPEN;
          wrist = retreat.wrist(back - r);
          turned = retreat.turn(back - r);
          digits = returnShape(r / back);
        }
        return {
          ...held,
          joints: { ...held.joints, ...digits },
          limbs: {
            ...held.limbs,
            [limb]: {
              point: wrist,
              rotation: turned,
              bend,
              reference,
              ...(constraint === undefined || t > down
                ? {}
                : {
                    contact: constraint.contact,
                    limits: constraint.limits,
                  }),
              ...(t <= down ? { planted: true } : {}),
            },
          },
        };
      },
    };
  }

  /**
   * A socket placement's demands on an earlier grasp: the source socket
   * on the receiving socket, with the same held-tool goal and bound that
   * the placement itself judges. A free placement chooses its own heading
   * and asks nothing of the earlier grasp.
   *
   * @param ahead The destination, the predicted stance and the candidate grip.
   * @returns The socket pose, or no demand without a named source socket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which placements constrain a prior grasp and whose pose and tolerance are used.
   * @evidence contracts/development/implementation.md#principled-implementation The destination prop frame P and prop-in-grip offset O require the grip frame P O^-1; the same source-socket contact and held-tool bound as the placing plan judge it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Filter the grip, read the destination, undo its rigid offset and declare one demand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No object kind is named, and a free world placement keeps its existing freedom.
   * @evidence contracts/development/implementation.md#efficient-algorithms One destination lookup and constant rigid-frame work per candidate grasp; the body pose is supplied lazily and this prop-socket branch never acquires its formerly unused full posture solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan and demand share putDownTarget and the held-tool goal and measure owners.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one immutable demand and retains nothing.
   */
  export function demands(
    ahead: IHumanActionLaw.IAhead<IParams>,
  ): readonly IHumanActionLaw.IDemand[] {
    const via: string | undefined = ahead.params.onto?.via;
    if (
      via === undefined ||
      ahead.grip.prop !== ahead.params.prop ||
      ahead.grip.side !== (ahead.params.hand ?? "right")
    )
      return [];
    const destination: IHumanProp.IFrame = putDownTarget.of(
      ahead,
      (): ReturnType<typeof resolveHumanPosture> =>
        resolveHumanPosture(ahead.body, ahead.grip.posture),
    )!;
    const tool: StrikingHeld.ITool = ahead.grip.tool({ tip: via });
    const frame: IHumanProp.IFrame = HumanPropFrame.parent(
      destination,
      tool.held!.frame,
    );
    return [
      {
        posture: ahead.grip.posture,
        tool,
        frame: {
          point: frame.position,
          rotation: frame.rotation,
        },
        back: 0,
        bound: StrikingRoll.MISS,
      },
    ];
  }
}
