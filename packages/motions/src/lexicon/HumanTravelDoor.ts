import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanTravelDoor,
  IAutoMovieMotionObstacleAperture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Going through a doorway: a walk that squares up before a named opening
 * of one of the performance's obstacles, passes through its middle and
 * comes out beyond it. Register `HumanTravelDoor.passThrough` to use it.
 *
 * The walker passes two places on the opening's own line, `CLEAR` before
 * its sill and the same beyond it, so the body crosses the opening at
 * right angles to its width wherever the walk began. The walk itself asks
 * the obstacles about each stretch (`walkClear`), so an opening narrower
 * than the walker's chest or lower than the walker stands is refused there
 * with the measure it would need. First pass: the leaf of a door is not
 * opened or held; an opening is a hole.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the law is, how the way is laid, where a misfit is refused and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law record over the walk: the opening is named by its obstacle and its id, as the obstacle declares it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law, its parameters and one distance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No door is special-cased; the fit is the obstacle owner's test, not restated here.
 */
export namespace HumanTravelDoor {
  /** How far before and beyond the sill the walker squares up and comes out, metres (provisional: about a step, so the body is past the wall's thickness). */
  export const CLEAR: number = 0.6;

  /** Walk through a named opening. */
  export const passThrough: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTravelDoor.IParams> =
    {
      name: "passThrough",
      interrupts: walk.interrupts,
      yields: walk.yields,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTravelDoor.IParams>,
      ): IAutoMovieMotionHumanActionPlan => {
        const obstacle: IAutoMovieMotionHumanObstacle | undefined = context
          .obstacles()
          .find(
            (o: IAutoMovieMotionHumanObstacle): boolean =>
              o.subject === context.params.through,
          );
        const openings: readonly IAutoMovieMotionObstacleAperture[] =
          obstacle?.apertures ?? [];
        const opening: IAutoMovieMotionObstacleAperture | undefined =
          context.params.aperture === undefined
            ? openings.length === 1
              ? openings[0]
              : undefined
            : openings.find(
                (a: IAutoMovieMotionObstacleAperture): boolean =>
                  a.id === context.params.aperture,
              );
        if (opening === undefined)
          throw new HumanRefusal({
            kind: "affordance",
            axis: obstacle === undefined ? "through" : "aperture",
            value:
              obstacle === undefined
                ? context.params.through
                : (context.params.aperture ?? null),
            feasible: {
              kind: "alternatives",
              values:
                obstacle === undefined
                  ? context
                      .obstacles()
                      .map(
                        (o: IAutoMovieMotionHumanObstacle): string => o.subject,
                      )
                  : openings.map(
                      (a: IAutoMovieMotionObstacleAperture): string => a.id,
                    ),
            },
            reason:
              obstacle === undefined
                ? `the performance has no obstacle ${context.params.through}`
                : context.params.aperture === undefined
                  ? `${context.params.through} has ${openings.length} openings, and none was named`
                  : `${context.params.through} has no opening ${context.params.aperture}`,
            fix: "name an obstacle of the performance and one of its openings",
          });

        // The level direction through the opening, at right angles to its width, away from where the walker stands.
        const here: IAutoMovieVector3 = context.entry.posture.root;
        const side: number =
          (opening.at.x - here.x) * -opening.across.z +
            (opening.at.z - here.z) * opening.across.x >=
          0
            ? 1
            : -1;
        const out: IAutoMovieVector3 = {
          x: -opening.across.z * side,
          y: 0,
          z: opening.across.x * side,
        };
        const along = (metres: number): IAutoMovieVector3 => ({
          x: opening.at.x + out.x * metres,
          y: 0,
          z: opening.at.z + out.z * metres,
        });
        return walk.plan({
          ...context,
          params: {
            to: along(CLEAR),
            via: [along(-CLEAR)],
            ...(context.params.pace === undefined
              ? {}
              : { pace: context.params.pace }),
          },
        });
      },
    };
}
