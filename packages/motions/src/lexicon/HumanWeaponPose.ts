import {
  ROM_TOLERANCE,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanWeaponHeld,
  IAutoMovieMotionHumanWeaponPresent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanVerdicts } from "../audit/HumanVerdicts";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingRoll } from "../striking/StrikingRoll";
import { StrikingSupport } from "../striking/StrikingSupport";
import { StrikingTarget } from "../striking/StrikingTarget";
import { HumanFirearmReady } from "./HumanFirearmReady";
import { HumanMountedPresentation } from "./HumanMountedPresentation";
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
   * @evidence contracts/development/design.md#minimal-and-owned-surface The stroke and grip admission read the same modeled tool and pivot as the pose choice.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None optional.
   */
  export interface IPosed {
    /** The trunk's whole turn, degrees, positive toward the performer's left: a long gun's blade toward the firing side on foot, with a seated performer's turn toward the target. */
    turn: number;

    /** The entry posture with the trunk turned and the supporting hand on its planned handle. */
    bladed: IAutoMovieMotionHumanPosture;

    /** The sight line's start, world metres. */
    eye: IAutoMovieVector3;

    /** What is aimed at, world metres. */
    target: IAutoMovieVector3;

    /** The unit direction from the root to the target on the floor. */
    line: IAutoMovieVector3;

    /** How the weapon is carried. */
    carriage: IAutoMovieMotionHumanWeaponPresent.Carriage;

    /** The firing hand's grip frame the carriage asks. */
    pose: IAutoMovieMotionHumanStrikingHeld.IHandFrame;

    /** Tool geometry in the hand frame, using both prop ends for a one-hand shoulder carriage. */
    tool: IAutoMovieMotionHumanStrikingHeld.ITool;

    /** Distance in metres from the tip to the point the stroke keeps. */
    back: number;
  }

  /**
   * A presentation's stance and pose with the weapon as a setup holds it.
   *
   * @param context The presentation's parameters, body and aiming.
   * @param entry The posture the presentation begins from.
   * @param start The film second it begins, the instant its target is read at.
   * @param s The setup.
   * @param seated Whether the performer sits a mount, whose trunk then turns toward the target (`HumanMountedPresentation`).
   * @returns The stance and the pose.
   * @throws {HumanRefusal} On `target` when the target lies more than `TURN` degrees off the heading, or past a seated performer's trunk turn and `TURN`, or an extended arm's line of aim passes beyond its reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The bore's line on the line from the anchor to the target, an extended arm's working point where that line meets the arm's own reach, a ready region's pose (`HumanFirearmReady`), or the recover's upright bore above the support side's breast (the 1764 Manual Exercise), on the bladed trunk a long gun is shouldered from, square at the recover.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The entry, the turn, the anchor, the target and its angle, then the pose by carriage.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target past `TURN`, or past a seated trunk's turn and `TURN`, is refused, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution and the carriage's pose choice.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan and once per weighed grip.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    context: Pick<
      IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWeaponPresent.IPresent>,
      "params" | "body" | "aim"
    >,
    entry: IAutoMovieMotionHumanPosture,
    start: number,
    s: IAutoMovieMotionHumanWeaponHeld.ISetup,
    seated: boolean,
  ): IPosed {
    const p: IAutoMovieMotionHumanWeaponPresent.IPresent = context.params;
    const carriage: IAutoMovieMotionHumanWeaponPresent.Carriage =
      p.carriage ?? "aim";
    // The shoulder pose, its reach check, and the displayed fit must all
    // use the same physical end of the prop as their pivot. The tool's
    // original axis and length describe its tip from the active grip.
    const piece: IAutoMovieVector3 | undefined = carriage === "shoulder" && s.butt !== undefined
      ? Vector3.subtract(s.tool.tip, s.butt)
      : undefined;
    const shoulderTool: IAutoMovieMotionHumanStrikingHeld.ITool = piece === undefined
      ? s.tool
      : { ...s.tool, axis: Vector3.normalize(piece), length: Vector3.length(piece) };
    // A two-hand plan's support offsets use the original tool axes.
    const tool: IAutoMovieMotionHumanStrikingHeld.ITool = s.support === null
      ? shoulderTool
      : s.tool;
    const back: number = carriage === "aim" ? 0 : tool.length;
    // A long gun is shouldered with the support shoulder forward: the
    // trunk turns toward the firing side, and the eye, the shoulders and
    // the reach are read on the turned trunk. At the recover the body stays
    // "as square to the front as possible". A seated shooter takes no blade:
    // standing, the hips and the feet take it, but the saddle holds the pelvis,
    // so it would all land in the spine; the seated turn toward the target is
    // the trunk's own (`mounted`).
    const turn: number =
      seated || !s.long || carriage === "recover" || carriage === "shoulder"
        ? 0
        : s.tool.side === "right"
          ? -HumanWeaponPresent.BLADED
          : HumanWeaponPresent.BLADED;
    const ahead = (yaw: number): IAutoMovieVector3 =>
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw },
        { x: 0, y: 0, z: 1 },
      );
    const aimed: IAutoMovieVector3 | undefined =
      p.target === undefined ? undefined : context.aim(p.target, start).point;
    // In the saddle the pelvis keeps the horse's heading, so the trunk turns
    // toward a target the arms alone cannot present to (HumanMountedPresentation),
    // by the signed bearing read on the same floor line the arms' bound reads.
    const mounted: number = ((): number => {
      if (!seated || aimed === undefined) return 0;
      const floor: IAutoMovieVector3 = StrikingTarget.line(
        entry.root,
        aimed,
        entry.yaw,
      );
      const left: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
        { x: 1, y: 0, z: 0 },
      );
      const bearing: number =
        (Math.atan2(
          Vector3.dot(floor, left),
          Vector3.dot(floor, ahead(entry.yaw)),
        ) *
          180) /
        Math.PI;
      return HumanMountedPresentation.turn(bearing, turn, s.tool.side, "target");
    })();
    const bladed: IAutoMovieMotionHumanPosture = StrikingBlade.turned(
      entry,
      turn + mounted,
    );

    // Both arms are judged where the presentation will put them. Leaving
    // the previous support goal here makes that old hand an obstacle to a
    // feasible two-handed presentation.
    const supported = (
      frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    ): IAutoMovieMotionHumanPosture =>
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
    const anchor: IAutoMovieMotionHumanWeaponPresent.Anchor =
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
    const target: IAutoMovieVector3 =
      aimed ?? Vector3.add(eye, Vector3.scale(ahead(entry.yaw), 10));
    const line: IAutoMovieVector3 = StrikingTarget.line(
      entry.root,
      target,
      entry.yaw + mounted,
    );
    const off: number =
      (Math.acos(
        Math.max(-1, Math.min(1, Vector3.dot(line, ahead(entry.yaw + mounted)))),
      ) *
        180) /
      Math.PI;
    // A seated turn has already refused a target past the trunk's reach and
    // brought the target to the arms' bound, so only an unturned
    // presentation is judged against it here.
    if (mounted === 0 && off > HumanWeaponPresent.TURN)
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
    const pose: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
      ((): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
        if (carriage === "aim") {
          // The bore on the line from the eye to the target, the arms out
          // (a handgun) or the butt drawn in to the shoulder (a long gun);
          // the pose is chosen and judged by both ends of the bore.
          const sight: IAutoMovieVector3 = Vector3.normalize(
            Vector3.subtract(target, eye),
          );
          const held = (
            out: number,
          ): IAutoMovieMotionHumanStrikingHeld.IHandFrame =>
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
          const chosen: IAutoMovieMotionHumanStrikingHeld.IHandFrame = held(
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
          const left: boolean = s.tool.side === "left";
          const hipName: AutoMovieHumanoidRegion = left ? "hipLeft" : "hipRight";
          const shoulderName: AutoMovieHumanoidRegion = left ? "shoulderLeft" : "shoulderRight";
          // The upper leg carries the hip skin landmark. Read its actual
          // planted fit instead of the authored angles used for trunk FK.
          const names: ReadonlySet<AutoMovieHumanoidBone> = new Set([
            context.body.surfaces.regions[hipName].bone,
            context.body.surfaces.regions[shoulderName].bone,
          ]);
          const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
          const shown: ReturnType<typeof poseBones> = poseBones(
            context.body,
            resolveHumanPosture.seeded(context.body, bladed, undefined, undefined, resolution, names).pose,
            resolution(),
            names,
          );
          const surface = (id: AutoMovieHumanoidRegion): IAutoMovieVector3 => {
            const region: typeof context.body.surfaces.regions.mouth =
              context.body.surfaces.regions[id];
            return resolveAutoMovieHumanoidSurfaces.place(
              region,
              shown.get(region.bone)!,
            ).point;
          };
          const hip: IAutoMovieVector3 = surface(hipName);
          const before: IAutoMovieVector3 = surface(shoulderName);
          const along: IAutoMovieVector3 = Vector3.normalize(
            Vector3.subtract(before, hip),
          );
          const held: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
            StrikingRoll.hand(
              context,
              shoulderTool,
              shoulderTool.length,
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
          const lift: number | undefined = HumanWeaponHeld.rise(
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
    // The stroke twists the trunk by the whole turn the pose was laid on.
    return {
      turn: turn + mounted,
      bladed: supported(pose),
      eye,
      target,
      line,
      carriage,
      pose,
      tool,
      back,
    };
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
}
