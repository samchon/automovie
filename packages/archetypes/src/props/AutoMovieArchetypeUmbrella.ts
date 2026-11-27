import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeUmbrellaRunner } from "./AutoMovieArchetypeUmbrellaRunner";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to an umbrella's handle, whose own diameter no maker read states";

/** Constructs the umbrella archetype from its recipe. */
export namespace AutoMovieArchetypeUmbrella {
/**
 * A stick umbrella, open over the head or closed and carried.
 *
 * It stands along `+Y` from the bottom of its handle at the origin to the
 * ferrule's tip at its closed length. `grip` is the straight handle a hand
 * closes round, taken from `-Z`. Open, its canopy is a disc of the open
 * diameter whose top is the shaft's top, and `canopy` is the canopy's top,
 * facing up, where the rain falls; closed, it is the shaft and the handle with
 * its ribs furled along the shaft, and declares no canopy: its `runner` slides
 * up the shaft and swings the ribs out through their stretchers
 * (`AutoMovieArchetypeUmbrellaRunner`), so an act opens it. A folding umbrella
 * is not made: no maker read gives its shaft's open length.
 *
 * @param params Whether it is open, its model, and any dimension the author
 *   fixes.
 * @param seed The seed that picks the model when none is given and draws every
 *   dimension left free inside its band; absent, the first model and the middle
 *   of each band.
 * @returns The umbrella.
 * @throws {AutoMovieArchetypeRefusal} For a model BLUNT's comparison does not
 *   list, or a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeUmbrella.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeUmbrella.Affordance, AutoMovieArchetypeUmbrella.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeUmbrella.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeUmbrella.Dimension>(
      "umbrella",
      AutoMovieArchetypeUmbrella.UNITS,
      seed,
      params,
    );
  const drawn: Partial<Record<AutoMovieArchetypeUmbrella.Dimension, number>> =
    draw.dimensions(AutoMovieArchetypeUmbrella.BANDS);
  // The umbrella is one of BLUNT's two models whole.
  const model: {
    name: AutoMovieArchetypeUmbrella.Model | undefined;
    figures: AutoMovieArchetypeUmbrella.Figures;
  } = draw.model<AutoMovieArchetypeUmbrella.Model>(
    "model",
    params.model,
    AutoMovieArchetypeUmbrella.MODELS,
  );
  const d: Record<AutoMovieArchetypeUmbrella.Dimension, number> = {
    length: model.figures.length!,
    canopy: model.figures.canopy!,
    mass: model.figures.mass!,
    gripDiameter: drawn.gripDiameter!,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeUmbrella.Affordance,
    AutoMovieArchetypeUmbrella.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: params.open === true ? "open umbrella" : "umbrella",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const handle: number = AutoMovieArchetypeUmbrella.HANDLE;
  builder.rod("handle", d.gripDiameter / 2, v(0, 0, 0), v(0, handle, 0), {
    color: "#3a2a1e",
  });
  builder.rod(
    "shaft",
    AutoMovieArchetypeUmbrella.SHAFT,
    v(0, handle, 0),
    v(0, d.length, 0),
    {
      color: "#2c2f33",
    },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, handle / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.gripDiameter,
    length: handle,
  });
  if (params.open !== true)
    AutoMovieArchetypeUmbrellaRunner.furl(builder, d.length, d.canopy);
  if (params.open === true) {
    // The canopy under the shaft's top, the full open diameter across.
    const top: number = d.length;
    builder.rod(
      "canopy",
      d.canopy / 2,
      v(0, top - AutoMovieArchetypeUmbrella.CANOPY, 0),
      v(0, top, 0),
      { color: "#1f2a44", density: 0.1 },
    );
    builder.affordance({
      id: "canopy",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, top, 0)),
      extent: null,
      width: d.canopy,
      depth: d.canopy,
    });
  }
  return builder.build(d.mass);
}
}

/** Companion types, constants and bands of {@link createUmbrella}. */
export namespace AutoMovieArchetypeUmbrella {
  /**
   * The shaft's radius, metres: a construction estimate that no act reads and
   * no band declares.
   */
  export const SHAFT: number = 0.006;

  /**
   * The handle's length, metres: the 120 mm CCOHS recommends for a tool handle
   * (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html).
   */
  export const HANDLE: number = 0.12;

  /**
   * The canopy's thickness as drawn, metres: a construction estimate that no
   * act reads and no band declares.
   */
  export const CANOPY: number = 0.01;

  /**
   * The affordance ids:
   *
   * - `grip`: the handle, taken from `-Z`.
   * - `canopy`: an open canopy's top, facing up.
   * - `runner`: a closed umbrella's runner, sliding up the shaft to open it.
   * - `rib<n>`: each rib's hinge at the top notch, following the runner.
   */
  export type Affordance =
    | "grip"
    | "canopy"
    | AutoMovieArchetypeUmbrellaRunner.Affordance;

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: closed, handle to ferrule.
   * - `canopy`: the open canopy's diameter.
   * - `gripDiameter`: the handle's.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "canopy" | "gripDiameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    canopy: "m",
    gripDiameter: "m",
    mass: "kg",
  };

  /**
   * The parameters: whether it is open, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Whether the canopy is open; closed when absent. */
    open?: boolean;

    /** BLUNT's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `umbrella` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The stick umbrellas read: BLUNT's Classic and Exec. */
  export type Model = "classic" | "exec";

  /**
   * Each model whole, the default first: closed length, open canopy and mass,
   * the Classic's 84 cm, 120 cm and 660 g and the Exec's 95.5 cm, 138 cm and
   * 910 g (BLUNT model comparison,
   * https://bluntumbrellas.com/pages/compare-model).
   */
  export const MODELS: Readonly<Record<Model, Figures>> = {
    classic: { length: 0.84, canopy: 1.2, mass: 0.66 },
    exec: { length: 0.955, canopy: 1.38, mass: 0.91 },
  };

  /** The band of each free dimension the models do not read. */
  export const BANDS: Readonly<
    Partial<Record<Dimension, IAutoMovieArchetypeBand>>
  > = {
    gripDiameter: AutoMovieArchetypeBand.metres(0.03, 0.04, POWER, true),
  };
}
