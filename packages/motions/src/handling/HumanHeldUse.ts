import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspUse } from "./HumanGraspUse";
import { HumanGrip } from "./HumanGrip";

/**
 * A held tool used as the grasp it was taken up by presents it: the act
 * that works with it keeps the hand's rotation the grasp was chosen to hold
 * at the place of use (`HumanGraspUse.presented`), so it asks the wrist only
 * what the grip was taken for, and a second hand that steadies the tool (a
 * camera's other end) is laid on the tool's other handle where the first
 * hand carries it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, why and what the second hand does.
 * @evidence contracts/development/design.md#principled-representation The grasp an act keeps is the pick up's own handle and line, so the attitude at the use is the one the grip was chosen for; a second hand is a grasp of another of the tool's handles, rigid with it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The kept grasp, the act's statement of it, its checked key, the key and the second hand; read by `touch` and `handToFace`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tool kind is named: the handle, the working point and the second handle are the prop's own affordance ids.
 */
export namespace HumanHeldUse {
  /** The digits whose phalanges and tips a held tool's hand keeps out of the body. */
  export const DIGITS: readonly HumanGrip.Digit[] = [
    "Thumb",
    "Index",
    "Middle",
    "Ring",
    "Little",
  ];

  /** The grasp a held tool was taken up by for its use (`pickUp`'s `handle` and `use.line`), which an act that uses it keeps. */
  export interface IGrasp {
    /** The handle the tool was taken by. */
    handle: string;

    /** The line its use names (`HumanGraspUse.IUse.line`). */
    line: HumanGraspUse.IUse["line"];
  }

  /** What an act states of the held tool it uses: the prop, its working point, the grasp kept and the other hand's handle, each absent when unused. */
  export interface IKept {
    /** The held prop's subject id. */
    prop?: string;

    /** The prop's working point, one of its affordance ids. */
    point?: string;

    /** The grasp the prop was taken up by for its use. */
    grasp?: IGrasp;

    /** The prop's handle the other hand takes. */
    other?: string;
  }

