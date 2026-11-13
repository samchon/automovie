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
import { AutoMovieMotionHumanArmKeyed } from "./AutoMovieMotionHumanArmKeyed";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * An arm carried in joint space: its angles read off a pose, the carry
 * between held angles and a goal, and the primitive that writes it, the
 * members `AutoMovieMotionHumanArm` names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three things the file holds and who names them.
 * @evidence contracts/development/design.md#principled-representation A free arm movement is described by its joint angles (Soechting and Lacquaniti 1981), so the carry reads and writes triples and solves a goal only to read its angles.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The angles record, its reader, the carry and its primitive; `AutoMovieMotionHumanArm` re-exports each by name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The blend and the clearing are their owners' (`blendHumanJoint`, `HumanArmClearing`), not restated.
 */
export namespace AutoMovieMotionHumanArmCarry {
  /**
   * One arm's joint angles: the clinical flexion, abduction and twist of the
   * upper arm, the forearm and the hand, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which joints are held, the order of each triple and the unit.
   * @evidence contracts/development/design.md#principled-representation An arm that travels freely is described by its joint angles, the coordinates a free arm movement is smooth in (Soechting and Lacquaniti 1981).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, the three joints the arm channel owns; read by `angles` and `carry`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each triple is the posture's own joint triple, so it is written back without conversion.
   */
  export interface IAngles {
    /** The upper arm's flexion, abduction and twist. */
    upper: readonly [number, number, number];

    /** The forearm's flexion, abduction and twist. */
    lower: readonly [number, number, number];

    /** The hand's flexion, abduction and twist. */
    hand: readonly [number, number, number];

    /** The fingers' joints of that hand as the arm holds them, read off the pose with the arm; the posture's own when absent. */
    fingers?: Readonly<
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >;
  }

