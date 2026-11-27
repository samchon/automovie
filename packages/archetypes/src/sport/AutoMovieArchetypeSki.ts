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
import { AutoMovieArchetypeSkiData } from "./internal/AutoMovieArchetypeSkiData";

/** Constructs the ski archetype from its recipe. */
export namespace AutoMovieArchetypeSki {
/**
 * An alpine ski lying flat on the snow, its tip toward `-Z`.
 *
 * Its length is one of LINE Blend's four, given or drawn from the seed, and its
 * outline is LINE Blend's shape at that length, as a forebody from the tip's
 * width to the waist's and an afterbody from the waist's to the tail's, at the
 * thickness Rossignol's patent claims for an alpine ski's middle. `stance`
 * marks the top under the boot. `base` marks the underside at the stance with
 * the two local edge positions, for a staged snow contact. The binding is
 * represented by its stance anchor.
 *
 * @param params The length LINE lists and any dimension the author fixes.
 * @param seed The seed that draws the length when it is not given and every
 *   dimension left free inside its band; absent, the first length and the
 *   middle of each band.
 * @returns The ski.
 * @throws {AutoMovieArchetypeRefusal} For a length LINE does not list or a
 *   fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeSki.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSki.Affordance, AutoMovieArchetypeSki.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSki.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSki.Dimension>(
      "ski",
      AutoMovieArchetypeSki.UNITS,
      seed,
      params,
    );
  const length: {
    name: AutoMovieArchetypeSki.Length | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeSki.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeSki.Length>("size", params.size, AutoMovieArchetypeSki.LENGTHS);
  const d: Partial<Record<AutoMovieArchetypeSki.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeSki.BANDS),
    ...length.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSki.Affordance,
    AutoMovieArchetypeSki.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `ski ${length.name}`,
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const half: number = d.length! / 2;
  const thick: number = d.thickness!;
  const contactWidth: number = (WIDTH.waist + WIDTH.tail) / 2;
  const contactLength: number = 2 * Math.min(STANCE, half - STANCE);
  builder.box(
    "forebody",
    v((WIDTH.tip + WIDTH.waist) / 2, thick, half),
    v(0, thick / 2, -half / 2),
    { color: "#d6202b" },
  );
  builder.box(
    "afterbody",
    v(contactWidth, thick, half),
    v(0, thick / 2, half / 2),
    { color: "#d6202b" },
  );
  builder.affordance({
    id: "stance",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, thick, STANCE)),
    extent: null,
    width: WIDTH.waist,
  });
  builder.affordance({
    id: "base",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, STANCE)),
    extent: null,
    width: contactWidth,
    depth: contactLength,
  });
  for (const [id, sign] of [
    ["leftEdge", 1],
    ["rightEdge", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        v((sign * contactWidth) / 2, 0, STANCE),
        v(0, 1, 0),
        v(0, 0, -sign),
      ),
      extent: null,
      length: contactLength,
    });
  return builder.build(d.mass!);
}

  /**
   * The boot stance, lower contact strip and its left and right boundaries near
   * the stance.
   */
  export type Affordance = "stance" | "base" | "leftEdge" | "rightEdge";

  /**
   * The free dimensions:
   *
   * - `length`: the ski, metres, its picked length's.
   * - `thickness`: its middle, metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    thickness: "m",
    mass: "kg",
  };

  /** LINE Blend's lengths. */
  export type Length = "163cm" | "169cm" | "175cm" | "180cm";

  /** Each length LINE Blend lists, metres, the default first. */
  export const LENGTHS: Readonly<
    Record<Length, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "163cm": { length: 163 * AutoMovieArchetypeUnits.CENTIMETRE },
    "169cm": { length: 169 * AutoMovieArchetypeUnits.CENTIMETRE },
    "175cm": { length: 175 * AutoMovieArchetypeUnits.CENTIMETRE },
    "180cm": { length: 180 * AutoMovieArchetypeUnits.CENTIMETRE },
  };

  /**
   * The parameters: the length, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "length">, number>
  > {
    /** LINE Blend's size, which sets `length`; drawn from the seed when absent. */
    size?: Length;

    /** The model's id, unique in a scene; `ski` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "length">, IAutoMovieArchetypeBand>
  > = {
    thickness: AutoMovieArchetypeBand.metres(0.015, 0.03, AutoMovieArchetypeSkiData.ROSSIGNOL),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      1.84,
      1.84,
      `${AutoMovieArchetypeSkiData.LINE}: 1840 g at 175 cm, the model takes it for every length`,
    ),
  };
}

/*
 * The shape's widths, metres: LINE Blend's 129 mm tip, 98 mm waist and 120 mm
 * tail.
 */
const WIDTH: Readonly<{ tip: number; waist: number; tail: number }> = {
  tip: 0.129,
  waist: 0.098,
  tail: 0.12,
};

/*
 * How far the stance lies behind the ski's centre, metres: LINE Blend's 20 mm.
 */
const STANCE: number = 0.02;
