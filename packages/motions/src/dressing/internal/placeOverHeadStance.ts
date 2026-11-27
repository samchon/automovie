import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlaceOverHead,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanTouchStance } from "../../compose/internal/AutoMovieMotionHumanTouchStance";
import { HumanTrunkLean } from "../../handling/internal/HumanTrunkLean";
import { pickUpAdjust } from "../../handling/internal/pickUpAdjust";
import type { pickUpPosture } from "../../handling/internal/pickUpPosture";
import { HumanRefusal } from "../../law/HumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { placeOverHeadPath } from "./placeOverHeadPath";

/**
 * A neck-loop dresser's stance (`placeOverHead`): the first of standing where
 * it entered and one adjustment step toward the hands' place at the crown from
 * which both hands clear the crown, each shoulder within its arm of the hand's
 * place at the path's apex or brought within it by the hip hinge, as
 * Vahrenkamp, Asfour and Dillmann 2013's Algorithm 1 tries base poses
 * (`AutoMovieMotionHumanTouchStance.choose`). Read from the plan's context,
 * arms, entry, reach and path.
 *
 * A refusal here is the geometry's, not the step's: the small woman (`f-small`,
 * reach 0.462 m) setting a ribbon from in front over the seated average man's
 * head, her feet 0.3 m before his seat's front edge, has the hand's place at
 * the apex 0.85 m ahead of and 0.32 m above her shoulder, 0.67 m ahead after
 * the step; standing at his knees and hinged at the hip at any angle (a 0.45 m
 * trunk), her shoulder comes no nearer it than 0.56 m, past her reach, so no
 * step limit could admit the layout and the refusal names the reach.
 *
 * @param scope What the plan chooses the stance from.
 * @returns The chosen stance and the context as a stance.
 * @throws {HumanRefusal} When no stance clears the crown.
 */
