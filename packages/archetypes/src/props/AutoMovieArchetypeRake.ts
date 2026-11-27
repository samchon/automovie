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
  "a garden rake: its dimensions and mass are provisional estimates, no maker's page was read";

/** Constructs the rake archetype from its recipe. */
export namespace AutoMovieArchetypeRake {
/**
 * A garden rake or a hoe: a crosswise head on a long handle, pulled along the
 * ground in two hands. Its head lies at the origin with the handle up `+Y` and
 * the tines (a hoe's blade) toward `+Z`; `face` is the line of the tine tips
 * facing `+Z`, and `shaft` the handle the two hands hold.
 *
 * @param params Scene identity, the kind and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The tool with its contacts.
 */
export function create(
  params: AutoMovieArchetypeRake.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRake.Affordance, AutoMovieArchetypeRake.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRake.Dimension> =
    new AutoMovieArchetypeDrawSession("rake", AutoMovieArchetypeRake.UNITS, seed, params);
  const d: Record<AutoMovieArchetypeRake.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeRake.BANDS,
  );
  const hoe: boolean = params.kind === "hoe";
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeRake.Affordance,
    AutoMovieArchetypeRake.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: hoe ? "a hoe" : "a garden rake",
    material: "steel",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const tines: number = 0.08;
  builder.box("head", v(d.width, 0.03, 0.03), v(0, 0.015, 0), {
    color: "#5c6066",
    share: 0.35,
  });
  builder.box(
    "tines",
    v(d.width, hoe ? 0.1 : 0.01, tines),
    v(0, hoe ? -0.02 : 0.005, tines / 2 + 0.015),
    { color: "#5c6066", share: 0.15 },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0.005, tines + 0.015),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    width: d.width,
  });
  builder.rod("handle", 0.014, v(0, 0.03, 0), v(0, d.length, 0), {
    color: "#b98d5b",
    share: 0.5,
  });
  builder.affordance({
    id: "shaft",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, (0.03 + d.length) / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "two-hand",
    aperture: 0.028,
    length: d.length - 0.03,
  });
  return builder.build(d.mass);
}

  /* Kinds, dimensions and contacts of {@link createRake}. */
  /** A tined rake, or a bladed hoe. */
  export type Kind = "rake" | "hoe";

  /** The tine tips, and the handle held in two hands. */
  export type Affordance = "face" | "shaft";

  /** The overall length, the head's width and the mass. */
  export type Dimension = "length" | "width" | "mass";

  /** Scene identity, the kind and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;

    /** The kind; a rake when absent. */
    kind?: Kind;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(1.4, 1.65, STAGED, true),
    width: AutoMovieArchetypeBand.metres(0.3, 0.42, STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.9, 1.6, STAGED, true),
  };
}
