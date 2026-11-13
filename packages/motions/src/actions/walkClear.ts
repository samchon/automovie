import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanObstacle } from "../perform/HumanObstacle";

/**
 * Refuses a walked way that goes through something solid: a wall with no
 * opening on the way, an opening narrower than the walker's shoulders or
 * one lower than the walker stands.
 *
 * A walker takes the breadth of the chest and the height of the stature.
 * Each straight stretch of the way, from the start by the places passed to
 * the end, is asked of the performance's obstacles
 * (`HumanObstacle.blocking`), and the first that is blocked is refused with
 * the obstacle, where the way meets it, why, and what would pass: the
 * obstacle's openings for a solid, or the measure the opening would need.
 *
 * @param context The walk's context: the walker, where it stands, the places it passes and its end.
 * @throws {HumanRefusal} A `reach` refusal on `path` when a stretch is blocked.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is refused, what a walker takes, how the way is asked and what the refusal carries.
 * @evidence contracts/development/implementation.md#principled-implementation The blocking test is its owner's, `HumanObstacle.blocking`; this only walks the stretches and words the refusal from the block it returns.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the stretches, one refusal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A blocked way is refused, never bent round the obstacle: going round is the composition's choice of places to pass. A walker who could pass an opening sideways or ducking is refused as one who walks facing the way and upright.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the stretches and the obstacles.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function walkClear(
  context: IHumanActionContext<{
    to: IAutoMovieVector3;
    via?: IAutoMovieVector3[];
  }>,
): void {
  const obstacles: readonly HumanObstacle.IObstacle[] = context.obstacles();
  if (obstacles.length === 0) return;
  const body: IHumanBody = context.body;
  const way: readonly IAutoMovieVector3[] = [
    context.entry.posture.root,
    ...(context.params.via ?? []),
    context.params.to,
  ];
  const need: HumanObstacle.INeed = {
    breadth: body.measure.chestBreadth,
    height: body.measure.stature,
  };
  for (let i: number = 0; i + 1 < way.length; ++i) {
    const block: HumanObstacle.IBlock | null = HumanObstacle.blocking(
      obstacles,
      way[i]!,
      way[i + 1]!,
      need,
    );
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
              (o: HumanObstacle.IObstacle): boolean =>
                o.subject === block.subject,
            )?.apertures ?? []
          ).map((a: HumanObstacle.IAperture): string => a.id),
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
