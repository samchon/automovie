import { Quaternion, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPosturePreparation } from "../posture/HumanPosturePreparation";
import { createHumanPostureCurve } from "../posture/createHumanPostureCurve";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { prepareHumanPostureRigCheck } from "../posture/prepareHumanPostureRigCheck";

/** The alternatives of `Heading2`'s site. */
type Heading2 = "yaw" | "pitch" | "roll";

/**
 * The root orientation that changes while the prepared articulation stays
 * fixed.
 */
type Heading = Pick<IAutoMovieMotionHumanPosture, Heading2>;

/**
 * Prepare placement of one fixed gymnastic articulation by its centre of mass.
 * The body and mass model belong to the unchanged body's plan. Each query may
 * change only root heading and centre, in degrees and world metres.
 *
 * @param body The plan's body with an unchanged skeleton and physical profile.
 * @param model Its mass model.
 * @param posture The fixed clinical joints, with no limb/digit goals or
 *   whole-body rotation.
 * @returns A reader producing a fresh posture at the requested heading and
 *   centre.
 * @throws {Error} When goals or a separate whole-body rotation make the
 *   articulation depend on its placement.
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

  const joints: IAutoMovieMotionHumanPosture["joints"] = copyJoints(
    posture.joints,
  );
  const source: ReturnType<typeof createHumanPostureCurve> =
    createHumanPostureCurve({
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints,
      limbs: {},
    });
  let requested: Set<AutoMovieHumanoidBone> | undefined;
  const prepare: () => IPlacement = (): IPlacement => {
    const captured: createHumanPostureCurve.ICaptured | undefined =
      createHumanPostureCurve.prepared(body, source);
    const prepared: HumanPosturePreparation.IPrepared =
      captured?.prepared ?? HumanPosturePreparation.prepare(body, source(0));
    if (requested === undefined) {
      requested = new Set();
      for (const segment of model.segments) requested.add(segment.bone);
    }
    return {
      prepared,
      local: resolveAutoMovieCenterOfMass.place(
        model,
        HumanPosturePreparation.bones(prepared, requested),
      ),
      rig: body.poseResolution,
      topology: body.topology,
      unchanged: captured?.unchanged ?? prepareHumanPostureRigCheck(body),
    };
  };
  let fixed: IPlacement = prepare();
  return (
    heading: Heading,
    centre: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture => {
    const rotation: ReturnType<typeof humanPostureHeading> =
      humanPostureHeading(heading);
    if (
      fixed.rig !== body.poseResolution ||
      fixed.topology !== body.topology ||
      fixed.unchanged?.() !== true
    )
      fixed = prepare();
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      rotation,
      fixed.local,
    );
    return HumanPosturePreparation.rigid(
      fixed.prepared,
      {
        x: centre.x - offset.x,
        y: centre.y - offset.y,
        z: centre.z - offset.z,
      },
      heading.yaw,
      heading.pitch,
      heading.roll,
    );
  };
}

/**
 * One actual fixed-articulation preparation and the rig/ROM epoch its mass
 * offset belongs to.
 */
interface IPlacement {
  /** Genuine source capability, kept separate from mutable public pose views. */
  prepared: HumanPosturePreparation.IPrepared;

  /** Actual neutral canonical COM, metres in the body's root frame. */
  local: IAutoMovieVector3;

  /**
   * The genuine immutable FK owner used for that actual canonical mass
   * observation.
   */
  rig: IAutoMovieMotionHumanBody["poseResolution"];

  /** The actual topology context of the same canonical preparation. */
  topology: IAutoMovieMotionHumanBody["topology"];

  /**
   * Genuine current rig/ROM proof; absence requires ordinary preparation at
   * every query.
   */
  unchanged: (() => boolean) | undefined;
}

/**
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
