import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBlade } from "../striking/StrikingBlade";
import type { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { StrikingTarget } from "../striking/StrikingTarget";
import { HumanFirearmReady } from "./HumanFirearmReady";
import type { HumanWeaponHeld } from "./HumanWeaponHeld";
import { HumanWeaponPresent } from "./HumanWeaponPresent";

/**
 * The pose a presentation strokes to (`HumanWeaponPresent.present`) and
 * the posture it is judged on: the stance no grip changes (the entry, a
 * long gun's bladed trunk, the eye on the sight line, the target and its
 * line) and the hand frame the carriage asks of the weapon as a setup holds
 * it. The plan strokes to it, and a grip a pick up weighs for the
 * presentation (`present.demands`) is judged at it, so the grip chosen is
 * the one the plan holds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is computed and who reads it.
 * @evidence contracts/development/design.md#principled-representation The stance and the hand frame as one record, the arguments of the presentation's stroke and of its refusal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record and its reading, read by the plan and its demands.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The constants stay the presentation's own; no weapon is named.
 */
export namespace HumanWeaponPose {
  /**
   * A presentation's stance and pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation What the stroke and its refusal read of a presentation: the trunk's turn, the posture, the sight line's ends and the hand frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, each read by the plan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None optional.
   */
  export interface IPosed {
    /** The trunk's turn toward the firing side, degrees. */
    turn: number;

    /** The entry posture with the trunk turned. */
    bladed: IHumanPosture;

    /** The sight line's start, world metres. */
    eye: IAutoMovieVector3;

    /** What is aimed at, world metres. */
    target: IAutoMovieVector3;

    /** The unit direction from the root to the target on the floor. */
    line: IAutoMovieVector3;

    /** How the weapon is carried. */
    carriage: HumanWeaponPresent.Carriage;

    /** The firing hand's grip frame the carriage asks. */
    pose: StrikingHeld.IHandFrame;
  }

  /**
   * A presentation's stance and pose with the weapon as a setup holds it.
   *
   * @param context The presentation's parameters, body and aiming.
   * @param entry The posture the presentation begins from.
   * @param start The film second it begins, the instant its target is read at.
   * @param s The setup.
   * @returns The stance and the pose.
   * @throws {HumanRefusal} On `target` when the target lies more than `TURN` degrees off the heading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The bore's line on the line from the anchor to the target, or a ready region's pose (`HumanFirearmReady`), on the bladed trunk a long gun is shouldered from.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The entry, the turn, the anchor, the target and its angle, then the pose by carriage.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target past `TURN` is refused, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution and the carriage's pose choice.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan and once per weighed grip.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    context: Pick<
      IHumanActionContext<HumanWeaponPresent.IPresent>,
      "params" | "body" | "aim"
    >,
    entry: IHumanPosture,
    start: number,
    s: HumanWeaponHeld.ISetup,
  ): IPosed {
    const p: HumanWeaponPresent.IPresent = context.params;
    // A long gun is shouldered with the support shoulder forward: the
    // trunk turns toward the firing side, and the eye, the shoulders and
    // the reach are read on the turned trunk.
    const turn: number = !s.long
      ? 0
      : s.tool.side === "right"
        ? -HumanWeaponPresent.BLADED
        : HumanWeaponPresent.BLADED;
    const bladed: IHumanPosture = StrikingBlade.turned(entry, turn);
    const bones: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
      context.body,
      bladed,
    );

    // The eye's place on the sight line. Over a long gun the head comes
    // down to the stock, so the line lies `CHEEK` of the way from the
    // head's joint down to the firing shoulder's height.
    const head: IAutoMovieVector3 = bones.get("head")!.worldPosition;
    const shoulder: IAutoMovieVector3 = bones.get(
      `${s.tool.side}UpperArm`,
    )!.worldPosition;
    const anchor: HumanWeaponPresent.Anchor = p.anchor ?? (s.long ? "cheek" : "eye");
    const eye: IAutoMovieVector3 =
      anchor === "eye"
        ? head
        : anchor === "cheek"
          ? { ...head, y: head.y - HumanWeaponPresent.CHEEK * (head.y - shoulder.y) }
          : anchor === "arm"
            ? shoulder
            : resolveAutoMovieHumanoidSurfaces.place(
                context.body.surfaces.regions.mouth,
                bones.get(context.body.surfaces.regions.mouth.bone)!,
              ).point;
    const chest: IAutoMovieVector3 = bones.get("chest")!.worldPosition;
    const ahead = (yaw: number): IAutoMovieVector3 =>
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw },
        { x: 0, y: 0, z: 1 },
      );
    const target: IAutoMovieVector3 =
      p.target === undefined
        ? Vector3.add(eye, Vector3.scale(ahead(entry.yaw), 10))
        : context.aim(p.target, start).point;
    const line: IAutoMovieVector3 = StrikingTarget.line(
      entry.root,
      target,
      entry.yaw,
    );
    const off: number =
      (Math.acos(
        Math.max(-1, Math.min(1, Vector3.dot(line, ahead(entry.yaw)))),
      ) *
        180) /
      Math.PI;
    if (off > HumanWeaponPresent.TURN)
      throw new HumanRefusal({
        kind: "reach",
        axis: "target",
        value: off,
        feasible: { kind: "range", minimum: 0, maximum: HumanWeaponPresent.TURN, unit: "deg" },
        reason: `the target lies ${off.toFixed(0)} degrees off the heading, beyond the ${HumanWeaponPresent.TURN} degrees the arms present to`,
        fix: "turn to face the target first",
      });
    const carriage: HumanWeaponPresent.Carriage = p.carriage ?? "aim";
    const pose: StrikingHeld.IHandFrame = ((): StrikingHeld.IHandFrame => {
      if (carriage === "aim") {
        // The bore on the line from the eye to the target, the arms out
        // (a handgun) or the butt drawn in to the shoulder (a long gun);
        // the pose is chosen and judged by both ends of the bore.
        const sight: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(target, eye),
        );
        return StrikingRoll.hand(
          context,
          s.tool,
          s.tool.length,
          Vector3.add(
            eye,
            Vector3.scale(sight, (s.long ? 0.3 : 0.7) * s.arm),
          ),
          sight,
          0,
          bladed,
        );
      }
      // A ready position is a region the doctrine describes, and the arm
      // holds the weapon where in it it can.
      return HumanFirearmReady.pose(context, {
        tool: s.tool,
        arm: s.arm,
        chest,
        shoulder: bones.get(`${s.tool.side}UpperArm`)!.worldPosition,
        line,
        low: carriage === "lowReady",
        posture: bladed,
      });
    })();
    return { turn, bladed, eye, target, line, carriage, pose };
  }
}