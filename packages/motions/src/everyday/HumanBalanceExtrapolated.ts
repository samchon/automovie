import { Vector3, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanForceSite,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { prepareHumanBalanceCentre } from "./prepareHumanBalanceCentre";

/**
 * Dynamic balance observations over a movement's actual three solved postures.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines cold and explicit fixed-body readers, metre margins, central-difference timing and synchronous metadata ownership.
 * @evidence contracts/development/design.md#principled-representation Uses the canonical posture, body, engine mass model and actual foot outlines; velocity and extrapolated mass placement remain engine-owned world-space quantities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanBalance delegates cold extrapolated and fixed-body prepareExtrapolated here; one numerical observation owner serves both.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no external numeric index, fitted result, resolved flag, tolerance override or alternate body/foot representation.
 */
export namespace HumanBalanceExtrapolated {
  /**
   * Read the original dynamic margin with one-argument movement callbacks.
   *
   * @param body The canonical body whose complete goals and mass are solved.
   * @param at Current raw posture at film seconds, called only with that time.
   * @param seconds The instant to observe.
   * @returns Signed stability margin in metres, positive inside the foot hull.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States callback arity, full solving, world-metre sign and original three-instant observation.
   * @evidence contracts/development/implementation.md#principled-implementation Hof's extrapolated mass centre uses velocity from the original t-1/240 and t+1/240 observations and pendulum length 1.34 hip heights, then actual t foot outlines determine the margin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Per-call FK/ROM and centre metadata feed one shared three-pose numerical owner; a thin callback adapter retains the original single supplied argument.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every original callback, full seeded fit, joint admission, mass sum, velocity expression, pendulum and hull query remains in its original order; no movement sample or achieved centre is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three complete posture fits remain, with one mass-name preparation for both neighbours and the original full final FK. Repeated fixed-body callers use prepare to move only immutable indexing outside their loop.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One synchronous FK workspace and genuine ROM projector serve all three actual fits; current scalar dependencies and every authored joint remain admitted. No prior dynamic margin, pose or time sample is reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local metadata, callback adapter and centre reader end with this call or throw; only a scalar escapes and no body, posture, frame, projector or history is retained here.
   */
  export function of(body: IAutoMovieMotionHumanBody, at: (seconds: number) => IAutoMovieMotionHumanPosture,
    seconds: number): number {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> = prepareHumanPostureProjection(body);
    const centre: ReturnType<typeof prepareHumanBalanceCentre> = prepareHumanBalanceCentre(body);
    return observed(body, (t: number): IAutoMovieMotionHumanPosture => at(t), seconds,
      resolution, projection, centre);
  }

  /**
   * Bind fixed body/name metadata for repeated actual dynamic margin queries.
   *
   * @param body The unchanged canonical body and its classic profile mass model.
   * @returns A margin reader taking a current movement and film second, plus optional synchronous FK/ROM loans. Each movement invocation receives its actual time and those same loans; no movement or result enters the preparation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States unchanged-body lifetime, current movement/time inputs, optional same-operation metadata loans, callback arguments and signed metre output.
   * @evidence contracts/development/implementation.md#principled-implementation Shares only the genuine mass-bearing and actual foot socket/outline name preparation. The shared owner still evaluates both neighbours and current full posture, the same central difference, mass extrapolation and actual support hull.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One centre reader and one union-demand final FK producer precede the per-observation native full-fit path; supplied synchronous metadata reaches movement construction and every actual canonical fit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All authored joints and all limb/digit/contact fits remain complete, including unrelated goals; final demand changes only unobserved world transforms. Every movement callback and mass/hull computation still runs, with original step, candidate order and bounds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed mass/foot name lookup and sorting run once across Q observations; each observation retains three full fits and current mass/support work while its final FK returns only profile and actual socket/outline ancestors. No measured speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged canonical body establishes fixed rig/profile/surface membership. Each invocation lends its own or a parent's exact FK workspace and genuine ROM metadata; every changed root/joint/goal and mass placement remains actual and no sample identity keys a result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning search/plan retains body and two bounded static readers until release. Current movement functions, postures, returned maps, mass centres, FK/ROM loans and time samples remain invocation-local and are never saved by the returned closure.
   */
  export function prepare(body: IAutoMovieMotionHumanBody): (at: AutoMovieHumanForceSite, seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>) => number {
    const centre: ReturnType<typeof prepareHumanBalanceCentre> = prepareHumanBalanceCentre(body);
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
      ...HumanColliders.bones(body), ...HumanFoot.bones(body),
    ]);
    const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
    return (at: AutoMovieHumanForceSite, seconds: number, source?: Parameters<typeof prepareHumanPoseResolution>[0],
      supplied?: ReturnType<typeof prepareHumanPostureProjection>): number => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
      const projection: ReturnType<typeof prepareHumanPostureProjection> = supplied ?? prepareHumanPostureProjection(body);
      return observed(body, at, seconds, resolution, projection, centre, frames);
    };
  }
}

/** Current raw movement construction may borrow metadata only during this call. */
type At = (seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>) => IAutoMovieMotionHumanPosture;

/** The original central difference, current full solve and support margin. */
function observed(body: IAutoMovieMotionHumanBody, at: AutoMovieHumanForceSite, seconds: number,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  projection: ReturnType<typeof prepareHumanPostureProjection>,
  centre: ReturnType<typeof prepareHumanBalanceCentre>, frames?: ReturnType<typeof poseBones.prepare>): number {
  const h: number = 1 / 240;
  const a: IAutoMovieVector3 = centre(at(seconds - h, resolution, projection), resolution, projection);
  const b: IAutoMovieVector3 = centre(at(seconds + h, resolution, projection), resolution, projection);
  const velocity: IAutoMovieVector3 = Vector3.scale(Vector3.subtract(b, a), 1 / (2 * h));
  const pose: ReturnType<typeof resolveHumanPosture> = resolveHumanPosture.seeded(
    body, at(seconds, resolution, projection), undefined, {}, resolution, undefined, projection,
  ).pose;
  const bones: ReturnType<typeof poseBones> = frames === undefined
    ? poseBones(body, pose, resolution()) : frames(pose, resolution());
  const xcom: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.extrapolate(
    resolveAutoMovieCenterOfMass.place(body.massModel, bones), velocity,
    resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
  );
  return resolveAutoMovieCenterOfMass.margin(xcom, HumanFoot.base(body, bones));
}
