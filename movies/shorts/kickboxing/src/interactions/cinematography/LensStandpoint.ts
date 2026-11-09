import { resolveAutoMovieFraming } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { CoverageLaw } from "../../laws/cinematography/CoverageLaw";
import type { IRingCast } from "../kickboxing/IRingCast";
import { RopeLens } from "./RopeLens";

/**
 * Where a shot size's lens stands: the closer sizes handheld on the apron,
 * no higher than the operator holds the camera; the wide and finish sizes
 * at the wide camera's standpoint, anywhere outside the ropes up to its
 * distance and height.
 *
 * ```ts
 * LensStandpoint.place(cast, "medium", CoverageLaw.goal("medium", ["a", "b"], bearing), spheres);
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#practice Apron handhelds and the far wide camera.
 */
export namespace LensStandpoint {
  /** A framing goal's lens held on the apron by {@link RopeLens.hold}. */
  export function place(
    cast: IRingCast,
    size: CoverageLaw.Size,
    goal: ReturnType<typeof CoverageLaw.goal>,
    spheres: Record<string, { center: IAutoMovieVector3; radius: number }>,
  ): RopeLens.IHeld {
    // The wide sizes are the wide camera's, standing anywhere outside the
    // ropes up to its distance and height; the closer sizes are handheld on
    // the apron, no higher than the operator holds the camera.
    const far: boolean = size === "wide" || size === "finish";
    return RopeLens.hold(
      resolveAutoMovieFraming(goal, spheres),
      far
        ? {
            half: cast.ring.half,
            canvasHalf: CoverageLaw.WIDE_DISTANCE,
            ropes: cast.ring.ropes,
          }
        : cast.ring,
      goal.elevation,
      far ? CoverageLaw.WIDE_HEIGHT - cast.ring.platform : overhead(cast),
    );
  }

  /** The highest lens an operator in the ring holds overhead: shoulder height plus arm reach of the referee's adult build. */
  export function overhead(cast: IRingCast): number {
    return (
      cast.referee.body.measure.shoulder + cast.referee.body.measure.armReach
    );
  }
}
