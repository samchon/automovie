import {
  ROM_TOLERANCE,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanVerdicts } from "../audit/HumanVerdicts";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBlade } from "../striking/StrikingBlade";
import type { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { StrikingSupport } from "../striking/StrikingSupport";
import { StrikingTarget } from "../striking/StrikingTarget";
import { HumanFirearmReady } from "./HumanFirearmReady";
import { HumanWeaponHeld } from "./HumanWeaponHeld";
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

    /** The entry posture with the trunk turned and the supporting hand on its planned handle. */
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
   * @throws {HumanRefusal} On `target` when the target lies more than `TURN` degrees off the heading, or an extended arm's line of aim passes beyond its reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The bore's line on the line from the anchor to the target, an extended arm's working point where that line meets the arm's own reach, a ready region's pose (`HumanFirearmReady`), or the recover's upright bore above the support side's breast (the 1764 Manual Exercise), on the bladed trunk a long gun is shouldered from, square at the recover.
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
    const carriage: HumanWeaponPresent.Carriage = p.carriage ?? "aim";
    // A long gun is shouldered with the support shoulder forward: the
    // trunk turns toward the firing side, and the eye, the shoulders and
    // the reach are read on the turned trunk. At the recover the body stays
    // "as square to the front as possible".
    const turn: number =
      !s.long || carriage === "recover" || carriage === "shoulder"
        ? 0
        : s.tool.side === "right"
          ? -HumanWeaponPresent.BLADED
          : HumanWeaponPresent.BLADED;
    const bladed: IHumanPosture = StrikingBlade.turned(entry, turn);

    // Both arms are judged where the presentation will put them. Leaving
    // the previous support goal here makes that old hand an obstacle to a
    // feasible two-handed presentation.
    const supported = (frame: StrikingHeld.IHandFrame): IHumanPosture =>
      StrikingSupport.posture(
        context.body,
        bladed,
        s.tool,
        frame,
        carriage === "recover" && s.lock !== undefined
          ? s.lock
          : HumanWeaponHeld.supported(context, s, frame, bladed),
      );
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
    const anchor: HumanWeaponPresent.Anchor =
      p.anchor ?? (s.long ? "cheek" : "eye");
    const eye: IAutoMovieVector3 =
      anchor === "eye"
        ? head
        : anchor === "cheek"
          ? {
              ...head,
              y: head.y - HumanWeaponPresent.CHEEK * (head.y - shoulder.y),
            }
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
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: HumanWeaponPresent.TURN,
          unit: "deg",
        },
        reason: `the target lies ${off.toFixed(0)} degrees off the heading, beyond the ${HumanWeaponPresent.TURN} degrees the arms present to`,
        fix: "turn to face the target first",
      });
    const pose: StrikingHeld.IHandFrame = ((): StrikingHeld.IHandFrame => {
      if (carriage === "aim") {
        // The bore on the line from the eye to the target, the arms out
        // (a handgun) or the butt drawn in to the shoulder (a long gun);
        // the pose is chosen and judged by both ends of the bore.
        const sight: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(target, eye),
        );
        const held = (out: number): StrikingHeld.IHandFrame =>
          StrikingRoll.hand(
            context,
            s.tool,
            s.tool.length,
            Vector3.add(eye, Vector3.scale(sight, out)),
            sight,
            0,
            supported,
          );
        if (!p.extended) return held((s.long ? 0.3 : 0.7) * s.arm);

        // An extended arm (a bow's) keeps only the solver's angular
        // resolution short of straight: the law of cosines at
        // ROM_TOLERANCE. A skin-sized setback bends a bow arm visibly.
        // The hand frame is
        // chosen once, where the line meets that length with the grip's
        // distance beyond the wrist; the tool is rigid in the hand, so sliding
        // that frame along the line moves its wrist by the same step, and the
        // step that brings the wrist to the length is the larger root of
        // `|w + s u - c|^2 = r^2` (the wrist `w`, the line `u`, the shoulder
        // `c`, the length `r`). A line the length never meets is refused.
        const upper: number = context.body.measure.upperArm;
        const lower: number = context.body.measure.forearm;
        const goal: number = Math.sqrt(
          upper * upper +
            lower * lower +
            2 * upper * lower * Math.cos((ROM_TOLERANCE * Math.PI) / 180),
        );
        const outward = (from: IAutoMovieVector3, r: number): number => {
          const step: number | undefined = reach(
            Vector3.subtract(from, shoulder),
            sight,
            r,
          );
          if (step === undefined)
            throw new HumanRefusal({
              kind: "reach",
              axis: "target",
              value: Vector3.length(Vector3.subtract(from, shoulder)),
              feasible: { kind: "range", minimum: 0, maximum: r, unit: "m" },
              reason: `the line of aim passes beyond the ${s.tool.side} arm's ${r.toFixed(3)} m reach from its shoulder`,
              fix: "face the target, or present without extending the arm",
            });
          return step;
        };
        const chosen: StrikingHeld.IHandFrame = held(
          outward(
            eye,
            s.arm +
              Vector3.length(
                HumanHand.offset(context.body, s.tool.side, "grip").point,
              ),
          ),
        );
        const wrist: IAutoMovieVector3 = HumanHand.place(
          context.body,
          s.tool.side,
          "grip",
          chosen.point,
          chosen.rotation,
          "relaxed",
        ).point;
        return {
          point: Vector3.add(
            chosen.point,
            Vector3.scale(sight, outward(wrist, goal)),
          ),
          rotation: chosen.rotation,
        };
      }
      if (carriage === "shoulder") {
        // The 1764 Manual Exercise's Position of a Soldier under Arms: "the
        // firelock to be carried on the left Shoulder", "the Flat of the
        // Butt, to be supported against the hip-bone ... that it may stand
        // before the Hollow of the Shoulder, not leaning towards the head nor
        // from it; the barrel almost perpendicular". The piece's butt-to-
        // muzzle line runs from the holding side's hip to before its
        // shoulder, the butt on the hip.
        const surface = (
          id: "hipLeft" | "hipRight" | "shoulderLeft" | "shoulderRight",
        ): IAutoMovieVector3 => {
          const region: typeof context.body.surfaces.regions.mouth =
            context.body.surfaces.regions[id];
          return resolveAutoMovieHumanoidSurfaces.place(
            region,
            bones.get(region.bone)!,
          ).point;
        };
        const left: boolean = s.tool.side === "left";
        const hip: IAutoMovieVector3 = surface(left ? "hipLeft" : "hipRight");
        const before: IAutoMovieVector3 = surface(
          left ? "shoulderLeft" : "shoulderRight",
        );
        const piece: IAutoMovieVector3 =
          s.butt === undefined
            ? Vector3.scale(s.tool.axis, s.tool.length)
            : Vector3.subtract(s.tool.tip, s.butt);
        const along: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(before, hip),
        );
        const held: StrikingHeld.IHandFrame = StrikingRoll.hand(
          context,
          { ...s.tool, axis: Vector3.normalize(piece) },
          Vector3.length(piece),
          hip,
          along,
          0,
          supported,
        );
        // "As low down as can be admitted without constraint": the lowest
        // place along the body's side, from the hip toward the shoulder,
        // where the holding hand's wrist lies within the arm's length less
        // the audit's skin, the frame slid up the line by the smaller root
        // of `|w + s u - c|^2 = r^2`.
        const wrist: IAutoMovieVector3 = HumanHand.place(
          context.body,
          s.tool.side,
          "grip",
          held.point,
          held.rotation,
          "relaxed",
        ).point;
        const lift: number | undefined = rise(
          Vector3.subtract(wrist, shoulder),
          along,
          s.arm - HumanVerdicts.SKIN,
        );
        if (lift === undefined)
          throw new HumanRefusal({
            kind: "reach",
            axis: "gun",
            value: Vector3.length(Vector3.subtract(wrist, shoulder)),
            feasible: {
              kind: "range",
              minimum: 0,
              maximum: s.arm - HumanVerdicts.SKIN,
              unit: "m",
            },
            reason: `the ${s.tool.side} hand cannot hold the shouldered piece's butt anywhere along the body's side`,
            fix: "shoulder a shorter piece",
          });
        return {
          point: Vector3.add(held.point, Vector3.scale(along, lift)),
          rotation: held.rotation,
        };
      }
      if (carriage === "recover") {
        // The 1764 Manual Exercise's recover: "the Butt close to the left
        // breast, but not pressed, the Firelock perpendicular, opposite the
        // left Side of the Face" (for a right-handed firer). The butt on the
        // support side's breast, the bore upright above it.
        const region: typeof context.body.surfaces.regions.mouth =
          context.body.surfaces.regions[
            s.tool.side === "right" ? "chestLeft" : "chestRight"
          ];
        const breast: IAutoMovieVector3 =
          resolveAutoMovieHumanoidSurfaces.place(
            region,
            bones.get(region.bone)!,
          ).point;
        // "The Firelock perpendicular" is read as the whole piece upright,
        // the line from its butt to its muzzle: the manual places the piece
        // by its butt ("close to the left breast") and the face, names no
        // barrel there, and the period abstract of the recover springs "the
        // firelock straight up" (Encyclopaedia Britannica, 2nd ed., 1778,
        // after the 1764 Manual Exercise). That line stands upright with the
        // butt, its length behind the muzzle, on the breast.
        const piece: IAutoMovieVector3 | undefined =
          s.butt === undefined
            ? undefined
            : Vector3.subtract(s.tool.tip, s.butt);
        return StrikingRoll.hand(
          context,
          piece === undefined
            ? s.tool
            : { ...s.tool, axis: Vector3.normalize(piece) },
          piece === undefined ? s.tool.length : Vector3.length(piece),
          breast,
          { x: 0, y: 1, z: 0 },
          0,
          supported,
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
        posture: supported,
      });
    })();
    return { turn, bladed: supported(pose), eye, target, line, carriage, pose };
  }

  /**
   * The signed step along a line from a point to where the line meets a
   * sphere about a centre on its far side: the larger root of
   * `|d + s u|^2 = r^2` for the point's offset `d` from the centre and the
   * unit direction `u`; undefined when the line misses the sphere (a
   * negative discriminant).
   */
  function reach(
    d: IAutoMovieVector3,
    u: IAutoMovieVector3,
    r: number,
  ): number | undefined {
    const b: number = Vector3.dot(d, u);
    const disc: number = b * b - Vector3.dot(d, d) + r * r;
    return disc < 0 ? undefined : -b + Math.sqrt(disc);
  }

  /**
   * The least step along a line from a point that brings it within a
   * distance of a centre: 0 when it already is, the smaller root of
   * `|d + s u|^2 = r^2` ahead of it otherwise; undefined when the line never
   * comes that near ahead.
   */
  function rise(
    d: IAutoMovieVector3,
    u: IAutoMovieVector3,
    r: number,
  ): number | undefined {
    const c: number = Vector3.dot(d, d) - r * r;
    if (c <= 0) return 0;
    const b: number = Vector3.dot(d, u);
    const disc: number = b * b - c;
    if (disc < 0) return undefined;
    const step: number = -b - Math.sqrt(disc);
    return step >= 0 ? step : undefined;
  }
}
