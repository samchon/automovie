import { resolveAutoMovieFraming } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { CoverageLaw } from "../../laws/cinematography/CoverageLaw";
import type { IRingCast } from "../kickboxing/IRingCast";
import { RopeLens } from "./RopeLens";

/**
 * Where a shot size's lens stands: the closer sizes handheld on the apron,
 * no higher than the operator holds the camera, shooting between the ropes;
 * the wide and finish sizes at the wide camera's standpoint, anywhere outside
 * the ropes up to its distance and height, looking down over the top rope.
 * The same standpoint holds the lens the operator actually delivers after his
 * follow, so no followed lens ever stands inside the ropes or at a rope's
 * height.
 *
 * ```ts
 * const held = LensStandpoint.place(cast, "medium", CoverageLaw.goal("medium", ["a", "b"], bearing), spheres);
 * LensStandpoint.deliver(cast, "medium", followed, target, ["a", "b"].map((id) => spheres[id]!));
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#practice Apron handhelds between the ropes and the far wide camera over them.
 */
export namespace LensStandpoint {
  /** A framing goal's lens held on the apron by {@link RopeLens.hold}. */
  export function place(
    cast: IRingCast,
    size: CoverageLaw.Size,
    goal: ReturnType<typeof CoverageLaw.goal>,
    spheres: Record<string, { center: IAutoMovieVector3; radius: number }>,
  ): RopeLens.IHeld {
    const stand = standpoint(cast, size);
    return RopeLens.hold(
      resolveAutoMovieFraming(goal, spheres),
      stand.apron,
      goal.elevation,
      stand.overhead,
      // The ropes are occluders: the lens sees the framed subjects over the
      // top rope or through a gap.
      goal.subjects.flatMap((id) => (spheres[id] ? [spheres[id]] : [])),
      stand.clearance,
    );
  }

  /**
   * A followed lens point held at the size's standpoint: kept on the apron,
   * a handheld's brought through the ropes toward its target, and at a
   * height whose sightlines to the subjects the ropes do not cross.
   *
   * @param cast The cast.
   * @param size The shot size.
   * @param point The point the operator's follow carried the lens to.
   * @param target The look-at point the follow carried the lens to.
   * @param subjects The framed subjects' spheres.
   * @returns The delivered lens point.
   */
  export function deliver(
    cast: IRingCast,
    size: CoverageLaw.Size,
    point: IAutoMovieVector3,
    target: IAutoMovieVector3,
    subjects: readonly { center: IAutoMovieVector3; radius: number }[],
  ): IAutoMovieVector3 {
    const stand = standpoint(cast, size);
    const kept: IAutoMovieVector3 = RopeLens.onApron(point, stand.apron);
    const floor: IAutoMovieVector3 =
      stand.clearance === "between"
        ? RopeLens.through(kept, target, stand.apron)
        : kept;
    return {
      ...floor,
      y: RopeLens.clear(
        floor,
        floor.y,
        subjects,
        stand.apron,
        stand.overhead,
        stand.clearance,
      ),
    };
  }

  /**
   * Whether two sizes are shot by different cameras: the wide camera's sizes
   * against the apron handheld's. Changing between them is a cut, not a move.
   */
  export function cuts(from: CoverageLaw.Size, to: CoverageLaw.Size): boolean {
    return far(from) !== far(to);
  }

  /** The highest lens an operator in the ring holds overhead: shoulder height plus arm reach of the referee's adult build. */
  export function overhead(cast: IRingCast): number {
    return (
      cast.referee.body.measure.shoulder + cast.referee.body.measure.armReach
    );
  }

  /** The wide camera's sizes. */
  function far(size: CoverageLaw.Size): boolean {
    return size === "wide" || size === "finish";
  }

  /** A size's apron, reach and rope clearance. */
  function standpoint(
    cast: IRingCast,
    size: CoverageLaw.Size,
  ): {
    apron: RopeLens.IApron;
    overhead: number;
    clearance: RopeLens.Clearance;
  } {
    // The wide sizes are the wide camera's, standing anywhere outside the
    // ropes up to its distance and height; the closer sizes are handheld on
    // the apron, no higher than the operator holds the camera.
    return far(size)
      ? {
          apron: {
            half: cast.ring.half,
            canvasHalf: CoverageLaw.WIDE_DISTANCE,
            ropes: cast.ring.ropes,
          },
          overhead: CoverageLaw.WIDE_HEIGHT - cast.ring.platform,
          clearance: "over",
        }
      : { apron: cast.ring, overhead: overhead(cast), clearance: "between" };
  }
}
