import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The ski's shape read. */
const LINE: string =
  "LINE Blend 2027: shape 129-98-120 mm (tip, waist, tail), lengths 163, 169, 175 and 180 cm, the stance 20 mm back from centre (https://lineskis.com/en-gb/p/blend-skis-ln261774)";

/** The ski's thickness read. */
const ROSSIGNOL: string =
  "Skis Rossignol patent EP0806228A1: an alpine ski's central zone between fifteen millimeters (15 mm) and thirty millimeters (30 mm) thick (https://patents.google.com/patent/EP0806228A1/en)";

/**
 * The shape's widths, metres: LINE Blend's 129 mm tip, 98 mm waist and 120 mm
 * tail.
 */
const WIDTH: Readonly<{ tip: number; waist: number; tail: number }> = {
  tip: 0.129,
  waist: 0.098,
  tail: 0.12,
};

/** How far the stance lies behind the ski's centre, metres: LINE Blend's 20 mm. */
const STANCE: number = 0.02;

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
export function createSki(
  params: createSki.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createSki.Affordance, createSki.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createSki.Dimension> =
    new AutoMovieArchetypeDrawSession<createSki.Dimension>(
      "ski",
      createSki.UNITS,
      seed,
      params,
    );
  const length: {
    name: createSki.Length | undefined;
    figures: Readonly<Partial<Record<createSki.Dimension, number>>>;
  } = draw.model<createSki.Length>("size", params.size, createSki.LENGTHS);
  const d: Partial<Record<createSki.Dimension, number>> = {
    ...draw.dimensions(createSki.BANDS),
    ...length.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    createSki.Affordance,
    createSki.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `ski ${length.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
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

/** Companion types and bands of {@link createSki}. */
export namespace createSki {
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
    thickness: AutoMovieArchetypeBand.metres(0.015, 0.03, ROSSIGNOL),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      1.84,
      1.84,
      `${LINE}: 1840 g at 175 cm, the model takes it for every length`,
    ),
  };
}
