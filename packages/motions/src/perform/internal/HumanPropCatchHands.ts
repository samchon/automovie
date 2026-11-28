import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionPropLaunch,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/*
 * Assign a spherical prop's receiving hands to its staged capture during their
 * fitted approach. The other surfaces still compete for first contact. The
 * completed capture must reach the same ball frame with each designated hand on
 * the ball's surface.
 */
export namespace HumanPropCatchHands {
  /*
   * The physically modeled gripping parts of one anchored capture.
   */
  export interface IApproach {
    /*
     * Catching performer.
     */
    subject: string;

    /*
     * Hand named by the captured grip.
     */
    side: AutoMovieHumanSide;

    /*
     * First film second of the fitted reception.
     */
    from: number;

    /*
     * Film second when the held state takes custody.
     */
    until: number;
  }

  /*
   * Select the owning capture's gripping parts at the exact superseding
   * instant.
   */
  export function forLaunch(
    launch: IAutoMovieMotionPropLaunch,
    grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
    capturedAt: number | undefined,
  ): readonly IApproach[] {
    if (capturedAt === undefined || launch.sphere === undefined) return [];
    return grips.flatMap((grip): IApproach[] => {
      const from: number | undefined = grip.capture?.handContactFrom;
      return grip.from === capturedAt &&
        grip.capture?.launch === launch &&
        from !== undefined
        ? [{ subject: grip.subject, side: grip.side, from, until: capturedAt }]
        : [];
    });
  }

  /*
   * Remove reserved hands and fingers from the current fresh sweep reading.
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
          (bone === `${grip.side}Hand` ||
            /Thumb|Index|Middle|Ring|Little/.test(bone))
        )
          bones.delete(bone);
    }
    return bones;
  }

  /*
   * Admit a reserved hold only if the actual fitted hand reaches the sphere.
   */
  export function closes(
    self: IAutoMovieMotionHumanPerformanceState,
    grip: IAutoMovieMotionHumanPerformanceState.IGrip,
    frame: IAutoMovieRigidTransform,
  ): boolean {
    const capture: typeof grip.capture = grip.capture;
    const sphere: IAutoMovieMotionPropLaunch["sphere"] = capture?.launch.sphere;
    if (sphere === undefined || capture?.handContactFrom === undefined)
      return true;

    return touches(self, grip.subject, grip.side, grip.from, frame, sphere);
  }

  /*
   * Compare the physical hand displayed at the film second to the sphere.
   */
  export function touches(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    side: AutoMovieHumanSide,
    seconds: number,
    frame: IAutoMovieRigidTransform,
    sphere: NonNullable<IAutoMovieMotionPropLaunch["sphere"]>,
  ): boolean {
    const body: ReturnType<
      typeof HumanPerformanceRead.person
    >["performer"]["body"] = HumanPerformanceRead.person(self, subject)
      .performer.body;
    const hand: AutoMovieHumanoidBone = `${side}Hand`;
    const fitted: IAutoMovieResolvedBone | undefined =
      HumanPerformanceRead.bones(self, subject, seconds, new Set([hand])).get(
        hand,
      );
    if (fitted === undefined || !HumanColliders.bones(body).has(hand))
      return false;

    const centre: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      frame.position,
      AutoMovieEngineQuaternion.rotateVector(frame.rotation, sphere.centre),
    );
    return (
      HumanColliders.distance(body, new Map([[hand, fitted]]), centre)
        .distance <=
      sphere.radius + 1e-6
    );
  }
}
