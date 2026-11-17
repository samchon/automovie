import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The cue's length read. */
const LENGTH: string =
  'McDermott carom cues: "Carom cues are 56" long (2" shorter than a traditional pool cue)" (https://www.mcdermottcue.com/crms07.php); Cuetec AVID Proof Black LTC: standard shaft length 29 in and butt length 29 in (https://www.cuetec.com/products/avid-cues-and-shafts/avid-proof-series-cues/avid-proof-black-ltc/)';

/** The weight read. */
const WEIGHT: string =
  'Viking support: "The standard weight range is 18 to 21oz." (https://www.vikingcue.com/support/); McDermott FAQ: 18 to 21 oz (https://www.mcdermottcue.com/faq.php)';

/**
 * A two-piece pool cue lying on the floor along `X`, its tip toward `+X`.
 *
 * The butt and the shaft are each half the cue's length, the butt at one of Viking's diameters and the shaft tapering from it to one of McDermott's tip diameters, each given or drawn from the seed. `butt` is the butt, a handle the back hand closes on, its diameter the aperture; `shaft` the shaft, a bar the bridge hand guides; `tip` the tip, the working point whose `+Y` runs out along the cue toward the ball.
 *
 * @param params The butt, the shaft and any dimension the author fixes.
 * @param seed The seed that draws the butt and the shaft when they are not given and every dimension left free inside its band; absent, the first of each and the middle of each band.
 * @returns The cue.
 * @throws {ArchetypeRefusal} For a butt Viking or a shaft McDermott does not list, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the cue lies, its halves and its three contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The makers' 58 in from McDermott's statement that a carom cue is 2 in shorter than a pool cue's, split as Cuetec's 29 in butt and 29 in shaft; the butt one of Viking's three diameters; the tip one of McDermott's four shaft diameters, each within the WPA's limit; the mass at the makers' standard weights.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the butt and the shaft, draw the dimensions, the butt and the shaft, then the three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The butt is one cylinder; the shaft is one tapered rod as two.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCue(
  params: createCue.IParams = {},
  seed?: number | string,
): Archetype<createCue.Affordance, createCue.Dimension> {
  const draw: ArchetypeDrawSession<createCue.Dimension> =
    new ArchetypeDrawSession<createCue.Dimension>(
      "cue",
      createCue.UNITS,
      seed,
      params,
    );
  const buttModel: {
    name: createCue.Butt | undefined;
    figures: Readonly<Partial<Record<createCue.Dimension, number>>>;
  } = draw.model<createCue.Butt>("buttSize", params.buttSize, createCue.BUTTS);
  const shaft: {
    name: createCue.Shaft | undefined;
    figures: Readonly<Partial<Record<createCue.Dimension, number>>>;
  } = draw.model<createCue.Shaft>("shaft", params.shaft, createCue.SHAFTS);
  const d: Record<createCue.Dimension, number> = {
    ...draw.dimensions(createCue.BANDS),
    butt: buttModel.figures.butt!,
    tip: shaft.figures.tip!,
  };
  const builder: ArchetypeBuilder<createCue.Affordance, createCue.Dimension> =
    new ArchetypeBuilder({
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
    frame: ArchetypeFrame.facing(v(back / 2, butt, 0), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    grip: "power",
    aperture: d.butt,
    length: half,
  });
  builder.affordance({
    id: "shaft",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(half / 2, butt, 0), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    grip: "precision",
    length: half,
  });
  builder.affordance({
    id: "tip",
    kind: "socket",
    direction: "along",
    frame: ArchetypeFrame.facing(v(half, butt, 0), v(1, 0, 0), v(0, 0, 1)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createCue}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Viking's butts and McDermott's shafts picked whole, one cited band per remaining dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two hands' places, the butt's size a grasp reads and the tip a stroke carries through the ball (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every size a hand or a stroke reads is a read model or a read band; no diameter between two listed is made.
 */
export namespace createCue {
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
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    butt: "m",
    tip: "m",
    mass: "kg",
  };

  /** Viking's butt diameters. */
  export type Butt = "standard" | "skinny" | "average";

  /** Each butt's diameter, metres, the default first: Viking's "standard butt diameter on all Viking cues measures a highly versatile and industry-standard 1.25"" (https://vikingcue.com/custom-materials-1), its "SKINNY" option "about 1.205"" and the "Average Standard Size of 1.295"" (https://www.vikingcue.com/new-skinny-cues-for-2016/). */
  export const BUTTS: Readonly<
    Record<Butt, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    standard: { butt: 1.25 * ArchetypeUnits.INCH },
    skinny: { butt: 1.205 * ArchetypeUnits.INCH },
    average: { butt: 1.295 * ArchetypeUnits.INCH },
  };

  /** McDermott's shaft tip diameters. */
  export type Shaft = "11.5mm" | "12mm" | "12.5mm" | "13mm";

  /** Each shaft's tip diameter, metres, the default first: McDermott's shaft overview's 11.5, 12, 12.5 and 13 mm (https://mcdermottcue.com/mcdermott_shaft_overview.php), each within WPA Recommended Equipment Specifications 17's 14 mm at most (https://wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf). */
  export const SHAFTS: Readonly<
    Record<Shaft, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "11.5mm": { tip: 11.5 * ArchetypeUnits.MILLIMETRE },
    "12mm": { tip: 12 * ArchetypeUnits.MILLIMETRE },
    "12.5mm": { tip: 12.5 * ArchetypeUnits.MILLIMETRE },
    "13mm": { tip: 13 * ArchetypeUnits.MILLIMETRE },
  };

  /** The parameters: the butt, the shaft, and any free dimension fixed to a value inside its band. */
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
    Record<Exclude<Dimension, "butt" | "tip">, IArchetypeBand>
  > = {
    length: ArchetypeBand.metres(
      58 * ArchetypeUnits.INCH,
      58 * ArchetypeUnits.INCH,
      LENGTH,
    ),
    mass: ArchetypeBand.of(
      "kg",
      18 * ArchetypeUnits.OUNCE,
      21 * ArchetypeUnits.OUNCE,
      WEIGHT,
    ),
  };
}
