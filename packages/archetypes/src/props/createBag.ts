import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type IAutoMovieArchetypeBand,
} from "../core";
import { BAG_BANDS } from "./BAG_BANDS";

/**
 * HSE's guideline load for a load held close to the body below the elbow by a
 * woman, kilograms (INDG143, Figure 1,
 * https://www.hse.gov.uk/pubns/indg143.pdf): the bound of every bag carried by
 * hand or on the back.
 */
const HSE_CLOSE_LOAD: number = 16;

/**
 * The greatest load each kind may carry, kilograms: HSE's 16 kg for a load held
 * close below the elbow by a woman (INDG143, Figure 1,
 * https://www.hse.gov.uk/pubns/indg143.pdf) for a carried bag, case or toolbox,
 * and for a suitcase IATA's 32 kg piece limit
 * (https://www.iata.org/en/programs/ops-infra/baggage/passenger-baggage-rules/)
 * less the heaviest empty case of 4.3 kg.
 */
const LOADS: Readonly<Record<createBag.Kind, number>> = {
  tote: HSE_CLOSE_LOAD,
  backpack: HSE_CLOSE_LOAD,
  suitcase: 32 - 4.3,
  briefcase: HSE_CLOSE_LOAD,
  toolbox: HSE_CLOSE_LOAD,
  handbag: HSE_CLOSE_LOAD,
  duffel: HSE_CLOSE_LOAD,
};

/**
 * A carried bag: a tote open at the top with handles and a shoulder strap, its
 * hollow reached through its `opening` and its floor the `inside` surface, a
 * backpack, a cabin suitcase with a telescopic handle, a briefcase, a toolbox,
 * a handbag or a duffel.
 *
 * The bag stands on its base at the origin, its wide face toward `+Z`; a
 * suitcase's, a briefcase's, a toolbox's and a duffel's top handle is the
 * Revised NIOSH Lifting Equation's optimal handle, applied, and a handbag's
 * handle is that handle's bar and length standing its read drop above the top:
 * a bar of its diameter band and its 11.5 cm length, standing its 5 cm
 * clearance above the top; a backpack's straps are on its `-Z` face, against
 * the back of a wearer who faces `-Z`. A suitcase's pull handle is a part on
 * the `telescope` slider, so drawing it out raises it to the height it is
 * pulled at.
 *
 * @param params The kind, the load and any dimension the author fixes.
 * @param seed The seed that picks the model when none is given and draws every
 *   dimension left free inside its band; absent, the first model and the middle
 *   of each band.
 * @returns The bag.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
 *   or a load the kind does not carry.
 */
