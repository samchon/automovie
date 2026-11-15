import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeRefusal,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** Tote sizes and handle lengths from a maker's listing seen in search results. */
const TOTE: string =
  "L.L.Bean Boat and Tote, small 10.5 x 9.5 x 5 in to large 15 x 17 x 7.5 in with 6 to 8 in handles, product listing seen only in search results";

/** Shoulder strap drops from a maker's pages seen in search results. */
const STRAP: string =
  "Coach handbag pages, detachable strap with 21.75 to 25 in drop, seen only in search results";

/** Two backpacks from listings seen in search results. */
const BACKPACK: string =
  "JanSport SuperBreak, 16.7 x 13 x 8.5 in and 0.3 kg, and Fjallraven Kanken 16 L, 38 x 27 x 13 cm and 0.3 kg, listings seen only in search results";

/** The optimal handle of the Revised NIOSH Lifting Equation, applied to a carried container's handle whose own size no maker gives. */
const NIOSH: string =
  'Waters, Putz-Anderson and Garg, Applications Manual for the Revised NIOSH Lifting Equation, DHHS (NIOSH) 94-110 (1994), Table 6 note 1, p. 30: "An optimal handle design has .75 - 1.5 inches (1.9 to 3.8 cm) diameter, >= 4.5 inches (11.5 cm) length, 2 inches (5 cm) clearance, cylindrical shape" (https://stacks.cdc.gov/view/cdc/209665/cdc_209665_DS1.pdf), applied to this handle';

/** The NIOSH optimal handle's diameters applied to a tote's handles and strap and a backpack's straps, flat webbing in a hook grip whose width no maker read gives. */
const WEBBING: string =
  "the 1.9 to 3.8 cm optimal handle diameter of the Applications Manual for the Revised NIOSH Lifting Equation, DHHS (NIOSH) 94-110, Table 6 note 1, p. 30 (https://stacks.cdc.gov/view/cdc/209665/cdc_209665_DS1.pdf), applied to a strap's webbing: no maker read states a strap's width (searched for the Fjallraven Kanken's, 2026-11-15; only the Kanken Mini's 25 mm, at a retailer)";

/** Two attache cases, seen only in search results; the larger of each case's two face sizes taken as its width. */
const ATTACHE: string =
  "Samsonite Focus III 6 in attache, 39.4 x 45.2 x 14.7 cm, 2.95 kg (https://www.samsonite.ca/en/bags/laptop-bags-%26-briefcases/samsonite-focus-iii-6%22-attach%C3%A9/10558XXXX.html), and Rimowa aluminium attache, 35 x 41.5 x 8.5 cm, 2.3 kg (https://rimowa.com/us/en/bags/attache/briefcase/90007010.html), seen only in search results";

/** A maker's handbag, read at a retailer, its other handle drop and its weight seen only in search results. */
const HANDBAG: string =
  "Longchamp Le Pliage Original M: height 28, width 30, depth 20 cm, handle drop 11 cm (https://www.selfridges.com/IE/en/product/longchamp-le-pliage-medium-recycled-nylon-top-handle-bag_R03885492/); a 12 cm handle height on Longchamp's Indonesian page and a 240 g weight seen only in search results";

/** A maker's duffel, seen only in search results. */
const DUFFEL: string =
  "The North Face Base Camp Duffel M, 14 x 25 x 14 in, 3 lb 9.1 oz (1620 g) (https://www.sunandski.com/p/93240061700002402), seen only in search results";

/** A maker's toolbox, read, its weight seen only in search results. */
const TOOLBOX: string =
  "Stanley 19 in Essential toolbox STST1-75520, 48.2 x 25.4 x 25 cm (https://www.stanleytools.co.uk/product/stst1-75520/stanley-19-essential-tool-box); its 1.5 kg seen only in search results";

/** HSE's guideline load for a load held close to the body below the elbow by a woman, kilograms (INDG143, Figure 1, https://www.hse.gov.uk/pubns/indg143.pdf): the bound of every bag carried by hand or on the back. */
const HSE_CLOSE_LOAD: number = 16;

/** The NIOSH optimal handle's diameters, metres, applied to a cased or carried bag's handle bar. */
const NIOSH_HANDLE: IArchetypeBand = ArchetypeBand.metres(
  0.019,
  0.038,
  NIOSH,
  true,
);

