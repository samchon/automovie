import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHandAttitude } from "../posture/HumanHandAttitude";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmCarryCourse } from "./AutoMovieMotionHumanArmCarryCourse";
import { AutoMovieMotionHumanArmChain } from "./AutoMovieMotionHumanArmChain";
import { AutoMovieMotionHumanArmFollow } from "./AutoMovieMotionHumanArmFollow";
import { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanChannel as HumanChannels } from "./AutoMovieMotionHumanChannel";

/**
 * An arm carried toward a goal: the joint-space carry between held angles
 * (`AutoMovieMotionHumanArmAngles`) and a goal, and the primitive that
 * writes an arm, planned over its action (`AutoMovieMotionHumanArmPlanned`)
 * or carried, the members `AutoMovieMotionHumanArm` names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two things the file holds, what the primitive delegates to and who names them.
 * @evidence contracts/development/design.md#principled-representation A free arm movement is described by its joint angles (Soechting and Lacquaniti 1981), so the carry reads and writes triples and solves a goal only to read its angles.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The carry, its record and its primitive; `AutoMovieMotionHumanArm` re-exports each by name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The blend and the clearing are their owners' (`blendHumanJoint`, `HumanArmClearing`), not restated.
 */
export namespace AutoMovieMotionHumanArmCarry {
  /**
   * Deprecated: a carry's path is the planner's, so a law moves its arm with
   * `carried` over its clock's span (`ICarry.span`), its goal's point and
   * contact the site, and this share-only carry and its clearing course
   * (`HumanArmClearing.course`) are retired once the last law has moved.
   *
   * A posture whose arms are carried in joint space between held angles and
   * their goals' solution: at share 0 each named arm holds the given angles,
   * at 1 the posture is returned as it is, and between them each joint is the
   * blend of its held rotation and the one the goal solves to
   * (`blendHumanJoint`), written as joints with the arm's goal removed.
   *
   * A hand leaving its rest for a goal, or returning, is on no surface, so
   * nothing asks its path to be straight; blending the solved joints keeps
   * the elbow on one course, where hand goals solved afresh each second may
   * change the arm's solution between seconds. The shoulder is blended as a
   * rotation, since a raised shoulder has two clinical triples and the solve
   * may return either; the elbow and the wrist, which lack a freedom, angle
   * by angle so they stay on their axes. The blended forearm is then kept
   * clear of the trunk, the thighs, the other arm and the bodies its goal
   * names (`HumanPosture.IGoal.clear`) by the shoulder's abduction and the
   * elbow's flexion (`HumanArmClearance.cleared`), each end keeping its room.
   *
   * @param body The body.
   * @param posture The posture, with the goals of the arms to carry.
   * @param from The held angles of each arm to carry; an arm absent is left as it is.
   * @param share How far each arm is from its held angles to its goal, clamped to [0, 1].
   * @param planned The posture with the goals the clearing course is planned against, the arrival's; the posture's own when absent. A course planned against a fixed arrival is a constant of the carry, so the arm moves continuously with the share; one planned against the goal of each second is solved again as the goal moves, and its least clear turn steps where it crosses a ridge of the room. The trade is that the keys are exactly clear for the arrival's goal and clear for the goal of a second only as far as that goal has moved from it.
   * @param source Optional same-body exact FK source borrowed only through this synchronous carry.
   * @param projection Optional genuine same-body direct ROM projector; both actual native pose solves still project every joint.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both ends, what is blended, why and what the result holds.
   * @evidence contracts/development/implementation.md#principled-implementation Free arm movements are smooth in joint space (Soechting and Lacquaniti 1981), so the transport blends the joints of the two ends and solves the goal only to read its joints; `blendHumanJoint` blends a ball joint as a rotation, which does not depend on the chart its triple is written in, and a joint with fewer freedoms angle by angle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture solve (two with a planned arrival), then three blended joints and one clearing course per arm (`HumanArmClearing.course`, solved at fixed shares of the carry so the turn does not step between two instants), each arm cleared in the pose the arms before it were written into.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shoulder takes the shorter arc between its two rotations, so neither a twist near 180 degrees nor a solution in its other chart swings the arm; the share is clamped so the arm cannot pass either end.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve for both arms and a second for planned arrival when given, none at either end. Fixed joint pairs prepare endpoint rotation/chart only at first interior use; every course key still runs the actual blend/clearing. Two paired endpoint baseline observations replace four duplicate full FK/clearance reads; their original scalar projection/interpolation remains.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual current/planned solves and baseline/cleared observations share one exact FK getter, optionally borrowed from the same-body parent; a genuine parent projector shares only direct ROM metadata. Body and endpoint triples stay unchanged during this carry, so between shares fixed endpoint preparation across original course shares; all varying poses, goals and clearing candidates remain actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous carry owns or borrows lazy FK/ROM metadata, existing per-key arm/pose maps and local course callbacks only until return/throw. No returned posture or goal retains the readers, projector, maps or callbacks.
   */
  export function carry(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    from: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >,
    share: number,
    planned?: IAutoMovieMotionHumanPosture,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IAutoMovieMotionHumanPosture {
    const s: number = Math.min(1, Math.max(0, share));
    const sides: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => from[side] !== undefined,
    );
    if (s >= 1 || sides.length === 0) return posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    if (s <= 0) {
      for (const side of sides) {
        const held: IAutoMovieMotionHumanArmAngles.IAngles = from[side]!;
        joints[`${side}UpperArm`] = held.upper;
        joints[`${side}LowerArm`] = held.lower;
        joints[`${side}Hand`] = held.hand;
        delete limbs[`${side}Arm`];
      }
      return { ...posture, joints, limbs };
    }
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const solved: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      resolution,
      undefined,
      projection,
    ).pose;
    const planning: IAutoMoviePose =
      planned === undefined
        ? solved
        : resolveHumanPosture.seeded(
            body,
            planned,
            undefined,
            undefined,
            resolution,
            undefined,
            projection,
          ).pose;
    const courses: ReturnType<typeof AutoMovieMotionHumanArmCarryCourse.arms> =
      AutoMovieMotionHumanArmCarryCourse.arms(
        body,
        sides,
        from,
        solved,
        planning,
        posture.limbs,
        resolution,
      );
    for (const side of sides) {
      const arm: IAutoMovieMotionHumanArmClearance.IArm = courses[side]!(s);
      joints[`${side}UpperArm`] = arm.upper;
      joints[`${side}LowerArm`] = arm.lower;
      joints[`${side}Hand`] = arm.hand;
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  }

