import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionObstacleAperture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanObstacle } from "../../perform/internal/HumanObstacle";

/*
 * Refuses a walked way that goes through something solid: a wall with no
 * opening on the way, an opening narrower than the walker's shoulders or one
 * lower than the walker stands.
 *
 * A walker takes the breadth of the chest and the height of the stature. Each
 * straight stretch of the way, from the start by the places passed to the end,
 * is asked of the performance's obstacles (`HumanObstacle.blocking`), and the
 * first that is blocked is refused with the obstacle, where the way meets it,
 * why, and what would pass: the obstacle's openings for a solid, or the measure
 * the opening would need.
 * Parameter context: The walk's context: the walker, where it stands, the places it
 * passes and its end.
 * A `reach` refusal on `path` when a stretch is blocked.
 */
export function walkClear(
  context: IAutoMovieMotionHumanActionContext<IWalkClearContext>,
): void {
  const obstacles: readonly IAutoMovieMotionHumanObstacle[] =
    context.obstacles();
  if (obstacles.length === 0) return;
  const body: IAutoMovieMotionHumanBody = context.body;
  const way: readonly IAutoMovieVector3[] = [
    context.entry.posture.root,
    ...(context.params.via ?? []),
    context.params.to,
  ];
  const need: IAutoMovieMotionHumanObstacle.INeed = {
    breadth: body.measure.chestBreadth,
    height: body.measure.stature,
  };
  for (let i: number = 0; i + 1 < way.length; ++i) {
    const block: IAutoMovieMotionHumanObstacle.IBlock | null =
      HumanObstacle.blocking(obstacles, way[i]!, way[i + 1]!, need);
    if (block === null) continue;
    const where: string = `${block.subject} at (${block.at.x.toFixed(2)}, ${block.at.z.toFixed(2)}), ${block.distance.toFixed(2)} m along the way`;
    if (block.cause === "solid")
      throw new HumanRefusal({
        kind: "reach",
        axis: "path",
        value: block.subject,
        feasible: {
          kind: "alternatives",
          values: (
            obstacles.find(
              (o: IAutoMovieMotionHumanObstacle): boolean =>
                o.subject === block.subject,
            )?.apertures ?? []
          ).map((a: IAutoMovieMotionObstacleAperture): string => a.id),
        },
        reason: `the way goes through ${where}, which has no opening there`,
        fix: "pass by one of its openings, or by places that go round it",
      });
    throw new HumanRefusal({
      kind: "reach",
      axis: "path",
      value: block.short?.has ?? null,
      feasible: {
        kind: "range",
        minimum: block.short?.needs ?? null,
        maximum: null,
        unit: "m",
      },
      reason: `the way goes through the opening ${block.aperture ?? ""} of ${where}, which is too ${block.cause === "narrow" ? "narrow" : "low"} for the walker`,
      fix:
        block.cause === "narrow"
          ? "pass by a wider opening, or turn sideways through it as an action of its own"
          : "pass by a higher opening, or duck through it as an action of its own",
    });
  }
}

/*
 * Companion check of walkClear.
 */
export namespace walkClear {
  /*
   * Refuses a place to stand by a person when something solid lies between the
   * two: a walker escorting, following or meeting someone ends on their side of
   * a wall, not across it.
   * Parameter context: The action's context.
   * Parameter place: Where the walker would stand, world metres.
   * Parameter person: Where the person is, world metres.
   * A `reach` refusal on `path` naming the obstacle
   * between them.
   */
  export function between(
    context: IAutoMovieMotionHumanActionContext<object>,
    place: IAutoMovieVector3,
    person: IAutoMovieVector3,
  ): void {
    const block: IAutoMovieMotionHumanObstacle.IBlock | null =
      HumanObstacle.blocking(context.obstacles(), place, person, {
        breadth: context.body.measure.chestBreadth,
        height: context.body.measure.stature,
      });
    if (block !== null)
      throw new HumanRefusal({
        kind: "reach",
        axis: "path",
        value: block.subject,
        feasible: null,
        reason: `${block.subject} stands between the place to stop at and the person, ${block.distance.toFixed(2)} m from that place`,
        fix: "stop on the person's own side of it: name another side of them or another gap",
      });
  }
}

/*
 * The record of `IWalkClearContext`'s site.
 */
type IWalkClearContext = {
  to: IAutoMovieVector3;
  via?: IAutoMovieVector3[];
};
