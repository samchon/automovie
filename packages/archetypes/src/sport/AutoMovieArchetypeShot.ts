import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, type IAutoMovieArchetypeBand } from "../core";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeShotData } from "./internal/AutoMovieArchetypeShotData";

/** Canonical producer and authoring contract for Shot. */
export namespace AutoMovieArchetypeShot {
  /** The categories. */
  export type Kind = "men" | "women";

  /** The affordance ids: `grip`, the shot as a hand holds it, at its centre. */
  export type Affordance = "grip";

  /**
   * The free dimensions:
   *
   * - `diameter`: metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "mass";

  /**
   * The parameters: the category, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which category. */
    kind: Kind;

    /** The model's id, unique in a scene; `shot` when absent. */
    id?: string;
  }

  /** Every category, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "women"];

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    mass: "kg",
  };

  /** The band of each free dimension, by category. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    men: {
      diameter: AutoMovieArchetypeShotData.band("m", 0.11, 0.13, "the men's 110 to 130 mm across"),
      mass: AutoMovieArchetypeShotData.band(
        "kg",
        7.26,
        7.26,
        "the men's at least 7.26 kg for admission, the minimum the model takes",
      ),
    },
    women: {
      diameter: AutoMovieArchetypeShotData.band("m", 0.095, 0.11, "the women's 95 to 110 mm across"),
      mass: AutoMovieArchetypeShotData.band(
        "kg",
        4,
        4,
        "the women's at least 4 kg for admission, the minimum the model takes",
      ),
    },
  };

  /**
   * A competition shot, the men's or the women's.
   *
   * It rests on the floor, its lowest point at the origin and its centre a radius
   * above it. `grip` is the shot as the putting hand holds it, at its centre, its
   * diameter the aperture: the put pushes it from the neck.
   *
   * @param params The category and any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The shot.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeShot.IParams,
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeShot.Affordance, AutoMovieArchetypeShot.Dimension> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeShot.Dimension> =
      new AutoMovieArchetypeDrawSession<AutoMovieArchetypeShot.Dimension>(
        "shot",
        AutoMovieArchetypeShot.UNITS,
        seed,
        params,
      );
    const kind: AutoMovieArchetypeShot.Kind = ArchetypeDraw.choice(
      "shot",
      "kind",
      params.kind,
      AutoMovieArchetypeShot.KINDS,
    );
    const d: Record<AutoMovieArchetypeShot.Dimension, number> = draw.dimensions(
      AutoMovieArchetypeShot.BANDS[kind],
    );
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeShot.Affordance,
      AutoMovieArchetypeShot.Dimension
    > = new AutoMovieArchetypeBuilder({
      material: "iron",
      id: params.id,
      name: `${kind}'s shot`,
      draw,
    });
    const centre: IAutoMovieVector3 = AutoMovieEngineVector3.create(0, d.diameter / 2, 0);
    builder.ball("shot", d.diameter / 2, centre, { color: "#4a4d52" });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        centre,
        AutoMovieEngineVector3.create(0, 1, 0),
        AutoMovieEngineVector3.create(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.diameter,
    });
    return builder.build(d.mass);
  }
}
