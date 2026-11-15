import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The control console read. */
const WINSTED: string =
  'Winsted E-SOC Control Station specification sheet: "Base Consoles shall be 34-5/8" (880mm) deep, 29" (736mm) high" in 48, 60 and 72 in widths (5.1); "a 20" (508mm) deep 1-1/8" (32mm) thick" work surface (1.6); the side profile\'s work surface at 28-7/8 in (733 mm) and the ergonomic page\'s 28-9/16 in (726 mm) (https://www.winsted.com/media/25vlxeet/e-soc-specsheet.pdf)';

/** A Winsted E-SOC base console's fixed sizes, metres, from the maker's sheet: its overall `depth`, 34-5/8 in, and its work surface's `surface` depth, 20 in, and `thickness`, 1-1/8 in. */
const CONSOLE: Readonly<{ depth: number; surface: number; thickness: number }> =
  {
    depth: 34.625 * ArchetypeUnits.INCH,
    surface: 20 * ArchetypeUnits.INCH,
    thickness: 1.125 * ArchetypeUnits.INCH,
  };

/** The construction size no source read gives, metres, an estimate no act reads and no band declares: `panel`, an end panel's thickness under the work surface. */
const ESTIMATES: Readonly<{ panel: number }> = { panel: 0.03 };

/**
 * A control room console: a work surface at the front over the knee space between two end panels, and the equipment section behind it.
 *
 * The console's back stands on the floor along `X` at the origin's `Z`, its front at `+Z`, where the operator sits. It is one of the sheet's three widths, given or drawn from the seed. The work surface takes the front of the console's depth, its top at the drawn height; the equipment section fills the rest of the depth from the floor to that height. `surface` is the work surface, and `edge` its front edge, where forearms and hands rest.
 *
 * @param params The size and any dimension the author fixes.
 * @param seed The seed that draws the width when it is not given and every dimension left free inside its band; absent, the first width and the middle of each band.
 * @returns The console.
 * @throws {ArchetypeRefusal} For a size the sheet does not list, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, how the width is chosen, how the depth is shared and each contact.
 * @evidence contracts/development/implementation.md#principled-implementation The maker's overall depth, work surface depth and thickness, one of its three widths whole, and the surface's height as the band its sheet's own three figures span, one console's spread and not three models: 5.1's 29 in for the base console overall, the side profile's 28-7/8 in to the work surface, and the ergonomic page's 28-9/16 in work surface height it recommends; the equipment section the overall depth less the work surface's, a derivation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the size, draw the dimensions, then the work surface, the end panels and the equipment section, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No width between the sheet's three is made; the rear section's own profile, the monitor arms and the cable trays are not built; the end panel's thickness is a construction estimate; the mass is provisional.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createConsole(
  params: createConsole.IParams = {},
  seed?: number | string,
): Archetype<createConsole.Affordance, createConsole.Dimension> {
  const draw: ArchetypeDrawSession<createConsole.Dimension> = new ArchetypeDrawSession<createConsole.Dimension>("console", createConsole.UNITS, seed, params);
  const size: {
    name: createConsole.Size | undefined;
    figures: Readonly<Partial<Record<createConsole.Dimension, number>>>;
  } = draw.model<createConsole.Size>("size", params.size, createConsole.SIZES);
  const d: Record<createConsole.Dimension, number> = {
    ...draw.dimensions(createConsole.BANDS),
    width: size.figures.width!,
  };
  const width: number = d.width;
  const builder: ArchetypeBuilder<
    createConsole.Affordance,
    createConsole.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: `control console ${size.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const { depth, surface, thickness } = CONSOLE;
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
    frame: ArchetypeFrame.upright(v(0, d.height, front)),
    extent: null,
    width: width,
    depth: surface,
  });
  builder.affordance({
    id: "edge",
    kind: "ledge",
    frame: ArchetypeFrame.facing(v(0, d.height, depth), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    length: width,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createConsole}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, width and dimension states what it is; each band and width its source.
 * @evidence contracts/development/design.md#principled-representation The widths a closed union of the sheet's three; one cited band per dimension; the sizes the maker gives once as constants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The surface an operator works on and the edge the forearms rest on (#3468 N14).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One console's three disagreeing heights bound its band, none chosen over the others, since they measure one product, not three; a mass no source gives is provisional and says so.
 */
export namespace createConsole {
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
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    height: "m",
    mass: "kg",
  };

  /** The base console's sizes the sheet lists, by their widths in inches. */
  export type Size = "48in" | "60in" | "72in";

  /** Each size's width, metres, the default first: the sheet's 48, 60 and 72 in (5.1). */
  export const SIZES: Readonly<
    Record<Size, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "48in": { width: 48 * ArchetypeUnits.INCH },
    "60in": { width: 60 * ArchetypeUnits.INCH },
    "72in": { width: 72 * ArchetypeUnits.INCH },
  };

  /** The parameters: the size, and any free dimension fixed to a value inside its band. */
  export interface IParams
    extends Partial<Record<Exclude<Dimension, "width">, number>> {
    /** Which of the sheet's sizes, which sets `width`; drawn from the seed when absent. */
    size?: Size;

    /** The model's id, unique in a scene; `console` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "width">, IArchetypeBand>
  > = {
    height: ArchetypeBand.metres(
      (28 + 9 / 16) * ArchetypeUnits.INCH,
      29 * ArchetypeUnits.INCH,
      WINSTED,
    ),
    mass: ArchetypeBand.of("kg", 60, 110, ArchetypeBand.TYPICAL_MASS, true),
  };
}
