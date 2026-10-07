import type { IHumanSourcePoseProducer } from "./structures/IHumanSourcePoseProducer.ts";

/**
 * The pose corrective producer, revision "pose-g1": the repository's contact
 * solver (`test/scripts/body-basis`, `createBodyCorrectiveSession` and
 * `mergeBodyCorrectives`) re-solving, on the body view, the shoulder states
 * whose published correctives reached the new neck support. Only the left
 * state is solved; the merge publishes its exact mirror. The solver has
 * changed since the published round 9 (onset bisection over the whole shape,
 * per-pair tissue budgets and queuing a still-crossing ramp midpoint as its
 * own state), so the same state now yields its own correctives, not the
 * published ones.
 */
export const HUMAN_SOURCE_POSE_PRODUCER: IHumanSourcePoseProducer = {
  revision: "pose-g1",
  dropped: [
    "pose/leftUpperArm.tt(120,120,0)",
    "pose/rightUpperArm.tt(120,120,0)",
  ],
  states: [
    {
      name: "leftUpperArm.tt(120,120,0)",
      set: "shoulders",
      group: "shoulders:leftUpperArm.tt(120,120,0)",
      shape: {},
      pose: [],
      shoulders: [
        { bone: "leftUpperArm", plane: 120, elevation: 120, axialRotation: 0 },
      ],
    },
  ],
};
