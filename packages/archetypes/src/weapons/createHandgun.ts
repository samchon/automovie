import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Two full-size service pistols' published tables. */
const FULL: string =
  "GLOCK G17 Gen5 technical data (https://eu.glock.com/en/products/pistols/g17-gen5) and SIG SAUER P320-M17 specifications (https://www.sigsauer.com/p320-m17.html)";

/** Two compact service pistols' published tables. */
const COMPACT: string =
  "GLOCK G19 Gen5 technical data (https://eu.glock.com/en/products/pistols/g19-gen5) and SIG SAUER P320-M18 specifications (https://www.sigsauer.com/p320-m18.html)";

/** The maker's guide that gives the trigger's reach and travel. */
const TRIGGER: string =
  "GLOCK Gen4 Buyer's Guide, trigger distance 70 to 74 mm by backstrap and trigger travel about 12.5 mm (https://www.krale.shop/media/blfa_files/Glock_Generation_4_Models_manual_exploded_view_EN-min_2.pdf)";

/** Dimensions no maker publishes. */
const UNPUBLISHED: string = "not published by either maker; an estimate";

/** The bands both frames share. */
const SHARED: Readonly<
  Record<
    "width" | "triggerReach" | "triggerTravel" | "gripDepth",
    IArchetypeBand
  >
> = {
  width: ArchetypeBand.metres(0.0255, 0.0255, `${FULL}: slide width 25.5 mm`),
  triggerReach: ArchetypeBand.metres(0.07, 0.074, TRIGGER),
  triggerTravel: ArchetypeBand.metres(0.0125, 0.0125, TRIGGER),
  gripDepth: ArchetypeBand.metres(
    0.048,
    0.055,
    `grip depth from front strap to backstrap, ${UNPUBLISHED}`,
    true,
  ),
};

/**
 * A handgun as a film prop: a slide over a frame with a grip, a trigger and sights. It models no mechanism and no effect.
 *
 * The pistol stands on the base of its grip at the origin with its muzzle toward `+Z` and its backstrap at `z = 0`. The shooting hand takes the `grip` from behind; the `trigger` is a part on its articulation, its face `triggerReach` ahead of the backstrap, as makers measure it; the `slide` runs back on its slider. `sight` and `frontSight` give the line of aim, `muzzle` the end of the barrel and `magazine` the well under the grip.
 *
 * @param params The frame size, whether it is loaded and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The handgun.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is and is not modelled, how the pistol stands and what each contact is.
 * @evidence contracts/development/implementation.md#principled-implementation Three boxes from the makers' published outside sizes; the trigger face stands at the published reach from the backstrap and moves by the published travel; a loaded pistol adds the difference between the makers' loaded and unloaded masses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the grip, the slide and the trigger, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The grip is upright, without its rake, and there is no trigger guard; neither changes where a hand or a finger goes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHandgun(
  params: createHandgun.IParams,
  seed?: number | string,
): Archetype<createHandgun.Affordance, createHandgun.Dimension> {
  const frame: createHandgun.Frame = ArchetypeDraw.choice(
    "handgun",
    "frame",
    params.frame,
    createHandgun.FRAMES,
  );
  const d: Record<createHandgun.Dimension, number> = ArchetypeDraw.dimensions(
    "handgun",
    createHandgun.BANDS[frame],
    seed,
    params,
    createHandgun.BANDS,
  );
  const builder: ArchetypeBuilder<
    createHandgun.Affordance,
    createHandgun.Dimension
  > = new ArchetypeBuilder({
    archetype: "handgun",
    id: params.id,
    name: `${frame === "fullSize" ? "full-size" : "compact"} handgun`,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const slide: number = 0.028;
  const top: number = d.height;
  const under: number = top - slide;
  const rear: number = -0.02;
  const muzzle: number = rear + d.length;
  const steel: string = "#2c2f33";
  builder.box(
    "grip",
    v(0.03, under, d.gripDepth),
    v(0, under / 2, d.gripDepth / 2),
    { color: steel, density: 0.5 },
  );
  builder.box(
    "slide",
    v(d.width, slide, d.length),
    v(0, top - slide / 2, (rear + muzzle) / 2),
    { color: steel },
  );
  builder.box(
    "trigger",
    v(0.008, 0.02, 0.006),
    v(0, under - 0.02, d.triggerReach - 0.003),
    { color: "#55595f" },
  );

  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      v(0, under / 2, d.gripDepth / 2),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.gripDepth,
    length: under,
  });
  builder.affordance({
    id: "trigger",
    kind: "trigger",
    frame: ArchetypeFrame.facing(
      v(0, under - 0.02, d.triggerReach),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    travel: d.triggerTravel,
    parts: ["trigger"],
  });
  builder.affordance({
    id: "slide",
    kind: "slider",
    frame: ArchetypeFrame.facing(
      v(0, top - slide / 2, 0.01),
      v(0, 1, 0),
      v(0, 0, -1),
    ),
    extent: null,
    grip: "power",
    aperture: d.width,
    travel: createHandgun.RACK,
    parts: ["slide"],
  });
  for (const [id, z] of [
    ["sight", rear + 0.01],
    ["frontSight", rear + 0.01 + d.sightRadius],
  ] as const)
    builder.affordance({
      id,
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, top, z)),
      extent: null,
      rides: "slide",
    });
  builder.affordance({
    id: "muzzle",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.facing(
      v(0, top - slide / 2, muzzle),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "magazine",
    kind: "socket",
    frame: ArchetypeFrame.facing(
      v(0, 0, d.gripDepth / 2),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(
    d.mass + (params.loaded === true ? createHandgun.AMMUNITION[frame] : 0),
  );
}

/**
 * Companion types and bands of {@link createHandgun}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each frame, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per frame, read from makers' published tables.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The outside sizes, the trigger's reach and travel and the sight line an aiming and holding act read (#3374).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Loading is a parameter that adds a published mass, not a second set of bands.
 */
