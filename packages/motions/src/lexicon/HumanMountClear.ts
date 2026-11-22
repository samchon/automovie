import { physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSeated,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanVerdicts } from "../audit/HumanVerdicts";

/**
 * How far a point a swinging foot passes must rise to clear what carries a
 * seat: the seat's carrier (`IAutoMovieMotionHumanSeated.ISeat.carrier`), at
 * its placement when the action starts, whose shapes the point must clear by
 * the shank's radius and the skin's give (`HumanVerdicts.SKIN`). The rise is
 * the shortfall, read twice so a sloping surface is met: exact where the
 * nearest surface lies straight below the point, as a back and a flank do
 * under a leg swung up and over them.
 *
 * @param context The action's context: its start, its props and the body's shank radius.
 * @param seat The seat, which names its carrier.
 * @returns The rise of a world point, metres, at least 0; none for a seat no prop carries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the carrier, the clearance, the two readings and the case with no carrier.
 * @evidence contracts/development/implementation.md#principled-implementation The carrier's own shapes give the signed distance of a point; rising by the shortfall clears a surface below it, and a second reading takes up a slope.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader, two raises a point.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The clearance is the shank's own radius plus the verdicts' skin; the carrier is the seat's declared one, never searched for.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two passes over the carrier's shapes a point; the caller reads a few points a plan.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The caller keeps what it reads.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the carrier's reader and placement for its caller's plan.
 */
export function HumanMountClear(
  context: Pick<IAutoMovieMotionHumanActionContext, "body" | "prop" | "start">,
  seat: IAutoMovieMotionHumanSeated.ISeat,
): ((point: IAutoMovieVector3) => number) | undefined {
  if (seat.carrier === undefined) return undefined;
  const read: IAutoMovieMotionHumanPropReader = context.prop(seat.carrier);
  const placed: IAutoMovieRigidTransform = read.frame(context.start);
  const need: number = context.body.measure.shankRadius + HumanVerdicts.SKIN;
  const nearest = (point: IAutoMovieVector3): number => {
    let least: number = Infinity;
    for (const shape of read.prop.shapes ?? [])
      least = Math.min(
        least,
        physicalShapeSegmentDistance(placed, shape, point, point),
      );
    return least;
  };
  return (point: IAutoMovieVector3): number => {
    let rise: number = 0;
    for (let pass: number = 0; pass < 2; ++pass) {
      const short: number =
        need - nearest({ ...point, y: point.y + rise });
      if (!(short > 0)) break;
      rise += short;
    }
    return rise;
  };
}