export function createBag(
  params: createBag.IParams,
  seed?: number,
): AutoMovieArchetype<createBag.Affordance, createBag.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createBag.Dimension> =
    new AutoMovieArchetypeDrawSession<createBag.Dimension>(
      "bag",
      createBag.UNITS,
      seed,
      params,
    );
  const kind: createBag.Kind = ArchetypeDraw.choice(
    "bag",
    "kind",
    params.kind,
    createBag.KINDS,
  );
  const load: number = params.load ?? 0;
  if (!(load >= 0 && load <= LOADS[kind]))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "bag",
      axis: "load",
      value: load,
      feasible: { kind: "range", minimum: 0, maximum: LOADS[kind], unit: "kg" },
      reason: `a ${kind} carries up to ${LOADS[kind]} kg`,
      fix: "give a load the bag carries",
    });
  const drawn: Partial<Record<createBag.Dimension, number>> = draw.dimensions(
    createBag.BANDS[kind],
    createBag.BANDS,
  );
  // A suitcase is one of the two cabin limits read whole, its pull handle one of the two heights the study tested.
  const model: {
    name: createBag.Model | undefined;
    figures: createBag.Figures;
  } = draw.model<createBag.Model>(
    "model",
    params.model,
    createBag.MODELS[kind],
  );
  const pull: { name: createBag.Pull | undefined; figures: createBag.Figures } =
    draw.model<createBag.Pull>("pull", params.pull, createBag.PULLS[kind]);
  const d: Partial<Record<createBag.Dimension, number>> = {
    ...drawn,
    ...model.figures,
    ...pull.figures,
  };
  const width: number = d.width!;
  const height: number = d.height!;
  const depth: number = d.depth!;
  const builder: AutoMovieArchetypeBuilder<
    createBag.Affordance,
    createBag.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind,
    draw,
  });
  const color: string =
    kind === "suitcase" || kind === "briefcase"
      ? "#3d4a5c"
      : kind === "toolbox"
        ? "#c8a020"
        : "#b08d57";
  if (kind === "tote") {
    // A tote is open at the top: a bottom and four walls round a hollow a
    // hand reaches into through its `opening`.
    const wall: number = createBag.WALL;
    builder.box(
      "body",
      Vector3.create(width, wall, depth),
      Vector3.create(0, wall / 2, 0),
      { color },
    );
    for (const [id, z] of [
      ["wall-front", depth / 2 - wall / 2],
      ["wall-back", -depth / 2 + wall / 2],
    ] as const)
      builder.box(
        id,
        Vector3.create(width, height - wall, wall),
        Vector3.create(0, (height + wall) / 2, z),
        { color },
      );
    for (const [id, x] of [
      ["wall-left", width / 2 - wall / 2],
      ["wall-right", -width / 2 + wall / 2],
    ] as const)
      builder.box(
        id,
        Vector3.create(wall, height - wall, depth - 2 * wall),
        Vector3.create(x, (height + wall) / 2, 0),
        { color },
      );
    builder.affordance({
      id: "opening",
      kind: "aperture",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, height, 0),
        Vector3.create(0, -1, 0),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
      width: width - 2 * wall,
      height: depth - 2 * wall,
    });
    builder.affordance({
      id: "inside",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, wall, 0)),
      extent: null,
      width: width - 2 * wall,
      depth: depth - 2 * wall,
    });
  } else
    builder.box(
      "body",
      Vector3.create(width, height, depth),
      Vector3.create(0, height / 2, 0),
      { color },
    );
  const bar: number = d.handleDiameter! / 2;
  const lift: number = createBag.HANDLE.clearance + bar;

  /**
   * A carrying bar along +X at a height, gripped from above, on a riser at each
   * end down to the body's top.
   */
  const carry = (id: "handle" | "strap", y: number, span: number): void => {
    builder.rod(
      id,
      bar,
      Vector3.create(-span / 2, y, 0),
      Vector3.create(span / 2, y, 0),
      { color: "#5a4630" },
    );
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const)
      builder.rod(
        `${id}-riser-${side}`,
        bar / 2,
        Vector3.create((sign * span) / 2, height, 0),
        Vector3.create((sign * span) / 2, y, 0),
        { color: "#5a4630" },
      );
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, y, 0)),
      extent: null,
      grip: id === "strap" ? "hook" : "power",
      aperture: 2 * bar,
      length: span,
    });
  };

  if (kind === "tote") {
    carry("handle", height + d.handleDrop!, width * 0.4);
    carry("strap", height + d.strapDrop!, width * 0.3);
  } else if (kind === "backpack") {
    carry("handle", height + 0.03, 0.08);
    // The wearer faces -Z with the bag on the back, so the wearer's left is -X.
    for (const [side, sign] of [
      ["left", -1],
      ["right", 1],
    ] as const) {
      const x: number = sign * width * 0.25;
      const z: number = -depth / 2 - bar;
      builder.rod(
        `strap-${side}`,
        bar,
        Vector3.create(x, height * 0.15, z),
        Vector3.create(x, height * 0.95, z),
        { color: "#5a4630" },
      );
      builder.affordance({
        id: `${side}Strap`,
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.create(x, height * 0.55, z),
          Vector3.create(0, 0, -1),
          Vector3.create(0, 1, 0),
        ),
        extent: null,
        grip: "hook",
        aperture: 2 * bar,
        length: height * 0.8,
      });
    }
  } else if (kind === "briefcase" || kind === "toolbox" || kind === "duffel") {
    carry("handle", height + lift, createBag.HANDLE.length);
  } else if (kind === "handbag") {
    // The handle's top stands the read drop above the bag's top.
    carry("handle", height + d.handleDrop! - bar, createBag.HANDLE.length);
  } else {
    // A suitcase: a carry handle on top, and a pull bar on two posts that slide up out of the back.
    carry("handle", height + lift, createBag.HANDLE.length);
    const z: number = -depth / 2 + 0.03;
    const travel: number = d.pullHeight! - (height + 0.02);
    builder.rod(
      "pull",
      bar,
      Vector3.create(-width * 0.2, height + 0.02, z),
      Vector3.create(width * 0.2, height + 0.02, z),
      { color: "#22262b" },
    );
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const)
      builder.rod(
        `pull-post-${side}`,
        0.008,
        Vector3.create(sign * width * 0.2, height + 0.02 - travel, z),
        Vector3.create(sign * width * 0.2, height + 0.02, z),
        { color: "#8a8d91" },
      );
    builder.affordance({
      id: "telescope",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, height + 0.02, z),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      travel,
      parts: ["pull", "pull-post-left", "pull-post-right"],
    });
    builder.affordance({
      id: "pull",
      kind: "bar",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.upright(
        Vector3.create(0, height + 0.02, z),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * bar,
      length: width * 0.4,
      rides: "telescope",
    });
  }
  return builder.build(d.mass! + load);
}

