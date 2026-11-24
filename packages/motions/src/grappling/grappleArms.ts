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

import { AutoMovieMotionPrepared } from "../compose/AutoMovieMotionPrepared";
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
 * course (`courseArmGoal`): the reach from the entry's arm angles to the grip,
 * the grip held on the partner's named moving surface, and the return, planned
 * as one trajectory clear of the partner's other segments, both hands together.
 * Both performers play one authored scene on one clock
 * (`HumanCoupled.grappling`), so the initiator's plan reads the partner where
 * the scene puts the partner at each second, a reaction time behind it on the
 * reach and a feedback delay behind it on the hold: an interception is aimed at
 * where the target will be, by an internal model of its motion (Zago, McIntyre,
 * Senot and Lacquaniti 2009, Exp Brain Res 192:571), and a rehearsed scene's
 * partner is known in advance, as the sumo tachiai's mutual start is. A reach
 * planned on the partner frozen as it was when the reach started kept the hold
 * on a charging or driven partner's old place, a belt grip at the tachiai 0.29
 * m beyond the place the partner had charged to, which no bounded follower can
 * close; the plan reads the scene's partner (`perceived`), so no follower
 * corrects it. The hand lies on the segments of the gripped region's bone and
 * its neighbours (`touchHold.others`). The fingers take the grip's shape on the
 * same envelope. A course per sample was what let an arm flip its branch from
 * one instant to the next (the staged takes' 180-degree upper arm turns).
 *
 * @param props The scene's context, its floor plan, the gripped regions and the
 *   grip's clock.
 * @returns The floor plan with the hands laid on the partner.
 * @throws {HumanRefusal} When a gripping wrist would stand beyond the arm's
 *   reach on the hold, or no course meets the trajectory's constraints.
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
  const held: IAutoMovieMotionClock = AutoMovieMotionClock(floor.duration, [
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
        // lies along the cylinder, up the thigh, instead of across it; on the
        // side of the chest likewise, the push's hazu grip with the thumb up
        // under the armpit and the fingers round the side.
        ...(shoulder(side)
          ? { forward: { x: 0, y: 1, z: 0 } }
          : region.startsWith("thigh") || region.startsWith("ribs")
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
      // The course's seams read the plan's own arm at the reach's start and
      // the return's end (`courseArmGoal`): there the floor's arm, not the
      // hand already laid on the partner.
      if (seconds <= reach || seconds >= rest) return posture;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const side of sides)
        limbs[`${side}Arm`] = goal(side, posture, seconds);
      return { ...posture, limbs };
    },
  };
  // The plan's goals as the scene places the partner at each second, under
  // the perception delays `seen` reads them through. This is the one
  // exception to planning on the partner as perceived when the reach starts
  // (`IAutoMovieMotionHumanArmCarry.ICarry.perceived`): a staged grapple is
  // one rehearsed scene both performers play on one clock
  // (`HumanCoupled.grappling`), so each knows the other's part before it is
  // played, as a choreography is known, and a tachiai's charge starts with
  // the reach itself, so no perception at the reach's start could foresee
  // it. A reach to a moving target is aimed at where the target will be
  // (Zago et al. 2009); here that is the scene's own partner. Nothing reads
  // a performer the scene does not hold for both, and the reaction and
  // feedback delays still apply. The plan already holds the partner's
  // motion, so no follower corrects toward it.
  const scene =
    (side: AutoMovieHumanSide) =>
    (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieHumanLimbGoal =>
      goal(side, posture, seconds);

  // The arms leave the floor's own arms as the reach starts, the angles
  // shown before it; the entry's were not, and the reach jumped from them.
  const begun: IAutoMoviePose = resolveHumanPosture(body, base.posture(reach));
  const start = (): IAutoMoviePose => begun;
  const lay = (end: number): IAutoMovieMotionHumanActionPlan => {
    const laid: IAutoMovieMotionHumanActionPlan = courseArmGoal({
      context,
      plan: goals,
      base,
      side: sides[0]!,
      rest: AutoMovieMotionHumanArm.angles(start(), sides[0]!),
      span: { start: reach, ready: take, relax: release, end },
      perceived: scene(sides[0]!),
      ...(sides.length < 2
        ? {}
        : {
            with: [
              {
                side: sides[1]!,
                rest: AutoMovieMotionHumanArm.angles(start(), sides[1]!),
                perceived: scene(sides[1]!),
              },
            ],
          }),
    });
    // The course is planned as it is first read.
    laid.posture(take);
    return laid;
  };
  // The return takes the time the course's own path back around the two
  // bodies needs: where the planner finds the authored return too fast, it
  // states the least seconds the action needs at its pace, and the return,
  // the one phase no partner's beat fixes, is stretched by that ratio within
  // the scene.
  const laid = (): IAutoMovieMotionHumanActionPlan => {
    try {
      return lay(rest);
    } catch (error: unknown) {
      const end: number | undefined = grappleArms.stretched(
        error,
        floor.duration,
        release,
        rest,
      );
      if (end === undefined) throw error;
      return lay(end);
    }
  };
  // The course is laid when the plan is prepared; a read before lays it
  // afresh and keeps nothing.
  const coursed: AutoMovieMotionPrepared.IValue<IAutoMovieMotionHumanActionPlan> =
    AutoMovieMotionPrepared(laid);
  const plan: IAutoMovieMotionHumanActionPlan = {
    ...floor,
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture =>
      sides.length === 0
        ? base.posture(...args)
        : coursed.read().posture(...args),
    prepare: (): void => {
      floor.prepare?.();
      if (sides.length !== 0) coursed.prepare().prepare?.();
    },
    goals,
  };
  return plan;
}

/** Companion types and constants of {@link grappleArms}. */
export namespace grappleArms {
  /**
   * The return's end the planner's own answer asks for: when a course refuses
   * its duration with the least seconds the action needs at its pace, the
   * return (from `release` to `rest`) stretched by that ratio, kept within the
   * action; none for any other refusal, or one the stretch cannot meet.
   *
   * @param error What the course threw.
   * @param duration The action's seconds.
   * @param release The release, seconds since the start.
   * @param rest The authored rest, seconds since the start.
   * @returns The stretched rest, seconds since the start, or none.
   * @evidence contracts/development/common.md#meaningful-documentation States which refusal is read, the stretch and when none is given.
   * @evidence contracts/development/implementation.md#principled-implementation The planner states the uniform time stretch its path needs; the free phase takes that stretch.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One test of the refusal, one ratio.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the planner's own feasible range; a return that cannot fit the scene is refused as before.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the refusal.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function stretched(
    error: unknown,
    duration: number,
    release: number,
    rest: number,
  ): number | undefined {
    if (!(error instanceof HumanRefusal) || error.axis !== "duration")
      return undefined;
    const feasible: HumanRefusal["feasible"] = error.feasible;
    if (
      feasible === null ||
      feasible.kind !== "range" ||
      feasible.minimum === null ||
      !(feasible.minimum > duration)
    )
      return undefined;
    const end: number =
      release + ((rest - release) * feasible.minimum) / duration;
    return end <= duration ? end : undefined;
  }
  /**
   * How far the shoulder throw's sleeve hand stands off the sleeve at the
   * middle of its release, in hand lengths (provisional).
   */
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

    /**
     * The grip's clock: `reach`, `take`, `release` and `rest`, seconds since
     * the start.
     */
    clock: IAutoMovieMotionClock;

    /**
     * The hand that separates along the sleeve on the release; none when
     * absent.
     */
    sleeve?: AutoMovieHumanSide;
  }
}
