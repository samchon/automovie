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
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeCleaningData } from "./internal/AutoMovieArchetypeCleaningData";

/** Constructs the cleaning archetype from its recipe. */
export namespace AutoMovieArchetypeCleaning {
/**
 * A thing a hand wipes or scrubs with: a cloth folded flat or a sponge.
 *
 * It lies flat on a surface centred over the origin. `grip` is the hold at its
 * middle, pinched for a cloth and closed round for a sponge, its thickness the
 * aperture; `face` its underside, facing down, the side that meets what is
 * wiped.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The thing.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeCleaning.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCleaning.Affordance, AutoMovieArchetypeCleaning.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeCleaning.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeCleaning.Dimension>(
      "cleaning",
      AutoMovieArchetypeCleaning.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeCleaning.Kind = ArchetypeDraw.choice(
    "cleaning",
    "kind",
    params.kind,
    AutoMovieArchetypeCleaning.KINDS,
  );
  const d: Record<AutoMovieArchetypeCleaning.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeCleaning.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeCleaning.Affordance,
    AutoMovieArchetypeCleaning.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: kind === "cloth" ? "fabric" : "foam",
    id: params.id,
    name: kind,
    draw,
  });
  builder.box(
    kind,
    AutoMovieEngineVector3.create(d.width, d.thickness, d.length),
    AutoMovieEngineVector3.create(0, d.thickness / 2, 0),
    { color: kind === "cloth" ? "#4f86c6" : "#f2d24b" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.upright(
      AutoMovieEngineVector3.create(0, d.thickness / 2, 0),
    ),
    extent: null,
    grip: kind === "cloth" ? "precision" : "power",
    aperture: d.thickness,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, 0, 0),
      AutoMovieEngineVector3.create(0, -1, 0),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  return builder.build(d.mass);
}

  /** The kinds: a cloth folded in four, a kitchen sponge. */
  export type Kind = "cloth" | "sponge";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["cloth", "sponge"];

  /**
   * The affordance ids:
   *
   * - `grip`: the hold at the middle.
   * - `face`: the underside, facing down.
   */
  export type Affordance = "grip" | "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `length`, `thickness`: the thing's as it lies.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "length" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    length: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which thing. */
    kind: Kind;

    /** The model's id, unique in a scene; `cleaning` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    cloth: {
      width: AutoMovieArchetypeBand.metres(
        0.15875,
        0.16,
        `${AutoMovieArchetypeCleaningData.CLOTH}: folded in four`,
      ),
      length: AutoMovieArchetypeBand.metres(
        0.15875,
        0.16,
        `${AutoMovieArchetypeCleaningData.CLOTH}: folded in four`,
      ),
      thickness: AutoMovieArchetypeBand.metres(
        0.012,
        0.012,
        `${AutoMovieArchetypeCleaningData.CLOTH}: four layers`,
      ),
      mass: AutoMovieArchetypeBand.of("kg", 0.019, 0.019, AutoMovieArchetypeCleaningData.CLOTH),
    },
    sponge: {
      width: AutoMovieArchetypeBand.metres(
        2.6 * AutoMovieArchetypeUnits.INCH,
        2.6 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeCleaningData.SPONGE,
      ),
      length: AutoMovieArchetypeBand.metres(
        4.4 * AutoMovieArchetypeUnits.INCH,
        4.4 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeCleaningData.SPONGE,
      ),
      thickness: AutoMovieArchetypeBand.metres(
        0.6 * AutoMovieArchetypeUnits.INCH,
        0.7 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeCleaningData.SPONGE,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.005,
        0.02,
        "the sponge's weight: the listings read do not give it",
        true,
      ),
    },
  };
}
