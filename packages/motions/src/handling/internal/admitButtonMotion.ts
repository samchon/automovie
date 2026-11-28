import type { IAutoMovieMotionHumanButton } from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Admit finite signed travel, finite positive dimensions in metres and finite
 * positive duration in seconds before the planner reads the garment.
 */
export function admitButtonMotion(
  p: Pick<IAutoMovieMotionHumanButton, ButtonMotion>,
): void {
  const travel: number = p.travel;
  if (!Number.isFinite(travel) || travel === 0)
    refuse("travel", travel, "a finite nonzero slider displacement in metres");

  for (const [axis, expected] of [
    ["radius", "a finite positive button radius in metres"],
    ["thickness", "a finite positive panel thickness in metres"],
    ["duration", "a finite positive push duration in seconds"],
  ] as const) {
    const value: number = p[axis];
    if (!Number.isFinite(value) || value <= 0) refuse(axis, value, expected);
  }
}

/*
 * The physical dimensions and time of one authored button stroke.
 */
type ButtonMotion = "travel" | "radius" | "thickness" | "duration";

/*
 * Report the invalid field and its supplied value.
 */
function refuse(axis: ButtonMotion, value: number, expected: string): never {
  throw new AutoMovieMotionHumanRefusal({
    kind: "parameter",
    axis,
    value,
    reason: `buttoning needs ${expected}`,
    fix: `set ${axis} to ${expected}`,
  });
}
