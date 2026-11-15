import { Vector3 } from "@automovie/engine";

import {
  ArchetypeUnits,
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The cue's length read. */
const LENGTH: string =
  "McDermott carom cues: \"Carom cues are 56\" long (2\" shorter than a traditional pool cue)\" (https://www.mcdermottcue.com/crms07.php); Cuetec AVID Proof Black LTC: standard shaft length 29 in and butt length 29 in (https://www.cuetec.com/products/avid-cues-and-shafts/avid-proof-series-cues/avid-proof-black-ltc/)";

/** The shaft read. */
const SHAFT: string =
  "McDermott shaft overview: Defy shafts 11.5 to 13.25 mm (https://mcdermottcue.com/mcdermott_shaft_overview.php); WPA Recommended Equipment Specifications 17: the tip at most 14 mm (https://wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf)";

/** The weight read. */
const WEIGHT: string =
  "Viking support: \"The standard weight range is 18 to 21oz.\" (https://www.vikingcue.com/support/); McDermott FAQ: 18 to 21 oz (https://www.mcdermottcue.com/faq.php)";

/** The butt's diameter read. */
const BUTT: string =
  "Viking: \"The \"SKINNY\" Option on a Viking Cue Butt measures out about 1.205\" thick ... and compared to the Average Standard Size of 1.295\" thickness\" (https://www.vikingcue.com/new-skinny-cues-for-2016/); \"the standard butt diameter on all Viking cues measures a highly versatile and industry-standard 1.25\"\" (https://vikingcue.com/custom-materials-1)";

/**
 * A two-piece pool cue lying on the floor along `X`, its tip toward `+X`.
 *
 * The butt and the shaft are each half the cue's length, the butt at the drawn diameter and the shaft tapering from it to its tip's diameter. `butt` is the butt, a handle the back hand closes on, its diameter the aperture; `shaft` the shaft, a bar the bridge hand guides; `tip` the tip, the working point whose `+Y` runs out along the cue toward the ball.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The cue.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the cue lies, its halves and its three contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The makers' 58 in from McDermott's statement that a carom cue is 2 in shorter than a pool cue's, split as Cuetec's 29 in butt and 29 in shaft; the butt at Viking's skinny to average standard diameters; the tip at McDermott's shaft diameters within the WPA's limit; the mass at the makers' standard weights.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the butt and the shaft, then the three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The butt is one cylinder; the shaft is one tapered rod as two.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCue(
  params: createCue.IParams = {},
  seed?: number | string,
): Archetype<createCue.Affordance, createCue.Dimension> {
  const d: Record<createCue.Dimension, number> = ArchetypeDraw.dimensions(
    "cue",
    createCue.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createCue.Affordance, createCue.Dimension> =
    new ArchetypeBuilder({
      archetype: "cue",
      id: params.id,
      name: "pool cue",
      dimensions: d,
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
  builder.rod("shaft-back", (butt + middle) / 2, v(0, butt, 0), v(half / 2, butt, 0), {
    color: "#e8d8b8",
  });
  builder.rod("shaft-front", (middle + tip) / 2, v(half / 2, butt, 0), v(half, butt, 0), {
    color: "#e8d8b8",
  });
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
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two hands' places, the butt's size a grasp reads and the tip a stroke carries through the ball (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every size a hand or a stroke reads is a read band.
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

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `cue` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(58 * ArchetypeUnits.INCH, 58 * ArchetypeUnits.INCH, LENGTH),
    butt: ArchetypeBand.metres(1.205 * ArchetypeUnits.INCH, 1.295 * ArchetypeUnits.INCH, BUTT),
    tip: ArchetypeBand.metres(0.0115, 0.01325, SHAFT),
    mass: ArchetypeBand.of("kg", 18 * ArchetypeUnits.OUNCE, 21 * ArchetypeUnits.OUNCE, WEIGHT),
  };
}
