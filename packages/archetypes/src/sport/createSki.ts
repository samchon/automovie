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

/** The ski's shape read. */
const LINE: string =
  "LINE Blend 2027: shape 129-98-120 mm (tip, waist, tail), lengths 163, 169, 175 and 180 cm, the stance 20 mm back from centre (https://lineskis.com/en-gb/p/blend-skis-ln261774)";

/** The ski's thickness read. */
const ROSSIGNOL: string =
  "Skis Rossignol patent EP0806228A1: an alpine ski's central zone between fifteen millimeters (15 mm) and thirty millimeters (30 mm) thick (https://patents.google.com/patent/EP0806228A1/en)";

/** The shape's widths, metres: LINE Blend's 129 mm tip, 98 mm waist and 120 mm tail. */
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
 * Its length is one of LINE Blend's four, given or drawn from the seed, and its outline is LINE Blend's shape at that length, as a forebody from the tip's width to the waist's and an afterbody from the waist's to the tail's, at the thickness Rossignol's patent claims for an alpine ski's middle. `stance` is the top at the maker's stance mark, the surface the boot stands on; the binding is not built. Skiing is balance on a sliding support, which no motion law covers yet (#3468 N11), so the ski is built for static use and carrying.
 *
 * @param params The length LINE lists and any dimension the author fixes.
 * @param seed The seed that draws the length when it is not given and every dimension left free inside its band; absent, the first length and the middle of each band.
 * @returns The ski.
 * @throws {ArchetypeRefusal} For a length LINE does not list or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the ski lies, its outline, its contact and its static use with the missing law.
 * @evidence contracts/development/implementation.md#principled-implementation LINE's widths and one of its lengths whole, with the stance behind the centre by its 20 mm, Rossignol's patented thickness range for the middle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the length, draw the dimensions, the two halves, then the contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each half is a box at its two ends' mean width; no sidecut curve, rocker, camber or binding.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSki(
  params: createSki.IParams = {},
  seed?: number | string,
): Archetype<createSki.Affordance, createSki.Dimension> {
  const draw: ArchetypeDrawSession<createSki.Dimension> =
    new ArchetypeDrawSession<createSki.Dimension>(
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
  const builder: ArchetypeBuilder<createSki.Affordance, createSki.Dimension> =
    new ArchetypeBuilder({
      id: params.id,
      name: `ski ${length.name}`,
      draw,
    });
  const v: typeof Vector3.create = Vector3.create;
  const half: number = d.length! / 2;
  const thick: number = d.thickness!;
  builder.box(
    "forebody",
    v((WIDTH.tip + WIDTH.waist) / 2, thick, half),
    v(0, thick / 2, -half / 2),
    { color: "#d6202b" },
  );
  builder.box(
    "afterbody",
    v((WIDTH.waist + WIDTH.tail) / 2, thick, half),
    v(0, thick / 2, half / 2),
    { color: "#d6202b" },
  );
  builder.affordance({
    id: "stance",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, thick, STANCE)),
    extent: null,
    width: WIDTH.waist,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createSki}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation LINE's lengths picked whole, one cited band per remaining dimension; the shape's widths and the stance are the maker's constants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The place the boot stands (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The thickness is a patent's claimed range, not one model's, and says so.
 */
export namespace createSki {
  /** The affordance id: `stance`, the top at the stance mark, where the boot stands. */
  export type Affordance = "stance";

  /**
   * The free dimensions:
   *
   * - `length`: the ski, metres, its picked length's.
   * - `thickness`: its middle, metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
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
    "163cm": { length: 163 * ArchetypeUnits.CENTIMETRE },
    "169cm": { length: 169 * ArchetypeUnits.CENTIMETRE },
    "175cm": { length: 175 * ArchetypeUnits.CENTIMETRE },
    "180cm": { length: 180 * ArchetypeUnits.CENTIMETRE },
  };

  /** The parameters: the length, and any free dimension fixed to a value inside its band. */
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
    Record<Exclude<Dimension, "length">, IArchetypeBand>
  > = {
    thickness: ArchetypeBand.metres(0.015, 0.03, ROSSIGNOL),
    mass: ArchetypeBand.of(
      "kg",
      1.84,
      1.84,
      `${LINE}: 1840 g at 175 cm, the model takes it for every length`,
    ),
  };
}
