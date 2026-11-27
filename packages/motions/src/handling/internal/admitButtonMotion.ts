import type { IAutoMovieMotionHumanButton } from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/** The physical dimensions and time of one authored button stroke. */
type ButtonMotion = "travel" | "radius" | "thickness" | "duration";

/**
 * Admit a signed slider displacement and positive dimensions in metres and
 * duration in seconds before reading the garment model.
 */
export function admitButtonMotion(
  p: Pick<IAutoMovieMotionHumanButton, ButtonMotion>,
): void {
  if (
    p.travel === 0 ||
    ![p.radius, p.thickness, p.duration].every(
      (value: number): boolean => value > 0,
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "travel",
      value: p.travel,
      reason:
        "buttoning needs a finite nonzero travel and positive finite dimensions and duration",
      fix: "give the measured slider travel, sphere radius, panel thickness and push duration",
    });
}
