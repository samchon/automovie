import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Prepare one body's actual mass-bearing FK demand for changing postures.
 *
 * @param body The unchanged body owning the canonical profile and classic mass model.
 * @returns A world-metre mass-centre reader, optionally borrowing its current synchronous operation's exact FK workspace and genuine ROM projector.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes fixed body/profile/name demand from changing complete postures and current-operation FK/ROM loans, and states world-metre/fresh-vector output ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Each observation runs the original complete seeded posture fit, requested profile FK and engine classic mass placement. The canonical mass model and collider-name producer derive from the same complete profile segments; only their fixed requested-name indexing is prepared.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One poseBones.prepare producer precedes the ordinary complete-fit and mass-placement readers; a local or borrowed lazy workspace serves each actual fit and final displayed frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every current authored joint and all limb/digit/contact fits remain admitted and solved, with no observational fit pruning, guessed centre, cached pose, target result, changed mass or tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Prepares K actual profile-bone names/order once rather than sorting/indexing them for each of Q observations; each observation retains its full fit, current demanded ancestor FK and linear engine mass summation. No support geometry is built and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body/profile topology and name demand are retained. Root, angles, goals and mass placement stay current; an explicit operation FK/ROM loan shares only dependency-checked transforms/static projection metadata, with every joint still admitted in order through seeded's genuine-provenance gate.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller retains the body and bounded fixed-name reader until its operation/plan ends. Local getters and borrowed FK/ROM loans end with their synchronous observation or parent operation; no posture, fitted result, centre, dynamic workspace or time history enters the returned closure.
 */
export function prepareHumanBalanceCentre(
  body: IAutoMovieMotionHumanBody,
): (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>) => IAutoMovieVector3 {
  const bones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, HumanColliders.bones(body));
  return (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): IAutoMovieVector3 => {
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
    const model: IAutoMovieMotionHumanBody["massModel"] = body.massModel;
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(body, posture, undefined, {}, read, undefined, projection).pose;
    return resolveAutoMovieCenterOfMass.place(model, bones(pose, read()));
  };
}
