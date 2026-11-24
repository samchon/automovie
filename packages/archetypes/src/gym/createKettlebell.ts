import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** What a competition kettlebell is commonly stated to measure. */
const BELL: string =
  "competition kettlebells as commonly stated for the sport (one size for every mass: 280 mm tall, a 210 mm body, a 35 mm handle); the rule's own text was not read, so the band is marked provisional";

/**
 * A kettlebell: a round body with a handle looped over its top, held in one
 * hand or both.
 *
 * It stands on the floor at the origin, the body a ball whose lowest point is
 * the origin, the handle a level bar along `X` at the top joined to the body by
 * two uprights. A competition bell has one size for every mass, so the mass
 * does not change the shape. `grip` is the handle's bar, taken from above.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The kettlebell.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createKettlebell(
  params: createKettlebell.IParams,
  seed?: number,
): AutoMovieArchetype<createKettlebell.Affordance, createKettlebell.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createKettlebell.Dimension> =
    new AutoMovieArchetypeDrawSession<createKettlebell.Dimension>(
      "kettlebell",
      createKettlebell.UNITS,
      seed,
      params,
    );
  const kind: createKettlebell.Kind = ArchetypeDraw.choice(
    "kettlebell",
    "kind",
    params.kind ?? "competition",
    createKettlebell.KINDS,
  );
  const d: Partial<Record<createKettlebell.Dimension, number>> =
    draw.dimensions(createKettlebell.BANDS[kind], createKettlebell.BANDS);
  const body: number = d.diameter! / 2;
  const slim: number = d.handleDiameter! / 2;
  const top: number = d.height! - slim;
  const half: number = createKettlebell.WINDOW / 2 + slim;
  const builder: AutoMovieArchetypeBuilder<
    createKettlebell.Affordance,
    createKettlebell.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "kettlebell",
    draw,
  });
  builder.ball("body", body, Vector3.create(0, body, 0), { color: "#2c2f33" });
  builder.rod(
    "handle",
    slim,
    Vector3.create(-half, top, 0),
    Vector3.create(half, top, 0),
    { color: "#b8bcc2" },
  );
  for (const side of [1, -1] as const)
    builder.rod(
      side === 1 ? "horn-left" : "horn-right",
      slim,
      Vector3.create(side * half, top, 0),
      Vector3.create(side * half, body, 0),
      { color: "#b8bcc2" },
    );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, top, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.handleDiameter!,
    length: createKettlebell.WINDOW,
  });
  return builder.build(d.mass!);
}

/** Companion types and bands of {@link createKettlebell}. */
export namespace createKettlebell {
  /** The kinds of kettlebell. */
  export type Kind = "competition";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["competition"];

  /**
   * The handle's clear width between its horns, metres. An estimate, not read
   * at a source: room for one hand, or two side by side with the thumbs over.
   */
  export const WINDOW: number = 0.12;

  /** The affordance ids: `grip`, the handle's level bar, taken from above. */
  export type Affordance = "grip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: from the floor to the handle's top.
   * - `diameter`: the body's.
   * - `handleDiameter`: the handle's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "handleDiameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    handleDiameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which kettlebell; `competition` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `kettlebell` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    competition: {
      height: AutoMovieArchetypeBand.metres(0.28, 0.28, BELL, true),
      diameter: AutoMovieArchetypeBand.metres(0.21, 0.21, BELL, true),
      handleDiameter: AutoMovieArchetypeBand.metres(0.033, 0.035, BELL, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        8,
        32,
        "an estimate of the range a gym carries, from the lightest common bell to the heaviest the sport lifts; the rule's text was not read",
        true,
      ),
    },
  };
}