/** The same diameters applied to a strap's webbing. */
const NIOSH_WEBBING: IArchetypeBand = ArchetypeBand.metres(
  NIOSH_HANDLE.minimum,
  NIOSH_HANDLE.maximum,
  WEBBING,
  true,
);
/** The greatest load each kind may carry, kilograms: HSE's 16 kg for a load held close below the elbow by a woman (INDG143, Figure 1, https://www.hse.gov.uk/pubns/indg143.pdf) for a carried bag, case or toolbox, and for a suitcase IATA's 32 kg piece limit (https://www.iata.org/en/programs/ops-infra/baggage/passenger-baggage-rules/) less the heaviest empty case of 4.3 kg. */
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
 * A carried bag: a tote with handles and a shoulder strap, a backpack, a cabin suitcase with a telescopic handle, a briefcase, a toolbox, a handbag or a duffel.
 *
 * The bag stands on its base at the origin, its wide face toward `+Z`; a suitcase's, a briefcase's, a toolbox's and a duffel's top handle is the Revised NIOSH Lifting Equation's optimal handle, applied, and a handbag's handle is that handle's bar and length standing its read drop above the top: a bar of its diameter band and its 11.5 cm length, standing its 5 cm clearance above the top; a backpack's straps are on its `-Z` face, against the back of a wearer who faces `-Z`. A suitcase's pull handle is a part on the `telescope` slider, so drawing it out raises it to the height it is pulled at.
 *
 * @param params The kind, the load and any dimension the author fixes.
 * @param seed The seed that picks the model when none is given and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The bag.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or a load the kind does not carry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled, how the bag stands and what the telescope moves.
 * @evidence contracts/development/implementation.md#principled-implementation A dimensioned box with each handle or strap a bar on two risers; the load adds to the cited empty mass up to the bound `LOADS` cites for the kind, which keeps a loaded suitcase within IATA's 32 kg.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the body, then each kind's handles.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A tote's strap and handles are rigid loops at rest and a backpack's straps rigid bars; their drape is the wearing act's to place.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most seven parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBag(
  params: createBag.IParams,
  seed?: number | string,
): Archetype<createBag.Affordance, createBag.Dimension> {
  const draw: ArchetypeDrawSession<createBag.Dimension> =
    new ArchetypeDrawSession<createBag.Dimension>(
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
    throw new ArchetypeRefusal({
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
  const builder: ArchetypeBuilder<createBag.Affordance, createBag.Dimension> =
    new ArchetypeBuilder({
      id: params.id,
      name: kind,
      draw,
    });
  builder.box(
    "body",
    Vector3.create(width, height, depth),
    Vector3.create(0, height / 2, 0),
    {
      color:
        kind === "suitcase" || kind === "briefcase"
          ? "#3d4a5c"
          : kind === "toolbox"
            ? "#c8a020"
            : "#b08d57",
    },
  );
  const bar: number = d.handleDiameter! / 2;
  const lift: number = createBag.HANDLE.clearance + bar;

  /** A carrying bar along +X at a height, gripped from above, on a riser at each end down to the body's top. */
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
      frame: ArchetypeFrame.upright(Vector3.create(0, y, 0)),
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
        frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.upright(Vector3.create(0, height + 0.02, z)),
      extent: null,
      grip: "power",
      aperture: 2 * bar,
      length: width * 0.4,
      rides: "telescope",
    });
  }
  return builder.build(d.mass! + load);
}

/**
 * Companion types and bands of {@link createBag}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sizes a carry reads (#3369, #3358): where the hand or shoulder takes the bag, how high the pull handle stands, and the mass.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A load beyond what the kind carries is refused, never capped.
 */
export namespace createBag {
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

  /** The Revised NIOSH Lifting Equation's optimal handle's length and clearance, metres, applied to a suitcase's, a briefcase's, a toolbox's, a duffel's and a handbag's handle (Applications Manual, NIOSH 94-110, Table 6 note 1, p. 30, https://stacks.cdc.gov/view/cdc/209665/cdc_209665_DS1.pdf): at least 11.5 cm long, 5 cm clear of the top. */
  export const HANDLE: Readonly<{ length: number; clearance: number }> = {
    length: 0.115,
    clearance: 0.05,
  };

