import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The cue's length read. */
const LENGTH: string =
  'McDermott carom cues: "Carom cues are 56" long (2" shorter than a traditional pool cue)" (https://www.mcdermottcue.com/crms07.php); Cuetec AVID Proof Black LTC: standard shaft length 29 in and butt length 29 in (https://www.cuetec.com/products/avid-cues-and-shafts/avid-proof-series-cues/avid-proof-black-ltc/)';

/** The weight read. */
const WEIGHT: string =
  'Viking support: "The standard weight range is 18 to 21oz." (https://www.vikingcue.com/support/); McDermott FAQ: 18 to 21 oz (https://www.mcdermottcue.com/faq.php)';

/** Canonical producer and authoring contract for Cue. */
export namespace AutoMovieArchetypeCue {
  /**
   * A two-piece pool cue lying on the floor along `X`, its tip toward `+X`.
   *
   * The butt and the shaft are each half the cue's length, the butt at one of
   * Viking's diameters and the shaft tapering from it to one of McDermott's tip
   * diameters, each given or drawn from the seed. `butt` is the butt, a handle
   * the back hand closes on, its diameter the aperture; `shaft` the shaft, a bar
   * the bridge hand guides; `tip` the tip, the working point whose `+Y` runs out
   * along the cue toward the ball.
   *
   * @param params The butt, the shaft and any dimension the author fixes.
   * @param seed The seed that draws the butt and the shaft when they are not
   *   given and every dimension left free inside its band; absent, the first of
   *   each and the middle of each band.
   * @returns The cue.
   * @throws {AutoMovieArchetypeRefusal} For a butt Viking or a shaft McDermott
   *   does not list, or a fixed dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeCue.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeCue.Affordance, AutoMovieArchetypeCue.Dimension> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeCue.Dimension> =
      new AutoMovieArchetypeDrawSession<AutoMovieArchetypeCue.Dimension>(
        "cue",
        AutoMovieArchetypeCue.UNITS,
        seed,
        params,
      );
    const buttModel: {
      name: AutoMovieArchetypeCue.Butt | undefined;
      figures: Readonly<Partial<Record<AutoMovieArchetypeCue.Dimension, number>>>;
    } = draw.model<AutoMovieArchetypeCue.Butt>("buttSize", params.buttSize, AutoMovieArchetypeCue.BUTTS);
    const shaft: {
      name: AutoMovieArchetypeCue.Shaft | undefined;
      figures: Readonly<Partial<Record<AutoMovieArchetypeCue.Dimension, number>>>;
    } = draw.model<AutoMovieArchetypeCue.Shaft>("shaft", params.shaft, AutoMovieArchetypeCue.SHAFTS);
    const d: Record<AutoMovieArchetypeCue.Dimension, number> = {
      ...draw.dimensions(AutoMovieArchetypeCue.BANDS),
      butt: buttModel.figures.butt!,
      tip: shaft.figures.tip!,
    };
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCue.Affordance,
      AutoMovieArchetypeCue.Dimension
    > = new AutoMovieArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: `pool cue, ${buttModel.name} butt, ${shaft.name} shaft`,
      draw,
    });
    const v: typeof Vector3.create = Vector3.create;
    const butt: number = d.butt / 2;
    const half: number = d.length / 2;
    const back: number = -half;
    const tip: number = d.tip / 2;
    const middle: number = (butt + tip) / 2;
    builder.rod("butt", butt, v(back, butt, 0), v(0, butt, 0), {
      color: "#3b2414",
    });
    builder.rod(
      "shaft-back",
      (butt + middle) / 2,
      v(0, butt, 0),
      v(half / 2, butt, 0),
      {
        color: "#e8d8b8",
      },
    );
    builder.rod(
      "shaft-front",
      (middle + tip) / 2,
      v(half / 2, butt, 0),
      v(half, butt, 0),
      {
        color: "#e8d8b8",
      },
    );
    builder.affordance({
      id: "butt",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(back / 2, butt, 0),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.butt,
      length: half,
    });
    builder.affordance({
      id: "shaft",
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(half / 2, butt, 0),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "precision",
      length: half,
    });
    builder.affordance({
      id: "tip",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        v(half, butt, 0),
        v(1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
    });
    return builder.build(d.mass);
  }
  /**
   * The affordance ids:
   *
   * - `butt`: the butt, a handle.
   * - `shaft`: the shaft, a bar the bridge guides.
   * - `tip`: the tip, the working point, `+Y` along the cue.
   */
  export type Affordance = "butt" | "shaft" | "tip";

  /**
   * The free dimensions:
   *
   * - `length`: the whole cue, metres.
   * - `butt`: the butt's diameter, metres.
   * - `tip`: the tip's diameter, metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "butt" | "tip" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    butt: "m",
    tip: "m",
    mass: "kg",
  };

  /** Viking's butt diameters. */
  export type Butt = "standard" | "skinny" | "average";

  /**
   * Each butt's diameter, metres, the default first: Viking's "standard butt
   * diameter on all Viking cues measures a highly versatile and
   * industry-standard 1.25"" (https://vikingcue.com/custom-materials-1), its
   * "SKINNY" option "about 1.205"" and the "Average Standard Size of 1.295""
   * (https://www.vikingcue.com/new-skinny-cues-for-2016/).
   */
  export const BUTTS: Readonly<
    Record<Butt, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    standard: { butt: 1.25 * AutoMovieArchetypeUnits.INCH },
    skinny: { butt: 1.205 * AutoMovieArchetypeUnits.INCH },
    average: { butt: 1.295 * AutoMovieArchetypeUnits.INCH },
  };

  /** McDermott's shaft tip diameters. */
  export type Shaft = "11.5mm" | "12mm" | "12.5mm" | "13mm";

  /**
   * Each shaft's tip diameter, metres, the default first: McDermott's shaft
   * overview's 11.5, 12, 12.5 and 13 mm
   * (https://mcdermottcue.com/mcdermott_shaft_overview.php), each within WPA
   * Recommended Equipment Specifications 17's 14 mm at most
   * (https://wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf).
   */
  export const SHAFTS: Readonly<
    Record<Shaft, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "11.5mm": { tip: 11.5 * AutoMovieArchetypeUnits.MILLIMETRE },
    "12mm": { tip: 12 * AutoMovieArchetypeUnits.MILLIMETRE },
    "12.5mm": { tip: 12.5 * AutoMovieArchetypeUnits.MILLIMETRE },
    "13mm": { tip: 13 * AutoMovieArchetypeUnits.MILLIMETRE },
  };

  /**
   * The parameters: the butt, the shaft, and any free dimension fixed to a
   * value inside its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "butt" | "tip">, number>
  > {
    /** Viking's butt size, which sets `butt`; drawn from the seed when absent. */
    buttSize?: Butt;

    /** McDermott's shaft; drawn from the seed when absent. */
    shaft?: Shaft;

    /** The model's id, unique in a scene; `cue` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "butt" | "tip">, IAutoMovieArchetypeBand>
  > = {
    length: AutoMovieArchetypeBand.metres(
      58 * AutoMovieArchetypeUnits.INCH,
      58 * AutoMovieArchetypeUnits.INCH,
      LENGTH,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      18 * AutoMovieArchetypeUnits.OUNCE,
      21 * AutoMovieArchetypeUnits.OUNCE,
      WEIGHT,
    ),
  };
}
