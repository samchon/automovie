import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  fitSeededChainToTarget,
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

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";

/**
 * Prepare a limb's unchanged source pose, clinical mappings, reference and
 * clearance for every target of one contact re-aim operation. The caller
 * keeps these inputs fixed and releases the workspace when that fit ends.
 * The workspace is placed by the caller's plant, whose chain carries the
 * body's rig-only readers of the limb when it was placed from the body's
 * chain constants (`placeChainPlant`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States operation scope, fixed inputs, reference/strain admission and caller-owned lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation The existing engine chain fit prepares the actual body rig once; a clinical reference still contains only the two chain joints and zero reference weight still omits it, while an uncontinued arm's strain comes from AutoMovieMotionHumanBend.strainOf.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This producer owns the Human-to-engine goal assembly and the engine's fitSeededChainToTarget.prepare owns the workspace; HumanLimbFit owns world attachment, obstruction creation, target iteration and selected pass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Near mode, reference/zero-weight omission, rotation, obstruction and strain keep their existing meanings. No point, callback result, prior fit or approximate key replaces the solve.
 * @evidence contracts/development/implementation.md#efficient-algorithms Creates each goal's reference records/strain once and shares its workspace across contact re-aim passes; every target keeps its full search/projection work and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Contact re-aim keeps its complete goal fixed, so one workspace serves its passes. The canonical poseResolution and authored/operation readers retain exact rig and source premises; no goal callback becomes a source reader or stored fit result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each returned workspace borrows body/source data and owns its goal-local reference/strain/callback scope until synchronous release; no handle is acquired.
 */
export function prepareHumanLimbFit(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  chain: IAutoMoviePlantChain,
  goal: IAutoMovieHumanLimbGoal,
  obstruction?: IAutoMovieFitChainToTargetProps["obstruction"],
  near?: IAutoMovieSwivelNear,
  readAuthored?: Parameters<typeof fitSeededChainToTarget.prepare>[1],
  resolution?: Parameters<typeof fitSeededChainToTarget.prepare>[2],
  plant?: Parameters<typeof fitSeededChainToTarget.prepare>[4],
): fitSeededChainToTarget.IWorkspace {
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
    ...(goal.rotation === undefined
      ? {}
      : { effectorRotation: goal.rotation }),
    ...(obstruction === undefined ? {} : { obstruction }),
    ...(near === undefined ? {} : { near }),
    ...(strain === null ? {} : { strain }),

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
  return fitSeededChainToTarget.prepare(source, readAuthored, resolution, body.poseResolution, plant);
}

/** Read the current clinical reference in degrees without a per-goal closure. */
function angles(
  bone: AutoMovieHumanoidBone,
  of: readonly [number, number, number],
): IAutoMovieJointPose {
  return { bone, flexion: of[0], abduction: of[1], twist: of[2] };
}
