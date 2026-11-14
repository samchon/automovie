import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Metres in an inch. */
const INCH: number = 0.0254;

/** The cue's length read. */
const LENGTH: string =
  "McDermott carom cues: \"Carom cues are 56\" long (2\" shorter than a traditional pool cue)\" (https://www.mcdermottcue.com/crms07.php); Cuetec AVID Proof Black LTC: standard shaft length 29 in and butt length 29 in (https://www.cuetec.com/products/avid-cues-and-shafts/avid-proof-series-cues/avid-proof-black-ltc/)";

/** The shaft read. */
const SHAFT: string =
  "McDermott shaft overview: Defy shafts 11.5 to 13.25 mm (https://mcdermottcue.com/mcdermott_shaft_overview.php); WPA Recommended Equipment Specifications 17: the tip at most 14 mm (https://wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf)";

/** The weight read. */
const WEIGHT: string =
  "Viking support: \"The standard weight range is 18 to 21oz.\" (https://www.vikingcue.com/support/); McDermott FAQ: 18 to 21 oz (https://www.mcdermottcue.com/faq.php)";

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `butt`, the butt's diameter at the bumper. */
const ESTIMATES: Readonly<{ butt: number }> = { butt: 0.032 };

/**
 * A two-piece pool cue lying on the floor along `X`, its tip toward `+X`.
 *
 * The butt and the shaft are each half the cue's length, the shaft tapering to its tip's diameter. `butt` is the butt, a handle the back hand holds; `shaft` the shaft, a bar the bridge hand guides; `tip` the tip, the working point whose `+Y` runs out along the cue toward the ball.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The cue.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the cue lies, its halves and its three contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The makers' 58 in from McDermott's statement that a carom cue is 2 in shorter than a pool cue's, split as Cuetec's 29 in butt and 29 in shaft; the tip at McDermott's shaft diameters within the WPA's limit; the mass at the makers' standard weights.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the butt and the shaft, then the three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The butt is one cylinder at an estimated bumper diameter and declares no aperture; the shaft is one tapered rod as two.
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
  const butt: number = ESTIMATES.butt / 2;
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two hands' places and the tip a stroke carries through the ball (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The butt's diameter, which no maker page read gives, is a construction estimate declared on no contact.
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
   * - `tip`: the tip's diameter, metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "tip" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `cue` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(58 * INCH, 58 * INCH, LENGTH),
    tip: ArchetypeBand.metres(0.0115, 0.01325, SHAFT),
    mass: ArchetypeBand.of("kg", 18 * 0.028349523125, 21 * 0.028349523125, WEIGHT),
  };
}
