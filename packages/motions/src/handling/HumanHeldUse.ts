import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanGrip,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHeldUse,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspHand } from "./HumanGraspHand";
import { HumanGraspTarget } from "./HumanGraspTarget";
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
  export const DIGITS: readonly IAutoMovieMotionHumanGrip.Digit[] = [
    "Thumb",
    "Index",
    "Middle",
    "Ring",
    "Little",
  ];

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
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "prop" | "start">,
    side: AutoMovieHumanSide,
    kept: IAutoMovieMotionHumanHeldUse.IKept,
    region: AutoMovieHumanoidRegion | null,
  ): IAutoMovieMotionHumanGrasp.IKey | null {
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
    if (kept.prop === undefined || kept.point === undefined || region === null)
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
   * line as the grasp was judged (`HumanGraspUse.presented`'s chooser), the
   * closed hand kept out of the body.
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
   * @evidence contracts/development/implementation.md#principled-implementation The grasp was chosen so that this key holds (`pickUp`'s use), so an act that keeps its rotation asks only a pose the grip was taken for, the roll the same chooser takes; the closed hand is the entry's own digits, each phalanx and tip less its radius from the body's colliders, whose depth in the face adds to a roll's miss.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The entry's hand, digits and body colliders, one clearance reader, then the use owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tool is named; the region is the act's own.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The clearance reader places the entry's digit points and the body's colliders once for every roll the use search tries.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry FK supplies the D digit points and the body's collider placement; each roll's clearance costs D distance queries.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The digit points and collider reader end with the key search; the returned key's judge holds its tool or contact geometry only.
   */
  export function key(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "prop" | "start">,
    side: AutoMovieHumanSide,
    prop: string,
    point: string,
    grasp: IAutoMovieMotionHumanHeldUse.IGrasp,
    region: AutoMovieHumanoidRegion,
  ): IAutoMovieMotionHumanGrasp.IKey {
    const body: IAutoMovieMotionHumanBody = context.body;
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
    const local: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 =>
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
      const phalanges: IAutoMovieResolvedBone[] = [];
      for (const name of HumanGrip.bones(side, digit)) {
        const phalanx: IAutoMovieResolvedBone | undefined = bones.get(name);
        if (phalanx !== undefined) phalanges.push(phalanx);
      }
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
    const apart: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
    for (const [bone, frame] of bones)
      if (!holding.test(bone)) apart.set(bone, frame);
    const geometry: ReturnType<typeof HumanColliders.reading> =
      HumanColliders.reading(body, apart);
    const clear: (wrist: IAutoMovieMotionHumanHand.IWrist) => number = (wrist: IAutoMovieMotionHumanHand.IWrist): number => {
      let least: number = Infinity;
      for (const digit of digits) {
        const point: IAutoMovieVector3 = Vector3.add(
          wrist.point, Quaternion.rotateVector(wrist.rotation, digit.point),
        );
        least = Math.min(
          least,
          geometry.segment(point, point).distance - digit.radius,
        );
      }
      return least;
    };
    const use: Parameters<typeof HumanGraspUse.presented>[0] = {
      context,
      prop,
      handle: grasp.handle,
      side,
      wrist: {
        point: hand?.worldPosition ?? { x: 0, y: 0, z: 0 },
        rotation: hand?.worldRotation ?? Quaternion.identity(),
      },
      use: { tip: point, line: grasp.line, at: { region } },
      clear,
    };
    return HumanGraspUse.presented(use);
  }

  /**
   * The other hand on a held tool's other handle: its reach, hold and
   * return planned as one trajectory over the span the act's own weight
   * states (`AutoMovieMotionHumanArm.stated`), from its entry angles to the
   * grasp of that handle where the holding hand's goal puts the tool at
   * each second, so it meets the tool as the tool arrives and leaves it as
   * it goes. The
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
  export function second(props: IAutoMovieMotionHumanHeldUse.ISecondProps ): IAutoMovieMotionHumanPrimitive[] {
    const { context, clock } = props;
    const body: IAutoMovieMotionHumanBody = context.body;
    const other: AutoMovieHumanSide = props.side === "right" ? "left" : "right";
    const place: ReturnType<typeof HumanGraspHand.prepare> = HumanGraspHand.prepare(body, other);
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      props.side,
      props.prop,
    );
    const record: IAutoMovieMotionHumanProp = context.prop(props.prop).prop;
    const socket: IAutoMovieVector3 = HumanHand.offset(
      body,
      props.side,
      "grip",
    ).point;

    // The other handle where a wrist of the holding hand puts the tool.
    const prepared: ReturnType<typeof HumanGraspTarget> = HumanGraspTarget(record, props.handle);
    const target: (wrist: IAutoMovieMotionHumanHand.IWrist) => HumanGrasp.IFrame = (wrist: IAutoMovieMotionHumanHand.IWrist): HumanGrasp.IFrame =>
      prepared.frame({
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
    // at its use, and the elbow the arm takes there, carried with the body
    // as the place it falls back to where no place is legal.
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const used: HumanGrasp.IFrame = target(props.key.wrist);
    const chosen: IAutoMovieMotionHumanGrasp.IReach = HumanGrasp.reachable(
      body,
      entry,
      other,
      AutoMovieMotionHumanBend.hang(body, entry, other),
      (turn: number, tilt: number): IAutoMovieMotionHumanHand.IWrist =>
        place(HumanGrasp.around(used, turn), tilt),
    );
    const hint: IAutoMovieVector3 = HumanFrame.local(
      { origin: entry.root, yaw: entry.yaw },
      poseBones(body, chosen.pose, undefined,
        new Set<AutoMovieHumanoidBone>([`${other}LowerArm`])).get(`${other}LowerArm`)!.worldPosition,
    );
    // The other hand's reach, hold and return, as its weight states them.
    const span: IAutoMovieMotionHumanArmPlanned.ISpan | undefined =
      AutoMovieMotionHumanArm.stated(props.weight, 0, clock.duration);
    const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried(
      {
        body,
        side: other,
        from: 0,
        to: clock.duration,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, other),
        weight: props.weight,
        ...(span === undefined ? {} : { span }),
        goal: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieHumanLimbGoal => {
          const first: IAutoMovieHumanLimbGoal = props.goal(posture, seconds);
          const wrist: IAutoMovieMotionHumanHand.IWrist = place(
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

            // The elbow is left to the body, on the grasp's own side
            // (`reference`): the one place an elbow is chosen.
            elbow: "strain",
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
          } satisfies IAutoMovieMotionHumanContactWindow,
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
