import type { IAutoMovieMotionHumanClimbStairsFlight } from "@automovie/interface";

import { HumanFrame } from "../../../posture/internal/HumanFrame";
import type { IMotionCaptureCase } from "../../internal/IMotionCaptureCase";

/**
 * The drawn boxes of a stair flight: each tread a 0.9 m wide block from the
 * flight's bottom (2 cm below the floor or the lowest tread) to its own height,
 * the last tread running on a second tread's depth as the top landing, and,
 * going down, the floor 0.8 m behind the first nosing.
 *
 * @param flight The flight: its frame, direction, tread count, riser, tread
 *   depth and first nosing.
 * @returns The boxes, in the flight's frame turned into the world.
 */
export function stairsCaseBoxes(
  flight: IAutoMovieMotionHumanClimbStairsFlight.IFlight,
): NonNullable<IMotionCaptureCase["boxes"]> {
  const out: NonNullable<IMotionCaptureCase["boxes"]> = [];
  const sign: number = flight.direction === "up" ? 1 : -1;
  const bottom: number = Math.min(0, sign * flight.count * flight.riser) - 0.02;
  const box = (z0: number, z1: number, top: number): void => {
    const lo: number = Math.min(top, bottom);
    out.push({
      centre: HumanFrame.point(flight.frame, {
        x: 0,
        y: (top + lo) / 2,
        z: (z0 + z1) / 2,
      }),
      half: { x: 0.45, y: Math.max(0.005, (top - lo) / 2), z: (z1 - z0) / 2 },
      color: 0x9aa4b0,
    });
  };
  for (let i: number = 1; i <= flight.count; i++)
    box(
      flight.first + (i - 1) * flight.tread,
      flight.first + (i === flight.count ? i + 1 : i) * flight.tread,
      sign * i * flight.riser,
    );
  if (sign < 0) box(flight.first - 0.8, flight.first, 0);
  return out;
}
