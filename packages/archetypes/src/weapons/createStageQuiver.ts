import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { StageCarrierConstruction } from "./StageCarrierConstruction";
import type { createHolster } from "./createHolster";

/**
 * Worn quiver silhouette.
 *
 * The upright tube exposes a common top socket, separate display slots, a belt
 * hook and a strap hook.
 *
 * @param params The scene id, optional display dimensions and this carrier's
 *   own fit options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageQuiver(
  params: createStageQuiver.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createStageQuiver.Affordance,
  createStageQuiver.Dimension
> {
  return StageCarrierConstruction(
    "quiver",
    params,
    seed,
    (builder, d, slots) => {
      const v: typeof Vector3.create = Vector3.create;
      // A quiver: a tube standing on its bottom, open at the top.
      const length: number = d.length!;
      const r: number = d.diameter! / 2;
      builder.rod("tube", r, v(0, 0, 0), v(0, length, 0), { color: "#6b4a2b" });
      builder.affordance({
        id: "socket",
        kind: "socket",
        frame: AutoMovieArchetypeFrame.upright(v(0, length, 0)),
        extent: null,
      });

      // The arrows' places on Vogel's spiral: the k-th at radius r sqrt((k + 1/2) / n) and k golden angles round, so they spread evenly over the mouth.
      const golden: number = Math.PI * (3 - Math.sqrt(5));
      for (let k: number = 0; k < slots; k++) {
        const radius: number = r * Math.sqrt((k + 0.5) / slots);
        builder.affordance({
          id: `slot${k + 1}`,
          kind: "socket",
          frame: AutoMovieArchetypeFrame.upright(
            v(
              radius * Math.cos(golden * k),
              length,
              radius * Math.sin(golden * k),
            ),
          ),
          extent: null,
        });
      }
      builder.affordance({
        id: "belt",
        kind: "hook",
        frame: StageCarrierConstruction.facingWearer(v(-r, length, 0)),
        extent: null,
      });
      builder.affordance({
        id: "strap",
        kind: "hook",
        frame: StageCarrierConstruction.facingWearer(v(-r, length / 2, 0)),
        extent: null,
      });
    },
  );
}

/** Authoring options for {@link createStageQuiver}. */
export namespace createStageQuiver {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /**
   * The createHolster contact set its shared construction types. This producer
   * builds belt, slot1, slot10, slot11, slot12, slot2, slot3, slot4, slot5,
   * slot6, slot7, slot8, slot9, socket, strap.
   */
  export type Affordance = createHolster.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createHolster.IParams,
    "id" | "length" | "diameter" | "mass"
  > {
    /** Whole number of display sites within the original slot capacity. */
    slots?: number;
  }
}
