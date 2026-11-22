import { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import { HumanArmClearing } from "./HumanArmClearing";
import { HumanArmObstacleBones } from "./HumanArmObstacleBones";
import { HumanArmOvershoot } from "./HumanArmOvershoot";
import { HumanArmSwing } from "./HumanArmSwing";
import { HumanColliders } from "./HumanColliders";
import { poseBones } from "./poseBones";
import { prepareHumanJointRom } from "./prepareHumanJointRom";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";

/**
 * The room a forearm needs beside its own trunk and beside the other arm.
 *
 * The other arm's room is the far side of the chest's median plane: an elbow
 * crosses it only as far as its wrist's goal does.
 *
 * A hand goal fixes the wrist and leaves the elbow free on a circle. An
 * elbow place whose point is outside the trunk can still run the forearm
 * through it, so the forearm is judged along its whole length: its axis,
 * sampled from the elbow toward the wrist, keeps the forearm's radius from
 * the colliders of the trunk, the neck and the head at the elbow, tapering to
 * the wrist's own clearance at the wrist, where the palm lies on the surface
 * the hand was sent to. The limb fit, which places the legs before the arms,
 * judges the thighs too (`obstacles`); a caller that poses only the trunk
 * judges the trunk alone (`trunk`).
 *
 * An arm that is not fitted to a goal but carried in joint space between two
 * arms has no elbow place to choose and no goal under its wrist; it is read
 * whole (`room`), against another body's colliders too when one stands in its
 * way, and its elbow let out or folded until the forearm asks no more room
 * than the carry's two ends hold (`cleared`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is judged, against which colliders, the taper and which caller judges the thighs.
 * @evidence contracts/development/design.md#principled-representation A capsule of linearly tapering radius against the body's own profile colliders, the shapes every contact verdict measures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The trunk/thigh colliders, forearm overshoot, posed arm, scalar room, paired endpoint baselines and shoulder/elbow correction serve bend solving, native arm fitting and joint-space carry through one clearance owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The radius is the body's measured forearm radius and the colliders are the profile's; no margin is added and no law is named.
 */
export namespace HumanArmClearance {
  /**
   * The colliders a forearm may not enter, placed by a pose's bones.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame; only the trunk's are read.
   * @returns The placed segments of the hips, the spine, the chest, the neck and the head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which segments are returned and what is read.
   * @evidence contracts/development/implementation.md#principled-implementation Placement is `HumanColliders.placed`, the single owner; this function only keeps the trunk's segments.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Filters actual placed profile segments by the existing trunk set without altering their geometry, clearance or source order.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the profile's segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanColliders.placed`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function trunk(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieMotionHumanColliders.IPlaced[] {
    return HumanColliders.placed(body, bones).filter(
      (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean => HumanArmObstacleBones.TRUNK.has(segment.bone),
    );
  }

  /**
   * The colliders a forearm may not enter in a pose whose legs are placed:
   * the trunk's, both thighs' and those of any arm already placed.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame, the legs where the pose puts them.
   * @param arms The arms already placed whose upper arm, forearm and hand count; none when absent.
   * @param placed An existing placement of this exact body and bone reading in the same unchanged synchronous evaluation; computed here when absent.
   * @returns The placed segments of `trunk`, of the two upper legs and of the named arms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which segments are returned and what the pose must already hold.
   * @evidence contracts/development/implementation.md#principled-implementation A hand sent to a thigh, or past one, bends its elbow away from the thigh as it does from the ribs; the limb fit places the legs before the arms, so the thighs stand where the posture puts them. Two forearms sent across each other (a self-hug, a hand on the other forearm) lie one over the other, so the arm placed second keeps clear of the first.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One placement when needed, followed by the same selection filter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shanks and feet are left out: a forearm reaches them only with the hand, which the taper leaves to its goal; an arm not yet placed is left out, since where it will be is not known.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the profile's segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The frame builder can supply its exact same-evaluation placement, while four fixed HumanArmObstacleBones subsets share canonical membership with scoped source FK; actual profile geometry and original placement order remain current.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh filtered array borrowing its actual placed segments; stores no placement, pose or body beyond the call.
   */
  export function obstacles(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    arms: readonly ("left" | "right")[] = [],
    placed?: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): IAutoMovieMotionHumanColliders.IPlaced[] {
    const limbs: ReadonlySet<AutoMovieHumanoidBone> = HumanArmObstacleBones(arms);
    return (placed ?? HumanColliders.placed(body, bones)).filter(
      (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
        limbs.has(segment.bone),
    );
  }

  /**
   * How far a forearm lies inside the room it needs, as degrees of upper arm
   * turn (`HumanArmOvershoot.of`, which states the rule).
   *
   * @param body The body, for the forearm's radius and the upper arm's length.
   * @param shapes The trunk's placed colliders (`trunk`).
   * @param elbow The elbow, world metres.
   * @param wrist The wrist, world metres.
   * @param side The arm.
   * @param others Placed colliders the wrist has no goal on (another body's); none when absent.
   * @param goal Whether the wrist is where a goal put it, which excuses its own depth in `shapes`; a carried arm between its ends has none.
   * @param rival The world point the other arm's goal will put its wrist at, while that arm is still to be fitted; absent, the room is kept unless the other arm's colliders are among `shapes`.
   * @param hint The world point the goal hints the elbow toward; none when absent.
   * @param rests Placed colliders of another body the goal lays the hand on; none when absent.
   * @returns Degrees; 0 when the forearm clears every shape and the elbow keeps its side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, each input and the meaning of 0; the rule is the reading's own.
   * @evidence contracts/development/implementation.md#principled-implementation The reading is `HumanArmOvershoot.of`, kept as this owner's entry so every caller of the clearance reads one name.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Passes every geometry, goal and resting allowance unchanged to the existing overshoot owner, so delegation adds no clearance policy or tolerance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The reading's own.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanArmOvershoot.of`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function overshoot(
    body: IAutoMovieMotionHumanBody,
    shapes: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    elbow: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    side: "left" | "right",
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    goal: boolean = true,
    rival?: IAutoMovieVector3,
    hint?: IAutoMovieVector3,
    rests: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
  ): number {
    return HumanArmOvershoot.of(
      body,
      shapes,
      elbow,
      wrist,
      side,
      others,
      goal,
      rival,
      hint,
      rests,
    );
  }

  /**
   * A pose with one arm's three joints replaced.
   *
   * @param pose The pose.
   * @param side The arm.
   * @param arm The arm's joint angles.
   * @returns The pose, every other joint as it was.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is replaced and what is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The pose holds each joint's clinical triple, so the arm is written as its triples.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint the pose does not carry is not added; the canonical pose carries every bone.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the joints with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing computed twice.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function posed(
    pose: IAutoMoviePose,
    side: "left" | "right",
    arm: IAutoMovieMotionHumanArmClearance.IArm,
  ): IAutoMoviePose {
    const written: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {
      [`${side}UpperArm`]: arm.upper,
      [`${side}LowerArm`]: arm.lower,
      [`${side}Hand`]: arm.hand,
    };
    return {
      ...pose,
      joints: pose.joints.map(
        (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
          const angles: readonly [number, number, number] | undefined =
            written[joint.bone];
          return angles === undefined
            ? joint
            : {
                ...joint,
                flexion: angles[0],
                abduction: angles[1],
                twist: angles[2],
              };
        },
      ),
    };
  }

  /** The bones of the five digits, by their names. */
  export const DIGITS: RegExp = /(Thumb|Index|Middle|Ring|Little)/;

  /**
   * A pose with one hand's fingers written at given angles, so an arm's room
   * reads the fingers it is shown with: the ones the hand holds at that
   * instant, or those it held where the arm was read.
   *
   * @param pose The pose.
   * @param side The hand.
   * @param fingers Clinical triples by bone; the other hand's and every other bone's are ignored.
   * @returns The pose, every other joint as it was.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is written, what is ignored and why.
   * @evidence contracts/development/implementation.md#principled-implementation The tangle audit reads the fingers as the pose shows them, so the room that keeps them clear must read the same fingers; the pose holds each joint's clinical triple.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the joints, as `posed`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only that hand's digit bones are written.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the joints with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing computed twice.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function fingered(
    pose: IAutoMoviePose,
    side: "left" | "right",
    fingers: Readonly<
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >,
  ): IAutoMoviePose {
    return {
      ...pose,
      joints: pose.joints.map(
        (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
          const angles: readonly [number, number, number] | undefined =
            joint.bone.startsWith(side) && DIGITS.test(joint.bone)
              ? fingers[joint.bone]
              : undefined;
          return angles === undefined
            ? joint
            : {
                ...joint,
                flexion: angles[0],
                abduction: angles[1],
                twist: angles[2],
              };
        },
      ),
    };
  }

  /**
   * A forearm's overshoot (`overshoot`) with the arm at given joint angles
   * in a pose.
   *
   * @param body The body.
   * @param pose The pose; the trunk, the legs and the other arm are read where it puts them.
   * @param side The arm.
   * @param arm The arm's joint angles, which replace the pose's.
   * @param others Another body's placed colliders in the arm's way; none when absent.
   * @param baseline What each of the two readings may keep, degrees (`IBaseline`); none when absent.
   * @param prepared An actual FK reader borrowed only through this synchronous unchanged-rig search; every pose still receives full admission and fresh resolved bones.
   * @returns Degrees; 0 when the forearm clears the trunk, the thighs, the other arm and the others, and no segment of the arm lies deeper in the body than at rest or in the quiet stance, each beyond its baseline.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is replaced, what is read and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The arm's three joints are written into the pose (`posed`) and the bones resolved by the engine's forward kinematics, so the forearm judged is the one the pose displays; the other arm is where the pose shows it, so a carry clears it as it stands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure roomTerms owns one posed-arm FK/placement and original ordered overshoot/allowance/audit/allowance reads; room applies the unchanged final Math.max while baseline shares those actual inputs across its two projections.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The obstacles are the limb fit's (`obstacles`), so a carried arm and a fitted one are judged against the same shapes.
   * @evidence contracts/development/implementation.md#efficient-algorithms One full FK traversal and collider construction precede every original overshoot/audit query. A search-owned reader shares only completed same-scalar joint/bone math; fresh outputs, changed ancestor propagation and all scans remain.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses posed, poseBones, obstacles, overshoot and the tangle arm reading. A borrowed actual engine reader belongs to this unchanged-rig search; each full posed input still runs. The two clearance readers share one exact collider placement, without pose writes or a pose-identity query cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows but never retains the optional FK reader; the caller releases it when its synchronous search ends. Local fresh bones/placements and every query temporary end with this call.
   */
  export function room(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: "left" | "right",
    arm: IAutoMovieMotionHumanArmClearance.IArm,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    baseline: IAutoMovieMotionHumanArmClearance.IBaseline = NONE,
    prepared?: ReturnType<typeof preparePoseResolution>,
  ): number {
    const terms: IAutoMovieMotionHumanArmClearance.IBaseline = roomTerms(body, pose, side, arm, others, baseline, prepared);
    return Math.max(0, terms.forearm, terms.segments);
  }

  /**
   * Read both independent zero-allowance baselines on the same actual arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns the same forearm-only and segment-only degree readings as two room calls with the other allowance Infinity, using one current pose/profile placement.
   * @evidence contracts/development/implementation.md#principled-implementation Both readings consume the same FK, overshoot and tangle values; applying the original zero/Infinity allowances afterward preserves each independent metric, including nonfinite propagation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure roomTerms owns the original ordered numerical queries; room and this paired reader apply their existing Math.max expressions to those terms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both physical queries still run in their original order; no finite-only gate, altered clearance, profile order, threshold or candidate omission is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms One admitted full FK/profile placement and both actual queries replace two identical pairs for each carry endpoint; constant scalar projections produce both results, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit caller fixes body, pose, arm, external colliders and reader for this synchronous paired observation; only that one unchanged observation is shared, without pose or metric caching.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh two-number record and retains no pose, placement, input, reader or query history.
   */
  export function baseline(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose, side: "left" | "right",
    arm: IAutoMovieMotionHumanArmClearance.IArm, others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    prepared?: ReturnType<typeof preparePoseResolution>): IAutoMovieMotionHumanArmClearance.IBaseline {
    const terms: IAutoMovieMotionHumanArmClearance.IBaseline = roomTerms(body, pose, side, arm, others, NONE, prepared);
    return { forearm: Math.max(0, terms.forearm, terms.segments - Infinity),
      segments: Math.max(0, terms.forearm - Infinity, terms.segments) };
  }

  /**
   * An arm turned at the shoulder and the elbow until its room (`room`) is
   * within an allowance: the least turn, along the first direction of a
   * fixed order that clears it (`HumanArmClearing`), not the nearest clear
   * arm in every direction.
   *
   * A hanging arm lies along the flank, so a forearm that swings forward
   * from it while the upper arm turns inward crosses the front of the waist,
   * and a person lets the elbow out as the hand comes up; a hand raised
   * toward someone who stands close would pass through them, and a person
   * folds the elbow and brings the hand up near their own chest. Both are
   * one rule over the two freedoms that move a forearm without a goal, the
   * upper arm's abduction and the elbow's flexion: `HumanArmClearing` takes
   * the least turn, along the first of its fixed order of directions that
   * clears the arm, inside both joints' ranges. The room is not smooth (a
   * forearm leaves one shape as it meets another), so no slope is followed.
   * When no direction clears the arm, the turn with the least room is taken.
   *
   * @param body The body.
   * @param pose The pose the arm is read in.
   * @param side The arm.
   * @param arm The arm's joint angles.
   * @param allowed The room the arm may lack, degrees.
   * @param others Another body's placed colliders in the arm's way; none when absent.
   * @param baseline What each of `room`'s readings may keep; none when absent.
   * @param source Optional exact FK reader or lazy supplier borrowed only by actual room observations in this synchronous search.
   * @returns The arm's joint angles, the hand's unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two movements, the one rule behind them, the order of the search, the bisection, the fallback and each argument's unit.
   * @evidence contracts/development/implementation.md#principled-implementation The least correction that clears the arm, over the two freedoms that carry a forearm off what it passes; the direction comes from the shapes in the way, so no obstacle is named.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of HumanArmClearing.of over the room and range readings built here.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No margin is added and no joint leaves its range; a turn that leaves a range is skipped, not clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Without a loan, the original single clear-arm reading allocates no FK workspace or ROM map; only a second room read creates the search reader. A supplied reader is demanded at the first actual observation. All scans, candidates and ROM scores remain; fixed same-scalar FK and each of two first-bone scans can be shared without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses room, actual FK/range owners and HumanArmClearing. A parent may explicitly lend its current synchronous reader; otherwise the local reader remains lazy. posed changes only three arm records, so exact unchanged dependencies can share math while current constraints, every candidate and scores remain actual reads.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This synchronous search releases its FK snapshots, local ROM reader and at most two bone records on return or throw. Only the chosen clinical arm escapes; no pose, callback, target, candidate or reader history is retained.
   */
  export function cleared(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: "left" | "right",
    arm: IAutoMovieMotionHumanArmClearance.IArm,
    allowed: number,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    baseline: IAutoMovieMotionHumanArmClearance.IBaseline = NONE,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanArmClearance.IArm {
    let prepared: ReturnType<typeof preparePoseResolution> | undefined;
    let borrowed: ReturnType<typeof prepareHumanPoseResolution> | undefined;
    let first: boolean = true;
    const over: (of: IAutoMovieMotionHumanArmClearance.IArm) => number = (of: IAutoMovieMotionHumanArmClearance.IArm): number => {
      const value: number = room(body, pose, side, of, others, baseline,
        source === undefined ? first ? undefined : (prepared ??= preparePoseResolution()) :
          (borrowed ??= prepareHumanPoseResolution(source))());
      first = false;
      return value - allowed;
    };
    const outside: ReturnType<typeof prepareHumanJointRom> = prepareHumanJointRom(body);
    return HumanArmClearing.of({
      arm,
      over,
      range: (of: IAutoMovieMotionHumanArmClearance.IArm): number =>
        outside(`${side}UpperArm`, of.upper) +
        outside(`${side}LowerArm`, of.lower),
    });
  }

  /**
   * A posture whose arms, written by joint angles with no hand goal (a
   * gait's swing), are kept clear of the body: a swinging arm passing the
   * thigh is let out at the shoulder, so each named arm takes the least added
   * abduction, up to `HumanArmSwing.SPAN`, at which each reading of its room is within that
   * reading in the quiet stance (`IBaseline`), found by bisection; an arm
   * that swings no deeper than it hangs is left as written.
   *
   * @param body The body.
   * @param posture The posture, the arms' joints set and their goals absent.
   * @param sides The arms to keep clear.
   * @param source Optional exact FK source borrowed only for this synchronous same-body operation.
   * @param projection Optional genuine same-body ROM projector; every actual joint still projects normally.
   * @returns The posture with the arms' upper arm joints let out.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which arms, against what allowance and what is written back.
   * @evidence contracts/development/implementation.md#principled-implementation A hanging arm's fingers lie against the thigh in the quiet stance, which the tangle audit takes as its baseline; the swing may come that near and no nearer, the same rule the audit reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolve, then one bisection per arm in the pose the arms before it were written into; the least abduction is continuous in time where the room is, so the swing has no jump a local search between frames would leave.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arm with a hand goal is the fit's to clear and is left alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve per call, one room reading for an arm already clear and about twelve for one that is not; the stance's room is solved once per body and arm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to HumanArmSwing.of, forwarding only explicit same-operation FK/ROM loans through native full fitting and actual room observations without candidate-result reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the existing numeric stance rooms persist weakly per body; current FK/ROM loans end with the synchronous owner and enter no returned posture or cache.
   */
  export function swung(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    sides: readonly ("left" | "right")[],
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    return HumanArmSwing.of(body, posture, sides, source, projection);
  }
}

/** Keep overshoot, its allowance read, tangle and its allowance read in original order. */
function roomTerms(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose, side: "left" | "right",
  arm: IAutoMovieMotionHumanArmClearance.IArm, others: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  baseline: IAutoMovieMotionHumanArmClearance.IBaseline, prepared?: ReturnType<typeof preparePoseResolution>): IAutoMovieMotionHumanArmClearance.IBaseline {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, HumanArmClearance.posed(pose, side, arm), prepared);
  const placed: IAutoMovieMotionHumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
  return {
    forearm: HumanArmClearance.overshoot(body,
      HumanArmClearance.obstacles(body, bones, [side === "left" ? "right" : "left"], placed),
      bones.get(`${side}LowerArm`)!.worldPosition, bones.get(`${side}Hand`)!.worldPosition,
      side, others, false) - baseline.forearm,
    segments: AutoMovieMotionHumanAuditTangle.arm(body, bones, side, placed) - baseline.segments,
  };
}

/** No baseline: every reading of an arm's room counts from zero. */
const NONE: IAutoMovieMotionHumanArmClearance.IBaseline = { forearm: 0, segments: 0 };

