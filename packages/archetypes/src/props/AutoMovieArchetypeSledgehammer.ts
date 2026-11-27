import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** No maker's page was read. */
const STAGED: string =
  "a long-handled striking tool: its dimensions and mass are provisional estimates, no maker's page was read";

/** Constructs the sledgehammer archetype from its recipe. */
export namespace AutoMovieArchetypeSledgehammer {
/**
 * A sledgehammer or a pickaxe: a heavy head on a long handle, swung in two
 * hands. As the forest axe's, its head lies at the origin with the handle up
 * `+Y`; `face` is the striking face toward `+Z` (a pick's point), and `shaft`
 * the handle the two hands hold, the lead hand sliding along it.
 *
 * @param params Scene identity, the kind and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The tool with its contacts.
 */
export function create(
  params: AutoMovieArchetypeSledgehammer.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeSledgehammer.Affordance,
  AutoMovieArchetypeSledgehammer.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSledgehammer.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "sledgehammer",
      AutoMovieArchetypeSledgehammer.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeSledgehammer.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeSledgehammer.BANDS,
  );
  const pick: boolean = params.kind === "pickaxe";
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSledgehammer.Affordance,
    AutoMovieArchetypeSledgehammer.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: pick ? "a pickaxe" : "a sledgehammer",
    material: "steel",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const head: number = d.head;
  const reach: number = pick ? 0.28 : head / 2;
  builder.box(
    "head",
    pick ? v(0.04, 0.05, 2 * reach) : v(0.08, 0.08, head),
    v(0, 0.04, 0),
    { color: "#5c6066", share: d.headMass / d.mass },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0.04, reach),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    width: pick ? 0.02 : 0.08,
  });
  builder.rod("handle", 0.018, v(0, 0.08, 0), v(0, d.length, 0), {
    color: "#b98d5b",
    share: 1 - d.headMass / d.mass,
  });
  builder.affordance({
    id: "shaft",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, (0.08 + d.length) / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "two-hand",
    aperture: 0.036,
    length: d.length - 0.08,
  });
  return builder.build(d.mass);
}

  /* Kinds, dimensions and contacts of {@link createSledgehammer}. */
  /** A blunt sledgehammer, or a pickaxe whose point strikes. */
  export type Kind = "sledgehammer" | "pickaxe";

  /** The striking face, and the handle held in two hands. */
  export type Affordance = "face" | "shaft";

  /** The overall length, the head's length, the head's mass and the whole mass. */
  export type Dimension = "length" | "head" | "headMass" | "mass";

  /** Scene identity, the kind and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;

    /** The kind; a sledgehammer when absent. */
    kind?: Kind;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    head: "m",
    headMass: "kg",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(0.8, 0.95, STAGED, true),
    head: AutoMovieArchetypeBand.metres(0.16, 0.22, STAGED, true),
    headMass: AutoMovieArchetypeBand.of("kg", 2.5, 4.5, STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 3.5, 5.5, STAGED, true),
  };
}
