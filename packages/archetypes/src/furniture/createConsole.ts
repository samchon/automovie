import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
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

/** The base console's widths the sheet lists, metres: 48, 60 and 72 in (5.1). */
const WIDTH: Readonly<Record<createConsole.Width, number>> = {
  "48in": 48 * ArchetypeUnits.INCH,
  "60in": 60 * ArchetypeUnits.INCH,
  "72in": 72 * ArchetypeUnits.INCH,
};

/** The construction size no source read gives, metres, an estimate no act reads and no band declares: `panel`, an end panel's thickness under the work surface. */
const ESTIMATES: Readonly<{ panel: number }> = { panel: 0.03 };

/**
 * A control room console: a work surface at the front over the knee space between two end panels, and the equipment section behind it.
 *
 * The console's back stands on the floor along `X` at the origin's `Z`, its front at `+Z`, where the operator sits. It is one of the sheet's three widths, given or drawn from the seed. The work surface takes the front of the console's depth, its top at the drawn height; the equipment section fills the rest of the depth from the floor to that height. `surface` is the work surface, and `edge` its front edge, where forearms and hands rest.
 *
 * @param params The width and any dimension the author fixes.
 * @param seed The seed that draws the width when it is not given and every dimension left free inside its band; absent, the first width and the middle of each band.
 * @returns The console.
 * @throws {ArchetypeRefusal} For a width the sheet does not list, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, how the width is chosen, how the depth is shared and each contact.
 * @evidence contracts/development/implementation.md#principled-implementation The maker's overall depth, work surface depth and thickness, one of its three widths whole, and the three heights its sheet gives as the band; the equipment section the overall depth less the work surface's, a derivation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, pick the width, then the work surface, the end panels and the equipment section, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No width between the sheet's three is made; the rear section's own profile, the monitor arms and the cable trays are not built; the end panel's thickness is a construction estimate; the mass is provisional.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createConsole(
  params: createConsole.IParams = {},
  seed?: number | string,
): Archetype<createConsole.Affordance, createConsole.Dimension> {
  const d: Record<createConsole.Dimension, number> = ArchetypeDraw.dimensions(
    "console",
    createConsole.BANDS,
    seed,
    params,
  );
  const size: createConsole.Width = ArchetypeDraw.pick(
    "console",
    "width",
    params.width,
    createConsole.WIDTHS,
    seed,
  );
  const width: number = WIDTH[size];
  const builder: ArchetypeBuilder<
    createConsole.Affordance,
    createConsole.Dimension
  > = new ArchetypeBuilder({
    archetype: "console",
    id: params.id,
    name: `control console ${size}`,
    dimensions: d,
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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sheet's three disagreeing heights bound the band, none chosen over the others; a mass no source gives is provisional and says so.
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
   * The free dimensions, metres unless stated:
   *
   * - `height`: the work surface's top above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "mass";

  /** The base console's widths the sheet lists, inches. */
  export type Width = "48in" | "60in" | "72in";

  /** Every width, the default first. */
  export const WIDTHS: readonly Width[] = ["48in", "60in", "72in"];

  /** The parameters: the width, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which of the sheet's widths, along `X`; drawn from the seed when absent. */
    width?: Width;

    /** The model's id, unique in a scene; `console` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    height: ArchetypeBand.metres(
      (28 + 9 / 16) * ArchetypeUnits.INCH,
      29 * ArchetypeUnits.INCH,
      WINSTED,
    ),
    mass: ArchetypeBand.of("kg", 60, 110, ArchetypeBand.TYPICAL_MASS, true),
  };
}
