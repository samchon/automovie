import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanThrowObjectForm,
  IAutoMovieMotionPropLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * Geometry added by the three precision delivery styles to the shared throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the supplemental windup and spherical release inputs.
 * @evidence contracts/development/design.md#principled-representation A closed arc feeds the existing hand planner, a planted lowering feeds the bowler's pose, and a ball's sized grip feeds the shared sphere flight.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies the windup path, the bowling stance and launch annotations to throwObject.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No second flight or grip ownership path is introduced.
 */
export namespace precisionThrow {
  /**
   * A full windmill arm circle blending from the entry hand pose to the regular release chamber.
   * The radius is proportional to arm length and provisional. See WBSC 2026–2029 Fast Pitch
   * Rule 4.3.3 and Oliver et al., the windmill pelvis and trunk measurements (PMC8358524).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the authored arc and its landmarks. All points are in world metres, progress is in [0, 1].
   * @evidence contracts/development/implementation.md#principled-implementation Trace a vertical circle around the throwing shoulder's region, returning to the launch chamber. Blend only the approach from the held hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One local curve, one frame placement, then one entry blend.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The curve is measured in arm lengths and never moves the release or changes the launch clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the existing body frame and entry blend curve.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function windmill(frame: IAutoMovieMotionHumanFrame, arm: number, chamber: IAutoMovieVector3, rest: IAutoMovieVector3, progress: number): IAutoMovieVector3 {
    const angle: number = 2 * Math.PI * progress;
    const radius: number = 0.8 * arm;
    const offset: IAutoMovieVector3 = HumanFrame.point({ ...frame, origin: chamber }, {
      x: 0, y: radius * (1 - Math.cos(angle)), z: radius * Math.sin(angle),
    });
    return Vector3.lerp(rest, offset, minimumJerk.share(Math.min(progress * 5, 1)));
  }

  /**
   * Prepare the two-foot bowling stance for a settled solo release. The pelvis descends through
   * knee flexion while the soles hold their entry placements. The depth is a provisional share
   * of leg length. Seiferheld et al. (doi:10.3390/s23198284) distinguish support and release during
   * the bowling delivery. A carrier remains responsible for its own base and feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the support frame, the provisional body-scaled depth and the unmodified carrier case.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the two displayed entry feet once and resolves bent knees over those fixed world placements as the pelvis descends. The release aim and played motion share this pose transform.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Early return outside solo bowling, then prepare both plants and apply one fraction of the lowering to each posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A carried performer retains its root and support owner. A grounded bowler does not lower by translating the feet or by shifting the ball after release.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two foot reads during preparation and fixed work per sampled posture.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the trunk owner's prepared planted leg goals for the same supports at each instant.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one depth and at most two prepared foot goal readers for the action lifetime.
   */
  export function stance(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "carrier" | "entry">,
    style: IAutoMovieMotionHumanThrowObjectForm.Style,
  ): ((posture: IAutoMovieMotionHumanPosture, share: number) => IAutoMovieMotionHumanPosture) | undefined {
    if (style !== "bowling" || context.carrier !== undefined) return undefined;
    const { body, entry } = context;
    const depth: number = 0.2 * (body.measure.thigh + body.measure.shank);
    const planted: ReturnType<typeof AutoMovieMotionHumanTrunk.preparePlanted> =
      AutoMovieMotionHumanTrunk.preparePlanted(body, AutoMovieMotionHumanTrunk.footing(body, entry.posture));
    return (posture: IAutoMovieMotionHumanPosture, share: number): IAutoMovieMotionHumanPosture =>
      share === 0 ? posture : planted({ ...posture, root: { ...posture.root, y: posture.root.y - depth * share } });
  }

  /**
   * Add the existing spherical collision input to a precision delivery with a sized ball grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads the local ball centre and radius from its grip. Explicit nonfixed attitudes continue through the original launch path.
   * @evidence contracts/development/implementation.md#principled-implementation The opt-in spherical flight shape uses the declared aperture and local grip centre without changing launch time, velocity or held origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Filter by the owning sport form then read the ball affordance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No assumed ball size and no replacement of explicit projectile attitude.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most one scan for a sized grip per launch.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the canonical published launch and its sphere input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the returned array.
   */
  export function launches(context: Pick<IAutoMovieMotionHumanActionContext, "prop">, style: IAutoMovieMotionHumanThrowObjectForm.Style, launches: IAutoMovieMotionPropLaunch[]): IAutoMovieMotionPropLaunch[] {
    if (style !== "windmill" && style !== "cricket" && style !== "bowling") return launches;
    return launches.map((launch: IAutoMovieMotionPropLaunch): IAutoMovieMotionPropLaunch => {
      if (launch.attitude !== undefined && launch.attitude.kind !== "fixed") return launch;
      const grip: IAutoMovieAffordance | undefined = context.prop(launch.prop).prop.affordances?.find((affordance: IAutoMovieAffordance): boolean => affordance.id === "grip");
      const diameter: number | undefined = grip?.aperture;
      if (diameter === undefined || !Number.isFinite(diameter) || diameter <= 0) return launch;
      return { ...launch, sphere: { radius: diameter / 2, centre: grip!.frame.translation } };
    });
  }
}
