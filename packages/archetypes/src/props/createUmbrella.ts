import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The maker's stick umbrellas, read. */
const BLUNT: string =
  "BLUNT model comparison: Classic open 120 cm, closed 84 cm, 660 g; Exec open 138 cm, closed 95.5 cm, 910 g (https://bluntumbrellas.com/pages/compare-model)";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to an umbrella's handle, whose own diameter no maker read states";

/**
 * A stick umbrella, open over the head or closed and carried.
 *
 * It stands along `+Y` from the bottom of its handle at the origin to the ferrule's tip at its closed length. `grip` is the straight handle a hand closes round, taken from `-Z`. Open, its canopy is a disc of the open diameter just under the ferrule, and `canopy` is the canopy's top, facing up, where the rain falls; closed, it is the shaft and the handle, and declares no canopy. A folding umbrella is not made: no maker read gives its shaft's open length.
 *
 * @param params Whether it is open, and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The umbrella.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the umbrella stands, where it is held and what opening it adds.
 * @evidence contracts/development/implementation.md#principled-implementation A handle rod and a shaft rod to the closed length, a stick umbrella's shaft keeping its length open or closed; open adds a canopy disc of the published open diameter.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the handle and its grip, the shaft, then the canopy when open.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The canopy is a flat disc, not a ribbed dome, and the furled canopy of a closed umbrella is not drawn; the shaft's radius, the handle's length, the canopy's thickness and the ferrule's length are named estimates. Opening is a state of the parameters, not an articulation, because the canopy changes size.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createUmbrella(
  params: createUmbrella.IParams = {},
  seed?: number | string,
): Archetype<createUmbrella.Affordance, createUmbrella.Dimension> {
  const d: Record<createUmbrella.Dimension, number> = ArchetypeDraw.dimensions(
    "umbrella",
    createUmbrella.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createUmbrella.Affordance,
    createUmbrella.Dimension
  > = new ArchetypeBuilder({
    archetype: "umbrella",
    id: params.id,
    name: params.open === true ? "open umbrella" : "umbrella",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const handle: number = createUmbrella.HANDLE;
  builder.rod("handle", d.gripDiameter / 2, v(0, 0, 0), v(0, handle, 0), {
    color: "#3a2a1e",
  });
  builder.rod("shaft", createUmbrella.SHAFT, v(0, handle, 0), v(0, d.length, 0), {
    color: "#2c2f33",
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, handle / 2, 0), v(0, 0, -1), v(0, 1, 0)),
    extent: null,
    grip: "power",
    aperture: d.gripDiameter,
    length: handle,
  });
  if (params.open === true) {
    // The canopy just under the ferrule, the full open diameter across.
    const top: number = d.length - createUmbrella.FERRULE;
    builder.rod(
      "canopy",
      d.canopy / 2,
      v(0, top - createUmbrella.CANOPY, 0),
      v(0, top, 0),
      { color: "#1f2a44", density: 0.1 },
    );
    builder.affordance({
      id: "canopy",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, top, 0)),
      extent: null,
      width: d.canopy,
      depth: d.canopy,
    });
  }
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createUmbrella}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension; open or closed is a parameter because the canopy's size, not a part's place, changes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handle a hand takes and the canopy a shot reads (#3468's N15).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The open diameter, closed length and mass are the maker's as read; the handle's diameter is a grip band applied, provisional; the rest are named estimates.
 */
export namespace createUmbrella {
  /** The shaft's radius, metres: an estimate. */
  export const SHAFT: number = 0.006;

  /** The handle's length, metres: the 120 mm CCOHS recommends for a tool handle (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html). */
  export const HANDLE: number = 0.12;

  /** The canopy's thickness as drawn, metres: an estimate. */
  export const CANOPY: number = 0.01;

  /** The ferrule above the open canopy, metres: an estimate. */
  export const FERRULE: number = 0.03;

  /**
   * The affordance ids:
   *
   * - `grip`: the handle, taken from `-Z`.
   * - `canopy`: an open canopy's top, facing up.
   */
  export type Affordance = "grip" | "canopy";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: closed, handle to ferrule.
   * - `canopy`: the open canopy's diameter.
   * - `gripDiameter`: the handle's.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "canopy" | "gripDiameter" | "mass";

  /** The parameters: whether it is open, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Whether the canopy is open; closed when absent. */
    open?: boolean;

    /** The model's id, unique in a scene; `umbrella` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(0.84, 0.955, BLUNT),
    canopy: ArchetypeBand.metres(1.2, 1.38, BLUNT),
    gripDiameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
    mass: ArchetypeBand.of("kg", 0.66, 0.91, BLUNT),
  };
}
