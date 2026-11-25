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

/**
 * A squat rack: two uprights, each with a hook a barbell rests on.
 *
 * It stands on the floor with the middle of its footprint at the origin, the
 * uprights on either side of `X`, the hooks reaching toward `-Z`, where the
 * lifter stands. `rest` is the place between the two hooks where the bar's
 * middle lies, on the bar's axis, with `+Y` up.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The rack.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createRack(
  params: createRack.IParams,
  seed?: number,
): AutoMovieArchetype<createRack.Affordance, createRack.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createRack.Dimension> =
    new AutoMovieArchetypeDrawSession<createRack.Dimension>(
      "rack",
      createRack.UNITS,
      seed,
      params,
    );
  const kind: createRack.Kind = ArchetypeDraw.choice(
    "rack",
    "kind",
    params.kind ?? "squat",
    createRack.KINDS,
  );
  const d: Partial<Record<createRack.Dimension, number>> = draw.dimensions(
    createRack.BANDS[kind],
    createRack.BANDS,
  );
  const half: number = d.width! / 2;
  const builder: AutoMovieArchetypeBuilder<
    createRack.Affordance,
    createRack.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "squat rack",
    draw,
  });
  for (const side of [1, -1] as const) {
    const name: string = side === 1 ? "left" : "right";
    builder.box(
      `upright-${name}`,
      Vector3.create(createRack.POST, d.height!, createRack.POST),
      Vector3.create(side * half, d.height! / 2, 0),
      { color: "#5a5f66" },
    );
    builder.box(
      `hook-${name}`,
      Vector3.create(createRack.POST, createRack.LIP, createRack.HOOK),
      Vector3.create(
        side * half,
        d.rest! - createRack.SEAT - createRack.LIP / 2,
        -(createRack.POST + createRack.HOOK) / 2,
      ),
      { color: "#b8bcc2" },
    );
  }
  builder.affordance({
    id: "rest",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, d.rest!, -(createRack.POST + createRack.HOOK) / 2),
    ),
    extent: null,
    width: d.width!,
    depth: createRack.HOOK,
  });
  return builder.build(d.mass!);
}

/** Companion types and bands of {@link createRack}. */
export namespace createRack {
  /** The kinds of rack. */
  export type Kind = "squat";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["squat"];

  /** An upright's square section, metres. An estimate, not read at a source. */
  export const POST: number = 0.06;

  /**
   * A hook's reach before its upright, metres. An estimate, not read at a
   * source.
   */
  export const HOOK: number = 0.08;

  /** A hook's thickness, metres. An estimate, not read at a source. */
  export const LIP: number = 0.02;

  /**
   * How far a resting bar's axis lies above the hook's top, metres: half a 28
   * mm bar.
   */
  export const SEAT: number = 0.014;

  /**
   * The affordance ids: `rest`, where a bar laid on both hooks has its middle,
   * on the bar's axis, `+Y` up.
   */
  export type Affordance = "rest";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the uprights'.
   * - `width`: between the uprights' middles.
   * - `rest`: a resting bar's axis above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "width" | "rest" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    width: "m",
    rest: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which rack; `squat` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `rack` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    squat: {
      height: AutoMovieArchetypeBand.metres(
        1.8,
        2.3,
        "an estimate; no maker's sheet was read",
        true,
      ),
      width: AutoMovieArchetypeBand.metres(
        1.05,
        1.2,
        "an estimate: inside a barbell's 1.31 m between collars; no maker's sheet was read",
        true,
      ),
      rest: AutoMovieArchetypeBand.metres(
        0.9,
        1.6,
        "an estimate: from a bench press's rest to a tall lifter's shoulders; no maker's sheet was read",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        30,
        80,
        "an estimate; no maker's sheet was read",
        true,
      ),
    },
  };
}
