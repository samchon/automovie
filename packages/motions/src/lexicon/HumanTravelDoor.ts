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
import { planReducedOpening } from "./planReducedOpening";

/**
 * Going through a doorway: travel that squares up before a named opening
 * of one of the performance's obstacles, passes through its middle and
 * comes out beyond it. Register `HumanTravelDoor.passThrough` to use it.
 *
 * The walker passes two places on the opening's own line, one of its own
 * steps at its pace before the sill and one beyond it (`walk.walking`, the
 * step `1.2 l Fr^0.25` of Alexander's walking model), so the last footfall
 * before the opening and the first after it lie on that line and the body
 * crosses the opening at right angles to its width wherever the walk began. The walk itself asks
 * the obstacles about each stretch (`walkClear`), so an opening narrower
 * than the walker's chest or lower than the walker stands is refused there
 * with the measure it would need. First pass: the leaf of a door is not
 * opened or held; an opening is a hole.
 *
 * A `duck`, `squeeze` or `crawl` mode hands the same opening to
 * `planReducedOpening`, which fits that posture through the solid's whole
 * depth and refuses with the width or headroom the posed body needs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the law is, how the way is laid, where a misfit is refused and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law record over the walk: the opening is named by its obstacle and its id, as the obstacle declares it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law and its parameters; the squaring distance is the walker's own step.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ordinary walk retains its original admission; reduced passage delegates posed clearance to the opening fitter.
 */
export namespace HumanTravelDoor {
  /** Travel through a named opening. */
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
        if (
          obstacle !== undefined &&
          context.params.mode !== undefined &&
          context.params.mode !== "upright"
        )
          return planReducedOpening(context, obstacle, opening, out);

        // One step of the walk at its pace, metres, before and beyond the sill.
        const froude: number = walk.FROUDE[context.params.pace ?? "normal"];
        const step: number =
          walk.walking(froude).step(froude) * context.body.measure.hipHeight;
        const along: (metres: number) => IAutoMovieVector3 = (
          metres: number,
        ): IAutoMovieVector3 => ({
          x: opening.at.x + out.x * metres,
          y: 0,
          z: opening.at.z + out.z * metres,
        });
        return walk.plan({
          ...context,
          params: {
            to: along(step),
            via: [along(-step)],
            ...(context.params.pace === undefined
              ? {}
              : { pace: context.params.pace }),
          },
        });
      },
    };
}
