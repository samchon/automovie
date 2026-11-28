import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeLoadData } from "./internal/AutoMovieArchetypeLoadData";

/**
 * Constructs a crate or sack proxy with paired end grips and a stacking surface.
 */
export namespace AutoMovieArchetypeLoad {
/**
 * Build a floor-standing rectangular load with its length along X.
 *
 * Crate grip frames lie 0.03 metres below the top at each short end.
 * Sack grip frames use half height. `top` describes the solid upper face.
 *
 * @param params Kind, optional scene ID, finite dimensions and optional
 *   crate contents in kilograms. The ID defaults to `load`.
 * @param seed Numeric seed for omitted dimensions. Omit it for band midpoints.
 * @returns The load's geometry, local contacts and total modeled mass.
 * @throws {AutoMovieArchetypeRefusal} If a kind, fixed dimension or
 *   contents mass is inadmissible.
 */
export function create(
  params: AutoMovieArchetypeLoad.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLoad.Affordance, AutoMovieArchetypeLoad.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeLoad.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeLoad.Dimension>(
      "load",
      AutoMovieArchetypeLoad.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeLoad.Kind = ArchetypeDraw.choice(
    "load",
    "kind",
    params.kind,
    AutoMovieArchetypeLoad.KINDS,
  );
  const d: Record<AutoMovieArchetypeLoad.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeLoad.BANDS[kind],
    AutoMovieArchetypeLoad.BANDS,
  );
  const load: number = params.load ?? 0;
  const most: number = kind === "sack" ? 0 : AutoMovieArchetypeLoad.CONTENTS;
  const finite: boolean = Number.isFinite(load);
  if (!(finite && load >= 0 && load <= most))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "load",
      axis: "load",
      value: load,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: most,
        unit: "kg",
      },
      reason:
        !finite
          ? "contents mass must be a finite number"
          : kind === "sack"
            ? "a sack already represents its full mass"
            : `contents mass must be between 0 and ${most} kg`,
      fix:
        kind === "sack"
          ? "omit load or set it to zero"
          : `set load to a number between 0 and ${most} kg`,
    });
  const { length, height, depth }: Record<AutoMovieArchetypeLoad.Dimension, number> = d;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeLoad.Affordance,
    AutoMovieArchetypeLoad.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind,
    draw,
  });
  builder.box(
    kind,
    AutoMovieEngineVector3.create(length, height, depth),
    AutoMovieEngineVector3.create(0, height / 2, 0),
    { color: kind === "crate" ? "#8a8f96" : "#c9bfa5" },
  );

  // A hand at each end: at a crate's grip hole under its top lip, or closed on a sack's end at half its thickness.
  const hold: number = kind === "crate" ? height - 0.03 : height / 2;
  for (const [id, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create((sign * length) / 2, hold, 0),
        AutoMovieEngineVector3.create(sign, 0, 0),
        AutoMovieEngineVector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "two-hand",
      length: kind === "crate" ? 0.12 : depth,
    });
  builder.affordance({
    id: "top",
    kind: "stack-top",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, height, 0)),
    extent: [
      AutoMovieEngineVector3.create(-length / 2, 0, -depth / 2),
      AutoMovieEngineVector3.create(length / 2, 0, -depth / 2),
      AutoMovieEngineVector3.create(length / 2, 0, depth / 2),
      AutoMovieEngineVector3.create(-length / 2, 0, depth / 2),
    ],
  });
  return builder.build(d.mass + load);
}

  /** Selects crate or sack geometry, grip height and mass rules. */
  export type Kind = "crate" | "sack";

  /** Load kinds accepted by `create`. */
  export const KINDS: readonly Kind[] = ["crate", "sack"];

  /**
   * Maximum total mass of the modeled load, in kilograms.
   *
   * @see https://www.hse.gov.uk/pubns/indg143.pdf
   */
  export const LIMIT: number = 25;

  /**
   * Maximum crate contents in kilograms. Adding 22.5 kilograms to the heaviest 2.5 kilogram crate gives the modeled total limit.
   */
  export const CONTENTS: number = 22.5;

  /**
   * `left` and `right` are the `+X` and `-X` end grips. `top` covers the rectangular upper face.
   */
  export type Affordance = "left" | "right" | "top";

  /**
   * Length along X, height along Y and depth along Z in metres. `mass` is the base crate or whole sack mass in kilograms.
   */
  export type Dimension = "length" | "height" | "depth" | "mass";

  /** Metres for model extents and kilograms for base load mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    height: "m",
    depth: "m",
    mass: "kg",
  };

  /** Load kind, optional scene ID, fixed band dimensions and contents mass. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Chooses crate or sack dimensions and extra contents admission. */
    kind: Kind;

    /** Scene object ID, defaulting to `load`. */
    id?: string;

    /**
     * Finite extra mass between 0 and 22.5 kilograms for a crate. A sack admits only zero. Defaults to zero.
     */
    load?: number;
  }

  /**
   * Shape and base mass intervals per load kind. Extra contents contribute to body mass separately.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    crate: {
      length: AutoMovieArchetypeBand.metres(0.6, 0.6, AutoMovieArchetypeLoadData.EURO, true),
      depth: AutoMovieArchetypeBand.metres(0.4, 0.4, AutoMovieArchetypeLoadData.EURO, true),
      height: AutoMovieArchetypeBand.metres(0.1475, 0.28, AutoMovieArchetypeLoadData.EURO, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1.5,
        2.5,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    sack: {
      length: AutoMovieArchetypeBand.metres(0.41, 0.413, AutoMovieArchetypeLoadData.SACK, true),
      depth: AutoMovieArchetypeBand.metres(0.41, 0.413, AutoMovieArchetypeLoadData.SACK, true),
      height: AutoMovieArchetypeBand.metres(0.15, 0.15, AutoMovieArchetypeLoadData.SACK, true),
      mass: AutoMovieArchetypeBand.of("kg", 25, 25, AutoMovieArchetypeLoadData.SACK, true),
    },
  };
}
