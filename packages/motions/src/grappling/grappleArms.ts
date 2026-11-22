import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClinch,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanPerception } from "../law/HumanPerception";
import { HumanRefusal } from "../law/HumanRefusal";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { touchHold } from "../touch/touchHold";
import { clinch } from "./clinch";

/**
 * The initiator's hands of a staged grapple laid on the partner as one arm
 * course (`courseArmGoal`): the reach from the entry's arm angles to the
 * grip, the grip held on the partner's named moving surface, and the
 * return, planned as one trajectory clear of the partner's other segments,
 * both hands together. The partner is read as perceived: a reaction time
 * behind the reach's start for the plan, and a feedback delay behind each
 * second on the hold, which the arm follows within the follower's bound
 * (`tracked`); the hand lies on the segments of the gripped region's bone
 * and its neighbours (`touchHold.others`). The fingers take the grip's shape
 * on the same envelope. A course per sample was what let an arm flip its
 * branch from one instant to the next (the staged takes' 180-degree upper
 * arm turns).
 *
 * @param props The scene's context, its floor plan, the gripped regions and the grip's clock.
 * @returns The floor plan with the hands laid on the partner.
 * @throws {HumanRefusal} When a gripping wrist would stand beyond the arm's reach on the hold, or no course meets the trajectory's constraints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is laid, on what, how the partner is read and why the course replaces the per-sample move.
 * @evidence contracts/development/implementation.md#principled-implementation A hand on a moving partner is one trajectory problem with branch continuity and clearance, planned from what is perceived and corrected by feedback within a bound.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The grip clock, the hand forms on the floor plan, the goals, then one course.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goal is the partner's own surface frame; the perception delays are the shared ones; a wrist beyond reach is refused.
 * @evidence contracts/development/implementation.md#efficient-algorithms One course for both hands; one partner read per goal sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses clinch placement, the hand target, the touch's partner colliders, the hand form and the shared course.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the course until it settles.
 */
