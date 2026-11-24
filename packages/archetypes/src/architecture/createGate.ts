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

/** The tripod turnstile read. */
const TRILOCK: string =
  "Boon Edam Trilock 60 product data sheet: cabinet 178 mm wide, 965 mm high, 686 mm long; passage 457, 508 or 559 mm; barrier height 838 mm; arm reach 416 mm and 32 mm across on the drawing (https://websaweprd.blob.core.windows.net/cms-assets-us/2021-02/BEI_PDS_Trilock%2060.pdf)";

/** The swing speed gate read. */
const SPEEDLANE: string =
  "Boon Edam Lifeline Speedlane Swing brochure: cabinet 106 mm wide, 1035 mm high, 1776 mm long; passage 615 mm, wide 915 mm; wing height 940 mm (https://www.barbourproductsearch.info/BEL_Lifeline%20Speedlane%20Swing_A4%20Brochure_2023-file133773.pdf)";

/**
 * A speed gate wing's lower edge above the floor, metres: the Speedlane Swing
 * elevation's 200 mm.
 */
const WING_FOOT: number = 0.2;

/**
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `wing`, a swing gate's wing thickness.
 */
const ESTIMATES: Readonly<{ wing: number }> = { wing: 0.02 };

/**
 * A pedestrian gate a person passes through: a tripod turnstile or a swing
 * speed gate.
 *
 * The lane runs along `Z` through the origin, one of its maker's read passage
 * widths between its cabinets, given or drawn from the seed, and is walked
 * toward `-Z`. A turnstile has one cabinet on the lane's `-X` side with its
 * barrier arm reaching across the lane at the maker's barrier height; a speed
 * gate has a cabinet on each side, each with a wing closing half the lane at
 * the maker's wing height. `passage` is the lane's opening, an aperture as high
 * as the cabinets; `top` is the `-X` cabinet's top, leaned on or vaulted.
 *
 * The arm and the wings are drawn at their cabinet's middle and declared as no
 * contact, since no source read places them along the cabinet; turning an arm
 * or swinging a wing has no motion law yet (#3468 N7), so the gate is built for
 * static use.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The gate.
 * @throws {AutoMovieArchetypeRefusal} For a passage the kind's maker does not
 *   list, a fixed dimension outside its band, or one only another kind has.
 */
export function createGate(
  params: createGate.IParams,
  seed?: number,
): AutoMovieArchetype<createGate.Affordance, createGate.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createGate.Dimension> =
    new AutoMovieArchetypeDrawSession<createGate.Dimension>(
      "gate",
      createGate.UNITS,
      seed,
      params,
    );
  const kind: createGate.Kind = ArchetypeDraw.choice(
    "gate",
    "kind",
    params.kind,
    createGate.KINDS,
  );
  const model: {
    name: createGate.Passage | undefined;
    figures: Readonly<Partial<Record<createGate.Dimension, number>>>;
  } = draw.model<createGate.Passage>(
    "lane",
    params.lane,
    createGate.PASSAGES[kind],
  );
  const d: Partial<Record<createGate.Dimension, number>> = {
    ...draw.dimensions(createGate.BANDS[kind], createGate.BANDS),
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    createGate.Affordance,
    createGate.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `${kind === "turnstile" ? "turnstile" : "speed gate"} ${model.name} mm`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const lane: number = d.passage!;
  const width: number = d.width!;
  const height: number = d.height!;
  const length: number = d.length!;
  const x: number = lane / 2 + width / 2;
  const steel: string = "#b9bec4";
  const sides: readonly (readonly [string, number])[] =
    kind === "turnstile"
      ? [["cabinet-right", -1]]
      : [
          ["cabinet-left", 1],
          ["cabinet-right", -1],
        ];
  for (const [id, sign] of sides)
    builder.box(id, v(width, height, length), v(sign * x, height / 2, 0), {
      color: steel,
    });
  const barrier: number = d.barrier!;
  if (kind === "turnstile")
    builder.rod(
      "arm",
      d.arm! / 2,
      v(-lane / 2, barrier, 0),
      v(-lane / 2 + d.reach!, barrier, 0),
      { color: "#55595f" },
    );
  else
    for (const [id, sign] of [
      ["wing-left", 1],
      ["wing-right", -1],
    ] as const)
      builder.box(
        id,
        v(lane / 2, barrier - WING_FOOT, ESTIMATES.wing),
        v((sign * lane) / 4, (barrier + WING_FOOT) / 2, 0),
        { color: "#d6e6ef" },
      );
  builder.affordance({
    id: "passage",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: lane,
    height,
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(-x, height, 0)),
    extent: null,
    width,
    depth: length,
  });
  return builder.build(d.mass!);
}

/** Companion types and bands of {@link createGate}. */
export namespace createGate {
  /** The kinds of gate. */
  export type Kind = "turnstile" | "speedGate";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["turnstile", "speedGate"];

  /**
   * The passage widths read, millimetres: the Trilock 60's 457, 508 and 559 mm
   * and the Speedlane Swing's 615 and 915 mm.
   */
  export type Passage = "457" | "508" | "559" | "615" | "915";

  /**
   * Each kind's passages with the clear width each gives, metres, its default
   * first.
   */
  export const PASSAGES: Readonly<
    Record<
      Kind,
      Readonly<
        Partial<Record<Passage, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    turnstile: {
      "457": { passage: 0.457 },
      "508": { passage: 0.508 },
      "559": { passage: 0.559 },
    },
    speedGate: { "615": { passage: 0.615 }, "915": { passage: 0.915 } },
  };

  /**
   * The affordance ids:
   *
   * - `passage`: the lane's opening between the cabinets, an aperture.
   * - `top`: the `-X` cabinet's top.
   */
  export type Affordance = "passage" | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `passage`: the lane's clear width, its model's.
   * - `width`, `height`, `length`: a cabinet across the lane, high and along it.
   * - `barrier`: a turnstile arm's height or a wing's height.
   * - `reach`, `arm`: a turnstile arm's reach into the lane and its diameter.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "passage"
    | "width"
    | "height"
    | "length"
    | "barrier"
    | "reach"
    | "arm"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    passage: "m",
    width: "m",
    height: "m",
    length: "m",
    barrier: "m",
    reach: "m",
    arm: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "passage">, number>
  > {
    /** Which gate. */
    kind: Kind;

    /**
     * The lane's clear width, one the kind's maker lists; drawn from the seed
     * when absent.
     */
    lane?: Passage;

    /** The model's id, unique in a scene; `gate` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    turnstile: {
      width: AutoMovieArchetypeBand.metres(0.178, 0.178, TRILOCK),
      height: AutoMovieArchetypeBand.metres(0.965, 0.965, TRILOCK),
      length: AutoMovieArchetypeBand.metres(0.686, 0.686, TRILOCK),
      barrier: AutoMovieArchetypeBand.metres(0.838, 0.838, TRILOCK),
      reach: AutoMovieArchetypeBand.metres(0.416, 0.416, TRILOCK),
      arm: AutoMovieArchetypeBand.metres(0.032, 0.032, TRILOCK),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        60,
        100,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    speedGate: {
      width: AutoMovieArchetypeBand.metres(0.106, 0.106, SPEEDLANE),
      height: AutoMovieArchetypeBand.metres(1.035, 1.035, SPEEDLANE),
      length: AutoMovieArchetypeBand.metres(1.776, 1.776, SPEEDLANE),
      barrier: AutoMovieArchetypeBand.metres(0.94, 0.94, SPEEDLANE),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        150,
        250,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
  };
}
