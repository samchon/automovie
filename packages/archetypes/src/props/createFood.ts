import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** USDA's apple portions, read. */
const APPLE: string =
  "USDA FoodData Central 171688, Apples, raw, with skin: portions from extra small, 2 1/2 in across and 101 g, to large, 3 1/4 in and 223 g (https://api.nal.usda.gov/fdc/v1/food/171688)";

/** A maker's sandwich loaf, read, and a one-pound pan loaf seen only in search results. */
const BREAD: string =
  "Klosterman White Sandwich Bread 32 oz, 14.75 by 4.25 by 4.25 in (https://klostermanbakery.com/white-sandwich-bread-32-oz), and a 1 lb loaf from the USA Pan 1140LF's 8.5 by 4.5 by 2.75 in baking surface, seen only in search results";

/**
 * Food a hand takes to the mouth: a loaf of bread or an apple. A chicken drumstick waits for a measured length and girth: the searches read found its mass (USDA FoodData Central 173612) but no study of its shape.
 *
 * Each lies on the floor of its own space at rest, as it lies on a plate's `top`. `grip` is where the hand holds it and `bite` the place `handToFace` brings to the mouth, as its `drink` task brings a cup's `lip`:
 *
 * - a loaf lies along `X` in two halves. The hand at `grip` holds the `+X` half from above; the other hand tears the `-X` half off by `tear`, a slider whose frame is that half's grip, travelling outward along `-X` of the model. `bite` is that half's outer end, and rides the tear.
 * - an apple sits on its base with its stalk up; `grip` closes round it and `bite` is its side toward `+Z`, `+Y` the skin's outward normal. *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The food.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each food lies, where it is held and bitten, and how the loaf tears.
 * @evidence contracts/development/implementation.md#principled-implementation A loaf as two boxes of half its drawn length, the `-X` half bound to a slider; an apple as one ball of the drawn diameter. Every grip's frame lies at the centre of the part it closes on, with that part's span along its `+Y` as the aperture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then the kind's parts, grip and bite.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A loaf's dome and an apple's dimples are not modelled; the tear's travel and the stalk are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createFood(
  params: createFood.IParams,
  seed?: number | string,
): Archetype<createFood.Affordance, createFood.Dimension> {
  const kind: createFood.Kind = ArchetypeDraw.choice(
    "food",
    "kind",
    params.kind,
    createFood.KINDS,
  );
  const d: Partial<Record<createFood.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "food",
      createFood.BANDS[kind],
      seed,
      params,
      createFood.BANDS,
    );
  const builder: ArchetypeBuilder<createFood.Affordance, createFood.Dimension> =
    new ArchetypeBuilder({
      archetype: "food",
      id: params.id,
      name: kind === "bread" ? "loaf of bread" : kind,
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;

  if (kind === "bread") {
    const length: number = d.length!;
    const width: number = d.width!;
    const height: number = d.height!;
    const color: string = "#c98f4e";
    builder.box(
      "kept",
      v(length / 2, height, width),
      v(length / 4, height / 2, 0),
      { color },
    );
    builder.box(
      "torn",
      v(length / 2, height, width),
      v(-length / 4, height / 2, 0),
      { color },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "half",
      frame: ArchetypeFrame.facing(
        v(length / 4, height / 2, 0),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: height,
    });

    // The tear: the -X half slides away along the loaf, its frame at that half's grip with +X outward.
    builder.affordance({
      id: "tear",
      kind: "slider",
      frame: ArchetypeFrame.facing(
        v(-length / 4, height / 2, 0),
        v(0, 1, 0),
        v(-1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: height,
      travel: createFood.TEAR,
      parts: ["torn"],
    });
    builder.affordance({
      id: "bite",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.facing(v(-length / 2, height / 2, 0), v(-1, 0, 0)),
      extent: null,
      rides: "tear",
    });
    return builder.build(d.mass!);
  }

  // An apple: one ball standing on its base, its stalk up.
  const r: number = d.diameter! / 2;
  builder.ball("flesh", r, v(0, r, 0), { color: "#b8322a" });
  builder.rod(
    "stalk",
    createFood.STALK.radius,
    v(0, 2 * r, 0),
    v(0, 2 * r + createFood.STALK.length, 0),
    { color: "#5a3d22", density: 0.5 },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, r, 0), v(-1, 0, 0), v(0, 1, 0)),
    extent: null,
    grip: "power",
    aperture: 2 * r,
  });
  builder.affordance({
    id: "bite",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(v(0, r, r), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createFood}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of two generic foods, one cited band per dimension per kind; the tear is an articulation, so a torn loaf is a moved part.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip a hand takes, the bite the mouth meets and the loaf's tear (#3501).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every food has the same `grip` and `bite`, so an eating act is written once; no food is one production's dish. A drumstick is left out until its shape has a source; the tear's travel and the stalk are named estimates.
 */
export namespace createFood {
  /** The kinds. */
  export type Kind = "bread" | "apple";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["bread", "apple"];

  /** How far the torn half of a loaf is drawn from the kept one, metres: an estimate. */
  export const TEAR: number = 0.1;

  /** An apple's stalk, metres: an estimate. */
  export const STALK: Readonly<{ radius: number; length: number }> = {
    radius: 0.002,
    length: 0.015,
  };

  /**
   * The affordance ids:
   *
   * - `grip`: where the hand holds it; a loaf's `+X` half from above, an apple round its middle.
   * - `bite`: the place brought to the mouth.
   * - `tear`: a loaf's `-X` half, a slider pulled away along the loaf.
   */
  export type Affordance = "grip" | "bite" | "tear";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `width`, `height`: a loaf's along `X`, across and up.
   * - `diameter`: an apple's.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "height" | "diameter" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which food. */
    kind: Kind;

    /** The model's id, unique in a scene; `food` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    bread: {
      length: ArchetypeBand.metres(
        8.5 * 0.0254,
        14.75 * 0.0254,
        BREAD,
        true,
      ),
      width: ArchetypeBand.metres(4.25 * 0.0254, 4.5 * 0.0254, BREAD, true),
      height: ArchetypeBand.metres(2.75 * 0.0254, 4.25 * 0.0254, BREAD, true),
      mass: ArchetypeBand.of("kg", 0.4536, 0.9072, BREAD, true),
    },
    apple: {
      diameter: ArchetypeBand.metres(2.5 * 0.0254, 3.25 * 0.0254, APPLE),
      mass: ArchetypeBand.of("kg", 0.101, 0.223, APPLE),
    },
  };
}
