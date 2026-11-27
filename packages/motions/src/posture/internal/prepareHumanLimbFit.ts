import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  AutoMovieEngineMotionKinematics,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePlantChain,
  IAutoMoviePose,
  IAutoMovieSwivelNear,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";

/*
 * Prepare a limb's unchanged source pose, clinical mappings, reference and
 * clearance for every target of one contact re-aim operation. The caller keeps
 * these inputs fixed and releases the workspace when that fit ends. The
 * workspace is placed by the caller's plant, whose chain carries the body's
 * rig-only readers of the limb when it was placed from the body's chain
 * constants (`placeChainPlant`).
 */
export function prepareHumanLimbFit(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  chain: IAutoMoviePlantChain,
  goal: IAutoMovieHumanLimbGoal,
  obstruction?: IAutoMovieFitChainToTargetProps["obstruction"],
  near?: IAutoMovieSwivelNear,
  readAuthored?: AutoMovieEngineMotionKinematics.ISeededChainReadAuthored,
  resolution?: AutoMovieEngineMotionKinematics.ISeededChainFitPoseResolution,
  plant?: AutoMovieEngineMotionKinematics.ISeededChainPlantReader,
): AutoMovieEngineMotionKinematics.ISeededChainFitWorkspace {
  // A continued fit keeps its seed's basin. An uncontinued arm may instead
  // rank its own legal swivels by the same joint strain as Bend.solve.
  const strain: ReturnType<typeof AutoMovieMotionHumanBend.strainOf> =
    goal.elbow === "strain" &&
    near === undefined &&
    chain.effector.endsWith("Hand")
      ? AutoMovieMotionHumanBend.strainOf({
          body,
          side: chain.upper.startsWith("left") ? "left" : "right",
          rotation: goal.rotation,
        })
      : null;
  const source: Omit<IAutoMovieFitChainToTargetProps, "target"> = {
    skeleton: body.skeleton,
    pose,
    chain,
    bend: goal.bend,
    ...(goal.rotation === undefined ? {} : { effectorRotation: goal.rotation }),
    ...(obstruction === undefined ? {} : { obstruction }),
    ...(near === undefined ? {} : { near }),
    ...(strain === null ? {} : { strain }),
    // A bend the law's own elbow search placed is searched from, not again.
    ...(goal.elbow === "placed" ? { placed: true } : {}),

    // A reference of no weight decides nothing and remains absent, as in
    // the one-shot fit. Its root and non-chain pose never replace the source.
    ...(goal.reference === undefined || goal.reference.weight === 0
      ? {}
      : {
          ...(goal.reference.weight === undefined
            ? {}
            : { referenceWeight: goal.reference.weight }),
          referencePose: {
            ...pose,
            joints: [
              angles(chain.upper, goal.reference.upper),
              angles(chain.lower, goal.reference.lower),
            ],
          },
        }),
    topology: body.topology,
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
  };
  return AutoMovieEngineMotionKinematics.prepareSeededChainFit(
    source,
    readAuthored,
    resolution,
    body.poseResolution,
    plant,
  );
}

/*
 * Read the current clinical reference in degrees without a per-goal closure.
 */
function angles(
  bone: AutoMovieHumanoidBone,
  of: readonly [number, number, number],
): IAutoMovieJointPose {
  return { bone, flexion: of[0], abduction: of[1], twist: of[2] };
}
