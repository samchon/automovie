import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The maker's guide that gives the trigger's reach by backstrap and its travel. */
const TRIGGER: string =
  "GLOCK Gen4 Buyer's Guide, p. 4, trigger distance 70, 72 and 74 mm without, with the medium and with the large backstrap, and trigger travel about 12.5 mm (https://www.krale.shop/media/blfa_files/Glock_Generation_4_Models_manual_exploded_view_EN-min_2.pdf)";

/** Dimensions no maker publishes. */
const UNPUBLISHED: string = "not published by either maker; an estimate";

/** The bands of the dimensions a model leaves, the same for both frames: each drawn only for a model that does not give it. */
const SHARED: Readonly<
  Record<
    "width" | "triggerReach" | "triggerTravel" | "gripDepth",
    IArchetypeBand
  >
> = {
  width: ArchetypeBand.metres(
    0.0255,
    0.0255,
    "slide width: SIG SAUER publishes only the overall width; the one slide width read, GLOCK's 25.5 mm on the G17 and G19 Gen5 (https://eu.glock.com/en/products/pistols/g17-gen5), applied",
    true,
  ),
  triggerReach: ArchetypeBand.metres(
    0.07,
    0.074,
    `${TRIGGER}: SIG SAUER publishes no trigger distance; the GLOCKs' read range applied`,
    true,
  ),
  triggerTravel: ArchetypeBand.metres(
    0.0125,
    0.0125,
    `${TRIGGER}: no Gen5 or SIG SAUER figure is published; the Gen4 figure applied`,
    true,
  ),
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
 * @param params The frame size, the model and a GLOCK's sights, whether it is loaded and any dimension the author fixes.
 * @param seed The seed that picks the model and the sights left free and draws every dimension left free inside its band; absent, the first model, the first sights and the middle of each band.
 * @returns The handgun.
 * @throws {ArchetypeRefusal} For a model not of the frame, sights on a pistol without them, a fixed dimension outside its band, or one the model or the sights give.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is and is not modelled, how the pistol stands and what each contact is.
 * @evidence contracts/development/implementation.md#principled-implementation Three boxes from the picked pistol's published outside sizes; the trigger face stands at the published reach from the backstrap and moves by the published travel; a loaded pistol adds the difference between the makers' loaded and unloaded masses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the model and the sights, draw the other dimensions, build the grip, the slide and the trigger, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The grip is upright, without its rake, and there is no trigger guard; neither changes where a hand or a finger goes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHandgun(
  params: createHandgun.IParams,
  seed?: number | string,
): Archetype<createHandgun.Affordance, createHandgun.Dimension> {
  const draw: ArchetypeDrawSession<createHandgun.Dimension> = new ArchetypeDrawSession<createHandgun.Dimension>("handgun", createHandgun.UNITS, seed, params);
  const frame: createHandgun.Frame = ArchetypeDraw.choice(
    "handgun",
    "frame",
    params.frame,
    createHandgun.FRAMES,
  );
  // One of the frame's two read pistols whole, and a GLOCK's sights, which set its sight radius.
  const model: { name: createHandgun.Model | undefined; figures: Readonly<Partial<Record<createHandgun.Dimension, number>>> } =
    draw.model<createHandgun.Model>("model", params.model, createHandgun.MODELS[frame]);
  const sights: { figures: Readonly<Partial<Record<createHandgun.Dimension, number>>> } =
    draw.model<createHandgun.Sights>("sights", params.sights, model.name === undefined ? undefined : createHandgun.SIGHTS[model.name]);
  const d: Partial<Record<createHandgun.Dimension, number>> = {
    ...draw.dimensions(createHandgun.BANDS[frame], createHandgun.BANDS),
    ...model.figures,
    ...sights.figures,
  };
  const builder: ArchetypeBuilder<
    createHandgun.Affordance,
    createHandgun.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: `${frame === "fullSize" ? "full-size" : "compact"} handgun`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const slide: number = 0.028;
  const top: number = d.height!;
  const under: number = top - slide;
  const rear: number = -0.02;
  const muzzle: number = rear + d.length!;
  const steel: string = "#2c2f33";
  builder.box(
    "grip",
    v(0.03, under, d.gripDepth!),
    v(0, under / 2, d.gripDepth! / 2),
    { color: steel, density: 0.5 },
  );
  builder.box(
    "slide",
    v(d.width!, slide, d.length!),
    v(0, top - slide / 2, (rear + muzzle) / 2),
    { color: steel },
  );
  builder.box(
    "trigger",
    v(0.008, 0.02, 0.006),
    v(0, under - 0.02, d.triggerReach! - 0.003),
    { color: "#55595f" },
  );

  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      v(0, under / 2, d.gripDepth! / 2),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.gripDepth!,
    length: under,
  });
  builder.affordance({
    id: "trigger",
    kind: "trigger",
    frame: ArchetypeFrame.facing(
      v(0, under - 0.02, d.triggerReach!),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    travel: d.triggerTravel!,
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
    aperture: d.width!,
    travel: createHandgun.RACK,
    parts: ["slide"],
  });
  for (const [id, z] of [
    ["sight", rear + 0.01],
    ["frontSight", rear + 0.01 + d.sightRadius!],
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
      v(0, 0, d.gripDepth! / 2),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(
    d.mass! + (params.loaded === true ? createHandgun.AMMUNITION[frame] : 0),
  );
}

/**
 * Companion types and bands of {@link createHandgun}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each frame, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions of frames, read pistols and sights, each pistol whole from its own maker's table, and one band per dimension a pistol leaves, provisional where it applies another maker's figure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The outside sizes, the trigger's reach and travel and the sight line an aiming and holding act read (#3374).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Loading is a parameter that adds a published mass, not a second set of bands; nothing between two pistols or two sights is drawn, and no maker's figure stands in another maker's pistol.
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

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    height: "m",
    width: "m",
    sightRadius: "m",
    triggerReach: "m",
    triggerTravel: "m",
    gripDepth: "m",
    mass: "kg",
  };

  /** The read pistols: the GLOCK G17 Gen5 and the SIG SAUER P320-M17 full-size, the G19 Gen5 and the P320-M18 compact. */
  export type Model = "g17" | "p320m17" | "g19" | "p320m18";

  /** A GLOCK's sights, which set its sight radius: polymer, steel or GNS. */
  export type Sights = "polymer" | "steel" | "gns";

  /**
   * Each frame's pistols whole, the default first, each from its own maker's table:
   *
   * - G17 Gen5: 202 mm long, 139 mm high with magazine, slide 25.5 mm wide, trigger distance 70 mm, 708 g with an empty magazine (https://eu.glock.com/en/products/pistols/g17-gen5).
   * - P320-M17: 8.5 in (216 mm) long, 5.5 in (139 mm) high, 6.6 in (168 mm) sight radius, 29.6 oz (839.1 g), the magazine state not stated (https://www.sigsauer.com/p320-m17.html; the 216 mm of the two 10-round SKUs, the first SKU's 6.6 in overall length repeating its sight radius).
   * - G19 Gen5: 185 mm long, 128 mm high, slide 25.5 mm wide, trigger distance 70 mm, 670 g with an empty magazine (https://eu.glock.com/en/products/pistols/g19-gen5).
   * - P320-M18: 7.2 in (183 mm) long, 5.5 in (140 mm) high, 5.8 in (147 mm) sight radius, 28.1 oz (797 g), the magazine state not stated (https://www.sigsauer.com/p320-m18.html).
   */
  export const MODELS: Readonly<Record<Frame, Readonly<Partial<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>>>> = {
    fullSize: {
      g17: { length: 0.202, height: 0.139, width: 0.0255, triggerReach: 0.07, mass: 0.708 },
      p320m17: { length: 0.216, height: 0.139, sightRadius: 0.168, mass: 0.8391 },
    },
    compact: {
      g19: { length: 0.185, height: 0.128, width: 0.0255, triggerReach: 0.07, mass: 0.67 },
      p320m18: { length: 0.183, height: 0.14, sightRadius: 0.147, mass: 0.797 },
    },
  };

  /** A GLOCK's sight radius by its sights, the maker's tables: G17 Gen5 165, 164 and 163 mm, G19 Gen5 153, 152 and 151 mm for polymer, steel and GNS. A SIG SAUER's is its model's. */
  export const SIGHTS: Readonly<Partial<Record<Model, Readonly<Record<Sights, Readonly<Partial<Record<Dimension, number>>>>>>>> = {
    g17: {
      polymer: { sightRadius: 0.165 },
      steel: { sightRadius: 0.164 },
      gns: { sightRadius: 0.163 },
    },
    g19: {
      polymer: { sightRadius: 0.153 },
      steel: { sightRadius: 0.152 },
      gns: { sightRadius: 0.151 },
    },
  };

  /** The parameters: the frame, the model and its sights, whether it is loaded, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which frame size. */
    frame: Frame;

    /** Which of the frame's read pistols; picked from the seed when absent. */
    model?: Model;

    /** A GLOCK's sights; picked from the seed when absent. A SIG SAUER has none to choose. */
    sights?: Sights;

    /** Whether the magazine is full, which adds its published mass; empty when absent. */
    loaded?: boolean;

    /** The model's id, unique in a scene; `handgun` when absent. */
    id?: string;
  }

  /** The band of each free dimension a model leaves, by frame. */
  export const BANDS: Readonly<
    Record<Frame, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    fullSize: SHARED,
    compact: SHARED,
  };
}
