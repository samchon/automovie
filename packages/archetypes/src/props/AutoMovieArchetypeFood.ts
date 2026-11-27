import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";

/*
 * A maker's sandwich loaf, read, and a one-pound pan loaf seen only in search
 * results.
 */
const BREAD: string =
  "Klosterman White Sandwich Bread 32 oz, 14.75 by 4.25 by 4.25 in (https://klostermanbakery.com/white-sandwich-bread-32-oz), and a 1 lb loaf from the USA Pan 1140LF's 8.5 by 4.5 by 2.75 in baking surface, seen only in search results";

/*
 * USDA's drumstick, read.
 */
const DRUMSTICK: string =
  "USDA FoodData Central 172373, chicken drumstick, 130 g";

/*
 * A drumstick's shape, which no source read gives.
 */
const DRUMSTICK_SHAPE: string =
  "a provisional estimate: the searches 'broiler drumstick length cm measured study', 'drumstick length broiler cm table mean' and 'tibiotarsus length mm broiler 42 days Ross 308 mean' found carcass studies that measure a drumstick's length without reporting it, and no length or girth";

/*
 * The readable name of each kind.
 */
const NAMES: Readonly<Record<AutoMovieArchetypeFood.Kind, string>> = {
  bread: "loaf of bread",
  apple: "apple",
  drumstick: "drumstick",
};

/** Constructs the food archetype from its recipe. */
export namespace AutoMovieArchetypeFood {
/**
 * Food a hand takes to the mouth: a loaf of bread, an apple or a chicken
 * drumstick.
 *
 * Each lies on the floor of its own space at rest, as it lies on a plate's
 * `top`. `grip` is where the hand holds it and `bite` the place `handToFace`
 * brings to the mouth, as its `drink` task brings a cup's `lip`:
 *
 * - A loaf lies along `X` in two halves that meet at its middle; the hand at
 *   `grip` holds it from above at its middle, and `bite` is its `-X` end. Two
 *   hands tear it: one holds the `-X` half at `hold`, the other draws the `+X`
 *   half away along `+X` on the `tear` slider.
 * - An apple sits on its base with its stalk up; `grip` closes round it and
 *   `bite` is its side toward `+Z`, `+Y` the skin's outward normal.
 * - A drumstick lies along `X`, its meat toward `-X` and its bare knuckle toward
 *   `+X`; `grip` closes round the knuckle and `bite` is the meat's `-X` end.
 *
 * @param params The kind, the kind's model where it has read models, and any
 *   dimension the author fixes.
 * @param seed The seed that picks the model when none is given and draws every
 *   dimension left free inside its band; absent, the first model and the middle
 *   of each band.
 * @returns The food.
 * @throws {AutoMovieArchetypeRefusal} For a model the kind does not have, or a
 *   fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeFood.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeFood.Affordance, AutoMovieArchetypeFood.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeFood.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeFood.Dimension>(
      "food",
      AutoMovieArchetypeFood.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeFood.Kind = ArchetypeDraw.choice(
    "food",
    "kind",
    params.kind,
    AutoMovieArchetypeFood.KINDS,
  );
  const drawn: Partial<Record<AutoMovieArchetypeFood.Dimension, number>> = draw.dimensions(
    AutoMovieArchetypeFood.BANDS[kind],
    AutoMovieArchetypeFood.BANDS,
  );
  // An apple is one of USDA's four portion sizes whole.
  const model: {
    name: AutoMovieArchetypeFood.Model | undefined;
    figures: AutoMovieArchetypeFood.Figures;
  } = draw.model<AutoMovieArchetypeFood.Model>(
    "model",
    params.model,
    AutoMovieArchetypeFood.MODELS[kind],
  );
  const d: Partial<Record<AutoMovieArchetypeFood.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeFood.Affordance,
    AutoMovieArchetypeFood.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "food",
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;

  if (kind === "bread") {
    // Two halves meeting at the middle: the -X one held, the +X one drawn away on the tear.
    const length: number = d.length!;
    const width: number = d.width!;
    const height: number = d.height!;
    const color: string = "#c98f4e";
    for (const [part, sign] of [
      ["half", -1],
      ["torn", 1],
    ] as const)
      builder.box(
        part,
        v(length / 2, height, width),
        v((sign * length) / 4, height / 2, 0),
        { color },
      );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "half",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, height / 2, 0),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: height,
    });
    builder.affordance({
      id: "hold",
      kind: "handle",
      symmetry: "half",
      frame: AutoMovieArchetypeFrame.facing(
        v(-length / 4, height / 2, 0),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: height,
    });
    builder.affordance({
      id: "tear",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(length / 4, height / 2, 0),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: height,
      travel: AutoMovieArchetypeFood.TEAR,
      parts: ["torn"],
    });
    builder.affordance({
      id: "bite",
      kind: "surface",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        v(-length / 2, height / 2, 0),
        v(-1, 0, 0),
      ),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  if (kind === "drumstick") {
    // The meat toward -X lying on the floor, the bare knuckle on its axis toward +X.
    const length: number = d.length!;
    const r: number = d.diameter! / 2;
    const knuckle: number = AutoMovieArchetypeFood.KNUCKLE.length;
    const joint: number = length / 2 - knuckle;
    builder.rod("meat", r, v(-length / 2, r, 0), v(joint, r, 0), {
      color: "#b5703a",
    });
    builder.rod(
      "knuckle",
      AutoMovieArchetypeFood.KNUCKLE.diameter / 2,
      v(joint, r, 0),
      v(length / 2, r, 0),
      { color: "#ece3d0" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(joint + knuckle / 2, r, 0),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: AutoMovieArchetypeFood.KNUCKLE.diameter,
      length: knuckle,
    });
    builder.affordance({
      id: "bite",
      kind: "surface",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(v(-length / 2, r, 0), v(-1, 0, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  // An apple: one ball standing on its base, its stalk up.
  const r: number = d.diameter! / 2;
  builder.ball("flesh", r, v(0, r, 0), { color: "#b8322a" });
  builder.rod(
    "stalk",
    AutoMovieArchetypeFood.STALK.radius,
    v(0, 2 * r, 0),
    v(0, 2 * r + AutoMovieArchetypeFood.STALK.length, 0),
    { color: "#5a3d22", density: 0.5 },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(v(0, r, 0), v(-1, 0, 0), v(0, 1, 0)),
    extent: null,
    grip: "power",
    aperture: 2 * r,
  });
  builder.affordance({
    id: "bite",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(v(0, r, r), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

  /** The kinds. */
  export type Kind = "bread" | "apple" | "drumstick";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["bread", "apple", "drumstick"];

