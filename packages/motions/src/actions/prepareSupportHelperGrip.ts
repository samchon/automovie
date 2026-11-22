import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanChannel,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

type Follow = (
  posture: IAutoMovieMotionHumanPosture,
  seconds: number,
  channels?: readonly AutoMovieMotionHumanChannel[],
) => IAutoMovieMotionHumanPosture;
type OptionalFollow = Follow | undefined;

/**
 * Keep a helper's palm on the rising person's displayed palm throughout a
 * closed grip. The rising person's planted course is evaluated first, so
 * their limb never asks the helper for the same instant in return.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the moving contact and the order of the two roles.
 * @evidence contracts/development/implementation.md#principled-implementation The current rotated wrist-to-palm offset locates the helper wrist that places the two anatomical palm points together.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepares the single contact reader and translates the already planned wrist goal while its actual grip is closed.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the same support plan, contact interval, palm geometry and reaching arm on every body.
 * @evidence contracts/development/implementation.md#efficient-algorithms Only the helper's occupied arm observes one partner hand, once per requested interior sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The helper uses its interval's planned hand attitude and bend, and reads the helped hand from the existing performer reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds only the fixed hand frame, contact bounds and the partner's reader for the owning plan's lifetime.
 */
export function prepareSupportHelperGrip(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
  contacts: readonly IAutoMovieMotionHumanContactWindow[],
  duration: number,
): OptionalFollow {
  const assist: IAutoMovieMotionHumanSupport.IParams["assist"] =
    context.params.assist;
  if (assist?.role !== "helper") return undefined;
  const grip: IAutoMovieMotionHumanContactWindow | undefined = contacts.find(
    (w: IAutoMovieMotionHumanContactWindow): boolean =>
      w.kind === "grip" &&
      w.support.kind === "person" &&
      w.support.subject === assist.partner,
  );
  if (grip === undefined) return undefined;
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    assist.partner,
  );
  const region: AutoMovieHumanoidRegion =
    assist.hand === "left" ? "palmLeft" : "palmRight";
  const own: IAutoMovieHumanoidSurfaces.IFrame =
    context.body.surfaces.regions[region];
  const other: IAutoMovieHumanoidSurfaces.IFrame =
    partner.body.surfaces.regions[region];
  const limb: AutoMovieHumanLimb = `${assist.hand}Arm`;
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([other.bone]);
  const from: number = grip.from * duration;
  const to: number = grip.to * duration;
  return (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    channels?: readonly AutoMovieMotionHumanChannel[],
  ): IAutoMovieMotionHumanPosture => {
    const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
    if (
      seconds < from ||
      seconds > to ||
      goal?.rotation === undefined ||
      (channels !== undefined && !channels.includes(limb))
    )
      return posture;
    const bone: IAutoMovieResolvedBone = partner
      .bones(context.start + seconds, requested)
      .get(other.bone)!;
    const point: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.point(
      other,
      bone,
    );
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      point,
      Quaternion.rotateVector(goal.rotation, own.point),
    );
    return {
      ...posture,
      limbs: { ...posture.limbs, [limb]: { ...goal, point: wrist } },
    };
  };
}
