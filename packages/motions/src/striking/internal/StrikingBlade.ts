import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingAdvance,
  IAutoMovieMotionHumanStrikingBlade,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTrunk } from "../../compose/internal/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingAdvance } from "./StrikingAdvance";
import { StrikingBladeCoursed } from "./StrikingBladeCoursed";
import { StrikingBladeOnPath } from "./StrikingBladeOnPath";
import { StrikingHeld } from "./StrikingHeld";
import { StrikingSupport } from "./StrikingSupport";

/*
 * The stroke of a held tool, shared by every blade and firearm action: the tool
 * is taken from where the hand holds it to a ready pose, carried along a path
 * to its decisive pose, kept there and returned, while the feet stay or the
 * leading foot steps or lunges under it.
 *
 * The action states only tool poses (hand frames built by
 * StrikingHeld.hand); this owns the time course and the body. The clock
 * is a phrase with the standard instants: the tool leaves the entry hold for
 * the ready pose by `ready`, runs its path from `strokeStart`, is at its
 * decisive pose at `stroke`, follows through to `strokeEnd`, stays until
 * `relax` and is back in the entry hold at `end`, or, recovered to its guard
 * (`coursed`), back at the path's start along the path it came, or stays where
 * the stroke left it for an action that ends in its pose (a guard, a levelled
 * aim).
 *
 * An advance carries the body with the stroke: the leading foot leaves the
 * floor at `strokeStart` and lands at `stroke`, the pelvis travels a share of
 * the foot's travel and sinks until both legs reach their feet, and the foot
 * and the pelvis come back from `relax` to `end` (`StrikingAdvance`).
 */