  /**
   * An arm's joint angles read off a solved pose.
   *
   * @param pose The pose.
   * @param side The arm.
   * @returns The angles; a joint the pose does not carry reads zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and what a missing joint reads.
   * @evidence contracts/development/implementation.md#principled-implementation The pose already holds each joint's clinical triple, so the angles are read and never re-derived from bone directions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three lookups.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing joint is the rest angle, zero, the value the resolver gives an unset joint.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three scans of the pose's joints with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing computed twice.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function angles(pose: IAutoMoviePose, side: HumanHand.Side): IAngles {
    const read = (
      bone: AutoMovieHumanoidBone,
    ): readonly [number, number, number] => {
      const joint = pose.joints.find((j): boolean => j.bone === bone);
      return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
    };
    const fingers: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    for (const joint of pose.joints)
      if (
        HumanArmClearance.DIGITS.test(joint.bone) &&
        joint.bone.startsWith(side)
      )
        fingers[joint.bone] = [
          joint.flexion ?? 0,
          joint.abduction ?? 0,
          joint.twist ?? 0,
        ];
    return {
      upper: read(`${side}UpperArm`),
      lower: read(`${side}LowerArm`),
      hand: read(`${side}Hand`),
      fingers,
    };
  }

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
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve for both arms and a second for the planned arrival when one is given, none at either end; per arm a course reads two keys, each one clearing (`HumanArmClearing.of`) in a pose read once per key, and at most `HumanArmClearing`'s few halvings more where its proportion leaves the arm uncleared.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `resolveHumanPosture`, `angles`, `blendHumanJoint` and `HumanArmClearance`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function carry(
    body: IHumanBody,
    posture: IHumanPosture,
    from: Partial<Record<HumanHand.Side, IAngles>>,
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
      const held: IAngles = from[side]!;
      const goal: IAngles = solved === null ? held : angles(solved, side);
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
      const aimed: IAngles = planning === null ? held : angles(planning, side);
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
        fingers?: IAngles["fingers"],
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
   * One arm carried in joint space toward a goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit and the range of the weight.
   * @evidence contracts/development/design.md#principled-representation The span the arm is written over, the angles it holds at weight 0, the goal it solves to at weight 1 and the weight between them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Nine members, all read by `carried`: seven that every carry needs, the clearing's `arrival` and the hand's `attitude`.
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
    rest: IAngles;

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

    /**
     * The stretch a second lies in, from its held end (weight 0) to its
     * arrival (weight 1): the goal's end inside it is read off fits at fixed
     * seconds (`AutoMovieMotionHumanArmKeyed.at`) and the clearing course is
     * planned against the arrival's goal. The second's own fit when absent.
     *
     * @param seconds Seconds since the action's start.
     * @returns The held end's and the arrival's seconds since the action's start.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the result, what reads it and the default.
     * @evidence contracts/development/implementation.md#principled-implementation Fits at fixed instants and a course planned against a fixed arrival are constants of the carry (as a `reference` is a constant of a fit), so the carried arm is a pure function of time that moves continuously, however a fit chooses between two near-equal arms.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `carried`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goal is read at the keyed seconds on the posture of the current one, so nothing is remembered between seconds.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
     */
    stretch?(seconds: number): readonly [number, number];

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
   * An arm carried in joint space between held angles and a goal by a weight:
   * a reflex's or a gesture's transport, from whatever the body held.
   *
   * @param props The carry.
   * @returns The primitive, on the arm's channel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is carried, by what, and the channel claimed.
   * @evidence contracts/development/implementation.md#principled-implementation The goal is written on the posture so far and `carry` blends its solved angles with the held ones, the goal's end between the ends read off its fits at the stretch's keys (`AutoMovieMotionHumanArmKeyed.at`) when a stretch is given; with an attitude, the hand between the ends is solved to it on the carried arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The goal's end (the second's goal, or `AutoMovieMotionHumanArmKeyed.at` inside a stretch), the arrival's goal with a stretch, one call of `carry`, then one hand solve with an attitude.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hand's fingers are not claimed, so a row that shapes them composes with this one.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per written second `carry`'s posture solves (one, two with a stretch), none at weight 0 or 1, and inside a stretch `AutoMovieMotionHumanArmKeyed.at`'s two fits in place of the second's own; between the ends an attitude adds the hand's forward kinematics on the blend, on the held end (the arm written as joints, no limb fit) and on the goal's end (the arm written as joints, or the goal's fit, which `carry`'s solve has just asked the resolver for), the attitude's own reading and `HumanHandAttitude.held` (one posture solve and at most three resolves of the arm written as joints).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanArmKeyed.at`, `carry` and `HumanHandAttitude.held`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
   */
  export function carried(props: ICarry): IAutoMovieMotionHumanPrimitive {
    const limb: "leftArm" | "rightArm" = `${props.side}Arm`;
    return {
      channels: [limb],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const weight: number = props.weight(seconds);
        const goal = (at: number): IHumanPosture => ({
          ...posture,
          limbs: { ...posture.limbs, [limb]: props.goal(posture, at) },
        });
        const stretch: readonly [number, number] | undefined =
          props.stretch?.(seconds);
        const aimed: IHumanPosture =
          stretch === undefined || !(weight > 0 && weight < 1)
            ? goal(seconds)
            : AutoMovieMotionHumanArmKeyed.at(
                props.body,
                posture,
                props.side,
                (at: number): IAngles =>
                  angles(resolveHumanPosture(props.body, goal(at)), props.side),
                stretch,
                seconds,
              );
        const out: IHumanPosture = carry(
          props.body,
          aimed,
          { [props.side]: props.rest },
          weight,
          stretch === undefined ? undefined : goal(stretch[1]),
        );
        if (props.attitude === undefined || !(weight > 0 && weight < 1))
          return out;
        // The hand held to its attitude on the arm the blend places
        // (`HumanHandAttitude`), between the hands its two ends show.
        const hand = (at: IHumanPosture): IAutoMovieQuaternion =>
          poseBones(props.body, resolveHumanPosture(props.body, at)).get(
            `${props.side}Hand`,
          )!.worldRotation;
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
