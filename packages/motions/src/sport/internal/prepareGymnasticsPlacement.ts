import { AutoMovieEngineKinematics, Quaternion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieHumanDigitGoal, IAutoMovieHumanLimbGoal, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieResolveCenterOfMass, IAutoMovieVector3 } from "@automovie/interface";

import { HumanPosturePreparation } from "../../posture/internal/HumanPosturePreparation";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";

/*
 * Prepare placement of one fixed gymnastic articulation by its centre of mass.
 * The body and mass model belong to the unchanged body's plan. Each query may
 * change only root heading and centre, in degrees and world metres.
 * Parameter body: The plan's body with an unchanged skeleton and physical profile.
 * Parameter model: Its mass model.
 * Parameter posture: The fixed clinical joints, with no limb/digit goals or
 * whole-body rotation.
 * Returns: A reader producing a fresh posture at the requested heading and
 * centre.
 * When goals or a separate whole-body rotation make the
 * articulation depend on its placement.
 */
export function prepareGymnasticsPlacement(
  body: IAutoMovieMotionHumanBody,
  model: IAutoMovieResolveCenterOfMass.IModel,
  posture: IAutoMovieMotionHumanPosture,
): (
  heading: Heading,
  centre: IAutoMovieVector3,
) => IAutoMovieMotionHumanPosture {
  if (
    Object.values(posture.limbs).some(
      (goal: IAutoMovieHumanLimbGoal | undefined): boolean =>
        goal !== undefined,
    ) ||
    Object.values(posture.digits ?? {}).some(
      (goal: IAutoMovieHumanDigitGoal | undefined): boolean =>
        goal !== undefined,
    ) ||
    posture.rotation !== undefined
  )
    throw new Error(
      "Fixed gymnastic placement requires joint-only articulation",
    );

  const prepared: HumanPosturePreparation.IPrepared =
    HumanPosturePreparation.prepare(body, {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: copyJoints(posture.joints),
      limbs: {},
    });
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of model.segments) requested.add(segment.bone);
  // The neutral canonical centre of mass, metres in the body's root frame.
  const local: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
    model,
    HumanPosturePreparation.bones(prepared, requested),
  );
  return (
    heading: Heading,
    centre: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture => {
    const rotation: ReturnType<typeof humanPostureHeading> =
      humanPostureHeading(heading);
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(rotation, local);
    return HumanPosturePreparation.rigid(
      prepared,
      {
        x: centre.x - offset.x,
        y: centre.y - offset.y,
        z: centre.z - offset.z,
      },
      heading.yaw,
      heading.pitch,
      heading.roll,
    ).posture;
  };
}

/*
 * The alternatives of `Heading2`'s site.
 */
type Heading2 = "yaw" | "pitch" | "roll";

/*
 * The root orientation that changes while the prepared articulation stays
 * fixed.
 */
type Heading = Pick<IAutoMovieMotionHumanPosture, Heading2>;
/*
 * Copy the authored tuples so neither the input nor a returned posture owns
 * retained shape data.
 */
function copyJoints(
  source: IAutoMovieMotionHumanPosture["joints"],
): IAutoMovieMotionHumanPosture["joints"] {
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const bone of Object.keys(source) as AutoMovieHumanoidBone[]) {
    const value: readonly [number, number, number] | undefined = source[bone];
    if (value !== undefined) joints[bone] = [value[0], value[1], value[2]];
  }
  return joints;
}
