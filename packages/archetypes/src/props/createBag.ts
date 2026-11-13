import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeRefusal,
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

/** Cabin baggage limits. */
const CABIN: string =
  "Lufthansa carry-on limit 55 x 40 x 23 cm (https://www.lufthansa.com/us/en/carry-on-baggage) up to IATA's 56 x 45 x 25 cm guide (https://www.iata.org/en/programs/ops-infra/baggage/passenger-baggage-rules/)";

/** The handle heights a luggage-pulling study tested. */
const PULL: string =
  "handle heights of 100 and 110 cm tested in a luggage-pulling study, Industrial Health 45(6):756-765, 2007 (https://www.jstage.jst.go.jp/article/indhealth/45/6/45_6_756/_article)";

/** The greatest load each kind may carry, kilograms: HSE's 16 kg for a load held close below the elbow by a woman (INDG143, Figure 1, https://www.hse.gov.uk/pubns/indg143.pdf) for a carried bag, and for a suitcase IATA's 32 kg piece limit (https://www.iata.org/en/programs/ops-infra/baggage/passenger-baggage-rules/) less the heaviest empty case of 4.3 kg, rounded down. */
const LOADS: Readonly<Record<createBag.Kind, number>> = {
  tote: 16,
  backpack: 16,
  suitcase: 27,
};

/**
 * A carried bag: a tote with handles and a shoulder strap, a backpack, or a cabin suitcase with a telescopic handle.
 *
 * The bag stands on its base at the origin, its wide face toward `+Z`; a backpack's straps are on its `-Z` face, against the back of a wearer who faces `-Z`. A suitcase's pull handle is a part on the `telescope` slider, so drawing it out raises it to the height it is pulled at.
 *
 * @param params The kind, the load and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
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
  const d: Partial<Record<createBag.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "bag",
      createBag.BANDS[kind],
      seed,
      params,
      createBag.BANDS,
    );
  const width: number = d.width!;
  const height: number = d.height!;
  const depth: number = d.depth!;
  const builder: ArchetypeBuilder<createBag.Affordance, createBag.Dimension> =
    new ArchetypeBuilder({
      archetype: "bag",
      id: params.id,
      name: kind,
      dimensions: d,
    });
  builder.box(
    "body",
    Vector3.create(width, height, depth),
    Vector3.create(0, height / 2, 0),
    { color: kind === "suitcase" ? "#3d4a5c" : "#b08d57" },
  );
  const bar: number = 0.012;

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
  } else {
    // A suitcase: a carry handle on top, and a pull bar on two posts that slide up out of the back.
    carry("handle", height + 0.03, 0.12);
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
  export type Kind = "tote" | "backpack" | "suitcase";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["tote", "backpack", "suitcase"];

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
   * - `handleDrop`: the top of a tote's handles above its body.
   * - `strapDrop`: the top of a tote's shoulder strap above its body.
   * - `pullHeight`: a suitcase's pull bar above the floor when drawn out.
   * - `mass`: the empty bag, kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "depth"
    | "handleDrop"
    | "strapDrop"
    | "pullHeight"
    | "mass";

  /** The parameters: the kind, the load, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bag. */
    kind: Kind;

    /** The model's id, unique in a scene; `bag` when absent. */
    id?: string;

    /** The mass of what the bag holds, kilograms: up to 16 for a tote or a backpack and 27 for a suitcase; empty when absent. */
    load?: number;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    tote: {
      width: ArchetypeBand.metres(0.241, 0.432, TOTE, true),
      height: ArchetypeBand.metres(0.267, 0.381, TOTE, true),
      depth: ArchetypeBand.metres(0.127, 0.191, TOTE, true),
      handleDrop: ArchetypeBand.metres(0.127, 0.203, TOTE, true),
      strapDrop: ArchetypeBand.metres(0.53, 0.64, STRAP, true),
      mass: ArchetypeBand.of("kg", 0.4, 0.9, ArchetypeBand.TYPICAL_MASS, true),
    },
    backpack: {
      width: ArchetypeBand.metres(0.27, 0.33, BACKPACK, true),
      height: ArchetypeBand.metres(0.38, 0.42, BACKPACK, true),
      depth: ArchetypeBand.metres(0.13, 0.21, BACKPACK, true),
      mass: ArchetypeBand.of("kg", 0.3, 0.3, BACKPACK, true),
    },
    suitcase: {
      width: ArchetypeBand.metres(0.4, 0.45, CABIN),
      height: ArchetypeBand.metres(0.55, 0.56, CABIN),
      depth: ArchetypeBand.metres(0.23, 0.25, CABIN),
      pullHeight: ArchetypeBand.metres(1, 1.1, PULL),
      mass: ArchetypeBand.of(
        "kg",
        3.2,
        4.3,
        "Rimowa Essential and Classic Cabin, 3.2 and 4.3 kg, product pages seen only in search results",
        true,
      ),
    },
  };
}
