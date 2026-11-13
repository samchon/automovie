import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingAdvance } from "./StrikingAdvance";
import { StrikingHeld } from "./StrikingHeld";

/**
 * The stroke of a held tool, shared by every blade and firearm action: the
 * tool is taken from where the hand holds it to a ready pose, carried along
 * a path to its decisive pose, kept there and returned, while the feet stay
 * or the leading foot steps or lunges under it.
 *
 * The action states only tool poses (hand frames built by
 * {@link StrikingHeld.hand}); this owns the time course and the body. The
 * clock is a phrase with the standard instants: the tool leaves the entry
 * hold for the ready pose by `ready`, runs its path from `strokeStart`, is at
 * its decisive pose at `stroke`, follows through to `strokeEnd`, stays until
 * `relax` and is back in the entry hold at `end`, or stays where the stroke
 * left it for an action that ends in its pose (a guard, a levelled aim).
 *
 * An advance carries the body with the stroke: the leading foot leaves the
 * floor at `strokeStart` and lands at `stroke`, the pelvis travels a share of
 * the foot's travel and sinks until both legs reach their feet, and the foot
 * and the pelvis come back from `relax` to `end` (`StrikingAdvance`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the caller gives, what this owns, the instants each part moves on and the provisional lengths.
 * @evidence contracts/development/design.md#principled-representation A stroke is a sequence of tool poses on one phrase clock over a base that stays or advances: effector goals on a shared time axis, the root decided once for the stroke.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The stroke record, the advance, the planner and the shoulder a caller measures reach from; read by the blade and firearm lexicons.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tool kind and no technique is named here; lengths are shares of the body's measure.
 */
export namespace StrikingBlade {
  /** How the body goes with a stroke. */
  export type Advance = StrikingAdvance.Advance;

  /** The other hand's hold on a tool held in both hands. */
  export interface ISupport {
    /** Its grip socket from the first hand's, metres: `x` along the tool's axis, `y` along its edge, `z` along their cross product. */
    offset: IAutoMovieVector3;

    /** Which of the tool's directions the handle it wraps runs along: a sword's grip runs along the blade's axis, a pistol's along its sights' side. */
    handle: "axis" | "edge";
  }

  /** A stroke. */
  export interface IStroke {
    /** The tool. */
    tool: StrikingHeld.ITool;

    /** The clock, a phrase with the standard instants. */
    clock: AutoMovieMotionClock.IClock;

    /**
     * The tool's pose along the stroke.
     *
     * @param progress 0 at the ready pose, 1 at the decisive pose, more than 1 through the follow-through.
     * @returns The hand's grip frame, world.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the progress's three marks and the result's frame.
     * @evidence contracts/development/implementation.md#principled-implementation A path is a pure function of its progress, so the planner alone decides the time course.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The planner passes the progress unclamped above 1, so a follow-through is the path's own.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
     */
    path(progress: number): StrikingHeld.IHandFrame;

    /** The point of the tool that must stay on its path where the wrist cannot turn as asked, metres behind the working point. */
    back: number;

    /** Where the other hand holds the tool, or null when one hand holds it. */
    support: ISupport | null;

    /** The instant that is the action's decisive one; `stroke` when absent. */
    decisive?: string;

    /** How the body goes with it. */
    advance: Advance;

    /** The horizontal unit line an advance travels. */
    line: IAutoMovieVector3;

    /** Whether the tool stays in the pose the stroke left it in, instead of returning to the entry hold. */
    stay: boolean;

    /** The share of the path a stopped stroke is arrested at, in (0, 1]; 1 when the stroke runs its path. */
    stop: number;

    /** The trunk's twist while the tool is on its path, degrees, positive toward the performer's left: a shouldered long gun turns the support shoulder forward. 0 when absent. */
    turn?: number;
  }