export namespace StrikingBlade {
  /*
   * The holding arm's shoulder on the body as it stands at an instant of an
   * advance, for a caller that measures its reach.
   * Parameter context: The action's context.
   * Parameter side: The arm.
   * Parameter advance: How the body goes.
   * Parameter line: The horizontal unit line of the advance.
   * Parameter travel: How far the advance carries the leading foot, metres; its
   * full travel when absent.
   * Returns: The shoulder joint at the decisive instant, world metres.
   */
  export function shoulder(
    context: Pick<IAutoMovieMotionHumanActionContext, ShoulderContext>,
    side: AutoMovieHumanSide,
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

  /*
   * A posture with the trunk twisted about its own axis, the chest taking the
   * larger share, as `AutoMovieMotionHumanTrunk.turn` splits it.
   * Parameter posture: The posture.
   * Parameter degrees: The twist added, positive toward the performer's left.
   * Returns: The posture with the chest's and the spine's twist added.
   */
  export function turned(
    posture: IAutoMovieMotionHumanPosture,
    degrees: number,
  ): IAutoMovieMotionHumanPosture {
    if (degrees === 0) return posture;
    const add = (
      bone: TurnedAddBone,
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

  /*
   * Plan a stroke.
   * Parameter context: The action's context.
   * Parameter stroke: The stroke.
   * Parameter along: Whether the recovery draws the tool back along its path to the
   * path's start, its guard, and keeps it there, for a stroke whose path
   * keeps one basin of the arm; back to the entry hold when absent.
   * Returns: The plan, whose decisive instant is `stroke`.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext,
    stroke: IAutoMovieMotionHumanStrikingBlade.IStroke,
    along?: boolean,
  ): IAutoMovieMotionHumanActionPlan {
    const { tool, clock }: IAutoMovieMotionHumanStrikingBlade.IStroke = stroke;
    const body: IAutoMovieMotionHumanBody = context.body;
    const duration: number = clock.duration;
    const other: AutoMovieHumanSide = tool.side === "left" ? "right" : "left";
    const trunkBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>(["chest", `${tool.side}UpperArm`]);
    const trunkReader: ReturnType<typeof HumanTrunk.prepareResolve> =
      HumanTrunk.prepareResolve(body, trunkBones);
    const trunkAt: ReturnType<typeof HumanTrunk.prepareResolve> = (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof HumanTrunk.resolve>[3],
    ): ReturnType<typeof HumanTrunk.resolve> =>
      trunkReader(posture, resolution);
    const handBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${tool.side}Hand`]);
    const elbowBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${tool.side}LowerArm`]);
    const base: IAutoMovieMotionHumanActionPlan = StrikingAdvance.base(
      context,
      stroke,
    );
    // A support hand that already holds the same prop (a musket's left hand
    // from the butt to above the lock) keeps its grip through the stroke: a
    // held hand is driven only by an action that grips what it holds.
    const supporting: IAutoMovieMotionHumanHeld.IHeld | undefined =
      stroke.support !== null &&
      tool.held !== undefined &&
      context.entry.holds[other] === tool.held.prop
        ? AutoMovieMotionHumanHeld(context, other, tool.held.prop)
        : undefined;

    // The hand as displayed at the entry, kept relative to the root so it
    // travels with an advance.
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
      undefined,
      handBones,
    );
    const held: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
      point: AutoMovieEngineVector3.subtract(
        HumanHand.frame(body, bones, tool.side, "grip").point,
        context.entry.posture.root,
      ),
      rotation: bones.get(`${tool.side}Hand`)!.worldRotation,
    };
    const fingers: IAutoMovieMotionHumanPosture["joints"] =
      tool.prop === undefined
        ? HumanHand.shape(tool.side, "fist")
        : (StrikingHeld.holds(context, tool)[0]?.fingers ?? {});
    const supportingFingers: IAutoMovieMotionHumanPosture["joints"] =
      stroke.support === null ? {} : HumanHand.shape(other, "fist");
    const preparedGoal: ReturnType<typeof StrikingHeld.prepareGoal> =
      StrikingHeld.prepareGoal(context, tool, stroke.back);
    const goalFor = (
      at: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    ): IAutoMovieHumanLimbGoal => preparedGoal(at, { x: 0, y: 0, z: 0 });

    // How far the tool is from the entry hold to its path, in [0, 1].
    const present = (seconds: number): number =>
      stroke.stay
        ? clock.progress("start", "ready", seconds)
        : clock.envelope(["start", "ready"], ["relax", "end"], seconds);
    const shoulderOf = (
      posture: IAutoMovieMotionHumanPosture,
      read?: () => ReturnType<typeof HumanTrunk.resolve>,
    ): IAutoMovieVector3 =>
      (read?.() ?? trunkAt(posture)).get(`${tool.side}UpperArm`)!.worldPosition;

    // The holding shoulder where the stroke starts and where it lands.
    const ends: readonly [IAutoMovieVector3, IAutoMovieVector3] = [
      shoulderOf(base.posture(0)),
      shoulderOf(turned(base.posture(clock.at("stroke")), stroke.turn ?? 0)),
    ];
    const borne = (): readonly [IAutoMovieVector3, IAutoMovieVector3] => ends;
    const progressAt = (seconds: number): number =>
      stroke.stop *
      AutoMovieMotionClock.through(
        clock,
        ["strokeStart", "stroke", "strokeEnd"],
        seconds,
      );
    const frame = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      read?: () => ReturnType<typeof HumanTrunk.resolve>,
    ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
      const weight: number = present(seconds);

      // A stroke recovered to its guard draws the tool back the way it came,
      // from where the stroke left it to the path's start, the on-guard
      // line it attacked from, and keeps it there: the recovery of a fencing
      // attack ends on guard, not in the hold the blade was taken up in.
      if (along === true && weight < 1 && seconds > clock.at("relax"))
        return onPath(
          posture,
          seconds,
          read,
          progressAt(clock.at("relax")) * weight,
        );
      const at: IAutoMovieMotionHumanStrikingHeld.IHandFrame = onPath(
        posture,
        seconds,
        read,
        progressAt(seconds),
      );
      if (weight >= 1) return at;
      return {
        point: AutoMovieEngineVector3.lerp(
          AutoMovieEngineVector3.add(posture.root, held.point),
          at.point,
          weight,
        ),
        rotation: AutoMovieEngineQuaternion.slerp(held.rotation, at.rotation, weight),
      };
    };

    // The tool's frame at a progress along its path at a second, carried
    // with the advance and a followed target.
    const onPath: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      read: (() => ReturnType<typeof HumanTrunk.resolve>) | undefined,
      progress: number,
    ) => IAutoMovieMotionHumanStrikingHeld.IHandFrame = StrikingBladeOnPath({
      stroke,
      shoulderOf,
      borne,
    });

    // The holding arm's own solution at the decisive pose, the reference of
    // every goal of the stroke, so the fit stays on one side of its choices
    // from the entry hold to the return. Solved when the plan is prepared,
    // on the plan's own base and the target as the placed performance shows
    // it; each read before that solves it cold.
    // The elbow's hint is anchored there too: solved once at the decisive
    // pose and carried on the chest from the shoulder, since a hint solved
    // anew at each instant jumped by 0.24 m inside one 1/48 s step and
    // swapped the arm's configuration by itself.
    let prepared: IBladeAnchor | undefined;
    const carried = (
      posture: IAutoMovieMotionHumanPosture,
      hint: IAutoMovieVector3,
      read?: () => ReturnType<typeof HumanTrunk.resolve>,
    ): IAutoMovieVector3 => {
      const bones: ReturnType<typeof HumanTrunk.resolve> =
        read?.() ?? trunkAt(posture);
      return AutoMovieEngineVector3.add(
        bones.get(`${tool.side}UpperArm`)!.worldPosition,
        AutoMovieEngineQuaternion.rotateVector(bones.get("chest")!.worldRotation, hint),
      );
    };
    const anchor = (): IBladeAnchor => {
      // A stroke that starts from the pose the previous action holds keeps
      // that arm: its elbow's hint, carried on the chest as it stood, and
      // its reference, so the same pose is the same arm at the boundary.
      const entered: IAutoMovieHumanLimbGoal | undefined =
        stroke.kept === true
          ? context.entry.posture.limbs[`${tool.side}Arm`]
          : undefined;
      if (entered?.reference !== undefined) {
        const at: ReturnType<typeof HumanTrunk.resolve> = trunkAt(
          context.entry.posture,
        );
        return {
          reference: entered.reference,
          hint: AutoMovieEngineQuaternion.rotateVector(
            AutoMovieEngineQuaternion.inverse(at.get("chest")!.worldRotation),
            AutoMovieEngineVector3.subtract(
              entered.bend,
              at.get(`${tool.side}UpperArm`)!.worldPosition,
            ),
          ),
        };
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
      const goal: IAutoMovieHumanLimbGoal = goalFor(decisive);
      // The arm at the decisive pose, its elbow left to the body
      // (`StrikingHeld.goal`): the elbow it takes there is the hint carried
      // on the chest, and its solution the stroke's reference.
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const posed: IAutoMoviePose = resolveHumanPosture.seeded(
        body,
        {
          ...stood,
          limbs: {
            ...stood.limbs,
            [`${tool.side}Arm`]: {
              ...goal,
              bend: AutoMovieMotionHumanBend.hang(body, stood, tool.side),
            },
          },
        },
        undefined,
        {},
        resolution,
      ).pose;
      const elbow: IAutoMovieVector3 = poseBones(
        body,
        posed,
        resolution(),
        elbowBones,
      ).get(`${tool.side}LowerArm`)!.worldPosition;
      const bones: ReturnType<typeof HumanTrunk.resolve> = trunkAt(
        stood,
        resolution,
      );
      return {
        reference: HumanLimbFit.reference(posed, `${tool.side}Arm`),
        hint: AutoMovieEngineQuaternion.rotateVector(
          AutoMovieEngineQuaternion.inverse(bones.get("chest")!.worldRotation),
          AutoMovieEngineVector3.subtract(
            elbow,
            bones.get(`${tool.side}UpperArm`)!.worldPosition,
          ),
        ),
      };
    };
    return {
      duration,
      events: clock.events(),
      contacts: [
        ...base.contacts,
        ...StrikingHeld.grips(tool),
        ...(supporting === undefined
          ? []
          : [AutoMovieMotionHumanHeld.grip(supporting)]),
      ],
      contact: clock.at(stroke.decisive ?? "stroke"),
      holds: [
        ...StrikingHeld.holds(context, tool),
        ...(supporting === undefined
          ? []
          : [AutoMovieMotionHumanHeld.hold(context, supporting)]),
      ],
      ...(tool.wields === undefined ? {} : { wields: tool.wields }),
      hands: stroke.support === null ? [tool.side] : [tool.side, other],
      prepare: (): void => {
        base.prepare?.();
        prepared = anchor();
      },
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(source);
        const posture: IAutoMovieMotionHumanPosture = turned(
          base.posture(t, undefined, resolution, projection),
          (stroke.turn ?? 0) * present(t),
        );
        const read: () => ReturnType<
          typeof HumanTrunk.resolve
        > = (): ReturnType<typeof HumanTrunk.resolve> =>
          trunkAt(posture, resolution);
        const at: IAutoMovieMotionHumanStrikingHeld.IHandFrame = frame(
          posture,
          t,
          read,
        );
        const first: IAutoMovieHumanLimbGoal = goalFor(at);
        const arm: IBladeAnchor = prepared ?? anchor();
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
          [`${tool.side}Arm`]: {
            ...first,
            bend: carried(posture, arm.hint, read),
            reference: { ...arm.reference, weight: present(t) },
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
            ...supportingFingers,
          },
          limbs,
        };
      },
    };
  }

  /*
   * Plan a one-handed stroke with the arm laid as one admitted course
   * (`StrikingBladeCoursed`).
   * Parameter context: The action's context.
   * Parameter stroke: The stroke.
   * Parameter travel: The arm's own travel from the entry hold to the guard,
   * metres.
   * Returns: The plan, whose decisive instant is `stroke`, its arm coursed.
   * When no arm course meets the trajectory's
   * constraints, as the plan is composed.
   */
  export function coursed(
    context: IAutoMovieMotionHumanActionContext,
    stroke: IAutoMovieMotionHumanStrikingBlade.IStroke,
    travel: number,
  ): IAutoMovieMotionHumanActionPlan {
    return StrikingBladeCoursed(plan, context, stroke, travel);
  }
}

/*
 * The alternatives of `TurnedAddBone`'s site.
 */
type TurnedAddBone = "chest" | "spine";

/*
 * The alternatives of `ShoulderContext`'s site.
 */
type ShoulderContext = "body" | "entry";

/*
 * The holding arm's anchor at a stroke's decisive pose: the arm's solution
 * there, and its elbow's hint carried on the chest from the shoulder.
 */
interface IBladeAnchor {
  /*
   * The arm's solution at the decisive pose.
   */
  reference: IAutoMovieHumanLimbReference;

  /*
   * The elbow's hint from the shoulder in the chest's frame, metres.
   */
  hint: IAutoMovieVector3;
}
