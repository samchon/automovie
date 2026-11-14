import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmClearing } from "../posture/HumanArmClearing";
import type { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandAttitude } from "../posture/HumanHandAttitude";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

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
   * names (`IHumanPosture.IGoal.clear`) by the shoulder's abduction and the
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
    body: IHumanBody,
    posture: IHumanPosture,
    from: Partial<Record<HumanHand.Side, AutoMovieMotionHumanArmAngles.IAngles>>,
    share: number,
    planned?: IHumanPosture,
  ): IHumanPosture {
    const s: number = Math.min(1, Math.max(0, share));
    const sides: HumanHand.Side[] = (["left", "right"] as const).filter(
      (side: HumanHand.Side): boolean => from[side] !== undefined,
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
    const joints: IHumanPosture["joints"] = { ...posture.joints };
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    // Each carried arm at a share of the carry: the plain blend of its two
    // ends, and its course, the blend kept clear. An arm's course at a share
    // is solved in the pose every other carried arm has at that same share
    // (an earlier arm on its course, a later one on its plain blend), so two
    // arms that travel together keep clear of each other as they are shown,
    // and a course does not depend on the instant it is read at.
    type Arm = (share: number) => HumanArmClearance.IArm;
    const plains: Partial<Record<HumanHand.Side, Arm>> = {};
    const courses: Partial<Record<HumanHand.Side, Arm>> = {};
    for (const side of sides) {
      const held: AutoMovieMotionHumanArmAngles.IAngles = from[side]!;
      const goal: AutoMovieMotionHumanArmAngles.IAngles = solved === null ? held : AutoMovieMotionHumanArmAngles.angles(solved, side);
      const plain: Arm = (share: number): HumanArmClearance.IArm => ({
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
      const aimed: AutoMovieMotionHumanArmAngles.IAngles = planning === null ? held : AutoMovieMotionHumanArmAngles.angles(planning, side);
      const plan: Arm = (share: number): HumanArmClearance.IArm => ({
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
      const others: readonly HumanColliders.IPlaced[] =
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
        of: HumanArmClearance.IArm,
        share: number,
        which: keyof HumanArmClearance.IBaseline,
        fingers?: AutoMovieMotionHumanArmAngles.IAngles["fingers"],
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
        | Record<keyof HumanArmClearance.IBaseline, readonly [number, number]>
        | undefined;
      const known: Map<number, HumanArmClearance.IArm> = new Map();
      // Between two arms that clear the body the blended one may not, so its
      // elbow is let out by as much as the forearm lacks; each end keeps the
      // room it holds, so the carry leaves and joins them without a step.
      // The turn is one course over the carry (`HumanArmClearing.course`),
      // so two neighbouring instants read neighbouring arms.
      courses[side] = (share: number): HumanArmClearance.IArm => {
        let arm: HumanArmClearance.IArm | undefined = known.get(share);
        if (arm === undefined) {
          arm = HumanArmClearing.course({
            plain,
            planned: plan,
            share,
            clear: (
              of: HumanArmClearance.IArm,
              key: number,
            ): HumanArmClearance.IArm => {
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
      const arm: HumanArmClearance.IArm = courses[side]!(s);
      joints[`${side}UpperArm`] = arm.upper;
      joints[`${side}LowerArm`] = arm.lower;
      joints[`${side}Hand`] = arm.hand;
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  }

  /**
   * One arm carried toward a goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit and the range of the weight.
   * @evidence contracts/development/design.md#principled-representation The span the arm is written over, the angles it holds at weight 0, the goal it solves to at weight 1 and the weight between them; with a span, the action's instants and what the planned trajectory needs of the hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Thirteen members, all read by `carried` or by `AutoMovieMotionHumanArmPlanned.planned`: seven that every carry needs, five a planned arm reads (`span`, `together`, `on`, `disc`, `rests`) and the hand's `attitude`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The goal is the posture's own goal type as a function of the posture so far, so any owner of arm goals fits.
   */
  export interface ICarry {
    /** The body. */
    body: IHumanBody;

    /** The arm. */
    side: HumanHand.Side;

    /** Seconds since the action's start from which the arm is written. */
    from: number;

    /** Seconds since the action's start until which the arm is written. */
    to: number;

    /** The angles the arm holds at weight 0. */
    rest: AutoMovieMotionHumanArmAngles.IAngles;

    /**
     * The goal the arm solves to at weight 1.
     *
     * @param posture The posture so far at this second.
     * @param seconds Seconds since the action's start.
     * @returns The goal.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States each argument and when the function is called.
     * @evidence contracts/development/implementation.md#principled-implementation A goal that rides on the trunk is a function of the posture so far, evaluated when the row is written.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `carried`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goal is used as returned, with no second form for a fixed goal.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    goal(posture: IHumanPosture, seconds: number): IHumanPosture.IGoal;

    /**
     * How far the arm is from its held angles to its goal.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, and that the result is a share in [0, 1].
     * @evidence contracts/development/implementation.md#principled-implementation The share is a pure function of the seconds, so any time course fits one member and the reader evaluates it at each second it needs.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `carried`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `carry` clamps the result to [0, 1] instead of trusting the member.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    weight(seconds: number): number;

    /** The action's instants when the arm's whole action is planned as one trajectory (`AutoMovieMotionHumanArmPlanned.planned`): the reach, the hold on the goal's site and the return; the weight's carry when absent. */
    span?: AutoMovieMotionHumanArmPlanned.ISpan;

    /** The arms planned over the same span as one problem; this arm alone when absent. */
    together?: AutoMovieMotionHumanArmPlanned.ITogether;

    /** The bone of the performer's own body the hand's region rides, for a region of the performer: a region on another arm of the group rides that arm as it is solved. */
    on?: AutoMovieHumanoidBone;

    /** The radius about its site the hand's contact may land within on the hold, metres: the site's own, or the region's extent; the contact skin the audits read a hand on its region with (`AutoMovieMotionHumanAuditTangle.BUILT`) when absent. */
    disc?: number;

    /** The arm's segments that lie on a bone of the same body over the hold (a self-hug's forearm on the other forearm); none when absent. */
    rests?: readonly { part: "upperArm" | "lowerArm"; on: string }[];
    /**
     * The hand's world rotation on the way, for a hand that holds an object
     * whose attitude matters (a glass kept upright), solved at the wrist on the
     * arm the blend places (`HumanHandAttitude.held`); the blend when absent.
     * Read only between the ends, it must meet the held end's hand at weight
     * 0 and the goal's at 1, or the hand steps as the carry leaves or joins.
     *
     * @param posture The posture so far at this second.
     * @param seconds Seconds since the action's start.
     * @param hand The hand's world rotation the blend gives.
     * @param start The hand's world rotation the held end (weight 0) shows at this second.
     * @param end The hand's world rotation the goal's end (weight 1) shows at this second: the goal as its fit reaches it.
     * @param weight The carry's weight at this second, in (0, 1).
     * @returns The hand's world rotation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what is solved, where, and the default.
     * @evidence contracts/development/implementation.md#principled-implementation A blend of the wrist's angles does not hold a world attitude, since the forearm turns under it; solving the hand on the arm as carried does.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `carried`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither end is touched, so the carry still starts at the held angles and arrives at the goal.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
     */
    attitude?(
      posture: IHumanPosture,
      seconds: number,
      hand: IAutoMovieQuaternion,
      start: IAutoMovieQuaternion,
      end: IAutoMovieQuaternion,
      weight: number,
    ): IAutoMovieQuaternion;
  }

  /**
   * An arm carried toward a goal by a weight: with a span, the arm's whole
   * action planned once as one trajectory with the other arms of its group
   * (`AutoMovieMotionHumanArmPlanned.planned`), read off the posture so far
   * the composer gives; without, the joint-space carry between held angles
   * and the goal's solution (`carry`), a reflex's or a transport's.
   *
   * @param props The carry.
   * @returns The primitive, on the arm's channel.
   * @throws {HumanRefusal} When a planned arm has no trajectory that meets its constraints, at the first second written.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ways an arm is carried, what each reads, the channel claimed and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A reach that lays a hand on a site is a motion-planning problem, solved as one trajectory over the action against the very postures it is written on (TrajOpt), so the plan is a constant of the action; a transport with no site keeps the joint-space carry (Soechting and Lacquaniti 1981). With an attitude, the hand between the ends is solved to it on the carried arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The group joined once; per second the planned arm or one `carry`, then one hand solve with an attitude.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The group is solved once, by its first member written, and a member asked while it is being solved throws instead of solving twice; the hand's fingers are not claimed, so a row that shapes them composes with this one.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trajectory solve per group and action; per written second one cubic read of it, or `carry`'s posture solve, none at weight 0 or 1; between the ends an attitude adds the hand's forward kinematics on the arm, the held end and the goal, and `HumanHandAttitude.held`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanArmPlanned.planned`, `carry` and `HumanHandAttitude.held`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props and its group, which keeps the group's one solution.
   */
  export function carried(props: ICarry): IAutoMovieMotionHumanPrimitive {
    const limb: "leftArm" | "rightArm" = `${props.side}Arm`;

    // The arm's whole action, solved once over its span, with the other
    // arms of its group.
    const group: AutoMovieMotionHumanArmPlanned.ITogether = props.together ?? AutoMovieMotionHumanArmPlanned.together();
    group.carries.push(props);
    const planned = (before: (seconds: number) => IHumanPosture): HumanArmTrajectory.Trajectory => {
      if (group.solved === undefined) {
        if (group.solving === true) throw new Error("Two arms moved together are solved from the first of them");
        group.solving = true;
        group.solved = AutoMovieMotionHumanArmPlanned.planned(props.body, props.span!, group.carries, before);
        group.solving = false;
      }
      return group.solved.get(props.side)!;
    };
    return {
      channels: [limb],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number, before?: (seconds: number) => IHumanPosture): IHumanPosture => {
        const weight: number = props.weight(seconds);
        const span: AutoMovieMotionHumanArmPlanned.ISpan | undefined = props.span;
        let out: IHumanPosture;
        if (span !== undefined && seconds > span.start && seconds < span.end) {
          const arm: HumanArmClearance.IArm = planned(before ?? ((): IHumanPosture => posture))(seconds);
          const joints: IHumanPosture["joints"] = { ...posture.joints };
          const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
          joints[`${props.side}UpperArm`] = arm.upper;
          joints[`${props.side}LowerArm`] = arm.lower;
          joints[`${props.side}Hand`] = arm.hand;
          delete limbs[limb];
          out = { ...posture, joints, limbs };
        } else
          out = carry(
            props.body,
            { ...posture, limbs: { ...posture.limbs, [limb]: props.goal(posture, seconds) } },
            { [props.side]: props.rest },
            weight,
          );
        if (props.attitude === undefined || !(weight > 0 && weight < 1)) return out;

        // The hand held to its attitude on the arm as written
        // (`HumanHandAttitude`), between the hands its two ends show.
        const aimed: IHumanPosture = { ...posture, limbs: { ...posture.limbs, [limb]: props.goal(posture, seconds) } };
        const hand = (at: IHumanPosture): IAutoMovieQuaternion =>
          poseBones(props.body, resolveHumanPosture(props.body, at)).get(`${props.side}Hand`)!.worldRotation;
        return HumanHandAttitude.held(
          props.body,
          out,
          props.side,
          props.attitude(
            posture,
            seconds,
            hand(out),
            hand(carry(props.body, posture, { [props.side]: props.rest }, 0)),
            hand(aimed),
            weight,
          ),
        );
      },
    };
  }
}