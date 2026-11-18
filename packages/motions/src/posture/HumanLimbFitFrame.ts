import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanLimbFitFrame,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The frame a limb fit is solved in (`solveHumanLimbFit`): the root's world
 * position and heading, so two people of one body doing the same thing in
 * different places, or one body facing another way, solve the same numbers.
 *
 * A pose and its goal are moved into the frame by taking away the root's
 * world position on all three axes and turning by minus its
 * heading about +Y; the limb solver reads only the geometry relative to the
 * root, so a fit solved in the frame is the fit solved in the world, moved.
 * The fitted pose is handed back with the caller's own root, since a limb
 * fit changes the limb's joints and not the root; its seed (the swivel and
 * branch of `fitSeededChainToTarget`) lives in the chain root's bone-local
 * frame, which a turn about +Y and a world translation leave as they are, so
 * it is handed back unchanged. A goal attached to a bone (`on`), or kept
 * clear of or resting on other bodies' colliders (`clear`, `rests`), names
 * world things the frame would have to carry, and is solved in the world;
 * so is a pose without a root.
 *
 * The limb solver has no absolute floor-height term: free-leg geometry,
 * own-body arm clearance and contact re-aim depend on relative positions,
 * local contact offsets and rotations. Every root, target, bend and rival
 * point moves together. A world-fixed ground goal remains different when
 * only the root moves vertically, because its relative target Y changes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, why a fit is invariant in it, what is handed back unchanged and why, and which goals stay in the world.
 * @evidence contracts/development/design.md#principled-representation A rigid reference frame removes all three root translation components and only its world-up heading; pitch/roll, joint coordinates, local contacts and seed branch/swivel remain unchanged. Optional y defaults to zero for existing explicitly constructed floor frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The frame and moving a pose, a goal and a point into it, read by solveHumanLimbFit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No goal is moved that names a world collider: it is keyed in the world, not approximated.
 */
export namespace HumanLimbFitFrame {
  /**
   * The frame a fit of a pose and a goal is solved in, or null when it
   * stays in the world.
   *
   * @param pose The pose before the fit.
   * @param goal The limb's goal.
   * @returns The frame, or null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines all-axis root translation, heading extraction and unchanged world-context exclusions.
   * @evidence contracts/development/implementation.md#principled-implementation The root's rotated forward vector determines its world-up heading. Subtracting full translation preserves relative chain/own-body/contact geometry; attached or external-shape goals remain in world coordinates.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One unchanged exclusion gate and one heading construction supply the common normalization frame for root, target, bend and rival.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps root-null/on/clear/rests exclusions and adds no tolerance, target replacement or acceptance rule; a fixed world goal changes relative Y when only the root rises.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant quaternion-vector/trigonometric work and one frame allocation, independent of rig/goal population.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The frame applies only to the current source/goal normalization; no fit is reused across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one caller-owned frame or null and retains no source, target, result or resource.
   */
  export function of(
    pose: IAutoMoviePose,
    goal: IAutoMovieHumanLimbGoal,
  ): IAutoMovieMotionHumanLimbFitFrame.IFrame | null {
    if (
      pose.root === null ||
      goal.on !== undefined ||
      goal.clear !== undefined ||
      goal.rests !== undefined
    )
      return null;
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
      pose.root.rotation,
      { x: 0, y: 0, z: 1 },
    );
    const heading: number = (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;
    return {
      x: pose.root.translation.x,
      y: pose.root.translation.y,
      z: pose.root.translation.z,
      into: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -heading),
    };
  }

  /**
   * A world point in the frame.
   *
   * @param frame The frame.
   * @param point The point, world metres.
   * @returns The point in the frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world-metre input/output and zero default for an explicitly omitted frame Y.
   * @evidence contracts/development/implementation.md#principled-implementation Applies inverse translation followed by the same unit inverse-heading quaternion; subtracting Y commutes with a world-up turn and changes no local contact or rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One component subtraction record feeds the existing quaternion-vector owner for every root/goal/rival point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual point/frame scalars without rounding, normalization, threshold or point-specific exception.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic and fresh vector storage; no body, shape or joint scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller shares this one current frame among all mutually translated inputs, while each point is transformed independently.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains no frame or point.
   */
  export function point(
    frame: IAutoMovieMotionHumanLimbFitFrame.IFrame,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(frame.into, {
      x: point.x - frame.x,
      y: point.y - (frame.y ?? 0),
      z: point.z - frame.z,
    });
  }

  /**
   * A pose in the frame: its root moved and turned; its joints as they are.
   *
   * @param frame The frame.
   * @param pose The pose, with a root.
   * @returns The pose in the frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States translated/heading-normalized root and borrowed unchanged joint/scale members.
   * @evidence contracts/development/implementation.md#principled-implementation Moves the actual root by point and left-multiplies its original rotation by inverse heading; clinical joints and root scale remain unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A root-null identity branch or one shallow pose/root update reuses the common point transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clinical articulation, root scale or rotation normalization changes, and null roots preserve the original object.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant root transform/copy work without traversing J borrowed joints.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows unchanged joints/scale only during normalization; the fit's output ownership remains with its solver.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input and returns the original root-null pose or fresh outer/root/translation/rotation records with unchanged members borrowed.
   */
  export function pose(frame: IAutoMovieMotionHumanLimbFitFrame.IFrame, pose: IAutoMoviePose): IAutoMoviePose {
    if (pose.root === null) return pose;
    return {
      ...pose,
      root: {
        ...pose.root,
        translation: point(frame, pose.root.translation),
        rotation: Quaternion.multiply(frame.into, pose.root.rotation),
      },
    };
  }

  /**
   * A goal in the frame: its point and bend moved and its rotation turned;
   * everything else as it is, its contact too, which lies in the end joint's
   * own rest frame (`HumanPosture.IGoal.contact`) and turns with the joint.
   *
   * @param frame The frame.
   * @param goal The goal, attached to no bone and naming no collider.
   * @returns The goal in the frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines translated world point/bend, heading-composed world rotation and unchanged local contacts/other goal data.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid reference change transforms world demands and rotations together, while contact/limit points in the effector rest frame remain local.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two common point calls and an optional original quaternion product preserve one goal conversion owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Receives only the original eligible no-on/no-external goal; every other field, reference, price and physical constraint is borrowed unchanged, with no achieved endpoint substitution.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant two-point/optional-rotation work, without traversing borrowed limits or geometry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the exact same source frame as the pose and rival so all relative demands remain equivalent; another frame transforms independently.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new goal with new changed vectors/rotation and borrowed unchanged metadata, retaining no input or query history.
   */
  export function goal(
    frame: IAutoMovieMotionHumanLimbFitFrame.IFrame,
    goal: IAutoMovieHumanLimbGoal,
  ): IAutoMovieHumanLimbGoal {
    return {
      ...goal,
      point: point(frame, goal.point),
      bend: point(frame, goal.bend),
      ...(goal.rotation === undefined
        ? {}
        : { rotation: Quaternion.multiply(frame.into, goal.rotation) }),
    };
  }
}
