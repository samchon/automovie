import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

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
const NAMES: Readonly<Record<createBarrel.Kind, string>> = {
  steelDrum: "steel drum",
  keg: "keg",
};

/**
 * A barrel moved by hand: a 55 gallon steel drum or a 50 L beer keg.
 *
 * The barrel stands upright on the floor at the origin, its axis along `+Y`. Two hands take it at its top rim on `+X` and `-X`, where a drum's chime and a keg's top skirt are gripped to tip, lift or walk it; its top is a face another load rests on.
 *
 * Both barrels rest on their steel chimes: steel on concrete (`ArchetypeFriction`).
 *
 * @param params The kind, a drum's model and any dimension the author fixes.
 * @param seed The seed that draws a drum's model when it is not given and every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The barrel, empty.
 * @throws {ArchetypeRefusal} For a model the drum maker does not list or one named for a keg, a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the barrel stands and where it is held.
 * @evidence contracts/development/implementation.md#principled-implementation One cylinder of the drawn diameter and height; the hands' places are the top rim's two ends of the `X` diameter, and the top's outline a polygon inscribed in the rim.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick a drum's model, draw the dimensions with its height and mass over them, then one part and its three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rolling hoops, bungs, spear or handholes: the rim stands for the gripped chime or skirt.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBarrel(
  params: createBarrel.IParams,
  seed?: number | string,
): Archetype<createBarrel.Affordance, createBarrel.Dimension> {
  const draw: ArchetypeDrawSession<createBarrel.Dimension> =
    new ArchetypeDrawSession<createBarrel.Dimension>(
      "barrel",
      createBarrel.UNITS,
      seed,
      params,
    );
  const kind: createBarrel.Kind = ArchetypeDraw.choice(
    "barrel",
    "kind",
    params.kind,
    createBarrel.KINDS,
  );
  const drum: Readonly<Partial<Record<createBarrel.Dimension, number>>> =
    draw.model<createBarrel.Drum>(
      "model",
      params.model,
      createBarrel.DRUMS[kind],
    ).figures;
  const d: Partial<Record<createBarrel.Dimension, number>> = {
    ...draw.dimensions(createBarrel.BANDS[kind], createBarrel.BANDS),
    ...drum,
  };
  const radius: number = d.diameter! / 2;
  const height: number = d.height!;
  const builder: ArchetypeBuilder<
    createBarrel.Affordance,
    createBarrel.Dimension
  > = new ArchetypeBuilder({
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
      frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: outline,
  });
  return builder.build(d.mass!, { rests: "steel" });
}

/**
 * Companion types and bands of {@link createBarrel}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The span between the two hands, the height they take the barrel at and its mass (#3468 N16).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mass is the empty barrel's; a band read only in search results is provisional.
 */
export namespace createBarrel {
  /** The kinds of barrel. */
  export type Kind = "steelDrum" | "keg";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["steelDrum", "keg"];

  /**
   * The affordance ids:
   *
   * - `left`, `right`: where the two hands take the barrel, on its top rim at `+X` and `-X`, `+Y` pointing out.
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
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    diameter: "m",
    height: "m",
    mass: "kg",
  };

  /** The steel drums read: Pipeline Packaging's DWG20459 tight head and DWG20443 open head. */
  export type Drum = "DWG20459" | "DWG20443";

  /** Each kind's models with their read height and mass, the default first: Pipeline Packaging's DWG20459, 34.75 in high and 38.4 lb, and DWG20443, 35 1/4 in high and 43 lb; a keg has one read model. */
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
        height: 34.75 * ArchetypeUnits.INCH,
        mass: 38.4 * ArchetypeUnits.POUND,
      },
      DWG20443: {
        height: 35.25 * ArchetypeUnits.INCH,
        mass: 43 * ArchetypeUnits.POUND,
      },
    },
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which barrel. */
    kind: Kind;

    /** A steel drum's model; drawn from the seed when absent. A keg has one read model. */
    model?: Drum;

    /** The model's id, unique in a scene; `barrel` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    steelDrum: {
      diameter: ArchetypeBand.metres(
        22.5 * ArchetypeUnits.INCH,
        22.5 * ArchetypeUnits.INCH,
        DRUM,
      ),
    },
    keg: {
      diameter: ArchetypeBand.metres(0.379, 0.383, KEG),
      height: ArchetypeBand.metres(0.597, 0.603, KEG),
      mass: ArchetypeBand.of("kg", 11.2, 12.1, KEG_MASS, true),
    },
  };
}
