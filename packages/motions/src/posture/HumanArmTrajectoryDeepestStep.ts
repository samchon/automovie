import { physicalShapeNearest } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMoviePhysicalShapeNearest,
} from "@automovie/interface";

import { HumanArmTrajectoryHalfStep } from "./HumanArmTrajectoryHalfStep";
import type { HumanArmTrajectoryLinks } from "./HumanArmTrajectoryLinks";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import type { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";

/**
 * A part's deepest probe past its allowance over one frame step, as a sweep
 * (`HumanArmTrajectorySweep.links`); none where no probe passes it. The step is
 * TrajOpt's: each probe's chord between the step's two poses, carried into the
 * shape's frame, as the hull of consecutive poses is (Schulman et al. 2014,
 * section IV-B and IV-C), with no correction for the course between them. Each
 * chord is bounded first by the shape's bounding sphere and read exactly only
 * where that bound could pass its allowance and the deepest so far (branch and
 * bound).
 *
 * @param c The context.
 * @param a The arm.
 * @param k The interval's first waypoint, whose frame of the shape the probes
 *   are carried into.
 * @param placed The arm placed at every waypoint, with its collider probes.
 * @param link The part.
 * @param shape The shape, by its index in the frame at `k`.
 * @param g0 The step's first waypoint.
 * @param g1 The step's last waypoint.
 * @returns The deepest probe's sweep past its allowance, or none.
 */
export function HumanArmTrajectoryDeepestStep(
  c: M.IContext,
  a: number,
  k: number,
  placed: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[],
  link: HumanArmTrajectoryLinks.ILink,
  shape: number,
  g0: number,
  g1: number,
): HumanArmTrajectorySweep.ISwept | undefined {
  const s: IAutoMovieMotionHumanArmGeometry.IShape =
    c.frames[a]![k]!.shapes[shape]!;
  const carried = (
    g: number,
    probe: number,
  ): ReturnType<typeof HumanArmTrajectoryHalfStep.carry> =>
    HumanArmTrajectoryHalfStep.carry(
      c,
      a,
      k,
      g,
      shape,
      HumanArmTrajectoryHalfStep.point(c.frames[a]![g]!, placed[g]!, probe),
    );
  let best: HumanArmTrajectorySweep.ISwept | undefined;
  let deepest: number = 0;
  for (const probe of link.probes) {
    const r: number = placed[k]!.probes[probe]![1];
    const lower: number = Math.min(
      c.allowed(a, g0, probe, shape),
      c.allowed(a, g1, probe, shape),
    );
    const start: ReturnType<typeof HumanArmTrajectoryHalfStep.carry> = carried(
      g0,
      probe,
    );
    const end: ReturnType<typeof HumanArmTrajectoryHalfStep.carry> = carried(
      g1,
      probe,
    );

    // The chord's least distance the bounding sphere allows: a probe it shows
    // within its allowance, or no deeper than the deepest so far, is not read
    // exactly.
    const bound: number =
      HumanArmTrajectoryHalfStep.sphere(s, start.point, end.point) - r;
    if (bound >= lower || lower - bound <= deepest) continue;
    const reading: IAutoMoviePhysicalShapeNearest.IResult =
      physicalShapeNearest(s.pose, s.shape, start.point, end.point);

    const clear: number = reading.distance - r;
    if (clear >= lower || lower - clear <= deepest) continue;
    deepest = lower - clear;
    best = {
      probe,
      shape,
      from: g0,
      start: start.point,
      first: start.turn,
      other: g1,
      to: end.point,
      turn: end.turn,
      clear,
      lower,
      near: reading,
    };
  }
  return best;
}
