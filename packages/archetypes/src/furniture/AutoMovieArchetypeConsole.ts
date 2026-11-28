import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeConsoleData } from "./internal/AutoMovieArchetypeConsoleData";

/**
 * Constructs a Winsted-style control console with a deep front work surface.
 */
export namespace AutoMovieArchetypeConsole {
/**
 * Build a console with two end panels and a recessed equipment body.
 *
 * The back is at model Z zero. The operator's work surface is on the
 * `+Z` side and spans 20 inches in depth.
 *
 * @param params Optional size, scene ID, work surface height and mass.
 *   The ID defaults to `console`.
 * @param seed Numeric seed for omitted options. Without it the
 *   width is 48 inches and the top is 0.73104375 metres high.
 * @returns The work `surface` and its front `edge` along X.
 * @throws {AutoMovieArchetypeRefusal} If size or a fixed option is inadmissible.
 */
export function create(
  params: AutoMovieArchetypeConsole.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeConsole.Affordance, AutoMovieArchetypeConsole.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeConsole.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeConsole.Dimension>(
      "console",
      AutoMovieArchetypeConsole.UNITS,
      seed,
      params,
    );
  const size: {
    name: AutoMovieArchetypeConsole.Size | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeConsole.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeConsole.Size>("size", params.size, AutoMovieArchetypeConsole.SIZES);
  const d: Record<AutoMovieArchetypeConsole.Dimension, number> = {
    ...draw.dimensions(AutoMovieArchetypeConsole.BANDS),
    width: size.figures.width!,
  };
  const width: number = d.width;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeConsole.Affordance,
    AutoMovieArchetypeConsole.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `control console ${size.name}`,
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const { depth, surface, thickness } = AutoMovieArchetypeConsoleData.CONSOLE;
  const panel: number = ESTIMATES.panel;
  const rear: number = depth - surface;
  const front: number = rear + surface / 2;
  const under: number = d.height - thickness;
  const grey: string = "#5a5f66";
  builder.box(
    "surface",
    v(width, thickness, surface),
    v(0, d.height - thickness / 2, front),
    { color: "#c9c4b8" },
  );
  for (const [id, sign] of [
    ["panel-left", 1],
    ["panel-right", -1],
  ] as const)
    builder.box(
      id,
      v(panel, under, surface),
      v(sign * (width / 2 - panel / 2), under / 2, front),
      { color: grey },
    );
  builder.box(
    "equipment",
    v(width, d.height, rear),
    v(0, d.height / 2, rear / 2),
    {
      color: grey,
    },
  );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.height, front)),
    extent: null,
    width: width,
    depth: surface,
  });
  builder.affordance({
    id: "edge",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height, depth),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    length: width,
  });
  return builder.build(d.mass);
}

  /**
   * `surface` is centred over the working slab. `edge` is its `+Z` edge along X.
   */
  export type Affordance = "surface" | "edge";

  /**
   * Catalogue width and working height in metres, and model mass in kilograms.
   */
  export type Dimension = "width" | "height" | "mass";

  /** Metres for width and height, kilograms for the model mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    mass: "kg",
  };

  /** Catalogue width options in inches for an E-SOC base console. */
  export type Size = "48in" | "60in" | "72in";

  /**
   * Converts the 48, 60 and 72 inch options to widths in metres. The 48 inch model is the first entry.
   */
  export const SIZES: Readonly<
    Record<Size, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "48in": { width: 48 * AutoMovieArchetypeUnits.INCH },
    "60in": { width: 60 * AutoMovieArchetypeUnits.INCH },
    "72in": { width: 72 * AutoMovieArchetypeUnits.INCH },
  };

  /** Optional scene ID, catalogue width option, fixed height and fixed mass. */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "width">, number>
  > {
    /** Catalogue width choice. Defaults to `48in` without a seed. */
    size?: Size;

    /** Scene object ID, defaulting to `console`. */
    id?: string;
  }

  /** Admitted height and mass intervals. Width comes from the selected size. */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "width">, IAutoMovieArchetypeBand>
  > = {
    height: AutoMovieArchetypeBand.metres(
      (28 + 9 / 16) * AutoMovieArchetypeUnits.INCH,
      29 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeConsoleData.WINSTED,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      60,
      110,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}

/*
 * The construction size no source read gives, metres, an estimate no act reads
 * and no band declares: `panel`, an end panel's thickness under the work
 * surface.
 */
const ESTIMATES: Readonly<{ panel: number }> = { panel: 0.03 };
