import { AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHandspring,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jump } from "../../actions/internal/jump";
import { stand } from "../../actions/internal/stand";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { StrikingBody } from "../../striking/internal/StrikingBody";

/*
 * Prepare the planted recovery from a handspring's touchdown posture.
 * Parameter input: The displayed flight, entry feet and landing surface.
 * Returns: The lowered posture at seconds since touchdown, with optional
 * synchronous FK resolution.
 * When either foot is outside a supplied landing
 * surface.
 */
export function handspringLanding(
  input: IHandspringLanding,
): (
  seconds: number,
  resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
) => IAutoMovieMotionHumanPosture {
  const {
    body,
    standing,
    entered,
    footBones,
    landingSurface,
    riseOfMat,
    yaw,
    flying,
    flight,
    rising,
    ease,
    land,
  } = input;

  // The landing: feet where they came down, the root carrying the
  // touchdown's velocity out to the standing place over them.
  const touched: IAutoMovieMotionHumanPosture = flying(flight);
  const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    StrikingBody.trunk(body, touched, undefined, footBones);
  const landed: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: shown.get("leftFoot")!.worldPosition,
    right: shown.get("rightFoot")!.worldPosition,
  };
  if (landingSurface !== undefined) {
    landingSurface.within(landed.left);
    landingSurface.within(landed.right);
  }
  const rootDown: IAutoMovieVector3 = touched.root;
  const rootSpeed: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    AutoMovieEngineVector3.subtract(rootDown, flying(flight - 1e-3).root),
    1e3,
  );
  const stoodFeet: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
    entered.get("leftFoot")!.worldPosition,
    entered.get("rightFoot")!.worldPosition,
    0.5,
  );
  const rootUp: IAutoMovieVector3 = {
    ...AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.lerp(landed.left, landed.right, 0.5),
      AutoMovieEngineVector3.subtract(standing.root, stoodFeet),
    ),
    y: standing.root.y + riseOfMat,
  };
  const forward: IAutoMovieVector3 = {
    x: Math.sin((yaw * Math.PI) / 180),
    y: 0,
    z: Math.cos((yaw * Math.PI) / 180),
  };
  const footRotations: Record<AutoMovieHumanSide, IAutoMovieQuaternion> = {
    left: HumanFoot.rotation(yaw + stand.TOE_OUT, 0),
    right: HumanFoot.rotation(yaw - stand.TOE_OUT, 0),
  };
  const bends: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: AutoMovieEngineVector3.add(landed.left, {
      x: forward.x,
      y: body.measure.hipHeight / 2,
      z: forward.z,
    }),
    right: AutoMovieEngineVector3.add(landed.right, {
      x: forward.x,
      y: body.measure.hipHeight / 2,
      z: forward.z,
    }),
  };
  const span: number = jump.ABSORB + jump.RISE;
  return (
    t: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ): IAutoMovieMotionHumanPosture => {
    const u: number = ease(t / span);
    const root: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.lerp(rootDown, rootUp, u),
      AutoMovieEngineVector3.scale(rootSpeed, AutoMovieEngineMotionSampling.carriedRate(span, t)),
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const side of ["left", "right"] as const)
      limbs[`${side}Leg`] = {
        point: landed[side],
        rotation: { ...footRotations[side] },
        bend: { ...bends[side] },
        planted: true,
      };
    return lowerHumanPosture(
      body,
      {
        ...ExerciseKey.posed(rising(u), yaw),
        // The same tip as the flight's, written below a whole turn so the
        // landing ends at 0 and the next action does not unwind a turn.
        pitch: (land - 360) * (1 - u),
        root,
        limbs,
      },
      undefined,
      resolution,
    );
  };
}

/*
 * The observed entry, flight and planted recovery inputs for a floor handspring
 * or vault.
 */
interface IHandspringLanding {
  /*
   * The performer.
   */
  body: IAutoMovieMotionHumanBody;

  /*
   * The entry stand used to restore the standing root.
   */
  standing: IAutoMovieMotionHumanPosture;

  /*
   * Entry ankle positions in world metres.
   */
  entered: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /*
   * The same two foot bones demanded by the entry observation.
   */
  footBones: ReadonlySet<AutoMovieHumanoidBone>;

  /*
   * An optional landing surface whose extents both feet must satisfy.
   */
  landingSurface: IAutoMovieMotionHumanHandspring.ISurface | undefined;

  /*
   * Landing elevation relative to the entry ground, metres.
   */
  riseOfMat: number;

  /*
   * The landing heading, degrees.
   */
  yaw: number;

  /*
   * The flight posture at seconds since hand release.
   */
  flying: (seconds: number) => IAutoMovieMotionHumanPosture;

  /*
   * The flight duration from hand release to touchdown, seconds.
   */
  flight: number;

  /*
   * The arch-to-stand articulation at eased recovery share.
   */
  rising: ReturnType<typeof ExerciseKey.prepareBlend>;

  /*
   * The minimum-jerk recovery progress function.
   */
  ease: (share: number) => number;

  /*
   * The unwrapped touchdown pitch, degrees.
   */
  land: number;
}
