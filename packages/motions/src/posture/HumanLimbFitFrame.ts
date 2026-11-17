import { Quaternion } from "@automovie/engine";
import type {
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "./IHumanPosture";

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
 * world things the frame would have to carry, and is keyed in the world as
 * before; so is a pose without a root.
 *
 * The limb solver has no absolute floor-height term: free-leg geometry,
 * own-body arm clearance and contact re-aim depend on relative positions,
 * local contact offsets and rotations. Every root, target, bend and rival
 * point moves together. A world-fixed ground goal remains different when
 * only the root moves vertically, because its relative target Y changes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, why a fit is invariant in it, what is handed back unchanged and why, and which goals stay in the world. The original GRID constant remains1e-12; its local documentation explains normalization rounding and the existing1e-9 moved-fit comparison.
 * @evidence contracts/development/design.md#principled-representation A rigid reference frame removes all three root translation components and only its world-up heading; pitch/roll, joint coordinates, local contacts and seed branch/swivel remain unchanged. Optional y defaults to zero for existing explicitly constructed floor frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The frame and moving a pose, a goal and a point into it, read by solveHumanLimbFit; the solve counters; and the former memory's grid (`grid`, `GRID`) and hit/miss fields, which specifications written against the memory still read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No goal is moved that names a world collider: it is keyed in the world, not approximated.
 */
export namespace HumanLimbFitFrame {
  /**
   * A root-position/heading frame; omitted y retains an explicit floor frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names world-metre translation, world-up heading inverse and the legacy omitted-y zero convention.
   * @evidence contracts/development/design.md#principled-representation Translation and a unit inverse-heading quaternion define one rigid reference frame; optional y denotes exactly zero rather than a second solver mode.
   * @evidence contracts/development/design.md#minimal-and-owned-surface of constructs the frame consumed by point/pose/goal and the memory's single normalization path; existing explicit floor frames remain valid.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no target, solve result or resolved flag; numerical quaternion/frame admission remains the caller's canonical-pose premise.
   */
  export interface IFrame {
    /** The root's x, world metres. */
    x: number;

    /** The root's y, world metres; omission means zero for an explicit floor frame. */
    y?: number;

    /** The root's z, world metres. */
    z: number;

    /** The turn into the frame: minus the heading about +Y. */
    into: IAutoMovieQuaternion;
  }

  /**
   * A body's limb-fit work counters, copied by statistics for cost tests.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each counter counts, including the former memory's hit/miss fields that now stay zero.
   * @evidence contracts/development/design.md#principled-representation Cumulative actual solve-attempt, curve, continuation and course counts describe work for one weak body lifetime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface work updates actual events and statistics exposes an independent observation without a reset, fixture key or result override; hits and misses remain only while specifications written against the memory read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Counters report actual operations and never decide physical acceptance or substitute for a fit.
   */
  export interface IStatistics {
    /** Fits read from the former fit memory: always 0, since every fit is solved directly; kept while specifications written against the memory read it. */
    hits: number;

    /** Fits solved and kept by the former memory: always 0, for the same reason. */
    misses: number;

    /** Actual solver attempts without a near seed, including failed attempts. */
    coldFits: number;

    /** Actual solver attempts with a near seed, including failed attempts. */
    continuedFits: number;

    /** Actual outer owned-free-curve queries, including unsupported inputs. */
    curveQueries: number;

    /** Actual current near-correction probes, including canonical-anchor construction. */
    curveProbes: number;

    /** Current probes passing every physical, bracket and chain-continuity check. */
    curveAccepted: number;

    /** Actual ordinary cold source preparations used as canonical anchors. */
    curveColdAnchors: number;

    /** Actual ordinary cold source preparations used as current-target fallbacks. */
    curveColdFallbacks: number;

    /** Rejected current candidates that required a finer deterministic predecessor. */
    curveRefinements: number;

    /** Actual algebraic orientation-root physical candidate trials. */
    orientationRootTrials: number;

    /** Actual accepted algebraic orientation-root returns. */
    orientationRootAccepted: number;

    /** Actual ordinary near-refinement calls inside the explicit continuation dispatcher. */
    continuationNearAttempts: number;

    /** Actual ordinary cold-fit calls inside the explicit continuation dispatcher. */
    continuationColdAttempts: number;

    /** Arm courses laid without optimisation and admitted by the trajectory model (`AutoMovieMotionHumanArmCourse`). */
    courseAdmitted: number;

    /** Arm courses the trajectory model refused, handed to the optimiser as its seed. */
    courseFallbacks: number;

    /** Refused courses whose worst term was a probe's speed (`HumanArmTrajectoryModel.IEvaluation.worst.term`). */
    courseRefusedSpeed: number;

    /** Refused courses whose worst term was a probe swept into a shape between waypoints. */
    courseRefusedSwept: number;

    /** Refused courses whose worst term was the hand off its site along the surface. */
    courseRefusedSite: number;

    /** Refused courses whose worst term was the hand inside its site. */
    courseRefusedLift: number;

    /** Refused courses whose worst term was a task point off its asked place. */
    courseRefusedLimit: number;

    /** Refused courses whose worst term was a probe inside a shape at a waypoint. */
    courseRefusedProbe: number;

    /** Refused courses whose worst term was a body corner inside the arm. */
    courseRefusedEmbedded: number;

    /** Refused courses whose worst term was one arm inside the other. */
    courseRefusedCrossing: number;
  }

  /**
   * The frame a fit of a pose and a goal is remembered in, or null when it
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The frame applies only to the current source/goal normalization; the body memory owns actual fit reuse under its original complete-input key/grid.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one caller-owned frame or null and retains no source, target, result or resource.
   */
  export function of(
    pose: IAutoMoviePose,
    goal: IHumanPosture.IGoal,
  ): IFrame | null {
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
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual point/frame scalars without rounding, normalization, threshold or point-specific exception; key rounding remains exclusively grid's original policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic and fresh vector storage; no body, shape or joint scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller shares this one current frame among all mutually translated inputs, while each point is transformed independently.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains no frame or point.
   */
  export function point(
    frame: IFrame,
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows unchanged joints/scale only during normalization; actual numerical fit and stored-output ownership remain with the existing memory owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input and returns the original root-null pose or fresh outer/root/translation/rotation records with unchanged members borrowed.
   */
  export function pose(frame: IFrame, pose: IAutoMoviePose): IAutoMoviePose {
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
   * own rest frame (`IHumanPosture.IGoal.contact`) and turns with the joint.
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
    frame: IFrame,
    goal: IHumanPosture.IGoal,
  ): IHumanPosture.IGoal {
    return {
      ...goal,
      point: point(frame, goal.point),
      bend: point(frame, goal.bend),
      ...(goal.rotation === undefined
        ? {}
        : { rotation: Quaternion.multiply(frame.into, goal.rotation) }),
    };
  }

  /**
   * The former fit memory's key grid, which no solve reads any more; kept
   * while specifications written against the memory serialize with it.
   * A key's number on the memory's grid (`GRID`), for `JSON.stringify`: a
   * pose and a goal moved into the frame from two places or headings differ
   * by the rounding of the move, a few units in the last place of a double
   * (about 1e-15 of a metre or a unit quaternion), so their exact digits
   * never meet; read on the grid they are one key. Every other value is
   * kept as it is.
   *
   * @param _ The member's name, unread.
   * @param value The member's value.
   * @returns A number as its whole count of `GRID`, any other value as it is.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the existing key-only numerical grid and unchanged nonnumeric values.
   * @evidence contracts/development/implementation.md#principled-implementation The original Math.round(value/GRID) merges only normalization rounding under the established key policy; source and solver inputs are not rounded by this callback.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One type gate and original scalar expression serve JSON key construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts GRID remains1e-12 and no contact, ROM, target, success tolerance or numeric fallback is changed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per visited key value; serialization owns the complete-input traversal.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each supplied value is read independently without retained scalar results.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one primitive or original nonnumeric value and retains nothing.
   */
  export function grid(_: string, value: unknown): unknown {
    return typeof value === "number" ? Math.round(value / GRID) : value;
  }

  /**
   * The former memory key's resolution (read by no solve; kept with `grid`),
   * in metres and in units of a quaternion or
   * an angle: a thousand times the rounding of a move into the frame, so two
   * copies of one fit read the same key but for the rare value that falls
   * on a step of the grid, which is only solved again; and a thousand times
   * finer than the 1e-9 m to which #3463 holds a moved fit to its original,
   * so two inputs read as one differ by less than that acceptance reads.
   *
   * The key resolution remains1e-12; this constant does not change a physical
   * contact, range-of-motion, target or success tolerance.
   */
  export const GRID: number = 1e-12;

  /**
   * Record one actual operation event without retaining keys or inputs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines solve attempts and curve, continuation and course events; positive amounts accumulate actual work only.
   * @evidence contracts/development/implementation.md#principled-implementation Call sites report events at their actual solver and planner boundaries.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed field-name union updates the same weak body's fixed scalar counter record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Diagnostics never select a solver, alter acceptance, patch a method or keep a seen-key set to invent unavailable provenance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and no per-event allocation after the body's first counter record; there is no candidate logging or graph scan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each supplied event is counted once at its actual owning call site.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One fixed scalar record is weakly owned per body; no input, key, pose, callback, output or query population is retained.
   */
  export function work(body: IHumanBody, event: Exclude<keyof IStatistics, "hits" | "misses">, amount: number = 1): void {
    counters(body)[event] += amount;
  }

  /**
   * A body's limb-fit work counts since the process began.
   *
   * @param body The body.
   * @returns Independent cumulative actual fitting, curve, continuation and course counts, with the former memory's hit/miss fields at zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines copied cumulative counters and initial zero values.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the body's actual scalar counters or initial zero fields and returns an independent observation; no unavailable cause of a historical miss is inferred.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak lookup and fixed-field copy expose existing counters without mutation access.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No counter reset, fabricated memory event or acceptance effect is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant lookup and one fresh fixed-size scalar record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Every observation reads current effects; no previous statistics result is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned record belongs to the caller; this read adds no retained state beyond the existing weak body counters.
   */
  export function statistics(body: IHumanBody): IStatistics {
    return { ...counters(body) };
  }

  /** Lazily allocate the one bounded scalar population for an actual body. */
  function counters(body: IHumanBody): IStatistics {
    let out: IStatistics | undefined = COUNTS.get(body);
    if (out === undefined) {
      out = { hits: 0, misses: 0, coldFits: 0, continuedFits: 0,
        curveQueries: 0, curveProbes: 0, curveAccepted: 0, curveColdAnchors: 0,
        curveColdFallbacks: 0, curveRefinements: 0, orientationRootTrials: 0,
        orientationRootAccepted: 0, continuationNearAttempts: 0, continuationColdAttempts: 0,
        courseAdmitted: 0, courseFallbacks: 0, courseRefusedSpeed: 0, courseRefusedSwept: 0,
        courseRefusedSite: 0, courseRefusedLift: 0, courseRefusedLimit: 0, courseRefusedProbe: 0,
        courseRefusedEmbedded: 0, courseRefusedCrossing: 0 };
      COUNTS.set(body, out);
    }
    return out;
  }

  /** The counts, by body, released with the body. */
  const COUNTS: WeakMap<IHumanBody, IStatistics> = new WeakMap();
}