  /**
   * An arm carried toward a goal by a weight: the arm's whole action planned
   * once as one trajectory with the other arms of its group
   * (`AutoMovieMotionHumanArmPlanned.planned`), read off the posture so far
   * the composer gives, over the span the caller states in its clock's
   * instants, or the span its weight states
   * (`AutoMovieMotionHumanArmPlanned.stated`). Without a span the arm keeps
   * the deprecated joint-space carry (`carry`), each law's until it states
   * its span. A
   * planned arm that follows a person (`ICarry.tracked`) is the plan with a
   * bounded correction toward the goal read at each second of the hold
   * (`AutoMovieMotionHumanArmFollow.follower`).
   *
   * @param props The carry.
   * @returns The primitive, on the arm's channel.
   * @throws {HumanRefusal} When a planned arm has no trajectory that meets its constraints: when its action is composed (`prepare`), or at the first second written where nothing composes it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ways an arm is carried, what each reads, the channel claimed and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A reach that lays a hand on a site is a motion-planning problem, solved as one trajectory over the action against the very postures it is written on (TrajOpt), so the plan is a constant of the action; a transport with no site keeps the joint-space carry (Soechting and Lacquaniti 1981). With an attitude, the hand between the ends is solved to it on the carried arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The group joined once; per second the planned arm or one `carry`, whose goal an arm without a span solves continued along the action's course (`AutoMovieMotionHumanArmChain`), then one hand solve with an attitude.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The group is solved once, when its first member is prepared on the posture before it, and a member asked while it is being solved throws instead of solving twice, and a solve that refuses keeps its refusal (`ITogether.refused`), which every later read of a member throws again instead of solving again; the hand's fingers are not claimed, so a row that shapes them composes with this one.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trajectory solve per group/action, refused or not; each write reads its cubic or carry, with no carry solve at weights 0/1. An interior attitude still evaluates all three actual hand-end postures, but canonical observations can omit only proven independent goals/digits and FK outputs only the hand; the final held solve retains its physical work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates planning/carry/attitude to their owners. A synchronous write borrows its host FK/ROM loans for actual fallback carry and hand observations/held solve; standalone writes own lazy metadata. Only exact prerequisites share, while distinct posture/goal requests remain actual solves.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive retains props, its group's trajectory and existing follower. A standalone fixed-posture reader is built outside the write environment, so a retained follower cannot capture that write's metadata through its fallback callback. Hand demand and FK/ROM loans end on return/throw; no output or plan stores them or new time/result history.
   */
  export function carried(
    props: IAutoMovieMotionHumanArmCarry.ICarry,
  ): IAutoMovieMotionHumanPrimitive {
    const limb: "leftArm" | "rightArm" = `${props.side}Arm`;
    const span: IAutoMovieMotionHumanArmPlanned.ISpan | undefined = props.span;

    // The arm's whole action, solved once over its span, with the other
    // arms of its group.
    const group: IAutoMovieMotionHumanArmPlanned.ITogether =
      props.beside ??
      props.together ??
      AutoMovieMotionHumanArmPlanned.together();
    group.carries.push(props);

    // A group planned beside solves each member alone on the shared base
    // (`IAutoMovieMotionHumanArmCarry.beside`): two problems of one arm's
    // nine coordinates, where one problem of both arms' eighteen costs
    // several times as much (measured on a six-second stretch: 95 s of a
    // 146 s spec in the joint problem's optimiser).
    const solve = (
      before: (seconds: number) => IAutoMovieMotionHumanPosture,
    ): Map<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanArmTrajectory.Trajectory
    > =>
      props.beside === undefined
        ? AutoMovieMotionHumanArmPlanned.planned(
            props.body,
            span!,
            group.carries,
            before,
            group,
            AutoMovieMotionHumanArmCarry.pace(group.carries),
          )
        : new Map(
            group.carries.flatMap(
              (
                member: IAutoMovieMotionHumanArmCarry.ICarry,
              ): [
                AutoMovieHumanSide,
                IAutoMovieMotionHumanArmTrajectory.Trajectory,
              ][] => [
                ...AutoMovieMotionHumanArmPlanned.planned(
                  member.body,
                  member.span === undefined ? span! : member.span,
                  [member],
                  before,
                  group,
                  AutoMovieMotionHumanArmCarry.pace([member]),
                ),
              ],
            ),
          );
    const planned = (
      before: (seconds: number) => IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanArmTrajectory.Trajectory => {
      if (group.solved === undefined) {
        // A refusal is the solve's outcome as a solution is: read again, it
        // is thrown again, not solved again.
        if (group.refused !== undefined) throw group.refused;
        if (group.solving === true)
          throw new Error(
            "Two arms moved together are solved from the first of them",
          );
        group.solving = true;
        try {
          group.solved = solve(before);
        } catch (error: unknown) {
          if (error instanceof HumanRefusal) group.refused = error;
          throw error;
        } finally {
          group.solving = false;
        }
      }
      return group.solved.get(props.side)!;
    };
    let follow:
      | ReturnType<typeof AutoMovieMotionHumanArmFollow.follower>
      | undefined;
    // An arm with no span solves its goal at each second along the action's
    // course (`AutoMovieMotionHumanArmChain`), each second continuing the
    // swivel the course chose before it, on the posture so far.
    let chain:
      | ReturnType<typeof AutoMovieMotionHumanArmChain.continued>
      | undefined;
    return {
      channels: [limb],
      reads: (seconds: number): readonly AutoMovieMotionHumanChannel[] =>
        span !== undefined &&
        props.tracked !== true &&
        props.attitude === undefined &&
        seconds > span.start &&
        (seconds <= span.end || span.relax >= span.end)
          ? []
          : HumanChannels.ORDER,
      from: props.from,
      to: props.to,
      // The group is planned when the action is, on the posture so far
      // before its first member, which leaves every member's arm out.
      ...(span === undefined
        ? {}
        : {
            prepare: (
              before: (seconds: number) => IAutoMovieMotionHumanPosture,
            ): void => void planned(before),
          }),
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        before?: (seconds: number) => IAutoMovieMotionHumanPosture,
        source?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
      ): IAutoMovieMotionHumanPosture => {
        const weight: number = props.weight(seconds);
        let out: IAutoMovieMotionHumanPosture;
        // The plan holds over its span, and on past its end where the hand
        // stays on its site to the end (`ISpan.relax` at `end`), as nothing
        // returns it. An arm that follows a person is the plan with a bounded
        // correction toward the goal read at each second of the hold.
        const so: (seconds: number) => IAutoMovieMotionHumanPosture =
          before ?? fixedPosture(posture);
        const arm = (at: number): IAutoMovieMotionHumanArmClearance.IArm =>
          props.tracked === true
            ? (follow ??= AutoMovieMotionHumanArmFollow.follower(
                props.body,
                props,
                span!,
                planned(so),
                so,
              ))(at, source, projection)
            : planned(so)(at);
        const placed = (
          on: IAutoMovieMotionHumanArmClearance.IArm,
        ): IAutoMovieMotionHumanPosture => {
          const joints: IAutoMovieMotionHumanPosture["joints"] = {
            ...posture.joints,
          };
          const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
            ...posture.limbs,
          };
          joints[`${props.side}UpperArm`] = on.upper;
          joints[`${props.side}LowerArm`] = on.lower;
          joints[`${props.side}Hand`] = on.hand;
          delete limbs[limb];
          return { ...posture, joints, limbs };
        };
        // The planned course holds through its span's last instant: a return
        // ends on its `back` there, and the rest-to-goal blend outside the
        // span, whose weight has fallen to none at that instant, would show
        // the rest instead.
        const onPlan: boolean =
          span !== undefined &&
          seconds > span.start &&
          (seconds <= span.end || span.relax >= span.end);
        const goaled = (
          at: IAutoMovieMotionHumanPosture,
          t: number,
          resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
          projector?: Parameters<typeof resolveHumanPosture.seeded>[6],
        ): IAutoMovieMotionHumanPosture => ({
          ...at,
          limbs: {
            ...at.limbs,
            [limb]: props.goal(at, t, resolution, projector),
          },
        });
        if (onPlan) out = placed(arm(seconds));
        else
          out = carry(
            props.body,
            span === undefined && before !== undefined && weight > 0
              ? (chain ??= AutoMovieMotionHumanArmChain.continued(
                  props.body,
                  props.to,
                  (t: number): IAutoMovieMotionHumanPosture =>
                    goaled(before(t), t),
                  [props.side],
                ))(seconds, goaled(posture, seconds, source, projection))
              : goaled(posture, seconds, source, projection),
            { [props.side]: props.rest },
            weight,
            undefined,
            source,
            projection,
          );
        if (props.attitude === undefined || !(weight > 0 && weight < 1))
          return out;

        // The hand held to its attitude on the arm as written
        // (`HumanHandAttitude`), between the hands its two ends show: weight 1
        // writes a planned arm's own hand, so its end is the plan's at the
        // hold's nearer edge, carried on the trunk now; the goal's fit else.
        const requested: ReadonlySet<AutoMovieHumanoidBone> =
          new Set<AutoMovieHumanoidBone>([`${props.side}Hand`]);
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(source);
        const hand: (
          at: IAutoMovieMotionHumanPosture,
        ) => IAutoMovieQuaternion = (
          at: IAutoMovieMotionHumanPosture,
        ): IAutoMovieQuaternion =>
          poseBones(
            props.body,
            resolveHumanPosture.seeded(
              props.body,
              at,
              undefined,
              undefined,
              resolution,
              requested,
              projection,
            ).pose,
            resolution(),
            requested,
          ).get(`${props.side}Hand`)!.worldRotation;
        const ended: IAutoMovieMotionHumanPosture = onPlan
          ? placed(arm(seconds <= span!.ready ? span!.ready : span!.relax))
          : {
              ...posture,
              limbs: {
                ...posture.limbs,
                [limb]: props.goal(posture, seconds, resolution, projection),
              },
            };
        return HumanHandAttitude.held(
          props.body,
          out,
          props.side,
          props.attitude(
            posture,
            seconds,
            hand(out),
            hand(
              carry(
                props.body,
                posture,
                { [props.side]: props.rest },
                0,
                undefined,
                resolution,
                projection,
              ),
            ),
            hand(ended),
            weight,
          ),
          resolution,
          projection,
        );
      },
    };
  }

  /**
   * The law's own speed bound over a group of carries: at each second the
   * fastest any of them declares (`ICarry.pace`); none where no carry
   * declares one, and the planner reads its reach pace.
   *
   * @param carries The carries planned together.
   * @returns The bound, metres per second by the action's seconds, or undefined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the combination and the default.
   * @evidence contracts/development/implementation.md#principled-implementation Arms planned as one problem share one speed bound; the fastest declared admits every member's own delivery.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter and one maximum per second.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A group with no declared pace keeps the planner's own.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the group per second read.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the carries.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the declaring carries only.
   */
  export function pace(
    carries: readonly IAutoMovieMotionHumanArmCarry.ICarry[],
  ): ((seconds: number) => number) | undefined {
    const declared: IAutoMovieMotionHumanArmCarry.ICarry[] = carries.filter(
      (c: IAutoMovieMotionHumanArmCarry.ICarry): boolean =>
        c.pace !== undefined,
    );
    if (declared.length === 0) return undefined;
    return (seconds: number): number =>
      Math.max(
        ...declared.map((c: IAutoMovieMotionHumanArmCarry.ICarry): number =>
          c.pace!(seconds),
        ),
      );
  }
}

/** A retained standalone follower needs only the original fixed posture. */
function fixedPosture(
  posture: IAutoMovieMotionHumanPosture,
): (seconds: number) => IAutoMovieMotionHumanPosture {
  return (): IAutoMovieMotionHumanPosture => posture;
}
