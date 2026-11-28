import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

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
import { AutoMovieArchetypeBarrelData } from "./internal/AutoMovieArchetypeBarrelData";

/** Constructs an upright empty steel drum or beer keg with two rim grips. */
export namespace AutoMovieArchetypeBarrel {
/**
 * Build an upright empty barrel with its axis along model `+Y`.
 *
 * The steel drum is 22.5 inches across and its chosen drawing supplies
 * height and mass together. The keg uses bands for all three dimensions.
 *
 * @param params Kind, optional drum model, scene ID and applicable
 *   fixed values. The ID defaults to `barrel`.
 * @param seed Numeric seed for omitted values. Without it the
 *   drum defaults to `DWG20459` and the keg uses its band midpoints.
 * @returns The barrel with opposed top rim grips and an upward stacking
 *   surface.
 * @throws {AutoMovieArchetypeRefusal} If a variant, model or fixed
 *   dimension is inadmissible.
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
    AutoMovieEngineVector3.create(0, 0, 0),
    AutoMovieEngineVector3.create(0, height, 0),
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
        AutoMovieEngineVector3.create(sign * radius, height, 0),
        AutoMovieEngineVector3.create(sign, 0, 0),
        AutoMovieEngineVector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "two-hand",
    });
  const outline: IAutoMovieVector3[] = [];
  for (let k: number = 0; k < SIDES; k++) {
    const angle: number = (2 * Math.PI * k) / SIDES;
    outline.push(
      AutoMovieEngineVector3.create(radius * Math.cos(angle), 0, radius * Math.sin(angle)),
    );
  }
  builder.affordance({
    id: "top",
    kind: "stack-top",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, height, 0)),
    extent: outline,
  });
  return builder.build(d.mass!, { rests: "steel" });
}

  /** Selects a 55 gallon steel drum or 50 litre keg proxy. */
  export type Kind = "steelDrum" | "keg";

  /** Barrel kinds accepted by `create`. */
  export const KINDS: readonly Kind[] = ["steelDrum", "keg"];

  /**
   * `left` and `right` lie on the top rim at `+X` and `-X` with outward grip normals. `top` is the upward stacking surface.
   */
  export type Affordance = "left" | "right" | "top";

  /** Outside diameter and height in metres, and empty mass in kilograms. */
  export type Dimension = "diameter" | "height" | "mass";

  /** Metres for diameter and height, kilograms for empty mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    height: "m",
    mass: "kg",
  };

  /** Pipeline Packaging drawing IDs for the tight-head and open-head drums. */
  export type Drum = "DWG20459" | "DWG20443";

  /**
   * Paired heights and masses from DWG20459 and DWG20443. The first entry is the seedless default.
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
   * Barrel kind, optional scene ID, steel drum model and applicable finite dimensions.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects steel drum or keg construction and dimension admission. */
    kind: Kind;

    /**
     * Optional steel drum model. The keg takes its dimensions from its bands.
     */
    model?: Drum;

    /** Scene object ID, defaulting to `barrel`. */
    id?: string;
  }

  /**
   * The steel drum's fixed diameter and the keg's diameter, height and mass ranges.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    steelDrum: {
      diameter: AutoMovieArchetypeBand.metres(
        22.5 * AutoMovieArchetypeUnits.INCH,
        22.5 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeBarrelData.DRUM,
      ),
    },
    keg: {
      diameter: AutoMovieArchetypeBand.metres(0.379, 0.383, AutoMovieArchetypeBarrelData.KEG),
      height: AutoMovieArchetypeBand.metres(0.597, 0.603, AutoMovieArchetypeBarrelData.KEG),
      mass: AutoMovieArchetypeBand.of("kg", 11.2, 12.1, AutoMovieArchetypeBarrelData.KEG_MASS, true),
    },
  };
}

/*
 * How many sides the top's outline has.
 */
const SIDES: number = 16;

/*
 * The readable name of each kind.
 */
const NAMES: Readonly<Record<AutoMovieArchetypeBarrel.Kind, string>> = {
  steelDrum: "steel drum",
  keg: "keg",
};
