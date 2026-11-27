import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import * as AutoMovieArchetypeConsoleData from "./internal/AutoMovieArchetypeConsoleData";

/** Constructs the console archetype from its recipe. */
export namespace AutoMovieArchetypeConsole {
/**
 * A control room console: a work surface at the front over the knee space
 * between two end panels, and the equipment section behind it.
 *
 * The console's back stands on the floor along `X` at the origin's `Z`, its
 * front at `+Z`, where the operator sits. It is one of the sheet's three
 * widths, given or drawn from the seed. The work surface takes the front of the
 * console's depth, its top at the drawn height; the equipment section fills the
 * rest of the depth from the floor to that height. `surface` is the work
 * surface, and `edge` its front edge, where forearms and hands rest.
 *
 * @param params The size and any dimension the author fixes.
 * @param seed The seed that draws the width when it is not given and every
 *   dimension left free inside its band; absent, the first width and the middle
 *   of each band.
 * @returns The console.
 * @throws {AutoMovieArchetypeRefusal} For a size the sheet does not list, or a
 *   fixed dimension outside its band.
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
  const v: typeof Vector3.create = Vector3.create;
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
   * The affordance ids:
   *
   * - `surface`: the work surface, facing up.
   * - `edge`: the work surface's front edge along `X`.
   */
  export type Affordance = "surface" | "edge";

  /**
   * The dimensions, metres unless stated:
   *
   * - `width`: the console along `X`, its size's.
   * - `height`: the work surface's top above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "height" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    mass: "kg",
  };

  /** The base console's sizes the sheet lists, by their widths in inches. */
  export type Size = "48in" | "60in" | "72in";

  /**
   * Each size's width, metres, the default first: the sheet's 48, 60 and 72 in
   * (5.1).
   */
  export const SIZES: Readonly<
    Record<Size, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "48in": { width: 48 * AutoMovieArchetypeUnits.INCH },
    "60in": { width: 60 * AutoMovieArchetypeUnits.INCH },
    "72in": { width: 72 * AutoMovieArchetypeUnits.INCH },
  };

  /**
   * The parameters: the size, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "width">, number>
  > {
    /**
     * Which of the sheet's sizes, which sets `width`; drawn from the seed when
     * absent.
     */
    size?: Size;

    /** The model's id, unique in a scene; `console` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
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
