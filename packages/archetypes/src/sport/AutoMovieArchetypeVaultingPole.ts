import { AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeVaultingPoleData } from "./internal/AutoMovieArchetypeVaultingPoleData";

/** Constructs the vaulting pole archetype from its recipe. */
export namespace AutoMovieArchetypeVaultingPole {
/**
 * A vaulting pole: a long, smooth tube a vaulter runs with, plants in the box
 * and swings on (#3529).
 *
 * The pole stands on its plant end at the origin, its length along `+Y`. `tip`
 * is the plant end, its `+Y` pointing out of the end along the pole, so a
 * planting act puts it on the floor or in the box. The two hands hold it in two
 * bands near the top: `topGrip`, the upper hand's, and `lowerGrip`, the lower
 * hand's below it, each a `handle` along the pole whose sites name a hand's
 * place; `shaft` is the whole tube as one two-hand bar, for a carry or a
 * pick-up anywhere along it. `rating` is the maker's stiffness rating, the
 * vaulter's weight the pole is made for, kilograms.
 *
 * The pole bends as a chain of straight links on hinges (`bend1` up to
 * `bend<n-1>`), the arc from the plant end to the top hand's band cut into `n`
 * equal links: the topmost link, which carries both bands' top and the pole's
 * top end, is fixed in the model, and each hinge turns the link below it about
 * `+X`, riding the hinge above, so a positive travel bows the pole toward `+Z`,
 * away from the hands that take it from `-Z`, and a negative one toward `-Z`,
 * as a round tube bends either way; `tip` rides the lowest hinge. The links are
 * Godot's even-length tessellation of that arc (`TOLERANCE`, `STAGES`): halved
 * while longer than 0.2 m, at most five times. Each hinge travels the turn the
 * greatest curvature of the pinned elastica (`pinnedElastica`) whose chord has
 * shortened to `BREAK` of its arc, the deepest bend a fibreglass pole survives,
 * gives over one link.
 *
 * @param params The pole's series and any dimension the author fixes.
 * @param seed The seed that draws the series when it is not given and every
 *   dimension left free inside its band; absent, the first series and the
 *   middle of each band.
 * @returns The pole.
 * @throws {AutoMovieArchetypeRefusal} For a series UCS Spirit does not list
 *   with a length, or a fixed dimension outside its band; every band fits both
 *   grips on the shortest pole, so no other refusal is needed.
 */
export function create(
  params: AutoMovieArchetypeVaultingPole.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeVaultingPole.Affordance,
  AutoMovieArchetypeVaultingPole.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeVaultingPole.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeVaultingPole.Dimension>(
      "vaultingPole",
      AutoMovieArchetypeVaultingPole.UNITS,
      seed,
      params,
    );
  const series: {
    name: AutoMovieArchetypeVaultingPole.Series | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeVaultingPole.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeVaultingPole.Series>(
    "series",
    params.series,
    AutoMovieArchetypeVaultingPole.SERIES,
  );
  const d: Record<AutoMovieArchetypeVaultingPole.Dimension, number> = {
    ...draw.dimensions(AutoMovieArchetypeVaultingPole.BANDS),
    length: series.figures.length!,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeVaultingPole.Affordance,
    AutoMovieArchetypeVaultingPole.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `vaulting pole, ${series.name} series`,
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const length: number = d.length;
  const radius: number = d.diameter / 2;
  const top: number = length - d.hold;

  // The chain: the arc from the plant end to the top hand's band halved
  // while a link is longer than `TOLERANCE`, at most `STAGES` times, the
  // topmost link running on to the pole's top.
  let n: number = 1;
  for (
    let stage: number = 0;
    top / n > AutoMovieArchetypeVaultingPole.TOLERANCE && stage < AutoMovieArchetypeVaultingPole.STAGES;
    stage++
  )
    n *= 2;
  const link: number = top / n;
  const deepest: number = AutoMovieEngineMath.pinnedElasticaCurvature(
    AutoMovieEngineMath.pinnedElasticaParameter(AutoMovieArchetypeVaultingPole.BREAK),
    top,
  );
  const at: (k: number) => number = (k: number): number => k * link;
  for (let k: number = 0; k < n; k++)
    builder.rod(
      `link${k}`,
      radius,
      v(0, at(k), 0),
      v(0, k === n - 1 ? length : at(k + 1), 0),
      { color: "#d8c23a" },
    );
  const hinge: (k: number) => AutoMovieArchetypeVaultingPole.Bend = (
    k: number,
  ): AutoMovieArchetypeVaultingPole.Bend => `bend${k}`;
  for (let k: number = n - 1; k >= 1; k--)
    builder.affordance({
      id: hinge(k),
      kind: "hinge",
      extent: null,
      travel: (deepest * link) / AutoMovieArchetypeUnits.DEGREE,
      reverse: (deepest * link) / AutoMovieArchetypeUnits.DEGREE,
      parts: [`link${k - 1}`],
      ...(k < n - 1 ? { rides: hinge(k + 1) } : {}),
      frame: AutoMovieArchetypeFrame.facing(
        v(0, at(k), 0),
        v(1, 0, 0),
        v(0, 1, 0),
      ),
    });
  // The hinge that carries a point of the pole: the one at the top of the
  // link it lies on, none on the topmost.
  const carrier: (y: number) => AutoMovieArchetypeVaultingPole.Bend | undefined = (
    y: number,
  ): AutoMovieArchetypeVaultingPole.Bend | undefined => {
    const k: number = Math.floor(y / link);
    return k >= n - 1 ? undefined : hinge(k + 1);
  };
  const rides: (y: number) => AutoMovieArchetypeVaultingPole.IRidden = (
    y: number,
  ): AutoMovieArchetypeVaultingPole.IRidden => {
    const by: AutoMovieArchetypeVaultingPole.Bend | undefined = carrier(y);
    return by === undefined ? {} : { rides: by };
  };

  // The plant end, facing out of the pole's bottom.
  builder.affordance({
    id: "tip",
    kind: "surface",
    materialPart: "link0",
    direction: "along",
    ...rides(0),
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });

  // The two hands' bands near the top, each a handle along the pole taken from -Z.
  const band = (
    id: "topGrip" | "lowerGrip" | "shaft",
    middle: number,
    run: number,
  ): void => {
    builder.affordance({
      id,
      kind: id === "shaft" ? "bar" : "handle",
      ...(id === "shaft"
        ? {}
        : {
            materialPart: `link${Math.min(n - 1, Math.floor(middle / link))}`,
          }),
      symmetry: "round",
      ...rides(middle),
      frame: AutoMovieArchetypeFrame.facing(
        v(0, middle, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: id === "shaft" ? "two-hand" : "power",
      aperture: d.diameter,
      length: run,
    });
  };
  band("topGrip", top - AutoMovieArchetypeVaultingPole.HAND / 2, AutoMovieArchetypeVaultingPole.HAND);
  band(
    "lowerGrip",
    top - d.spacing - AutoMovieArchetypeVaultingPole.HAND / 2,
    AutoMovieArchetypeVaultingPole.HAND,
  );
  band("shaft", length / 2, length);
  return builder.build(d.mass);
}

  /**
   * A hand's breadth along the pole, metres: the run of one grip band. An
   * estimate, not read at a source.
   */
  export const HAND: number = 0.1;

  /**
   * The shortest chord a bending pole reaches, a share of its arc from the
   * plant end to the top hand: a fibreglass pole breaks when bent further than
   * to about 60 % of its length (Linthorne 2000, Sports Engineering 3:205-218,
   * "Flexible-pole model").
   */
  export const BREAK: number = 0.6;

  /**
   * The longest link of the chain, metres: Godot's even-length tessellation
   * halves a segment while it is longer than this (`Curve3D`'s
   * `tessellate_even_length`, `tolerance_length` 0.2; godotengine/godot
   * `scene/resources/curve.cpp`, `_bake_segment3d_even_length`, at
   * eabb9a63d4bc70cd87e50d6af152f841ea549972, MIT, "Copyright (c) 2014-present
   * Godot Engine contributors").
   */
  export const TOLERANCE: number = 0.2;

  /**
   * The most times the chain's arc is halved: the same tessellation's
   * `max_stages`, 5.
   */
  export const STAGES: number = 5;

  /** A hinge of the chain, by its place from the plant end. */
  export type Bend = `bend${number}`;

  /**
   * The affordance ids:
   *
   * - `tip`: the plant end at the bottom, facing down along the pole.
   * - `topGrip`: the upper hand's band near the top, taken from `-Z`.
   * - `lowerGrip`: the lower hand's band, `spacing` below the upper.
   * - `shaft`: the whole pole as one two-hand bar.
   * - `bend<k>`: the chain's hinges, the `k`th link's top from the plant end.
   */
  export type Affordance = "tip" | "topGrip" | "lowerGrip" | "shaft" | Bend;

  /** What rides a hinge: the hinge, none on the topmost link. */
  export interface IRidden {
    /** The hinge; absent on the topmost link. */
    rides?: Bend;
  }

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the plant end to the top.
   * - `diameter`: the tube's.
   * - `hold`: the upper hand's top edge below the pole's top.
   * - `spacing`: the lower hand below the upper.
   * - `mass`: kilograms.
   * - `rating`: the maker's stiffness rating, kilograms: the vaulter's weight the
   *   pole is made for.
   */
  export type Dimension =
    | "length"
    | "diameter"
    | "hold"
    | "spacing"
    | "mass"
    | "rating";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    hold: "m",
    spacing: "m",
    mass: "kg",
    rating: "kg",
  };

  /** UCS Spirit's series read with a length. */
  export type Series = "235" | "305" | "520";

  /**
   * Each series' length, metres, the default first: UCS Spirit's poles run
   * "from 7 ft 8 in (the 235 series) to 17 ft 1 in (the 520 series)"
   * (https://ucsspirit.com/products/ucs-spirit-vaulting-poles), and its 305
   * series pole is 10 ft, rated 90 lb (https://spiritpoles.com/305-40-10-90lb).
   * The full series list was not readable, so only these three are built.
   */
  export const SERIES: Readonly<
    Record<Series, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "235": {
      length:
        7 * AutoMovieArchetypeUnits.FOOT + 8 * AutoMovieArchetypeUnits.INCH,
    },
    "305": {
      length: 10 * AutoMovieArchetypeUnits.FOOT,
      rating: 90 * AutoMovieArchetypeUnits.POUND,
    },
    "520": {
      length: 17 * AutoMovieArchetypeUnits.FOOT + AutoMovieArchetypeUnits.INCH,
    },
  };

  /**
   * The parameters: the series, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "length">, number>
  > {
    /** UCS Spirit's series; drawn from the seed when absent. */
    series?: Series;

    /** The model's id, unique in a scene; `vaultingPole` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "length">, IAutoMovieArchetypeBand>
  > = {
    diameter: AutoMovieArchetypeBand.metres(
      0.03,
      0.045,
      `${AutoMovieArchetypeVaultingPoleData.RULE}; an estimate of a fibreglass pole's outer diameter; the UCS Spirit pages read give no diameter`,
      true,
    ),
    hold: AutoMovieArchetypeBand.metres(
      0.1,
      0.3,
      "the upper hand held a little below the top, a vaulter's habit; an estimate, not read at a source",
      true,
    ),
    spacing: AutoMovieArchetypeBand.metres(
      0.45,
      0.65,
      "the hands about shoulder width apart along the pole, a vaulter's habit; an estimate, not read at a source",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      1.5,
      3,
      "an estimate of a fibreglass pole of these lengths; the UCS Spirit pages read give no mass",
      true,
    ),
    rating: AutoMovieArchetypeBand.of(
      "kg",
      55 * AutoMovieArchetypeUnits.POUND,
      220 * AutoMovieArchetypeUnits.POUND,
      "UCS Spirit rates its poles from 55 to 220 lb (https://ucsspirit.com/products/ucs-spirit-vaulting-poles)",
      true,
    ),
  };
}
