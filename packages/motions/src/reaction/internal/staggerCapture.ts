import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import type { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import { staggerCaptureDistance } from "./staggerCaptureDistance";

/**
 * The N-step capture distance of a pushed body in closed form (Koolen et al.
 * 2012, Int J Robot Res 31:1094, eqs. 13, 25, 26): with `q = e^(-omega0 T_s)`
 * per step of time `T_s`, a body whose extrapolated centre of mass starts
 * within `d_N = r_max + l_max q (1 - q^N) / (1 - q)` of its stance ankle can be
 * caught in N steps, `r_max` the base's reach from the ankle and `l_max` the
 * longest step; the first step, after its own time `T_1`, gives `r_max +
 * (l_max
 *
 * - R_max + d_(N-1)) e^(-omega0 T_1)`.
 *
 * Koolen's model steps instantly, onto an optimally oriented foot, anywhere in
 * a disc of radius `l_max`; this recovery's steps take their measured times,
 * land in a region inside that disc and must be admitted by the legs. Every
 * bound here is taken at its most permissive (the largest sole reach, the
 * longest measured step in any direction, the shortest measured swing), so a
 * push outside `d_N` is caught by no recovery of N steps here either: the
 * distance is a necessary screen, never the decision, which stays with the
 * steps (`staggerStep`) and the admission (`staggerAdmission`).
 *
 * @param pendulum The push's pendulum at its start.
 * @returns The capture distances by step count and the push's own reading.
 */
export function staggerCapture(
  pendulum: StaggerPendulum,
): IStaggerCaptureResult {
  const {
    STEP_TIME,
    STEP_LENGTH,
    REACTION,
    TRANSFER,
    STEPS,
  }: typeof staggerBounds = staggerBounds;
  const w: number = pendulum.w;
  const body: StaggerPendulum["body"] = pendulum.body;

  // The most permissive bounds: the farthest sole point from its ankle, the
  // longest measured step, the shortest measured swing.
  const reach: number = Math.max(
    ...(["left", "right"] as const).flatMap(
      (side: AutoMovieHumanSide): number[] =>
        HumanFoot.sole(body, side, pendulum.entered[side]).map(
          (q: IAutoMovieVector3): number =>
            Math.hypot(
              q.x - pendulum.entered[side].ankle.x,
              q.z - pendulum.entered[side].ankle.z,
            ),
        ),
    ),
  );

  // A step's region is measured from where the foot stood beside the stance
  // foot, so a landing lies within the longest step plus the entry's ankle
  // separation of the stance ankle.
  const longest: number =
    Math.max(STEP_LENGTH.forward, STEP_LENGTH.side, STEP_LENGTH.backward) *
      body.measure.stature +
    Math.hypot(
      pendulum.entered.left.ankle.x - pendulum.entered.right.ankle.x,
      pendulum.entered.left.ankle.z - pendulum.entered.right.ankle.z,
    );
  const shortest: number = Math.min(
    STEP_TIME.forward,
    STEP_TIME.side,
    STEP_TIME.backward,
  );

  // The first step lifts off no sooner than the unloaded leg of a sideways
  // push does (`LATERAL.footOff` of the reaction and weight shift).
  const first: number =
    Math.min(1, staggerBounds.LATERAL.footOff) *
      (AutoMovieMotionHumanTiming.seconds(REACTION) +
        AutoMovieMotionHumanTiming.seconds(TRANSFER)) +
    shortest;
  const distance: (steps: number) => number = staggerCaptureDistance({
    w,
    reach,
    longest,
    step: shortest,
    first,
  });

  // The push's own distance: its extrapolated centre of mass from the
  // nearer entry ankle, and the fewest steps whose distance covers it.
  const xi: IAutoMovieVector3 = Vector3.add(pendulum.centre, pendulum.xi());
  const offset: number = Math.min(
    ...(["left", "right"] as const).map((side: AutoMovieHumanSide): number =>
      Math.hypot(
        xi.x - pendulum.entered[side].ankle.x,
        xi.z - pendulum.entered[side].ankle.z,
      ),
    ),
  );
  let fewest: number = 0;
  while (fewest <= STEPS && distance(fewest) < offset) fewest++;
  return { distance, offset, fewest };
}

/** The record of `IStaggerCaptureResult`'s site. */
type IStaggerCaptureResult = {
  distance: (steps: number) => number;
  offset: number;
  fewest: number;
};