export namespace createHandgun {
  /** The frame sizes. */
  export type Frame = "fullSize" | "compact";

  /** Every frame, for a caller that reads one at run time. */
  export const FRAMES: readonly Frame[] = ["fullSize", "compact"];

  /** What a full magazine adds, kilograms: the loaded mass less the mass with an empty magazine, GLOCK G17 Gen5 (945 less 708 g) and G19 Gen5 (855 less 670 g). */
  export const AMMUNITION: Readonly<Record<Frame, number>> = {
    fullSize: 0.237,
    compact: 0.185,
  };

  /** How far the slide is drawn back, metres: an estimate, not published. */
  export const RACK: number = 0.04;

  /**
   * The affordance ids:
   *
   * - `grip`: the grip, taken from behind.
   * - `trigger`: the trigger's face, pulled back by its travel.
   * - `slide`: the rear of the slide, a slider drawn back.
   * - `sight`, `frontSight`: the tops of the rear and front sights, which ride the slide.
   * - `muzzle`: the end of the barrel, facing forward.
   * - `magazine`: the magazine well under the grip, a socket facing down.
   */
  export type Affordance =
    | "grip"
    | "trigger"
    | "slide"
    | "sight"
    | "frontSight"
    | "muzzle"
    | "magazine";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `height`, `width`: overall length, height with magazine and slide width.
   * - `sightRadius`: from the rear sight to the front sight.
   * - `triggerReach`: from the backstrap to the trigger's face.
   * - `triggerTravel`: the trigger's pull.
   * - `gripDepth`: the grip from front strap to backstrap.
   * - `mass`: with an empty magazine, kilograms.
   */
  export type Dimension =
    | "length"
    | "height"
    | "width"
    | "sightRadius"
    | "triggerReach"
    | "triggerTravel"
    | "gripDepth"
    | "mass";

  /** The parameters: the frame, whether it is loaded, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which frame size. */
    frame: Frame;

    /** Whether the magazine is full, which adds its published mass; empty when absent. */
    loaded?: boolean;

    /** The model's id, unique in a scene; `handgun` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by frame. */
  export const BANDS: Readonly<
    Record<Frame, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    fullSize: {
      ...SHARED,
      length: ArchetypeBand.metres(0.202, 0.216, FULL),
      height: ArchetypeBand.metres(0.139, 0.139, FULL),
      sightRadius: ArchetypeBand.metres(0.163, 0.168, FULL),
      mass: ArchetypeBand.of(
        "kg",
        0.708,
        0.839,
        `${FULL}; the SIG figure's magazine state is not stated`,
      ),
    },
    compact: {
      ...SHARED,
      length: ArchetypeBand.metres(0.183, 0.185, COMPACT),
      height: ArchetypeBand.metres(0.128, 0.14, COMPACT),
      sightRadius: ArchetypeBand.metres(0.147, 0.153, COMPACT),
      mass: ArchetypeBand.of(
        "kg",
        0.67,
        0.797,
        `${COMPACT}; the SIG figure's magazine state is not stated`,
      ),
    },
  };
}
