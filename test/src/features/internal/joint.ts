import { AutoMovieHumanoidBone, IAutoMovieJointPose } from "@automovie/interface";

/**
 * Create one engine joint-pose record. Flexion, abduction and twist use degrees; omitted axes become null so tests can exercise the engine's own partial-channel/default rules without a fixture-side validator.
 */
export function joint(
  name: AutoMovieHumanoidBone,
  axes: Partial<
    Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
  > = {}
): IAutoMovieJointPose {
  return ({
  bone: name,
  flexion: axes.flexion ?? null,
  abduction: axes.abduction ?? null,
  twist: axes.twist ?? null,
});
}
