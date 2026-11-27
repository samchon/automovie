import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The rule that sizes a competition bench. */
const IPF: string =
  "International Powerlifting Federation, Technical Rules, the bench: not less than 1.22 m long, 29 to 32 cm wide, 42 to 45 cm from the floor to the top of its pad";

/** Constructs the bench archetype from its recipe. */
export namespace AutoMovieArchetypeBench {
/**
 * A flat weight bench: a padded top on four legs, lain on for a press or sat
 * on.
 *
 * It stands on the floor with the middle of its footprint at the origin, its
 * length along `Z`. `surface` is the top, lain on along its length; `seat` is
 * the same top at its `+Z` end, sat on facing `+Z`; `edge` is the middle of the
 * top's `+X` long side, which the upper back leans on across the bench (a hip
 * thrust) with the body out along `+X`.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The bench.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeBench.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBench.Affordance, AutoMovieArchetypeBench.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBench.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeBench.Dimension>(
      "bench",
      AutoMovieArchetypeBench.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeBench.Kind = ArchetypeDraw.choice(
    "bench",
    "kind",
    params.kind ?? "flat",
    AutoMovieArchetypeBench.KINDS,
  );
  const d: Partial<Record<AutoMovieArchetypeBench.Dimension, number>> = draw.dimensions(
    AutoMovieArchetypeBench.BANDS[kind],
    AutoMovieArchetypeBench.BANDS,
  );
  const length: number = d.length!;
  const width: number = d.width!;
  const height: number = d.height!;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeBench.Affordance,
    AutoMovieArchetypeBench.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "weight bench",
    draw,
  });
  builder.box(
    "pad",
    Vector3.create(width, AutoMovieArchetypeBench.PAD, length),
    Vector3.create(0, height - AutoMovieArchetypeBench.PAD / 2, 0),
    { color: "#2c2f33" },
  );
  for (const x of [1, -1] as const)
    for (const z of [1, -1] as const)
      builder.rod(
        `leg-${x === 1 ? "left" : "right"}-${z === 1 ? "front" : "back"}`,
        AutoMovieArchetypeBench.LEG,
        Vector3.create(
          x * (width / 2 - AutoMovieArchetypeBench.LEG),
          0,
          z * (length / 2 - AutoMovieArchetypeBench.INSET),
        ),
        Vector3.create(
          x * (width / 2 - AutoMovieArchetypeBench.LEG),
          height - AutoMovieArchetypeBench.PAD,
          z * (length / 2 - AutoMovieArchetypeBench.INSET),
        ),
        { color: "#b8bcc2" },
      );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: null,
    width,
    depth: length,
  });
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, height, length / 2 - AutoMovieArchetypeBench.SEAT / 2),
    ),
    extent: null,
    depth: AutoMovieArchetypeBench.SEAT,
    width,
  });
  builder.affordance({
    id: "edge",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(width / 2, height, 0),
    ),
    extent: null,
    depth: length,
  });
  return builder.build(d.mass!);
}

  /** The kinds of bench. */
  export type Kind = "flat";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["flat"];

  /** The pad's thickness, metres. An estimate, not read at a source. */
  export const PAD: number = 0.07;

  /** A leg's radius, metres. An estimate, not read at a source. */
  export const LEG: number = 0.025;

  /**
   * How far the legs stand in from the pad's ends, metres. An estimate, not
   * read at a source.
   */
  export const INSET: number = 0.15;

  /**
   * The depth of the top's end a sitter takes, metres. An estimate, not read at
   * a source.
   */
  export const SEAT: number = 0.4;

  /**
   * The affordance ids:
   *
   * - `surface`: the top, lain on along `Z`.
   * - `seat`: the top's `+Z` end, sat on facing `+Z`.
   * - `edge`: the middle of the top's `+X` long side, leaned on across the bench.
   */
  export type Affordance = "surface" | "seat" | "edge";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: the pad's, along `Z`.
   * - `width`: the pad's, along `X`.
   * - `height`: from the floor to the top of the pad.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "height" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    height: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bench; `flat` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `bench` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    flat: {
      length: AutoMovieArchetypeBand.metres(
        1.22,
        1.3,
        `${IPF}; the upper end is an estimate`,
        true,
      ),
      width: AutoMovieArchetypeBand.metres(0.29, 0.32, IPF),
      height: AutoMovieArchetypeBand.metres(0.42, 0.45, IPF),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        20,
        40,
        "an estimate; no maker's sheet was read",
        true,
      ),
    },
  };
}
