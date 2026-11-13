import type { IAutoMovieVector3 } from "@automovie/interface";

import { walk } from "../actions/walk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { HumanObstacle } from "../perform/HumanObstacle";

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
  /** Parameters of a passage. */
  export interface IParams {
    /** The obstacle whose opening is passed: its subject id. */
    through: string;

    /** The opening's id within that obstacle; its only opening when absent. */
    aperture?: string;

    /** The pace; `normal` when absent. */
    pace?: walk.IParams["pace"];
  }

  /** How far before and beyond the sill the walker squares up and comes out, metres (provisional: about a step, so the body is past the wall's thickness). */
  export const CLEAR: number = 0.6;

  /** Walk through a named opening. */
  export const passThrough: IHumanActionLaw<IParams> = {
    name: "passThrough",
    interrupts: walk.interrupts,
    yields: walk.yields,
    plan: (context: IHumanActionContext<IParams>): IHumanActionPlan => {
      const obstacle: HumanObstacle.IObstacle | undefined = context
        .obstacles()
        .find(
          (o: HumanObstacle.IObstacle): boolean =>
            o.subject === context.params.through,
        );
      const openings: readonly HumanObstacle.IAperture[] =
        obstacle?.apertures ?? [];
      const opening: HumanObstacle.IAperture | undefined =
        context.params.aperture === undefined
          ? openings.length === 1
            ? openings[0]
            : undefined
          : openings.find(
              (a: HumanObstacle.IAperture): boolean =>
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
                    .map((o: HumanObstacle.IObstacle): string => o.subject)
                : openings.map((a: HumanObstacle.IAperture): string => a.id),
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
