import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMoviePlantChain,
  type IAutoMovieSwivelNear,
  type IFitChainToTargetProps,
  fitSeededChainToTarget,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * Prepare a limb's unchanged source pose, clinical mappings, reference and
 * clearance for every target of one contact re-aim operation. The caller
 * keeps these inputs fixed and releases the workspace when that fit ends.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States operation scope, fixed inputs, reference/strain admission and caller-owned lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation The existing engine chain fit prepares the actual body rig once; a clinical reference still contains only the two chain joints and zero reference weight still omits it, while an uncontinued arm's strain comes from AutoMovieMotionHumanBend.strainOf.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This producer owns Human-to-engine fixed input assembly; HumanLimbFit owns world attachment, obstruction creation, target iteration and the selected pass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Near mode, reference weight, goal rotation, obstruction and strain retain their existing meanings; no target, callback result, previous fit or approximate cache key replaces the actual solve.
 * @evidence contracts/development/implementation.md#efficient-algorithms Creates the reference's two records and optional strain closure once, then delegates rig preparation and lazy FK to one engine workspace shared by at most REAIM_PASSES targets; no speedup is claimed without measurement.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All passes keep body/source pose, goal bend/rotation/reference, obstruction and near seed fixed. The body's genuine immutable canonical poseResolution supplies static FK prerequisites; the optional authored reader stays at its original admission site, while a same-operation resolution reader shares only exact joint/ancestor work among distinct source, zeroed and reference poses.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned workspace borrows body inputs and the operation's callbacks and owns bounded reference/strain data; HumanLimbFit retains it only until synchronous completion or failure, with no added global cache or resource handle.
 */
export function prepareHumanLimbFit(
  body: IHumanBody,
  pose: IAutoMoviePose,
  chain: IAutoMoviePlantChain,
  goal: IHumanPosture.IGoal,
  obstruction?: IFitChainToTargetProps["obstruction"],
  near?: IAutoMovieSwivelNear,
  readAuthored?: Parameters<typeof fitSeededChainToTarget.prepare>[1],
  resolution?: Parameters<typeof fitSeededChainToTarget.prepare>[2],
): fitSeededChainToTarget.IWorkspace {
  /** Read a law's clinical reference triple without changing its bone or units. */
  const angles: (
    bone: AutoMovieHumanoidBone,
    of: readonly [number, number, number],
  ) => IAutoMovieJointPose = (
    bone: AutoMovieHumanoidBone,
    of: readonly [number, number, number],
  ): IAutoMovieJointPose => ({
    bone,
    flexion: of[0],
    abduction: of[1],
    twist: of[2],
  });

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
  return fitSeededChainToTarget.prepare(
    {
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
    },
    readAuthored,
    resolution,
    body.poseResolution,
  );
}