export function placeOverHeadStance(
  scope: placeOverHeadStance.IScope,
): placeOverHeadStance.IChosen {
  const {
    context,
    p,
    body,
    side,
    other,
    entry,
    pose,
    shoulders,
    reach,
    path,
    holding,
    grasping,
  }: placeOverHeadStance.IScope = scope;
  // A stance from which both hands clear the crown: each shoulder within
  // its arm of the hand's place at the path's apex, or brought within it
  // by the hip hinge the descent takes (`HumanTrunkLean`). A crown no
  // hinge brings within the arm is refused, naming the partner.
  const crowned = (
    stance: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture => {
    const placed: ReturnType<typeof poseBones> =
      stance === entry
        ? pose
        : poseBones(
            body,
            resolveHumanPosture(body, stance),
            undefined,
            shoulders,
          );
    const from: IAutoMovieMotionHumanActionContext<object> = on(stance);
    const targets: readonly (readonly [
      AutoMovieHumanSide,
      IAutoMovieMotionHumanArmTarget.ITarget,
    ])[] = [
      [side, holding(path.apex)],
      [other, grasping(path.apex)],
    ];
    for (const [arm, target] of targets) {
      const shoulder: IAutoMovieVector3 = placed.get(
        `${arm}UpperArm`,
      )!.worldPosition;
      const miss: number = Vector3.distance(shoulder, target.point) - reach;
      if (miss <= 0) continue;
      if (
        !AutoMovieMotionHumanTouchStance.reaches(
          (wrist: HumanTrunkLean.IWrist): number =>
            HumanTrunkLean.least(from, [wrist]),
          {
            side: arm,
            point: AutoMovieMotionHumanArmTarget.goal(body, arm, target).point,
            rotation: target.rotation,
          },
        )
      )
        throw new HumanRefusal({
          kind: "reach",
          axis: "partner",
          value: p.partner,
          feasible: {
            kind: "range",
            minimum: null,
            maximum: reach,
            unit: "m",
          },
          reason: `the ${arm} hand would pass ${(miss * 1000).toFixed(0)} mm beyond the arm's reach to clear the partner's crown`,
          fix: "have the partner bow, kneel or sit first, or stand nearer",
        });
    }
    return stance;
  };

  // The context as the stance a candidate stands in: the hip hinge is
  // solved on it.
  const on = (
    stance: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanActionContext<object> =>
    stance === entry
      ? context
      : { ...context, entry: { ...context.entry, posture: stance } };

  // The dresser's stance is chosen as Vahrenkamp et al. 2013's Algorithm 1
  // tries base poses (`AutoMovieMotionHumanTouchStance.choose`)
  // between the law's two candidates in this order: standing where it
  // entered, then one adjustment step toward the hand's place at the
  // path's apex (`pickUpAdjust.stepped`: Tomita et al. 2024's step
  // timing, a step bounded by `pickUpAdjust.STEP`), as a dresser steps in
  // to a seated partner's knees. The step is taken only where its stance
  // clears the crown.
  const standing: pickUpPosture.IStance = {
    posture: entry,
    at: (): IAutoMovieMotionHumanPosture => entry,
    lower: (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => posture,
  };
  const stance: IStance = AutoMovieMotionHumanTouchStance.choose<
    Stance,
    IStance
  >({
    candidates: ["standing", "stepped"],
    reach: (candidate: Stance): IStance => {
      if (candidate === "standing") {
        crowned(entry);
        return { posture: entry, stride: null };
      }
      const stride: pickUpPosture.IStance | null = pickUpAdjust.stepped(
        context,
        side,
        AutoMovieMotionHumanArmTarget.goal(body, side, holding(path.apex))
          .point,
        standing,
        undefined,
        reach,
        (posture: IAutoMovieMotionHumanPosture): boolean =>
          AutoMovieMotionHumanTouchStance.reaches(crowned, posture),
      );
      if (stride === null || stride.step === undefined)
        throw new HumanRefusal({
          kind: "reach",
          axis: "partner",
          value: p.partner,
          reason:
            "no adjustment step brings both hands within their arms above the partner's crown",
          fix: "have the partner bow, kneel or sit first, or stand nearer",
        });
      return { posture: stride.posture, stride };
    },
  });

  return { on, stance };
}

/** What a neck-loop dresser's stance reads and what it is. */
export namespace placeOverHeadStance {
  /** What a neck-loop plan chooses its stance from. */
  export interface IScope {
    /** The action's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPlaceOverHead>;

    /** The action's parameters. */
    p: IAutoMovieMotionHumanPlaceOverHead;

    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The hand that holds the loop at entry. */
    side: AutoMovieHumanSide;

    /** The hand that takes the loop's other handle. */
    other: AutoMovieHumanSide;

    /** The entry posture. */
    entry: IAutoMovieMotionHumanPosture;

    /** The entry pose's bones. */
    pose: ReturnType<typeof poseBones>;

    /** The shoulder joints a stance is read at. */
    shoulders: ReadonlySet<AutoMovieHumanoidBone>;

    /** The arm's reach, metres. */
    reach: number;

    /** The loop's path. */
    path: placeOverHeadPath.IPath;

    /**
     * The holding hand's target for a loop frame.
     *
     * @param frame The loop's frame.
     * @returns The target.
     */
    holding: (
      frame: IAutoMovieRigidTransform,
    ) => IAutoMovieMotionHumanArmTarget.ITarget;

    /**
     * The other hand's target for a loop frame.
     *
     * @param frame The loop's frame.
     * @returns The target.
     */
    grasping: (
      frame: IAutoMovieRigidTransform,
    ) => IAutoMovieMotionHumanArmTarget.ITarget;
  }

  /** The chosen stance and the context as a stance. */
  export interface IChosen {
    /**
     * The context as the stance a candidate stands in.
     *
     * @param stance The stance.
     * @returns The context on it.
     */
    on: (
      stance: IAutoMovieMotionHumanPosture,
    ) => IAutoMovieMotionHumanActionContext<object>;

    /** The dresser's chosen stance. */
    stance: IStance;
  }
  /** The dresser's chosen stance. */
  export interface IStance {
    /** The posture the dresser stands in at the crown. */
    posture: IAutoMovieMotionHumanPosture;

    /** The adjustment step that brings it there; null standing where it entered. */
    stride: pickUpPosture.IStance | null;
  }
}

/** The dresser's chosen stance (`placeOverHeadStance.IStance`). */
type IStance = placeOverHeadStance.IStance;
/** The stances a dresser is placed in, in the law's order. */
type Stance = "standing" | "stepped";
