import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The steel drums read. */
const DRUM: string =
  "Pipeline Packaging 55 gallon steel drums: DWG20459 tight head, diameter 22.5 in, outside height 34.75 in, 38.4 lb (https://images.salsify.com/image/upload/s--qux83p23--/qul3km981gfsrgolci19.pdf); DWG20443 open head, diameter 22 1/2 in, outside height 35 1/4 in, 43 lb (https://images.salsify.com/image/upload/s--Va7JVN6o--/zemdshut43rl5xcftlfj.pdf)";

/** The keg read. */
const KEG: string =
  "KegLand 50 L DIN keg drawing KL09485: 381 +/- 2 mm across the rolling rings, 600 +/- 3 mm high (https://www.kegland.com.au/cdn/shop/files/KL09485_-_50L_DIN_KegLand_1.8mm.pdf)";

/** The keg's empty mass, from a search only. */
const KEG_MASS: string =
  "50 L DIN kegs 11.2 to 12.1 kg empty (Czech Mini Breweries, Rotzmeier), as search results give the makers' listings; not read";

/** How many sides the top's outline has. */
const SIDES: number = 16;

/** The readable name of each kind. */
const NAMES: Readonly<Record<AutoMovieArchetypeBarrel.Kind, string>> = {
  steelDrum: "steel drum",
  keg: "keg",
};

/** Constructs the barrel archetype from its recipe. */
export namespace AutoMovieArchetypeBarrel {
/**
 * A barrel moved by hand: a 55 gallon steel drum or a 50 L beer keg.
 *
 * The barrel stands upright on the floor at the origin, its axis along `+Y`.
 * Two hands take it at its top rim on `+X` and `-X`, where a drum's chime and a
 * keg's top skirt are gripped to tip, lift or walk it; its top is a face
 * another load rests on.
 *
 * Both barrels rest on their steel chimes: steel on concrete
 * (`AutoMovieArchetypeFriction`).
 *
 * @param params The kind, a drum's model and any dimension the author fixes.
 * @param seed The seed that draws a drum's model when it is not given and every
 *   dimension left free inside its band; absent, the first model and the middle
 *   of each band.
 * @returns The barrel, empty.
 * @throws {AutoMovieArchetypeRefusal} For a model the drum maker does not list
 *   or one named for a keg, a fixed dimension outside its band, or one only
 *   another kind has.
 */
export function create(
  params: AutoMovieArchetypeBarrel.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBarrel.Affordance, AutoMovieArchetypeBarrel.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBarrel.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeBarrel.Dimension>(
      "barrel",
      AutoMovieArchetypeBarrel.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeBarrel.Kind = ArchetypeDraw.choice(
    "barrel",
    "kind",
    params.kind,
    AutoMovieArchetypeBarrel.KINDS,
  );
  const drum: Readonly<Partial<Record<AutoMovieArchetypeBarrel.Dimension, number>>> =
    draw.model<AutoMovieArchetypeBarrel.Drum>(
      "model",
      params.model,
      AutoMovieArchetypeBarrel.DRUMS[kind],
    ).figures;
  const d: Partial<Record<AutoMovieArchetypeBarrel.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeBarrel.BANDS[kind], AutoMovieArchetypeBarrel.BANDS),
    ...drum,
  };
  const radius: number = d.diameter! / 2;
  const height: number = d.height!;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeBarrel.Affordance,
    AutoMovieArchetypeBarrel.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  builder.rod(
    kind,
    radius,
    Vector3.create(0, 0, 0),
    Vector3.create(0, height, 0),
    { color: kind === "keg" ? "#b9bec4" : "#4a6b8a", surface: "steel" },
  );
  for (const [id, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(sign * radius, height, 0),
        Vector3.create(sign, 0, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "two-hand",
    });
  const outline: IAutoMovieVector3[] = [];
  for (let k: number = 0; k < SIDES; k++) {
    const angle: number = (2 * Math.PI * k) / SIDES;
    outline.push(
      Vector3.create(radius * Math.cos(angle), 0, radius * Math.sin(angle)),
    );
  }
  builder.affordance({
    id: "top",
    kind: "stack-top",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: outline,
  });
  return builder.build(d.mass!, { rests: "steel" });
}
}

/** Companion types and bands of {@link createBarrel}. */
export namespace AutoMovieArchetypeBarrel {
  /** The kinds of barrel. */
  export type Kind = "steelDrum" | "keg";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["steelDrum", "keg"];

  /**
   * The affordance ids:
   *
   * - `left`, `right`: where the two hands take the barrel, on its top rim at
   *   `+X` and `-X`, `+Y` pointing out.
   * - `top`: the top, on which another load rests.
   */
  export type Affordance = "left" | "right" | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: across the barrel.
   * - `height`: the barrel's outside height.
   * - `mass`: the empty barrel, kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * The steel drums read: Pipeline Packaging's DWG20459 tight head and DWG20443
   * open head.
   */
  export type Drum = "DWG20459" | "DWG20443";

  /**
   * Each kind's models with their read height and mass, the default first:
   * Pipeline Packaging's DWG20459, 34.75 in high and 38.4 lb, and DWG20443, 35
   * 1/4 in high and 43 lb; a keg has one read model.
   */
  export const DRUMS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Drum, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    steelDrum: {
      DWG20459: {
        height: 34.75 * AutoMovieArchetypeUnits.INCH,
        mass: 38.4 * AutoMovieArchetypeUnits.POUND,
      },
      DWG20443: {
        height: 35.25 * AutoMovieArchetypeUnits.INCH,
        mass: 43 * AutoMovieArchetypeUnits.POUND,
      },
    },
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which barrel. */
    kind: Kind;

    /**
     * A steel drum's model; drawn from the seed when absent. A keg has one read
     * model.
     */
    model?: Drum;

    /** The model's id, unique in a scene; `barrel` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    steelDrum: {
      diameter: AutoMovieArchetypeBand.metres(
        22.5 * AutoMovieArchetypeUnits.INCH,
        22.5 * AutoMovieArchetypeUnits.INCH,
        DRUM,
      ),
    },
    keg: {
      diameter: AutoMovieArchetypeBand.metres(0.379, 0.383, KEG),
      height: AutoMovieArchetypeBand.metres(0.597, 0.603, KEG),
      mass: AutoMovieArchetypeBand.of("kg", 11.2, 12.1, KEG_MASS, true),
    },
  };
}