export function grappleArms(
  props: grappleArms.IProps,
): IAutoMovieMotionHumanActionPlan {
  const { context, floor, regions, clock } = props;
  const p: IAutoMovieMotionHumanGrapple.IParams = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    p.partner,
  );
  const reach: number = clock.at("reach");
  const take: number = clock.at("take");
  const release: number = clock.at("release");
  const rest: number = clock.at("rest");
  // The hold's clock in the touch's names, for the partner's colliders.
  const held: IAutoMovieMotionClock = AutoMovieMotionClock.of(floor.duration, [
    { name: "ready", seconds: take },
    { name: "relax", seconds: release },
  ]);
  const sides: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
    (side: AutoMovieHumanSide): boolean => regions[side] !== undefined,
  );
  const needed: Set<AutoMovieHumanoidBone> = new Set(
    sides.map(
      (side: AutoMovieHumanSide): AutoMovieHumanoidBone =>
        partner.body.surfaces.regions[regions[side]!].bone,
    ),
  );
  const shoulder = (side: AutoMovieHumanSide): boolean =>
    regions[side]!.startsWith("shoulder");
  const forms: IAutoMovieMotionHumanPrimitive[] = sides.map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanHand.form(
        clock,
        side,
        ["reach", "take"],
        ["release", "rest"],
        "flat",
      ),
  );
  const others: Record<string, ReturnType<typeof touchHold.others>> = {};
  for (const side of sides)
    others[side] = touchHold.others(
      context,
      { subject: p.partner, region: regions[side]! },
      held,
    );
  const reachable: number = body.measure.upperArm + body.measure.forearm;

  // The partner as the performer has them at a second since the start:
  // a feedback delay behind on the hold, its ends included so the held
  // goal starts where the hold does, a reaction time behind elsewhere.
  const seen = (
    seconds: number,
  ): ReturnType<IAutoMovieMotionHumanPerformerReader["bones"]> =>
    partner.bones(
      Math.max(
        0,
        context.start +
          seconds -
          (seconds >= take && seconds <= release
            ? HumanPerception.HELD
            : HumanPerception.REACTION),
      ),
      needed,
    );
  // The horizontal tangent of a thigh at its normal, the way a hand's
  // fingers wrap it with the thumb up: one way for each hand.
  const around = (
    side: AutoMovieHumanSide,
    normal: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.normalize(
      Vector3.scale(
        Vector3.cross({ x: 0, y: 1, z: 0 }, normal),
        side === "left" ? 1 : -1,
      ),
    );
  const goal = (
    side: AutoMovieHumanSide,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieHumanLimbGoal => {
    const region: AutoMovieHumanoidRegion = regions[side]!;
    const contact: IAutoMovieMotionHumanClinch.IPlaceResult = clinch.place(
      partner.body,
      seen(seconds),
      region,
      0,
    );
    // The sleeve hand of the shoulder throw first separates along the
    // material's normal; the offset is zero at release and at the end.
    if (props.sleeve === side && seconds > release && seconds < rest) {
      const phase: number = (seconds - release) / (rest - release);
      contact.point = Vector3.add(
        contact.point,
        Vector3.scale(
          contact.normal,
          grappleArms.SEPARATION *
            body.measure.hand *
            Math.sin(Math.PI * phase) ** 2,
        ),
      );
    }
    const laid: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanArmTarget.goal(
      body,
      side,
      AutoMovieMotionHumanTarget.hand(body, posture, side, contact, {
        surface: "palm",
        shape: "flat",
        bend: "forward",
        // The palm lies open on the region: curled fingers folded the thumb
        // and tips into the partner's thigh or chest. On a shoulder its
        // fingers point up. On a thigh they wrap around it, so the thumb
        // lies along the cylinder, up the thigh, instead of across it.
        ...(shoulder(side)
          ? { forward: { x: 0, y: 1, z: 0 } }
          : region.startsWith("thigh")
            ? { forward: around(side, contact.normal) }
            : {}),
      }),
    );
    if (seconds >= take && seconds <= release) {
      const at: IAutoMovieVector3 = HumanTrunk.resolve(
        body,
        posture,
        undefined,
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
      ).get(`${side}UpperArm`)!.worldPosition;
      const offset: IAutoMovieVector3 = Vector3.subtract(laid.point, at);
      const distance: number = Vector3.length(offset);
      if (distance > reachable)
        throw new HumanRefusal({
          kind: "reach",
          axis: "partner",
          value: p.partner,
          reason: `the staged ${side} wrist needs ${distance.toFixed(3)} m to reach the partner's ${region} at ${seconds.toFixed(3)} s, beyond its ${reachable.toFixed(3)} m reach (world offset ${offset.x.toFixed(3)}, ${offset.y.toFixed(3)}, ${offset.z.toFixed(3)} m)`,
          fix: "reposition the two actors on closer marks or select a different staged scene",
        });
    }
    return { ...laid, ...others[side]!(posture, seconds) };
  };

  // The floor with the fingers shaped: the course is laid on it.
  const base: IAutoMovieMotionHumanActionPlan = {
    ...floor,
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture => {
      let posture: IAutoMovieMotionHumanPosture = floor.posture(...args);
      for (const form of forms) posture = form.write(posture, args[0]);
      return posture;
    },
  };
  const goals: IAutoMovieMotionHumanActionPlan = {
    ...base,
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = base.posture(...args);
      const seconds: number = args[0];
      if (seconds < reach || seconds > rest) return posture;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const side of sides)
        limbs[`${side}Arm`] = goal(side, posture, seconds);
      return { ...posture, limbs };
    },
  };
  // The plan's goals as perceived when the reach starts.
  const perceived =
    (side: AutoMovieHumanSide) =>
    (posture: IAutoMovieMotionHumanPosture): IAutoMovieHumanLimbGoal =>
      goal(side, posture, reach);
  const span: Parameters<typeof courseArmGoal>[0]["span"] = {
    start: reach,
    ready: take,
    relax: release,
    end: rest,
  };
  // The arms leave the floor's own arms as the reach starts, the angles
  // shown before it; the entry's were not, and the reach jumped from them.
  let begun: IAutoMoviePose | undefined;
  const start = (): IAutoMoviePose =>
    (begun ??= resolveHumanPosture(body, base.posture(reach)));
  let coursed: IAutoMovieMotionHumanActionPlan | undefined;
  const course = (): IAutoMovieMotionHumanActionPlan =>
    (coursed ??= courseArmGoal({
      body,
      plan: goals,
      base,
      side: sides[0]!,
      rest: AutoMovieMotionHumanArm.angles(start(), sides[0]!),
      span,
      perceived: perceived(sides[0]!),
      tracked: true,
      ...(sides.length < 2
        ? {}
        : {
            with: [
              {
                side: sides[1]!,
                rest: AutoMovieMotionHumanArm.angles(start(), sides[1]!),
                perceived: perceived(sides[1]!),
                tracked: true,
              },
            ],
          }),
    }));
  const plan: IAutoMovieMotionHumanActionPlan = {
    ...floor,
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture =>
      sides.length === 0 ? base.posture(...args) : course().posture(...args),
    settle: (): void => {
      coursed = undefined;
      floor.settle?.();
    },
  };
  courseArmGoal.SOURCES.set(plan, goals);
  return plan;
}

/**
 * Companion types and constants of {@link grappleArms}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
 * @evidence contracts/development/design.md#principled-representation The scene's context, floor plan, regions by hand and the grip's four instants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the grapple law hands its arms.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's context, plan, clock and region types.
 */
export namespace grappleArms {
  /** How far the shoulder throw's sleeve hand stands off the sleeve at the middle of its release, in hand lengths (provisional). */
  export const SEPARATION: number = 0.55;

  /** The scene's arms. */
  export interface IProps {
    /** The initiator's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGrapple.IParams>;

    /** The floor plan, whose posture the hands are laid on. */
    floor: IAutoMovieMotionHumanActionPlan;

    /** The partner's region each gripping hand is laid on. */
    regions: Readonly<
      Partial<Record<AutoMovieHumanSide, AutoMovieHumanoidRegion>>
    >;

    /** The grip's clock: `reach`, `take`, `release` and `rest`, seconds since the start. */
    clock: IAutoMovieMotionClock;

    /** The hand that separates along the sleeve on the release; none when absent. */
    sleeve?: AutoMovieHumanSide;
  }
}