  /**
   * The key of an act that keeps the grasp a held tool was taken up by, or
   * null when it keeps none: the act's statement checked, then `key`.
   *
   * @param context The action's context.
   * @param side The holding hand.
   * @param kept What the act states of the held tool.
   * @param region The region of the performer's own the act works at; null when it works elsewhere (a partner, a sheet).
   * @returns The key, or null without a grasp.
   * @throws {HumanRefusal} A `parameter` refusal on `other` when it comes without a grasp, and on `grasp` when it comes without a prop, a point or a region of the performer's own.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result, the absence and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The use's place is a region of the performer's own body, and a second hand is laid where the kept grasp presents the tool, so a statement missing either is refused before the key is read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two checks, then one delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tool is named; each refusal names what to give.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `key`; read by `touch` and `handToFace`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The cost is the key's.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function kept(
    context: Pick<IHumanActionContext, "body" | "entry" | "prop" | "start">,
    side: HumanHand.Side,
    kept: IKept,
    region: AutoMovieHumanoidRegion | null,
  ): HumanGrasp.IKey | null {
    if (kept.grasp === undefined) {
      if (kept.other !== undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "other",
          value: kept.other,
          feasible: null,
          reason:
            "a second hand is laid on a held prop where the kept grasp presents it, and this act keeps no grasp",
          fix: "name the grasp the prop was taken up by, or leave out the other handle",
        });
      return null;
    }
    if (
      kept.prop === undefined ||
      kept.point === undefined ||
      region === null
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "grasp",
        value: kept.grasp,
        feasible: null,
        reason:
          "a grasp kept through an act brings a held prop's point to a region of the performer's own body, and this act names no held prop, no point or no such region",
        fix: `pick up a prop by a ${kept.grasp.handle} handle for this use${kept.point === undefined ? "" : ` with its ${kept.point}`} and name it as the prop, at a region of the performer's own body, or leave out the grasp`,
      });
    return key(context, side, kept.prop, kept.point, kept.grasp, region);
  }

  /**
   * The pose a held tool is used in at a region of the performer's own: the
   * use's presented key (`HumanGraspUse.presented`) with the region as the
   * use's place, from the hand as the entry holds it, turned about the
   * line where the closed hand keeps out of the body.
   *
   * @param context The action's context.
   * @param side The holding hand.
   * @param prop The held prop's subject id.
   * @param point The prop's working point, one of its affordance ids.
   * @param grasp The grasp it was taken up by.
   * @param region The region of the performer's own the point is brought to.
   * @returns The key: the wrist, its rotation and the elbow's hint.
   * @throws {HumanRefusal} As `HumanGraspUse.presented` does for a point the prop lacks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the key, its inputs and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The grasp was chosen so that this key holds (`pickUp`'s use), so an act that keeps its rotation asks only a pose the grip was taken for; the hand's own rotation at a place is the arm's fit there with the hanging elbow, as `pickUp` reads it; the closed hand is the entry's own digits, each phalanx and tip less its radius from the body's colliders, so a roll that would put a finger in the face is not taken while another keeps it out.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The entry hand and its digits, the clearance, the hand's own rotation, one delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tool is named; the region is the act's own.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanGraspUse.presented`, the posture resolver and `AutoMovieMotionHumanBend.hang`.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry pose read and a few arm fits per act.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function key(
    context: Pick<IHumanActionContext, "body" | "entry" | "prop" | "start">,
    side: HumanHand.Side,
    prop: string,
    point: string,
    grasp: IGrasp,
    region: AutoMovieHumanoidRegion,
  ): HumanGrasp.IKey {
    const body: IHumanBody = context.body;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      context.entry.pose,
    );
    const hand: IAutoMovieResolvedBone | undefined = bones.get(`${side}Hand`);

    // The closed hand as the entry holds it, in the hand's frame: each
    // phalanx's joint centre and each digit's tip, with the digit's radius;
    // and the body it must stay out of, all of it but that arm and hand.
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      hand?.worldRotation ?? Quaternion.identity(),
    );
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, hand?.worldPosition ?? point),
      );
    const digits: { point: IAutoMovieVector3; radius: number }[] = [];
    for (const digit of DIGITS) {
      const chain: ReturnType<typeof HumanGrip.chain> = HumanGrip.chain(
        body,
        side,
        digit,
      );
      const phalanges: IAutoMovieResolvedBone[] = HumanGrip.bones(side, digit)
        .map((bone: AutoMovieHumanoidBone) => bones.get(bone))
        .filter(
          (
            bone: IAutoMovieResolvedBone | undefined,
          ): bone is IAutoMovieResolvedBone => bone !== undefined,
        );
      for (const phalanx of phalanges)
        digits.push({
          point: local(phalanx.worldPosition),
          radius: chain.radius,
        });
      const distal: IAutoMovieResolvedBone | undefined =
        phalanges[phalanges.length - 1];
      if (distal !== undefined)
        digits.push({
          point: local(
            Vector3.add(
              distal.worldPosition,
              Quaternion.rotateVector(distal.worldRotation, chain.tip),
            ),
          ),
          radius: chain.radius,
        });
    }
    const holding: RegExp = new RegExp(
      `^${side}(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)`,
    );
    const apart: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      [...bones].filter(
        ([bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean =>
          !holding.test(bone),
      ),
    );
    const clear = (wrist: HumanHand.IWrist): number => {
      let least: number = Infinity;
      for (const digit of digits)
        least = Math.min(
          least,
          HumanColliders.distance(
            body,
            apart,
            Vector3.add(
              wrist.point,
              Quaternion.rotateVector(wrist.rotation, digit.point),
            ),
          ).distance - digit.radius,
        );
      return least;
    };
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      context.entry.posture,
      side,
    );
    const limb: IHumanPosture.Limb = `${side}Arm`;
    return HumanGraspUse.presented({
      context,
      prop,
      handle: grasp.handle,
      side,
      wrist: {
        point: hand?.worldPosition ?? { x: 0, y: 0, z: 0 },
        rotation: hand?.worldRotation ?? Quaternion.identity(),
      },
      use: { tip: point, line: grasp.line, at: { region } },
      natural: (at: IAutoMovieVector3): IAutoMovieQuaternion =>
        poseBones(
          body,
          resolveHumanPosture(body, {
            ...context.entry.posture,
            limbs: { ...context.entry.posture.limbs, [limb]: { point: at, bend } },
          }),
        ).get(`${side}Hand`)?.worldRotation ?? Quaternion.identity(),
      clear,
    });
  }

  /**
   * The other hand on a held tool's other handle: carried in joint space
   * from its entry angles, by the act's own weight, to the grasp of that
   * handle where the holding hand's goal puts the tool at each second, so
   * it meets the tool as the tool arrives and leaves it as it goes. The
   * turn about the handle is chosen once, the one the arm reaches best with
   * the tool at its use (`HumanGrasp.reachable`), and the arm is held to
   * that solution.
   *
   * @param props The act's context and clock, the holding hand and its goal, the tool, the other handle, the tool's pose at its use and the weight.
   * @returns The other arm and its fingers, the arm carrying the grip's window from `ready` to `relax`.
   * @throws {HumanRefusal} When the holding hand does not hold the prop, or the prop lacks the handle or colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the hand meets the tool, the choice of turn and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation A held tool is rigid in the holding hand's grip frame (`AutoMovieMotionHumanHeld.of`), so the other handle's frame follows from the holding hand's goal; the grasp of it is the pick up's (`HumanGrasp.at`, `HumanGrasp.hand`), and the reachable turn ranks the symmetric grasps of a handle as grasp planners do.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The tool in the hand, the turn at the use, then one arm carry and one hand form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The handle is the prop's own; the elbow's hint is solved once at the use and carried with the body.
   * @evidence contracts/development/implementation.md#efficient-algorithms One reachable search at plan time, one goal of the holding hand and one grasp per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the held owner, the grasp's target, hand and reachable search, the bend solver and the arm carry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitives close over the tool read at plan time and one hint.
   */
  export function second(props: {
    context: Pick<
      IHumanActionContext,
      "body" | "entry" | "prop" | "start" | "subject"
    >;
    clock: AutoMovieMotionClock.IClock;
    side: HumanHand.Side;
    prop: string;
    handle: string;
    key: HumanGrasp.IKey;
    goal: (posture: IHumanPosture, seconds: number) => IHumanPosture.IGoal;
    weight: (seconds: number) => number;
  }): IAutoMovieMotionHumanPrimitive[] {
    const { context, clock } = props;
    const body: IHumanBody = context.body;
    const other: HumanHand.Side = props.side === "right" ? "left" : "right";
    const held: AutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      props.side,
      props.prop,
    );
    const record: IHumanProp = context.prop(props.prop).prop;
    const socket: IAutoMovieVector3 = HumanHand.offset(
      body,
      props.side,
      "grip",
    ).point;

