import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The table's size, from a secondary summary of the apparatus norms. */
const NORMS: string =
  "the vaulting table of the FIG apparatus norms, 135 cm high for men and 125 cm for women, 120 cm long and 90 cm wide, each to 1 cm, as Wikipedia's Vault (gymnastics) gives them (https://en.wikipedia.org/wiki/Vault_(gymnastics)); the norms were not read";

/**
 * A vaulting table: the padded top on a pedestal a gymnast's hands push off in a vault.
 *
 * It stands on the floor with the middle of its base at the origin, the gymnast running in from `-Z`. The top is a padded block whose long side runs along `Z`; `surface` is its top, where the hands come down.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The table.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the table stands and the contact.
 * @evidence contracts/development/implementation.md#principled-implementation A top block of the drawn length and width whose top stands at the drawn height, on a column and a base plate; the top is the contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, base, column, top, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The top is a flat block; its rounded front edge and padding are not drawn. The column and base sizes are estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createVaultingTable(
  params: createVaultingTable.IParams,
  seed?: number | string,
): Archetype<createVaultingTable.Affordance, createVaultingTable.Dimension> {
  const kind: createVaultingTable.Kind = ArchetypeDraw.choice(
    "vaultingTable",
    "kind",
    params.kind,
    createVaultingTable.KINDS,
  );
  const d: Record<createVaultingTable.Dimension, number> =
    ArchetypeDraw.dimensions(
      "vaultingTable",
      createVaultingTable.BANDS[kind],
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createVaultingTable.Affordance,
    createVaultingTable.Dimension
  > = new ArchetypeBuilder({
    archetype: "vaultingTable",
    id: params.id,
    name: "vaulting table",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const top: number = createVaultingTable.TOP;
  const base: number = createVaultingTable.BASE;
  builder.box("base", v(d.width, base, d.length), v(0, base / 2, 0), {
    color: "#55595f",
    density: 4,
  });
  builder.rod(
    "column",
    createVaultingTable.COLUMN / 2,
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
    frame: ArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createVaultingTable}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the men's and women's heights and one band per dimension, each to the norms' centimetre.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The top's height and extent a vault reads, and the one contact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pedestal's sizes are named estimates; they shape the picture and no contact.
 */
export namespace createVaultingTable {
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which table. */
    kind: Kind;

    /** The model's id, unique in a scene; `vaultingTable` when absent. */
    id?: string;
  }

  /** The bands every table shares. */
  const SHARED: Readonly<Record<"length" | "width" | "mass", IArchetypeBand>> =
    {
      length: ArchetypeBand.metres(1.19, 1.21, NORMS, true),
      width: ArchetypeBand.metres(0.89, 0.91, NORMS, true),
      mass: ArchetypeBand.of(
        "kg",
        80,
        120,
        "an estimate of a steel-based competition table; no maker's figure was read",
        true,
      ),
    };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    men: { ...SHARED, height: ArchetypeBand.metres(1.34, 1.36, NORMS, true) },
    women: {
      ...SHARED,
      height: ArchetypeBand.metres(1.24, 1.26, NORMS, true),
    },
  };
}
