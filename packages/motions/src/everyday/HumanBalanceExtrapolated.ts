import { Vector3, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
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
   * The dynamic margin at one instant of a movement given by a one-argument posture function.
   *
   * @param body The body whose goals and mass are solved.
   * @param at The movement's posture at a film second, called with that second only.
   * @param seconds The instant to observe.
   * @returns Signed stability margin in metres, positive inside the foot hull.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the callback's argument, the solving, the world-metre sign and the three instants observed.
   * @evidence contracts/development/implementation.md#principled-implementation Hof's extrapolated centre of mass from the velocity of the t - 1/240 s and t + 1/240 s centres and a pendulum of 1.34 hip heights, measured to the foot outlines at t.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A one-off use of `prepare`: the same reader, built and read once, with the callback narrowed to its one argument.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every instant's posture is fully solved; no sample or centre is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three full posture fits; callers observing many instants use `prepare` to bind the bone names once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The three fits share one FK workspace and ROM projector; nothing is reused across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader and its workspaces end with the call; only a scalar escapes.
   */
  export function of(body: IAutoMovieMotionHumanBody, at: (seconds: number) => IAutoMovieMotionHumanPosture,
    seconds: number): number {
    return prepare(body)((t: number): IAutoMovieMotionHumanPosture => at(t), seconds);
  }

  /**
   * Bind fixed body/name metadata for repeated actual dynamic margin queries.
   *
   * @param body The unchanged canonical body and its classic profile mass model.
   * @returns A margin reader taking a current movement and film second, plus optional synchronous FK/ROM loans. Each movement invocation receives its actual time and those same loans; no movement or result enters the preparation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the body's lifetime, the movement and time inputs, the optional borrowed workspaces, the callback's arguments and the signed metre output.
   * @evidence contracts/development/implementation.md#principled-implementation Binds the mass-bearing and foot bone names once; each observation solves the two neighbouring postures and the current one fully, takes the central difference, extrapolates the centre (Hof, Gazendam and Sinke 2005) and measures it to the support hull.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One centre reader and one bone reader for the final posture are built once; each observation runs the three fits, lending them any supplied workspaces.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every limb, digit and contact goal is fitted; the final reading omits only bones no measure reads.
   * @evidence contracts/development/implementation.md#efficient-algorithms The name lookup runs once across Q observations; each observation costs three full fits and the mass and support work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The body fixes the bone names; each observation lends its own or its caller's FK workspace and ROM projector to its fits, and nothing keys a result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller holds the body and the two readers until release; movements, postures, centres and workspaces stay within each observation.
   */
  export function prepare(body: IAutoMovieMotionHumanBody): (at: At, seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>) => number {
    const centre: ReturnType<typeof prepareHumanBalanceCentre> = prepareHumanBalanceCentre(body);
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
      ...HumanColliders.bones(body), ...HumanFoot.bones(body),
    ]);
    const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
    return (at: At, seconds: number, source?: Parameters<typeof prepareHumanPoseResolution>[0],
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

/** The central difference of the centre, the full solve at the instant and the support margin of the extrapolated centre. */
function observed(body: IAutoMovieMotionHumanBody, at: At, seconds: number,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  projection: ReturnType<typeof prepareHumanPostureProjection>,
  centre: ReturnType<typeof prepareHumanBalanceCentre>, frames?: ReturnType<typeof poseBones.prepare>): number {
  // The difference step: a tenth of a 24 Hz film frame, so the difference
  // reads the movement's velocity within the frame it is drawn on.
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
