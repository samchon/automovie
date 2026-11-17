import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmClearing } from "../posture/HumanArmClearing";
import { HumanHandAttitude } from "../posture/HumanHandAttitude";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmFollow } from "./AutoMovieMotionHumanArmFollow";
import { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";

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
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both ends, what is blended, why and what the result holds.
   * @evidence contracts/development/implementation.md#principled-implementation Free arm movements are smooth in joint space (Soechting and Lacquaniti 1981), so the transport blends the joints of the two ends and solves the goal only to read its joints; `blendHumanJoint` blends a ball joint as a rotation, which does not depend on the chart its triple is written in, and a joint with fewer freedoms angle by angle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture solve (two with a planned arrival), then three blended joints and one clearing course per arm (`HumanArmClearing.course`, solved at fixed shares of the carry so the turn does not step between two instants), each arm cleared in the pose the arms before it were written into.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shoulder takes the shorter arc between its two rotations, so neither a twist near 180 degrees nor a solution in its other chart swings the arm; the share is clamped so the arm cannot pass either end.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve for both arms and a second for the planned arrival when one is given, none at either end; per arm a course reads at most two keys, each one clearing (`HumanArmClearing.of`) in a pose read once per key.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `resolveHumanPosture`, `angles`, `blendHumanJoint` and `HumanArmClearance`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function carry(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    from: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >,
    share: number,
    planned?: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    const s: number = Math.min(1, Math.max(0, share));
    const sides: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => from[side] !== undefined,
    );
    if (s >= 1 || sides.length === 0) return posture;
    const solved: IAutoMoviePose | null =
      s <= 0 ? null : resolveHumanPosture(body, posture);
    // The pose the clearing course is planned in: the arrival's, when the
    // caller names it, so the course is a plan constant and not re-solved
    // against the goal of each second.
    const planning: IAutoMoviePose | null =
      solved === null || planned === undefined
        ? solved
        : resolveHumanPosture(body, planned);
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    // Each carried arm at a share of the carry: the plain blend of its two
    // ends, and its course, the blend kept clear. An arm's course at a share
    // is solved in the pose every other carried arm has at that same share
    // (an earlier arm on its course, a later one on its plain blend), so two
    // arms that travel together keep clear of each other as they are shown,
    // and a course does not depend on the instant it is read at.
    type Arm = (share: number) => IAutoMovieMotionHumanArmClearance.IArm;
    const plains: Partial<Record<AutoMovieHumanSide, Arm>> = {};
    const courses: Partial<Record<AutoMovieHumanSide, Arm>> = {};
    for (const side of sides) {
      const held: IAutoMovieMotionHumanArmAngles.IAngles = from[side]!;
      const goal: IAutoMovieMotionHumanArmAngles.IAngles =
        solved === null
          ? held
          : AutoMovieMotionHumanArmAngles.angles(solved, side);
      const plain: Arm = (
        share: number,
      ): IAutoMovieMotionHumanArmClearance.IArm => ({
        upper: blendHumanJoint(
          body,
          `${side}UpperArm`,
          held.upper,
          goal.upper,
          share,
        ),
        lower: blendHumanJoint(
          body,
          `${side}LowerArm`,
          held.lower,
          goal.lower,
          share,
        ),
        hand: blendHumanJoint(body, `${side}Hand`, held.hand, goal.hand, share),
      });
      plains[side] = plain;
      const aimed: IAutoMovieMotionHumanArmAngles.IAngles =
        planning === null
          ? held
          : AutoMovieMotionHumanArmAngles.angles(planning, side);
      const plan: Arm = (
        share: number,
      ): IAutoMovieMotionHumanArmClearance.IArm => ({
        upper: blendHumanJoint(
          body,
          `${side}UpperArm`,
          held.upper,
          aimed.upper,
          share,
        ),
        lower: blendHumanJoint(
          body,
          `${side}LowerArm`,
          held.lower,
          aimed.lower,
          share,
        ),
        hand: blendHumanJoint(
          body,
          `${side}Hand`,
          held.hand,
          aimed.hand,
          share,
        ),
      });
      if (solved === null || planning === null) {
        courses[side] = plain;
        continue;
      }
      const others: readonly IAutoMovieMotionHumanColliders.IPlaced[] =
        posture.limbs[`${side}Arm`]?.clear ?? [];
      const posed: Map<number, IAutoMoviePose> = new Map();
      const pose = (share: number): IAutoMoviePose => {
        let at: IAutoMoviePose | undefined = posed.get(share);
        if (at === undefined) {
          at = planning;
          // Read after every arm's blend and course exist; an earlier arm
          // is on its course, a later one on its plain blend, so no two
          // courses wait on each other.
          for (const other of sides)
            if (other !== side)
              at = HumanArmClearance.posed(
                at,
                other,
                (sides.indexOf(other) < sides.indexOf(side)
                  ? courses[other]!
                  : plains[other]!)(share),
              );
          posed.set(share, at);
        }
        return at;
      };
      // Each of the room's two readings keeps the share's blend of its own
      // two ends: the depth an end's upper arm lies in the chest is not
      // room for the forearm on the way.
      const reading = (
        of: IAutoMovieMotionHumanArmClearance.IArm,
        share: number,
        which: keyof IAutoMovieMotionHumanArmClearance.IBaseline,
        fingers?: IAutoMovieMotionHumanArmAngles.IAngles["fingers"],
      ): number =>
        HumanArmClearance.room(
          body,
          fingers === undefined
            ? pose(share)
            : HumanArmClearance.fingered(pose(share), side, fingers),
          side,
          of,
          others,
          {
            forearm: which === "forearm" ? 0 : Infinity,
            segments: which === "segments" ? 0 : Infinity,
          },
        );
      let ends:
        | Record<
            keyof IAutoMovieMotionHumanArmClearance.IBaseline,
            readonly [number, number]
          >
        | undefined;
      const known: Map<number, IAutoMovieMotionHumanArmClearance.IArm> =
        new Map();
      // Between two arms that clear the body the blended one may not, so its
      // elbow is let out by as much as the forearm lacks; each end keeps the
      // room it holds, so the carry leaves and joins them without a step.
      // The turn is one course over the carry (`HumanArmClearing.course`),
      // so two neighbouring instants read neighbouring arms.
      courses[side] = (
        share: number,
      ): IAutoMovieMotionHumanArmClearance.IArm => {
        let arm: IAutoMovieMotionHumanArmClearance.IArm | undefined =
          known.get(share);
        if (arm === undefined) {
          arm = HumanArmClearing.course({
            plain,
            planned: plan,
            share,
            clear: (
              of: IAutoMovieMotionHumanArmClearance.IArm,
              key: number,
            ): IAutoMovieMotionHumanArmClearance.IArm => {
              ends ??= {
                forearm: [
                  reading(held, 0, "forearm", held.fingers),
                  reading(aimed, 1, "forearm"),
                ],
                segments: [
                  reading(held, 0, "segments", held.fingers),
                  reading(aimed, 1, "segments"),
                ],
              };
              return HumanArmClearance.cleared(
                body,
                pose(key),
                side,
                of,
                0,
                others,
                {
                  forearm: ends.forearm[0] * (1 - key) + ends.forearm[1] * key,
                  segments:
                    ends.segments[0] * (1 - key) + ends.segments[1] * key,
                },
              );
            },
          });
          known.set(share, arm);
        }
        return arm;
      };
    }
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The group joined once; per second the planned arm or one `carry`, then one hand solve with an attitude.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The group is solved once, when its first member is prepared on the posture before it, and a member asked while it is being solved throws instead of solving twice; the hand's fingers are not claimed, so a row that shapes them composes with this one.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trajectory solve per group and action; per written second one cubic read of it, or `carry`'s posture solve, none at weight 0 or 1; between the ends an attitude adds the hand's forward kinematics on the arm, the held end and the goal's end (a planned arm's own held hand, one more read of its plan), and `HumanHandAttitude.held`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanArmPlanned.planned`, `carry` and `HumanHandAttitude.held`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props and its group, which keeps the group's one solution.
   */
  export function carried(
    props: IAutoMovieMotionHumanArmCarry.ICarry,
  ): IAutoMovieMotionHumanPrimitive {
    const limb: "leftArm" | "rightArm" = `${props.side}Arm`;
    const span: IAutoMovieMotionHumanArmPlanned.ISpan | undefined = props.span;

    // The arm's whole action, solved once over its span, with the other
    // arms of its group.
    const group: IAutoMovieMotionHumanArmPlanned.ITogether =
      props.together ?? AutoMovieMotionHumanArmPlanned.together();
    group.carries.push(props);
    const planned = (
      before: (seconds: number) => IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanArmTrajectory.Trajectory => {
      if (group.solved === undefined) {
        if (group.solving === true)
          throw new Error(
            "Two arms moved together are solved from the first of them",
          );
        group.solving = true;
        group.solved = AutoMovieMotionHumanArmPlanned.planned(
          props.body,
          span!,
          group.carries,
          before,
        );
        group.solving = false;
      }
      return group.solved.get(props.side)!;
    };
    let follow:
      | ((seconds: number) => IAutoMovieMotionHumanArmClearance.IArm)
      | undefined;
    return {
      channels: [limb],
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
      ): IAutoMovieMotionHumanPosture => {
        const weight: number = props.weight(seconds);
        let out: IAutoMovieMotionHumanPosture;
        // The plan holds over its span, and on past its end where the hand
        // stays on its site to the end (`ISpan.relax` at `end`), as nothing
        // returns it. An arm that follows a person is the plan with a bounded
        // correction toward the goal read at each second of the hold.
        const so: (seconds: number) => IAutoMovieMotionHumanPosture =
          before ?? ((): IAutoMovieMotionHumanPosture => posture);
        const arm = (at: number): IAutoMovieMotionHumanArmClearance.IArm =>
          props.tracked === true
            ? (follow ??= AutoMovieMotionHumanArmFollow.follower(
                props.body,
                props,
                span!,
                planned(so),
                so,
              ))(at)
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
        const onPlan: boolean =
          span !== undefined &&
          seconds > span.start &&
          (seconds < span.end || span.relax >= span.end);
        if (onPlan) out = placed(arm(seconds));
        else
          out = carry(
            props.body,
            {
              ...posture,
              limbs: { ...posture.limbs, [limb]: props.goal(posture, seconds) },
            },
            { [props.side]: props.rest },
            weight,
          );
        if (props.attitude === undefined || !(weight > 0 && weight < 1))
          return out;

        // The hand held to its attitude on the arm as written
        // (`HumanHandAttitude`), between the hands its two ends show: weight 1
        // writes a planned arm's own hand, so its end is the plan's at the
        // hold's nearer edge, carried on the trunk now; the goal's fit else.
        const hand = (at: IAutoMovieMotionHumanPosture): IAutoMovieQuaternion =>
          poseBones(props.body, resolveHumanPosture(props.body, at)).get(
            `${props.side}Hand`,
          )!.worldRotation;
        const ended: IAutoMovieMotionHumanPosture = onPlan
          ? placed(arm(seconds <= span!.ready ? span!.ready : span!.relax))
          : {
              ...posture,
              limbs: { ...posture.limbs, [limb]: props.goal(posture, seconds) },
            };
        return HumanHandAttitude.held(
          props.body,
          out,
          props.side,
          props.attitude(
            posture,
            seconds,
            hand(out),
            hand(carry(props.body, posture, { [props.side]: props.rest }, 0)),
            hand(ended),
            weight,
          ),
        );
      },
    };
  }
}
