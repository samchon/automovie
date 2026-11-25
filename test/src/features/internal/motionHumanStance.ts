import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";

/**
 * The displayed bones of a body in the quiet stance every performer starts from
 * (`stand.posture`), at a place and a heading.
 *
 * The audit's tests carry these bones rigidly, or one limb of them against the
 * rest, to inject a defect of a known size into an otherwise sound pose.
 *
 * @param body The body.
 * @param at Where it stands, world metres; the origin by default.
 * @param yaw Its heading, degrees; zero by default.
 * @returns The displayed bones.
 */
export function motionHumanStance(
  body: IAutoMovieMotionHumanBody,
  at: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
  yaw: number = 0,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return poseBones(
    body,
    resolveHumanPosture(
      body,
      AutoMovieMotionHumanStance.stand.posture(body, at, yaw),
    ),
  );
}
