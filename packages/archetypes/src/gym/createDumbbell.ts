import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDensity,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * A dumbbell: a short handle with a steel head at each end, held in one hand.
 *
 * It lies along `X` with the handle's middle at the origin. Each head is a
 * solid steel cylinder as thick as its own radius times `SQUAT`, sized so the
 * two heads and the handle weigh the dumbbell's mass, so a heavier one is
 * larger. `grip` is the handle, taken from the `-Z` side.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The dumbbell.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createDumbbell(
  params: createDumbbell.IParams,
  seed?: number | string,
): AutoMovieArchetype<createDumbbell.Affordance, createDumbbell.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createDumbbell.Dimension> =
    new AutoMovieArchetypeDrawSession<createDumbbell.Dimension>(
      "dumbbell",
      createDumbbell.UNITS,
      seed,
      params,
    );
  const kind: createDumbbell.Kind = ArchetypeDraw.choice(
    "dumbbell",
    "kind",
    params.kind ?? "fixed",
    createDumbbell.KINDS,
  );
  const d: Partial<Record<createDumbbell.Dimension, number>> = draw.dimensions(
    createDumbbell.BANDS[kind],
    createDumbbell.BANDS,
  );
  const half: number = d.handle! / 2;
  const slim: number = d.diameter! / 2;

  // Each head's radius from its share of the mass: a cylinder of steel as
  // thick as SQUAT radii.
  const steel: number =
    Math.max(
      0,
      d.mass! -
        AutoMovieArchetypeDensity.STEEL * Math.PI * slim * slim * d.handle!,
    ) / 2;
  const radius: number = Math.max(
    slim,
    Math.cbrt(
      steel /
        (AutoMovieArchetypeDensity.STEEL * Math.PI * createDumbbell.SQUAT),
    ),
  );
  const builder: AutoMovieArchetypeBuilder<
    createDumbbell.Affordance,
    createDumbbell.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "dumbbell",
    draw,
  });
  builder.rod(
    "handle",
    slim,
    Vector3.create(-half, 0, 0),
    Vector3.create(half, 0, 0),
    { color: "#b8bcc2" },
  );
  for (const side of [1, -1] as const)
    builder.rod(
      side === 1 ? "head-left" : "head-right",
      radius,
      Vector3.create(side * half, 0, 0),
      Vector3.create(side * (half + createDumbbell.SQUAT * radius), 0, 0),
      { color: "#2c2f33" },
    );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.diameter!,
    length: d.handle!,
  });
  return builder.build(d.mass!);
}

/** Companion types and bands of {@link createDumbbell}. */
export namespace createDumbbell {
  /** The kinds of dumbbell. */
  export type Kind = "fixed";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["fixed"];

  /** A head's thickness in its own radii. An estimate, not read at a source. */
  export const SQUAT: number = 0.8;

  /**
   * The affordance ids: `grip`, the handle between the heads, taken from the
   * `-Z` side.
   */
  export type Affordance = "grip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `handle`: the handle's length between the heads.
   * - `diameter`: the handle's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "handle" | "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    handle: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which dumbbell; `fixed` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `dumbbell` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    fixed: {
      handle: AutoMovieArchetypeBand.metres(
        0.12,
        0.14,
        "an estimate: a handle a little longer than a hand's breadth; no maker's sheet was read",
        true,
      ),
      diameter: AutoMovieArchetypeBand.metres(
        0.028,
        0.034,
        "an estimate: from a barbell's 28 mm grip to a thick rubber dumbbell's handle; no maker's sheet was read",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1,
        40,
        "an estimate of the range a gym's rack carries; no maker's sheet was read",
        true,
      ),
    },
  };
}
