import { Vector3, bracketedCrossing } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAudit } from "../audit/AutoMovieMotionHumanAudit";
import { HumanSignature } from "../audit/HumanSignature";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { jumpGroundPosture } from "./jumpGroundPosture";
import type { jumpLanding } from "./jumpLanding";
import { jumpPath } from "./jumpPath";
import { jumpState } from "./jumpState";

/**
 * Limit a turned floor landing's absorption to a supported depth.
 *
 * The requested knee flexion around the turned stance can
 * put more dorsiflexion into one ankle than its range permits. In the
 * already turned footprint frame, find a height above the same stance
 * center where the achieved heel, ball and toes still stay on their
 * original supports. The returned height feeds both the absorption and
 * recovery paths, with no per-query root correction.
 *
 * @param body The jumping body used for ground fitting.
 * @param landing The unchanged footprints and nominal world-root endpoints.
 * @param velocity The ballistic world velocity at touchdown, metres per second.
 * @param seconds The absorption phase's duration in seconds.
 * @param demand The current lowered posture at a candidate world root and seconds since touchdown.
 * @returns The nominal absorbed root or the root of an observed shallower fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the affected phase, ground points, feet, root and unchanged target.
 * @evidence contracts/development/implementation.md#principled-implementation At fixed heading and horizontal stance center, measure the largest actual sole displacement or floor height through the shared ground and final planted-fit path at the motion signature's default cadence and both phase boundaries. Search the vertical segment only when the full planned depth fails and the shallow endpoint's course fits. Both path polynomials share the chosen root. The surviving bracket endpoint is verified; this makes no global statement about nonmonotone ROM branches or intermediate poses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the unchanged feet, measure the deep and shallow courses, then use the shared bracket search when they disagree.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Samples actual resolved limbs, preserves the original 5 mm continuity budget and world footprints, and does not claim a fit when even the shallow end fails. Ordinary jumps do not call this turned-floor preparation.
 * @evidence contracts/development/implementation.md#efficient-algorithms A candidate samples its absorption course at the existing audit cadence, with actual foot and toe FK per sample. Only a straddled bound prepares additional bracket samples; the final bracket width is the existing jump continuity budget in metres. No solve is added at playback.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The resolver preparation and sole-target geometry are shared across this one synchronous depth search. Each candidate still solves its current ankle, contact and pose.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Bounded fixed geometry, FK demand and projection stay in the call. The returned root alone survives.
 */
export function fitJumpAbsorption(
  body: IAutoMovieMotionHumanBody,
  landing: jumpLanding.ILanding,
  velocity: IAutoMovieVector3,
  seconds: number,
  demand: (
    root: IAutoMovieVector3,
    elapsed: number,
    read: ReturnType<typeof prepareHumanPoseResolution>,
  ) => IAutoMovieMotionHumanPosture,
): IAutoMovieVector3 {
  const limit: number = AutoMovieMotionHumanAudit.LIMITS.jump;
  const { absorbed, stood }: jumpLanding.ILanding = landing;
  const span: number = stood.y - absorbed.y;
  if (!(span > 0)) return absorbed;

  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const legs: ReturnType<typeof jumpState.prepareLegs> =
    jumpState.prepareLegs(body);
  const bones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    new Set(["leftFoot", "leftToes", "rightFoot", "rightToes"]),
  );
  const targets: Record<"left" | "right", IAutoMovieVector3[]> = {
    left: HumanFoot.SOCKETS.map(
      (point): IAutoMovieVector3 =>
        HumanFoot.point(body, "left", point, landing.feet.left),
    ),
    right: HumanFoot.SOCKETS.map(
      (point): IAutoMovieVector3 =>
        HumanFoot.point(body, "right", point, landing.feet.right),
    ),
  };
  const times: number[] = HumanSignature.times(0, seconds);

  /** Maximum sampled sole residual minus the existing metre budget. */
  const excess = (depth: number): number => {
    const root: IAutoMovieVector3 = { ...absorbed, y: stood.y - depth };
    const path: ReturnType<typeof jumpPath.prepare> = jumpPath.prepare(
      landing.touched,
      velocity,
      root,
      { x: 0, y: 0, z: 0 },
      seconds,
    );
    let miss: number = 0;
    for (const t of times) {
      const posed: jumpState.IState = jumpState.of(
        body,
        jumpGroundPosture(body, demand(path(t), t, read), "landing", read),
        legs,
        read,
        projection,
      );
      const placed: ReturnType<typeof bones> = bones(posed.pose, read());
      for (const side of ["left", "right"] as const) {
        const sole: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
          body,
          placed,
          side,
        );
        for (let i: number = 0; i < sole.length; ++i) {
          const point: IAutoMovieVector3 = sole[i]!.point;
          miss = Math.max(
            miss,
            Math.abs(point.y),
            Vector3.distance(point, targets[side][i]!),
          );
        }
      }
    }
    return miss - limit;
  };
  const deep: number = excess(span);
  if (deep <= 0) return absorbed;
  const shallow: number = excess(0);
  if (!(shallow <= 0)) return absorbed;

  const fit: number = bracketedCrossing({
    f: excess,
    past: (value: number): boolean => !(value <= 0),
    low: 0,
    high: span,
    known: { low: shallow, high: deep },
    tolerance: limit,
  }).low;
  return { ...absorbed, y: stood.y - fit };
}
