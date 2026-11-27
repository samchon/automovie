import type {
  IAutoMovieSamplePhysicalRecoveryGoal,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

import { AutoMovieStepPlanner as Planner } from "../AutoMovieStepPlanner";

/*
 * Sample the declared recovery trajectory and its derivative at one clock,
 * independently of native control or cache-frame ownership.
 */
export function samplePhysicalRecoveryGoal(
  input: IAutoMovieSamplePhysicalRecoveryGoal.IInput,
): IAutoMovieSamplePhysicalRecoveryGoal.IResult {
  const duration: number = input.swing.end - input.swing.start;
  const progress: number = Math.max(
    0,
    Math.min(1, (input.seconds - input.swing.start) / duration),
  );
  const placement: IAutoMovieStepPlanner.IPlacement = Planner.swing(
    input.swing.from,
    input.swing.to,
    progress,
    input.height,
  );
  const rate: number =
    progress > 0 && progress < 1
      ? (30 * progress ** 2 * (1 - progress) ** 2) / duration
      : 0;
  // The clearance leaves and meets the baseline at rest, h 16 (p (1 - p))^2:
  // its speed vanishes at both ends and its height stays well clear through
  // the swing (Khadiv et al. 2017, Section III-C: strictly positive height),
  // peaking at h at mid-swing. Its acceleration peaks at
  // `AutoMoviePhysicalBalance.CLEARANCE` h / T^2 at lift-off and touchdown.
  const u: number = progress * (1 - progress);
  const inside: boolean = progress > 0 && progress < 1;
  const clearance: number = input.height * 16 * u * u;
  const lift: number = inside
    ? (input.height * 32 * u * (1 - 2 * progress)) / duration
    : 0;
  const bend: number = inside
    ? (input.height * 32 * ((1 - 2 * progress) ** 2 - 2 * u)) /
      (duration * duration)
    : 0;  // The quintic's second derivative, 60p - 180p^2 + 120p^3, over T^2: the
  // swing's horizontal acceleration, fed forward by its tracking.
  const curve: number = inside
    ? (60 * progress - 180 * progress ** 2 + 120 * progress ** 3) /
      (duration * duration)
    : 0;
  // Past the swing's end the foot keeps descending, at the clearance's mean
  // speed over its half, 2 h / T, until it strikes the floor (Yin, Loken and
  // van de Panne 2007, Section 3.1).
  const descent: number = (2 * input.height) / duration;
  const late: number = Math.max(0, input.seconds - input.swing.end);
  return {
    point: {
      x: placement.point[0],
      y: input.point.y + clearance - descent * late,
      z: placement.point[1],
    },
    velocity: {
      x: (input.swing.to.point[0] - input.swing.from.point[0]) * rate,
      y: input.velocity.y + (inside ? lift : late > 0 ? -descent : 0),
      z: (input.swing.to.point[1] - input.swing.from.point[1]) * rate,
    },
    acceleration: {
      x: (input.swing.to.point[0] - input.swing.from.point[0]) * curve,
      y: bend,
      z: (input.swing.to.point[1] - input.swing.from.point[1]) * curve,
    },
  };
}
