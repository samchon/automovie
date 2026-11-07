import type { IAutoMovieVector3 as V } from "@automovie/interface";

import { AutoMovieStepPlanner as Planner } from "./AutoMovieStepPlanner";

/** Sample the declared recovery trajectory and its derivative at one clock, independently of native control or cache-frame ownership. */
export function samplePhysicalRecoveryGoal(input: {
  /** Existing support swing, with explicit start and end. */ swing: Planner.IStep;
  /** Authored world endpoint and velocity at the same requested clock. */ point: V;
  velocity: V;
  /** Declared peak clearance, metres. */ height: number;
  /** Requested local seconds. */ seconds: number;
}): { point: V; velocity: V } {
  const duration: number = input.swing.end - input.swing.start;
  const progress: number = Math.max(
    0,
    Math.min(1, (input.seconds - input.swing.start) / duration),
  );
  const placement: Planner.IPlacement = Planner.swing(
    input.swing.from,
    input.swing.to,
    progress,
    input.height,
  );
  const rate: number =
    progress > 0 && progress < 1
      ? (30 * progress ** 2 * (1 - progress) ** 2) / duration
      : 0;
  return {
    point: {
      x: placement.point[0],
      y: input.point.y + placement.clearance,
      z: placement.point[1],
    },
    velocity: {
      x: (input.swing.to.point[0] - input.swing.from.point[0]) * rate,
      y:
        input.velocity.y +
        (progress > 0 && progress < 1
          ? (input.height * Math.PI * Math.cos(Math.PI * progress)) / duration
          : 0),
      z: (input.swing.to.point[1] - input.swing.from.point[1]) * rate,
    },
  };
}