/** Companion types and bands of {@link createBag}. */
export namespace createBag {
  /**
   * An open tote's wall and bottom thickness, metres (provisional: a stiff
   * canvas or leather panel).
   */
  export const WALL: number = 0.006;

  /** The kinds of bag. */
  export type Kind =
    | "tote"
    | "backpack"
    | "suitcase"
    | "briefcase"
    | "toolbox"
    | "handbag"
    | "duffel";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "tote",
    "backpack",
    "suitcase",
    "briefcase",
    "toolbox",
    "handbag",
    "duffel",
  ];

  /**
   * The Revised NIOSH Lifting Equation's optimal handle's length and clearance,
   * metres, applied to a suitcase's, a briefcase's, a toolbox's, a duffel's and
   * a handbag's handle (Applications Manual, NIOSH 94-110, Table 6 note 1, p.
   * 30, https://stacks.cdc.gov/view/cdc/209665/cdc_209665_DS1.pdf): at least
   * 11.5 cm long, 5 cm clear of the top.
   */
  export const HANDLE: Readonly<{ length: number; clearance: number }> = {
    length: 0.115,
    clearance: 0.05,
  };

  /**
   * The affordance ids:
   *
   * - `handle`: the carrying handle above the top, gripped from above; every
   *   kind.
   * - `strap`: the top of a tote's shoulder strap, hooked over the shoulder or
   *   the fingers.
   * - `leftStrap`, `rightStrap`: a backpack's shoulder straps, each frame at the
   *   strap's middle with the strap's length along it so a site names its top,
   *   on the left (`-X`) and the right of a wearer who faces `-Z` with the bag
   *   on the back.
   * - `telescope`: a suitcase's telescopic handle, a slider travelling up.
   * - `pull`: the bar of that handle, which rides the telescope.
   */
  export type Affordance =
    | "handle"
    | "strap"
    | "leftStrap"
    | "rightStrap"
    | "telescope"
    | "pull"
    | "opening"
    | "inside";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: the body along `+X`, `+Y` and `+Z`.
   * - `handleDrop`: the top of a tote's or a handbag's handles above its body.
   * - `strapDrop`: the top of a tote's shoulder strap above its body.
   * - `pullHeight`: a suitcase's pull bar above the floor when drawn out.
   * - `handleDiameter`: a suitcase's, a briefcase's, a toolbox's, a duffel's or a
   *   handbag's handle bar, or a tote's or a backpack's handle and strap
   *   webbing.
   * - `mass`: the empty bag, kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "depth"
    | "handleDrop"
    | "strapDrop"
    | "pullHeight"
    | "handleDiameter"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    depth: "m",
    handleDrop: "m",
    strapDrop: "m",
    pullHeight: "m",
    handleDiameter: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, the load, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bag. */
    kind: Kind;

    /** A suitcase's cabin limit; drawn from the seed when absent. */
    model?: Model;

    /** A suitcase's pull height; drawn from the seed when absent. */
    pull?: Pull;

    /** The model's id, unique in a scene; `bag` when absent. */
    id?: string;

    /**
     * The mass of what the bag holds, kilograms: up to 16 for a tote, a
     * backpack, a briefcase, a toolbox, a handbag or a duffel and 27.7 for a
     * suitcase; empty when absent.
     */
    load?: number;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The suitcases read: the two cabin limits, Lufthansa's and IATA's guide. */
  export type Model = "lufthansa" | "iata";

  /**
   * Each kind's models whole, the default first: a suitcase's height x width x
   * depth, Lufthansa's carry-on limit 55 x 40 x 23 cm
   * (https://www.lufthansa.com/us/en/carry-on-baggage) and IATA's 56 x 45 x 25
   * cm guide
   * (https://www.iata.org/en/programs/ops-infra/baggage/passenger-baggage-rules/).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    suitcase: {
      lufthansa: { height: 0.55, width: 0.4, depth: 0.23 },
      iata: { height: 0.56, width: 0.45, depth: 0.25 },
    },
  };

  /** The pull heights read: the two a luggage-pulling study tested. */
  export type Pull = "pull100" | "pull110";

  /**
   * Each kind's pull heights, the default first: 100 and 110 cm, tested in
   * Industrial Health 45(6):756-765, 2007
   * (https://www.jstage.jst.go.jp/article/indhealth/45/6/45_6_756/_article).
   */
  export const PULLS: Readonly<
    Partial<Record<Kind, Readonly<Record<Pull, Figures>>>>
  > = {
    suitcase: {
      pull100: { pullHeight: 1 },
      pull110: { pullHeight: 1.1 },
    },
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = BAG_BANDS;
}