  /**
   * The holding arm's shoulder on the body as it stands at an instant of an
   * advance, for a caller that measures its reach.
   *
   * @param context The action's context.
   * @param side The arm.
   * @param advance How the body goes.
   * @param line The horizontal unit line of the advance.
   * @returns The shoulder joint at the decisive instant, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instant and the result's frame.
   * @evidence contracts/development/implementation.md#principled-implementation The shoulder of the body as the advance leaves it at the decisive instant: the leading foot placed its full travel ahead, the pelvis carried and lowered until both legs reach, the same posture the plan shows then.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolution and one translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The advance's own posture is used, so the reach is measured on the body that performs it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One trunk resolution.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function shoulder(
    context: Pick<IHumanActionContext, "body" | "entry">,
    side: HumanHand.Side,
    advance: Advance,
    line: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return HumanTrunk.resolve(
      context.body,
      advance === "none"
        ? context.entry.posture
        : StrikingAdvance.stood(
            context,
            side,
            line,
            StrikingAdvance.travel(context, advance),
            null,
          ),
    ).get(`${side}UpperArm`)!.worldPosition;
  }

  /**
   * A posture with the trunk twisted about its own axis, the chest taking
   * the larger share, as `AutoMovieMotionHumanTrunk.turn` splits it.
   *
   * @param posture The posture.
   * @param degrees The twist added, positive toward the performer's left.
   * @returns The posture with the chest's and the spine's twist added.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is added, the sign and the split's owner.
   * @evidence contracts/development/implementation.md#principled-implementation Axial rotation of the trunk is mostly thoracic, so the chest takes `AutoMovieMotionHumanTrunk.CHEST` of the twist and the spine the rest; the pelvis and the feet are not turned.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two joints written over what the posture holds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A twist of 0 returns the posture unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function turned(posture: IHumanPosture, degrees: number): IHumanPosture {
    if (degrees === 0) return posture;
    const add = (
      bone: "chest" | "spine",
      share: number,
    ): readonly [number, number, number] => {
      const held: readonly [number, number, number] = posture.joints[bone] ?? [
        0, 0, 0,
      ];
      return [held[0], held[1], held[2] + share * degrees];
    };
    return {
      ...posture,
      joints: {
        ...posture.joints,
        chest: add("chest", AutoMovieMotionHumanTrunk.CHEST),
        spine: add("spine", 1 - AutoMovieMotionHumanTrunk.CHEST),
      },
    };
  }

  /**
   * Plan a stroke.   *
   * @param context The action's context.
   * @param stroke The stroke.
   * @returns The plan, whose decisive instant is `stroke`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the plan's decisive instant; the namespace states the time course.
   * @evidence contracts/development/implementation.md#principled-implementation The tool's pose is the path read at `AutoMovieMotionClock.through`, which passes the decisive pose at speed (a strike delivers its speed at its end, Putnam 1993), blended from and to the entry hold on the clock's minimum-jerk envelope (Flash and Hogan 1985); the body is decided first, from the advance alone, and both arms are fitted on it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The base, then the tool's frame at a second, then the two arm goals written on the base's posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The elbow hint is the arm's least-strain place with the hanging arm as its named fallback; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One elbow search per arm per evaluated posture, the cost of every shipped arm goal.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each posture is computed from the plan's constants; nothing is memoised.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the stroke and the entry state only.
   */
  export function plan(
    context: IHumanActionContext,
    stroke: IStroke,
  ): IHumanActionPlan {
    const { tool, clock }: IStroke = stroke;
    const body: IHumanBody = context.body;
    const duration: number = clock.duration;
    const other: HumanHand.Side = tool.side === "left" ? "right" : "left";
    const base: IHumanActionPlan = StrikingAdvance.base(context, stroke);

    // The hand as displayed at the entry, kept relative to the root so it
    // travels with an advance.
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const held: StrikingHeld.IHandFrame = {
      point: Vector3.subtract(
        HumanHand.frame(body, bones, tool.side, "grip").point,
        context.entry.posture.root,
      ),
      rotation: bones.get(`${tool.side}Hand`)!.worldRotation,
    };
    const fingers: IHumanPosture["joints"] =
      tool.prop === undefined
        ? HumanHand.shape(tool.side, "fist")
        : (StrikingHeld.holds(context, tool)[0]?.fingers ?? {});
    const bare: StrikingHeld.ITool = StrikingHeld.of(context, other);

    // How far the tool is from the entry hold to its path, in [0, 1].
    const present = (seconds: number): number =>
      stroke.stay
        ? clock.progress("start", "ready", seconds)
        : clock.envelope(["start", "ready"], ["relax", "end"], seconds);
    const frame = (
      posture: IHumanPosture,
      seconds: number,
    ): StrikingHeld.IHandFrame => {
      const progress: number =
        stroke.stop *
        AutoMovieMotionClock.through(
          clock,
          ["strokeStart", "stroke", "strokeEnd"],
          seconds,
        );
      const at: StrikingHeld.IHandFrame = stroke.path(
        stroke.stop < 1 ? Math.min(stroke.stop, progress) : progress,
      );
      const weight: number = present(seconds);
      if (weight >= 1) return at;
      return {
        point: Vector3.lerp(
          Vector3.add(posture.root, held.point),
          at.point,
          weight,
        ),
        rotation: Quaternion.slerp(held.rotation, at.rotation, weight),
      };
    };
    const bend = (
      posture: IHumanPosture,
      side: HumanHand.Side,
      goal: Pick<IHumanPosture.IGoal, "point" | "rotation">,
    ): IAutoMovieVector3 =>
      AutoMovieMotionHumanBend.solve({
        body,
        posture,
        side,
        point: goal.point,
        ...(goal.rotation === undefined ? {} : { rotation: goal.rotation }),
        fallback: "hang",
      });

    // The holding arm's own solution at the decisive pose, the reference of
    // every goal of the stroke, so the fit stays on one side of its choices
    // from the entry hold to the return. Built on first use, since the body
    // an advance leaves is read from the plan's own base.
    let anchored: IHumanPosture.IReference | undefined;
    const reference = (): IHumanPosture.IReference => {
      if (anchored !== undefined) return anchored;
      const stood: IHumanPosture = turned(
        base.posture(clock.at("stroke")),
        stroke.turn ?? 0,
      );
      const goal: IHumanPosture.IGoal = StrikingHeld.goal(
        context,
        tool,
        stroke.path(stroke.stop),
        stroke.back,
        { x: 0, y: 0, z: 0 },
      );
      anchored = resolveHumanPosture.reference(
        resolveHumanPosture(body, {
          ...stood,
          limbs: {
            ...stood.limbs,
            [`${tool.side}Arm`]: {
              ...goal,
              bend: bend(stood, tool.side, goal),
            },
          },
        }),
        `${tool.side}Arm`,
      );
      return anchored;
    };
    return {
      duration,
      events: clock.events(),
      contacts: [...base.contacts, ...StrikingHeld.grips(tool)],
      contact: clock.at(stroke.decisive ?? "stroke"),
      holds: StrikingHeld.holds(context, tool),
      ...(tool.wields === undefined ? {} : { wields: tool.wields }),
      hands: stroke.support === null ? [tool.side] : [tool.side, other],
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IHumanPosture = turned(
          base.posture(t),
          (stroke.turn ?? 0) * present(t),
        );
        const at: StrikingHeld.IHandFrame = frame(posture, t);
        const first: IHumanPosture.IGoal = StrikingHeld.goal(
          context,
          tool,
          at,
          stroke.back,
          { x: 0, y: 0, z: 0 },
        );
        const limbs: IHumanPosture["limbs"] = {
          ...posture.limbs,
          [`${tool.side}Arm`]: {
            ...first,
            bend: bend(posture, tool.side, first),
            reference: { ...reference(), weight: present(t) },
          },
        };
        if (stroke.support !== null) {
          // The other hand wraps the handle at its offset in the tool's own
          // axes, its knuckles the way the tool's other direction faces.
          const axis: IAutoMovieVector3 = Quaternion.rotateVector(
            at.rotation,
            tool.axis,
          );
          const edge: IAutoMovieVector3 = Quaternion.rotateVector(
            at.rotation,
            tool.edge,
          );
          const offset: IAutoMovieVector3 = stroke.support.offset;
          const along: boolean = stroke.support.handle === "axis";
          const second: Omit<AutoMovieMotionHumanArm.ITarget, "bend"> = {
            surface: "grip",
            shape: "fist",
            ...StrikingHeld.hand(
              bare,
              0,
              Vector3.add(
                at.point,
                Vector3.add(
                  Vector3.add(
                    Vector3.scale(axis, offset.x),
                    Vector3.scale(edge, offset.y),
                  ),
                  Vector3.scale(Vector3.cross(axis, edge), offset.z),
                ),
              ),
              along ? axis : edge,
              along ? edge : axis,
            ),
          };
          const wrist: HumanHand.IWrist = HumanHand.place(
            body,
            other,
            "grip",
            second.point,
            second.rotation,
            "fist",
          );
          limbs[`${other}Arm`] = AutoMovieMotionHumanArm.goal(body, other, {
            ...second,
            bend: bend(posture, other, wrist),
          });
        }
        return {
          ...posture,
          joints: {
            ...posture.joints,
            ...fingers,
            ...(stroke.support === null ? {} : HumanHand.shape(other, "fist")),
          },
          limbs,
        };
      },
    };
  }
}