  /**
   * The affordance ids:
   *
   * - `handle`: the carrying handle above the top, gripped from above; every kind.
   * - `strap`: the top of a tote's shoulder strap, hooked over the shoulder or the fingers.
   * - `leftStrap`, `rightStrap`: a backpack's shoulder straps, each frame at the strap's middle with the strap's length along it so a site names its top, on the left (`-X`) and the right of a wearer who faces `-Z` with the bag on the back.
   * - `telescope`: a suitcase's telescopic handle, a slider travelling up.
   * - `pull`: the bar of that handle, which rides the telescope.
   */
  export type Affordance =
    | "handle"
    | "strap"
    | "leftStrap"
    | "rightStrap"
    | "telescope"
    | "pull";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: the body along `+X`, `+Y` and `+Z`.
   * - `handleDrop`: the top of a tote's or a handbag's handles above its body.
   * - `strapDrop`: the top of a tote's shoulder strap above its body.
   * - `pullHeight`: a suitcase's pull bar above the floor when drawn out.
   * - `handleDiameter`: a suitcase's, a briefcase's, a toolbox's, a duffel's or a handbag's handle bar, or a tote's or a backpack's handle and strap webbing.
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
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    height: "m",
    depth: "m",
    handleDrop: "m",
    strapDrop: "m",
    pullHeight: "m",
    handleDiameter: "m",
    mass: "kg",
  };

  /** The parameters: the kind, the load, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bag. */
    kind: Kind;

    /** A suitcase's cabin limit; drawn from the seed when absent. */
    model?: Model;

    /** A suitcase's pull height; drawn from the seed when absent. */
    pull?: Pull;

    /** The model's id, unique in a scene; `bag` when absent. */
    id?: string;

    /** The mass of what the bag holds, kilograms: up to 16 for a tote, a backpack, a briefcase, a toolbox, a handbag or a duffel and 27.7 for a suitcase; empty when absent. */
    load?: number;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The suitcases read: the two cabin limits, Lufthansa's and IATA's guide. */
  export type Model = "lufthansa" | "iata";

  /** Each kind's models whole, the default first: a suitcase's height x width x depth, Lufthansa's carry-on limit 55 x 40 x 23 cm (https://www.lufthansa.com/us/en/carry-on-baggage) and IATA's 56 x 45 x 25 cm guide (https://www.iata.org/en/programs/ops-infra/baggage/passenger-baggage-rules/). */
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

  /** Each kind's pull heights, the default first: 100 and 110 cm, tested in Industrial Health 45(6):756-765, 2007 (https://www.jstage.jst.go.jp/article/indhealth/45/6/45_6_756/_article). */
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
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    tote: {
      width: ArchetypeBand.metres(
        9.5 * ArchetypeUnits.INCH,
        17 * ArchetypeUnits.INCH,
        TOTE,
        true,
      ),
      height: ArchetypeBand.metres(
        10.5 * ArchetypeUnits.INCH,
        15 * ArchetypeUnits.INCH,
        TOTE,
        true,
      ),
      depth: ArchetypeBand.metres(
        5 * ArchetypeUnits.INCH,
        7.5 * ArchetypeUnits.INCH,
        TOTE,
        true,
      ),
      handleDrop: ArchetypeBand.metres(
        6 * ArchetypeUnits.INCH,
        8 * ArchetypeUnits.INCH,
        TOTE,
        true,
      ),
      strapDrop: ArchetypeBand.metres(
        21.75 * ArchetypeUnits.INCH,
        25 * ArchetypeUnits.INCH,
        STRAP,
        true,
      ),
      handleDiameter: NIOSH_WEBBING,
      mass: ArchetypeBand.of("kg", 0.4, 0.9, ArchetypeBand.TYPICAL_MASS, true),
    },
    backpack: {
      width: ArchetypeBand.metres(
        0.27,
        13 * ArchetypeUnits.INCH,
        BACKPACK,
        true,
      ),
      height: ArchetypeBand.metres(
        0.38,
        16.7 * ArchetypeUnits.INCH,
        BACKPACK,
        true,
      ),
      depth: ArchetypeBand.metres(
        0.13,
        8.5 * ArchetypeUnits.INCH,
        BACKPACK,
        true,
      ),
      handleDiameter: NIOSH_WEBBING,
      mass: ArchetypeBand.of("kg", 0.3, 0.3, BACKPACK, true),
    },
    suitcase: {
      handleDiameter: NIOSH_HANDLE,
      mass: ArchetypeBand.of(
        "kg",
        3.2,
        4.3,
        "Rimowa Essential and Classic Cabin, 3.2 and 4.3 kg, product pages seen only in search results",
        true,
      ),
    },
    briefcase: {
      width: ArchetypeBand.metres(0.415, 0.452, ATTACHE, true),
      height: ArchetypeBand.metres(0.35, 0.394, ATTACHE, true),
      depth: ArchetypeBand.metres(0.085, 0.147, ATTACHE, true),
      handleDiameter: NIOSH_HANDLE,
      mass: ArchetypeBand.of("kg", 2.3, 2.95, ATTACHE, true),
    },
    toolbox: {
      width: ArchetypeBand.metres(0.482, 0.482, TOOLBOX),
      height: ArchetypeBand.metres(0.25, 0.25, TOOLBOX),
      depth: ArchetypeBand.metres(0.254, 0.254, TOOLBOX),
      handleDiameter: NIOSH_HANDLE,
      mass: ArchetypeBand.of("kg", 1.5, 1.5, TOOLBOX, true),
    },
    handbag: {
      width: ArchetypeBand.metres(0.3, 0.3, HANDBAG),
      height: ArchetypeBand.metres(0.28, 0.28, HANDBAG),
      depth: ArchetypeBand.metres(0.2, 0.2, HANDBAG),
      handleDrop: ArchetypeBand.metres(0.11, 0.12, HANDBAG, true),
      handleDiameter: NIOSH_HANDLE,
      mass: ArchetypeBand.of("kg", 0.24, 0.24, HANDBAG, true),
    },
    duffel: {
      width: ArchetypeBand.metres(
        25 * ArchetypeUnits.INCH,
        25 * ArchetypeUnits.INCH,
        DUFFEL,
        true,
      ),
      height: ArchetypeBand.metres(
        14 * ArchetypeUnits.INCH,
        14 * ArchetypeUnits.INCH,
        DUFFEL,
        true,
      ),
      depth: ArchetypeBand.metres(
        14 * ArchetypeUnits.INCH,
        14 * ArchetypeUnits.INCH,
        DUFFEL,
        true,
      ),
      handleDiameter: NIOSH_HANDLE,
      mass: ArchetypeBand.of("kg", 1.62, 1.62, DUFFEL, true),
    },
  };
}
