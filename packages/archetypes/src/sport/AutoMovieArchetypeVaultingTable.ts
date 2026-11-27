import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The table's size, from a secondary summary of the apparatus norms. */
const NORMS: string =
  "the vaulting table of the FIG apparatus norms, 135 cm high for men and 125 cm for women, 120 cm long and 90 cm wide, each to 1 cm, as Wikipedia's Vault (gymnastics) gives them (https://en.wikipedia.org/wiki/Vault_(gymnastics)); the norms were not read";

/** Constructs the vaulting table archetype from its recipe. */
export namespace AutoMovieArchetypeVaultingTable {
/**
 * A vaulting table: the padded top on a pedestal a gymnast's hands push off in
 * a vault.
 *
 * It stands on the floor with the middle of its base at the origin, the gymnast
 * running in from `-Z`. The top is a padded block whose long side runs along
 * `Z`; `surface` is its top, where the hands come down.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The table.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeVaultingTable.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeVaultingTable.Affordance,
  AutoMovieArchetypeVaultingTable.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeVaultingTable.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeVaultingTable.Dimension>(
      "vaultingTable",
      AutoMovieArchetypeVaultingTable.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeVaultingTable.Kind = ArchetypeDraw.choice(
    "vaultingTable",
    "kind",
    params.kind,
    AutoMovieArchetypeVaultingTable.KINDS,
  );
  const d: Record<AutoMovieArchetypeVaultingTable.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeVaultingTable.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeVaultingTable.Affordance,
    AutoMovieArchetypeVaultingTable.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "vaulting table",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const top: number = AutoMovieArchetypeVaultingTable.TOP;
  const base: number = AutoMovieArchetypeVaultingTable.BASE;
  builder.box("base", v(d.width, base, d.length), v(0, base / 2, 0), {
    color: "#55595f",
    density: 4,
  });
  builder.rod(
    "column",
    AutoMovieArchetypeVaultingTable.COLUMN / 2,
    v(0, base, 0),
    v(0, d.height - top, 0),
    { color: "#55595f", density: 4 },
  );
  builder.box("top", v(d.width, top, d.length), v(0, d.height - top / 2, 0), {
    color: "#2f5d9e",
  });
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  return builder.build(d.mass);
}
}

/** Companion types, constants and bands of {@link createVaultingTable}. */
export namespace AutoMovieArchetypeVaultingTable {
  /** The top block's thickness, metres. An estimate, not read at a source. */
  export const TOP: number = 0.25;

  /** The base plate's thickness, metres. An estimate, not read at a source. */
  export const BASE: number = 0.05;

  /** The column's diameter, metres. An estimate, not read at a source. */
  export const COLUMN: number = 0.12;

  /** The kinds: the men's table and the women's. */
  export type Kind = "men" | "women";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "women"];

  /** The affordance ids: `surface`, the top the hands come down on. */
  export type Affordance = "surface";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the top above the floor.
   * - `length`: the top along `Z`, the run's direction.
   * - `width`: the top along `X`.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "length" | "width" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    length: "m",
    width: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which table. */
    kind: Kind;

    /** The model's id, unique in a scene; `vaultingTable` when absent. */
    id?: string;
  }

  /** The bands every table shares. */
  const SHARED: Readonly<
    Record<"length" | "width" | "mass", IAutoMovieArchetypeBand>
  > = {
    length: AutoMovieArchetypeBand.metres(1.19, 1.21, NORMS, true),
    width: AutoMovieArchetypeBand.metres(0.89, 0.91, NORMS, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      80,
      120,
      "an estimate of a steel-based competition table; no maker's figure was read",
      true,
    ),
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    men: {
      ...SHARED,
      height: AutoMovieArchetypeBand.metres(1.34, 1.36, NORMS, true),
    },
    women: {
      ...SHARED,
      height: AutoMovieArchetypeBand.metres(1.24, 1.26, NORMS, true),
    },
  };
}