  /**
   * An apple's stalk, metres: a construction estimate that no act reads and no
   * band declares.
   */
  export const STALK: Readonly<{ radius: number; length: number }> = {
    radius: 0.002,
    length: 0.015,
  };

  /**
   * A drumstick's bare knuckle, metres, its length along the drumstick and its
   * diameter: a provisional estimate, searched for as its band's shape was, the
   * grip's length and aperture.
   */
  export const KNUCKLE: Readonly<{ length: number; diameter: number }> = {
    length: 0.03,
    diameter: 0.015,
  };

  /**
   * How far a loaf's torn half is drawn away, metres: a provisional estimate,
   * since the search 'tearing bread by hand distance halves pulled apart' found
   * recipes and customs that pull a loaf into halves, none giving how far.
   */
  export const TEAR: number = 0.1;

  /**
   * A drumstick's length and its meat's diameter, metres: provisional estimates
   * that its bands declare, no source read giving either.
   */
  export const ESTIMATES: Readonly<{ length: number; diameter: number }> = {
    length: 0.12,
    diameter: 0.045,
  };

  /**
   * The affordance ids:
   *
   * - `grip`: where the hand holds it; a loaf from above at its middle, an apple
   *   round it, a drumstick round its knuckle.
   * - `bite`: the place brought to the mouth.
   * - `hold`: a loaf's `-X` half from above, held while the other half is torn
   *   away.
   * - `tear`: a loaf's `+X` half from above, a slider drawing that half away
   *   along `+X`.
   */
  export type Affordance = "grip" | "bite" | "hold" | "tear";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `width`, `height`: a loaf's along `X`, across and up; `length`
   *   also a drumstick's along `X`.
   * - `diameter`: an apple's, or a drumstick's meat across.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "height" | "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    height: "m",
    diameter: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which food. */
    kind: Kind;

    /** An apple's portion size; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `food` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The apples read: USDA's extra small, small, medium and large portions. */
  export type Model = "extraSmall" | "small" | "medium" | "large";

  /**
   * Each kind's models whole, the default first: USDA FoodData Central 171688,
   * Apples, raw, with skin, its portions 2 1/2, 2 3/4, 3 and 3 1/4 in across at
   * 101, 149, 182 and 223 g (https://api.nal.usda.gov/fdc/v1/food/171688).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    apple: {
      extraSmall: { diameter: 2.5 * AutoMovieArchetypeUnits.INCH, mass: 0.101 },
      small: { diameter: 2.75 * AutoMovieArchetypeUnits.INCH, mass: 0.149 },
      medium: { diameter: 3 * AutoMovieArchetypeUnits.INCH, mass: 0.182 },
      large: { diameter: 3.25 * AutoMovieArchetypeUnits.INCH, mass: 0.223 },
    },
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    bread: {
      length: AutoMovieArchetypeBand.metres(
        8.5 * AutoMovieArchetypeUnits.INCH,
        14.75 * AutoMovieArchetypeUnits.INCH,
        BREAD,
        true,
      ),
      width: AutoMovieArchetypeBand.metres(
        4.25 * AutoMovieArchetypeUnits.INCH,
        4.5 * AutoMovieArchetypeUnits.INCH,
        BREAD,
        true,
      ),
      height: AutoMovieArchetypeBand.metres(
        2.75 * AutoMovieArchetypeUnits.INCH,
        4.25 * AutoMovieArchetypeUnits.INCH,
        BREAD,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        AutoMovieArchetypeUnits.POUND,
        32 * AutoMovieArchetypeUnits.OUNCE,
        BREAD,
        true,
      ),
    },
    apple: {},
    drumstick: {
      length: AutoMovieArchetypeBand.metres(
        ESTIMATES.length,
        ESTIMATES.length,
        DRUMSTICK_SHAPE,
        true,
      ),
      diameter: AutoMovieArchetypeBand.metres(
        ESTIMATES.diameter,
        ESTIMATES.diameter,
        DRUMSTICK_SHAPE,
        true,
      ),
      mass: AutoMovieArchetypeBand.of("kg", 0.13, 0.13, DRUMSTICK),
    },
  };
}
