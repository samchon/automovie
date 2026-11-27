import { AffordanceArticulation } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/** The relative motion the writing target can support. */
export namespace writeAdmission {
  /** Admit a carried tool distinct from the stationary writing surface. */
  export function surface(
    tool: string,
    on: string,
    prop: Pick<Tool, "fixed" | "motion">,
    stationary: () => boolean,
  ): void {
    if (on === tool || prop.fixed === true || prop.motion !== undefined || !stationary())
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: on,
        reason: "writing needs a carried tool and a separate stationary surface",
        fix: "give a fixed support without articulation and a grip-driven tool",
      });
  }

  /** Admit a working point rigidly attached to its carried tool. */
  export function tip(
    prop: Pick<Tool, "point" | "articulate">,
    site: Pick<IAutoMovieAffordance, "id" | "kind" | "rides">,
  ): void {
    if (
      prop.point !== undefined ||
      (prop.articulate !== undefined &&
        (site.rides !== undefined || AffordanceArticulation.KINDS.has(site.kind)))
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: "tip",
        value: site.id,
        reason: "writing needs a working point fixed to the held tool frame",
        fix: "use a fixed working point on the tool",
      });
  }
}

/** The prop fields that determine whether a tool and its point can move. */
type Tool = IAutoMovieMotionHumanPropReader["prop"];
