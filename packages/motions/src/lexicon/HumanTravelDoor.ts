import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanTravelDoor,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { humanTravelDoorWay } from "./humanTravelDoorWay";
import { planReducedOpening } from "./planReducedOpening";

/**
 * Going through a doorway: travel that squares up before a named opening of one
 * of the performance's obstacles, passes through its middle and comes out
 * beyond it. Register `HumanTravelDoor.passThrough` to use it.
 *
 * The walker passes two places on the opening's own line, one of its own steps
 * at its pace before the sill and one beyond it (`walk.walking`, the step `1.2
 * l Fr^0.25` of Alexander's walking model), so the last footfall before the
 * opening and the first after it lie on that line and the body crosses the
 * opening at right angles to its width wherever the walk began. The walk itself
 * asks the obstacles about each stretch (`walkClear`), so an opening narrower
 * than the walker's chest or lower than the walker stands is refused there with
 * the measure it would need. First pass: the leaf of a door is not opened or
 * held; an opening is a hole.
 *
 * A `duck`, `squeeze` or `crawl` mode hands the same opening to
 * `planReducedOpening`, which fits that posture through the solid's whole depth
 * and refuses with the width or headroom the posed body needs.
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
        const way: humanTravelDoorWay.IWay = humanTravelDoorWay(
          context.obstacles(),
          context.params,
          context.entry.posture.root,
        );
        const { obstacle, opening, out } = way;
        if (
          context.params.mode !== undefined &&
          context.params.mode !== "upright"
        )
          return planReducedOpening(context, obstacle, opening, out);

        // One step of the walk at its pace, metres, before and beyond the sill.
        const froude: number = walk.FROUDE[context.params.pace ?? "normal"];
        const step: number =
          walk.walking(froude).step(froude) * context.body.measure.hipHeight;
        const along: (metres: number) => IAutoMovieVector3 = way.along;
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
