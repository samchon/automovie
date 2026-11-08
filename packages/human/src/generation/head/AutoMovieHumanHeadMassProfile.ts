import { AutoMovieViewSection } from "@automovie/engine";

import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";

/** Existing shape laws shared by original mass authoring and its public template readers, without constructing another source. */
export namespace AutoMovieHumanHeadMassProfile {
  /** Preserve the existing bounded Lame-diagonal to conic-shoulder convention. */
  export function shoulder(n: number): number {
    return Math.max(
      AutoMovieViewSection.ELLIPSE / 4,
      Math.min(0.95, 2 ** (1 - 1 / n) - 1),
    );
  }

  /** Level planes drift from the neck's own axis to the skull's; they never tilt across the jaw. */
  export function centreAt(plan: IAutoMovieHumanHeadLayout, y: number): number {
    return (
      plan.neck.x +
      (plan.centre - plan.neck.x) *
        smooth((y - plan.y0) / (plan.landmarks.tragion[1] - plan.y0))
    );
  }

  /** Preserve the existing C2 quintic blend, including its closed unit-interval clamp. */
  export function smooth(u: number): number {
    const x: number = Math.min(1, Math.max(0, u));
    return x * x * x * (10 - 15 * x + 6 * x * x);
  }
}
