import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionPropLaunch,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/**
 * Assign a spherical prop's receiving hands to its staged capture during
 * their fitted approach. The other surfaces still compete for first contact.
 * The completed capture must reach the same ball frame with each designated
 * hand on the ball's surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the approach scope and the final collision-backed closure check.
 * @evidence contracts/development/design.md#principled-representation A reservation is one grip on the same launch, with film seconds for its approach and closure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPropFlight selects the capture and admits closure; HumanPropSweep applies its hand mask while observing current body geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the same launch's designated hands and their fingers are reserved. Other performers, body parts, props and earlier instants retain their actual collision domains.
 */
export namespace HumanPropCatchHands {
  /**
   * The physically modeled gripping parts of one anchored capture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fields identify one performer, one hand and the film-time bounds of its fitted approach.
   * @evidence contracts/development/design.md#principled-representation A later grip closes a bounded part of the launch on the same film clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Sweep reads only subject, side and time bounds; the capture the range comes from remains with the flight owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No approach hides any non-hand bone or applies to another flight.
   */
  export interface IApproach {
    /** Catching performer. */
    subject: string;

    /** Hand named by the captured grip. */
    side: AutoMovieHumanSide;

    /** First film second of the fitted reception. */
    from: number;

    /** Film second when the held state takes custody. */
    until: number;
  }

  /**
   * Select the owning capture's gripping parts at the exact superseding instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Receives a tagged launch and its final capture time in film seconds, and returns the owned handedness and approach ranges.
   * @evidence contracts/development/implementation.md#principled-implementation Requires an opted-in spherical launch and matches each grip by exact launch identity and closure.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rejects absent captures before filtering and projecting the matching grips.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Later grips or captures of another launch never affect the returned collision domain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits each prop grip once and allocates records only for selected approaches.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Consumes the already resolved grip records without replanning their poses.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new list of small records without retaining the supplied grips.
   */
  export function forLaunch(
    launch: IAutoMovieMotionPropLaunch,
    grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
    capturedAt: number | undefined,
  ): readonly IApproach[] {
    if (capturedAt === undefined || launch.sphere === undefined) return [];
    return grips.flatMap(
      (grip): IApproach[] => {
        const from: number | undefined = grip.capture?.handContactFrom;
        return grip.from === capturedAt && grip.capture?.launch === launch && from !== undefined
          ? [{ subject: grip.subject, side: grip.side, from, until: capturedAt }]
          : [];
      },
    );
  }

  /**
   * Remove reserved hands and fingers from the current fresh sweep reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Mutates and returns the caller's fresh bones, for one person's capture windows and film second.
   * @evidence contracts/development/implementation.md#principled-implementation Removes the hand and fingers on the named side inside its approach window.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Tests each before-and-after bound before visiting the map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves forearms, other body parts and all frames outside the approach window.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits the map only for active hand windows, at most once per active receiving hand.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the already computed fresh bone map without allocating independent placement or pose snapshots.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no bones, schedules or query state.
   */
  export function omit(
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    approach: readonly IApproach[],
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    for (const grip of approach) {
      if (seconds < grip.from || seconds > grip.until) continue;
      for (const bone of bones.keys())
        if (
          bone.startsWith(grip.side) &&
          (bone === `${grip.side}Hand` || /Thumb|Index|Middle|Ring|Little/.test(bone))
        )
          bones.delete(bone);
    }
    return bones;
  }

  /**
   * Admit a reserved hold only if the actual fitted hand reaches the sphere.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads the reserved hand's actual contact with the displayed spherical prop, allowing one micrometre of numerical error.
   * @evidence contracts/development/implementation.md#principled-implementation Converts the displayed prop frame to its sphere centre and tests the named hand body's signed distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Skips legacy grips, reads the one actual hand and checks the contact geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing fitted or profiled hands cannot satisfy a reserved capture. Fingers can enter before closure, yet the hand body must meet the sphere.
   * @evidence contracts/development/implementation.md#efficient-algorithms Requests one hand's skeletal output and restricts the final signed-distance query to that bone.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing forward-kinematics and collider distance owners for the fitted body.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All projection inputs release on return and only the closure verdict escapes.
   */
  export function closes(
    self: IAutoMovieMotionHumanPerformanceState,
    grip: IAutoMovieMotionHumanPerformanceState.IGrip,
    frame: IAutoMovieRigidTransform,
  ): boolean {
    const capture: typeof grip.capture = grip.capture;
    const sphere: IAutoMovieMotionPropLaunch["sphere"] = capture?.launch.sphere;
    if (sphere === undefined || capture?.handContactFrom === undefined) return true;

    const body: ReturnType<typeof HumanPerformanceRead.person>["performer"]["body"] =
      HumanPerformanceRead.person(self, grip.subject).performer.body;
    const hand: AutoMovieHumanoidBone = `${grip.side}Hand`;
    const fitted: IAutoMovieResolvedBone | undefined =
      HumanPerformanceRead.bones(self, grip.subject, grip.from, new Set([hand])).get(hand);
    if (fitted === undefined || !HumanColliders.bones(body).has(hand)) return false;

    const centre: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, sphere.centre),
    );
    return HumanColliders.distance(body, new Map([[hand, fitted]]), centre).distance
      <= sphere.radius + 1e-6;
  }
}
