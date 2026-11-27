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

/** Constructs the load archetype from its recipe. */
export namespace AutoMovieArchetypeLoad {
/**
 * A heavy load moved by hand: a crate with two grip holes, or a sack.
 *
 * The load lies on the floor at the origin, its length along `+X`. A crate is
 * held by the grip holes in the middle of its two short ends, a sack by a hand
 * closed on each end at half its thickness; both have a top another load rests
 * on.
 *
 * @param params The kind, the crate's contents and any dimension the author
 *   fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The load.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
 *   contents heavier than `createLoad.CONTENTS`, or any contents in a sack.
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
  if (!(load >= 0 && load <= most))
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
        kind === "sack"
          ? "a sack's mass is its own; it takes no contents"
          : `contents of ${load} kg could take a crate above ${AutoMovieArchetypeLoad.LIMIT} kg`,
      fix: "give contents that keep the load within what a person lifts",
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

  /** The kinds of load. */
  export type Kind = "crate" | "sack";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["crate", "sack"];

  /**
   * The greatest mass with contents, kilograms: HSE INDG143 Figure 1
   * (https://www.hse.gov.uk/pubns/indg143.pdf).
   */
  export const LIMIT: number = 25;

  /**
   * The greatest contents of a crate, kilograms: the limit less the heaviest
   * empty crate, so the bound does not depend on the seed.
   */
  export const CONTENTS: number = 22.5;

  /**
   * The affordance ids:
   *
   * - `left`, `right`: where the two hands hold the load, at its `+X` and `-X`
   *   ends.
   * - `top`: the upper face, on which another load rests.
   */
  export type Affordance = "left" | "right" | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `height`, `depth`: along `+X`, `+Y` and `+Z`.
   * - `mass`: the empty crate or the whole sack, kilograms.
   */
  export type Dimension = "length" | "height" | "depth" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    height: "m",
    depth: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, the contents, and any free dimension fixed to a
   * value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which load. */
    kind: Kind;

    /** The model's id, unique in a scene; `load` when absent. */
    id?: string;

    /**
     * The mass of a crate's contents, kilograms, up to `CONTENTS`; empty when
     * absent. A sack takes none.
     */
    load?: number;
  }

  /** The band of each free dimension, by kind. */
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