    // The other handle where a wrist of the holding hand puts the tool.
    const target = (wrist: HumanHand.IWrist): HumanGrasp.ITarget =>
      HumanGrasp.at(record, props.handle, {
        position: Vector3.add(
          wrist.point,
          Quaternion.rotateVector(
            wrist.rotation,
            Vector3.add(socket, held.frame.position),
          ),
        ),
        rotation: Quaternion.normalize(
          Quaternion.multiply(wrist.rotation, held.frame.rotation),
        ),
      });

    // The turn about the handle the other arm reaches best with the tool
    // at its use, and the elbow's hint there, carried with the body.
    const entry: IHumanPosture = context.entry.posture;
    const used: HumanGrasp.ITarget = target(props.key.wrist);
    const chosen: HumanGrasp.IReach = HumanGrasp.reachable(
      body,
      entry,
      other,
      AutoMovieMotionHumanBend.hang(body, entry, other),
      (turn: number, tilt: number): HumanHand.IWrist =>
        HumanGrasp.hand(body, other, HumanGrasp.around(used, turn), tilt),
    );
    const hint: IAutoMovieVector3 = HumanFrame.local(
      { origin: entry.root, yaw: entry.yaw },
      AutoMovieMotionHumanBend.solve({
        body,
        posture: entry,
        side: other,
        point: chosen.wrist.point,
        rotation: chosen.wrist.rotation,
        fallback: "hang",
      }),
    );
    const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried(
      {
        body,
        side: other,
        from: 0,
        to: clock.duration,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, other),
        weight: props.weight,
        goal: (posture: IHumanPosture, seconds: number): IHumanPosture.IGoal => {
          const first: IHumanPosture.IGoal = props.goal(posture, seconds);
          const wrist: HumanHand.IWrist = HumanGrasp.hand(
            body,
            other,
            HumanGrasp.around(
              target({
                point: first.point,
                rotation: first.rotation ?? props.key.wrist.rotation,
              }),
              chosen.turn,
            ),
            chosen.tilt,
          );
          return {
            point: wrist.point,
            rotation: wrist.rotation,
            bend: HumanFrame.point(
              { origin: posture.root, yaw: posture.yaw },
              hint,
            ),
            reference: chosen.reference,
          };
        },
      },
    );
    return [
      {
        ...arm,
        contacts: [
          {
            part: `${other}Hand`,
            kind: "grip",
            from: clock.at("ready") / clock.duration,
            to: clock.at("relax") / clock.duration,
            support: { kind: "prop", subject: props.prop },
          } satisfies IHumanContactWindow,
        ],
      },
      AutoMovieMotionHumanHand.form(
        clock,
        other,
        ["start", "ready"],
        ["relax", "end"],
        "fist",
      ),
    ];
  }
}
