import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingAdvance,
  IAutoMovieMotionHumanStrikingBlade,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingAdvance } from "./StrikingAdvance";
import { StrikingHeld } from "./StrikingHeld";
import { StrikingSupport } from "./StrikingSupport";

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
  /**
   * The holding arm's shoulder on the body as it stands at an instant of an
   * advance, for a caller that measures its reach.
   *
   * @param context The action's context.
   * @param side The arm.
   * @param advance How the body goes.
   * @param line The horizontal unit line of the advance.
   * @param travel How far the advance carries the leading foot, metres; its full travel when absent.
   * @returns The shoulder joint at the decisive instant, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instant and the result's frame.
   * @evidence contracts/development/implementation.md#principled-implementation The shoulder of the body as the advance leaves it at the decisive instant: the leading foot placed its travel ahead, the pelvis carried and lowered until both legs reach, the same posture the plan shows then.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolution and one translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The advance's own posture is used, so the reach is measured on the body that performs it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One trunk resolution.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function shoulder(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">,
    side: IAutoMovieMotionHumanHand.Side,
    advance: IAutoMovieMotionHumanStrikingAdvance.Advance,
    line: IAutoMovieVector3,
    travel: number = StrikingAdvance.travel(context, advance),
  ): IAutoMovieVector3 {
    return HumanTrunk.resolve(
      context.body,
      advance === "none"
        ? context.entry.posture
        : StrikingAdvance.stood(context, side, line, travel, null),
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
  export function turned(
    posture: IAutoMovieMotionHumanPosture,
    degrees: number,
  ): IAutoMovieMotionHumanPosture {
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
    context: IAutoMovieMotionHumanActionContext,
    stroke: IAutoMovieMotionHumanStrikingBlade.IStroke,
  ): IAutoMovieMotionHumanActionPlan {
    const { tool, clock }: IAutoMovieMotionHumanStrikingBlade.IStroke = stroke;
    const body: IAutoMovieMotionHumanBody = context.body;
    const duration: number = clock.duration;
    const other: IAutoMovieMotionHumanHand.Side =
      tool.side === "left" ? "right" : "left";
    const base: IAutoMovieMotionHumanActionPlan = StrikingAdvance.base(
      context,
      stroke,
    );

    // The hand as displayed at the entry, kept relative to the root so it
    // travels with an advance.
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const held: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
      point: Vector3.subtract(
        HumanHand.frame(body, bones, tool.side, "grip").point,
        context.entry.posture.root,
      ),
      rotation: bones.get(`${tool.side}Hand`)!.worldRotation,
    };
    const fingers: IAutoMovieMotionHumanPosture["joints"] =
      tool.prop === undefined
        ? HumanHand.shape(tool.side, "fist")
        : (StrikingHeld.holds(context, tool)[0]?.fingers ?? {});

    // How far the tool is from the entry hold to its path, in [0, 1].
    const present = (seconds: number): number =>
      stroke.stay
        ? clock.progress("start", "ready", seconds)
        : clock.envelope(["start", "ready"], ["relax", "end"], seconds);
    const shoulderOf = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieVector3 =>
      HumanTrunk.resolve(body, posture).get(`${tool.side}UpperArm`)!
        .worldPosition;

    // The holding shoulder where the stroke starts and where it lands.
    let ends: readonly [IAutoMovieVector3, IAutoMovieVector3] | undefined;
    const borne = (): readonly [IAutoMovieVector3, IAutoMovieVector3] =>
      (ends ??= [
        shoulderOf(base.posture(0)),
        shoulderOf(turned(base.posture(clock.at("stroke")), stroke.turn ?? 0)),
      ]);
    const frame = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
      const progress: number =
        stroke.stop *
        AutoMovieMotionClock.through(
          clock,
          ["strokeStart", "stroke", "strokeEnd"],
          seconds,
        );
      const sought: IAutoMovieMotionHumanStrikingHeld.IHandFrame = stroke.path(
        stroke.stop < 1 ? Math.min(stroke.stop, progress) : progress,
        seconds,
      );

      // A path is laid from the shoulder as it stands to the shoulder the
      // advance brings, as if the body advanced with the stroke's own
      // progress. The body advances on its own time, so the hand is carried
      // by what the shoulder is ahead of or behind that: otherwise a lunge
      // drives the body through its own hand and folds the arm to its limit.
      const at: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
        stroke.advance === "none" || !(stroke.stop > 0)
          ? sought
          : {
              ...sought,
              point: Vector3.add(
                sought.point,
                Vector3.subtract(
                  shoulderOf(posture),
                  Vector3.lerp(
                    borne()[0],
                    borne()[1],
                    Math.min(1, Math.max(0, progress / stroke.stop)),
                  ),
                ),
              ),
            };
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

    // The holding arm's own solution at the decisive pose, the reference of
    // every goal of the stroke, so the fit stays on one side of its choices
    // from the entry hold to the return. Built on first use, since the body
    // an advance leaves is read from the plan's own base.
    // The elbow's hint is anchored there too: solved once at the decisive
    // pose and carried on the chest from the shoulder, since a hint solved
    // anew at each instant jumped by 0.24 m inside one 1/48 s step and
    // swapped the arm's configuration by itself.
    let anchored: IAutoMovieMotionHumanPosture.IReference | undefined;
    let hint: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const carried = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieVector3 => {
      reference();
      const bones: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
        body,
        posture,
      );
      return Vector3.add(
        bones.get(`${tool.side}UpperArm`)!.worldPosition,
        Quaternion.rotateVector(bones.get("chest")!.worldRotation, hint),
      );
    };
    const reference = (): IAutoMovieMotionHumanPosture.IReference => {
      if (anchored !== undefined) return anchored;

      // A stroke that starts from the pose the previous action holds keeps
      // that arm: its elbow's hint, carried on the chest as it stood, and
      // its reference, so the same pose is the same arm at the boundary.
      const entered: IAutoMovieMotionHumanPosture.IGoal | undefined =
        stroke.kept === true
          ? context.entry.posture.limbs[`${tool.side}Arm`]
          : undefined;
      if (entered?.reference !== undefined) {
        const at: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
          body,
          context.entry.posture,
        );
        hint = Quaternion.rotateVector(
          Quaternion.inverse(at.get("chest")!.worldRotation),
          Vector3.subtract(
            entered.bend,
            at.get(`${tool.side}UpperArm`)!.worldPosition,
          ),
        );
        anchored = entered.reference;
        return anchored;
      }
      const decisive: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
        stroke.path(stroke.stop, clock.at("stroke"));
      const stood: IAutoMovieMotionHumanPosture = StrikingSupport.posture(
        body,
        turned(base.posture(clock.at("stroke")), stroke.turn ?? 0),
        tool,
        decisive,
        stroke.support,
      );
      const goal: IAutoMovieMotionHumanPosture.IGoal = StrikingHeld.goal(
        context,
        tool,
        decisive,
        stroke.back,
        { x: 0, y: 0, z: 0 },
      );
      // The arm at the decisive pose, its elbow left to the body
      // (`StrikingHeld.goal`): the elbow it takes there is the hint carried
      // on the chest, and its solution the stroke's reference.
      const posed: IAutoMoviePose = resolveHumanPosture(body, {
        ...stood,
        limbs: {
          ...stood.limbs,
          [`${tool.side}Arm`]: {
            ...goal,
            bend: AutoMovieMotionHumanBend.hang(body, stood, tool.side),
          },
        },
      });
      const elbow: IAutoMovieVector3 = poseBones(body, posed).get(
        `${tool.side}LowerArm`,
      )!.worldPosition;
      const bones: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
        body,
        stood,
      );
      hint = Quaternion.rotateVector(
        Quaternion.inverse(bones.get("chest")!.worldRotation),
        Vector3.subtract(
          elbow,
          bones.get(`${tool.side}UpperArm`)!.worldPosition,
        ),
      );
      anchored = resolveHumanPosture.reference(posed, `${tool.side}Arm`);
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
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IAutoMovieMotionHumanPosture = turned(
          base.posture(t),
          (stroke.turn ?? 0) * present(t),
        );
        const at: IAutoMovieMotionHumanStrikingHeld.IHandFrame = frame(
          posture,
          t,
        );
        const first: IAutoMovieMotionHumanPosture.IGoal = StrikingHeld.goal(
          context,
          tool,
          at,
          stroke.back,
          { x: 0, y: 0, z: 0 },
        );
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
          [`${tool.side}Arm`]: {
            ...first,
            bend: carried(posture),
            reference: { ...reference(), weight: present(t) },
          },
        };
        if (stroke.support !== null) {
          limbs[`${other}Arm`] = StrikingSupport.goal(
            body,
            posture,
            tool,
            at,
            stroke.support,
          );
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
