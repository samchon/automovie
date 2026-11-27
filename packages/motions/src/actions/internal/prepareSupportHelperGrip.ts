import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanLimb, AutoMovieHumanoidBone, AutoMovieHumanoidRegion, AutoMovieMotionHumanChannel, IAutoMovieHumanLimbGoal, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPerformerReader, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSupport, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

/*
 * Keep a helper's palm on the rising person's displayed palm throughout a
 * closed grip. The rising person's planted course is evaluated first, so their
 * limb never asks the helper for the same instant in return.
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
    const point: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
      other,
      bone,
    );
    const wrist: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      point,
      AutoMovieEngineQuaternion.rotateVector(goal.rotation, own.point),
    );
    return {
      ...posture,
      limbs: { ...posture.limbs, [limb]: { ...goal, point: wrist } },
    };
  };
}
type Follow = (
  posture: IAutoMovieMotionHumanPosture,
  seconds: number,
  channels?: readonly AutoMovieMotionHumanChannel[],
) => IAutoMovieMotionHumanPosture;

type OptionalFollow = Follow | undefined;
