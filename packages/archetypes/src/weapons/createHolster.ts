import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeRefusal,
  type IArchetypeBand,
} from "../core";

/** A duty-gear maker's description of holster ride heights. */
const RIDE: string =
  "Safariland, Holster Ride Options: mid-ride puts the pistol's butt level with the belt, low and high ride about 1.5 in lower and higher (https://inside.safariland.com/education/holster-ride-options/)";

/** A scabbard maker's rule of fit, read. */
const WULFLUND: string =
  "Wulflund's wood-core scabbard, made to the sword at about 1.5 cm longer and 2 cm wider than the blade (https://www.wulflund.com/weapons/swords/sword-accessories/scabbard-with-a-wooden-core.html)";

/** What no scabbard maker read gives. */
const UNREAD: string =
  "no scabbard's thickness or weight was found in the makers' pages read";

/** Back quivers, seen only in search results. */
const QUIVER: string =
  "back quivers 18 to 22.5 in deep (Bear Archery, Martin Flint, Vista Honcho) and 3.5 in across (Dark Knight Armoury), capacities to 50 arrows (TOPARCHERY), and 20 in quivers weighing 0.62 kg (MAYARMS) and 1.5 lb (CH Narchery), seen only in search results";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createHolster.Kind, string>> = {
  holster: "belt holster",
  scabbard: "scabbard",
  sheath: "sheath",
  quiver: "quiver",
};

/**
 * A container worn on the body that a weapon or its ammunition is drawn from and returned to: a belt holster for a handgun, a sword's scabbard, a knife's or a dagger's sheath, or an archer's quiver. A cartridge pouch waits for a source of its weight.
 *
 * Each hangs with the wearer's body on its `-X` side and its front toward `+Z`; `belt` is the loop or hanger it hangs by, facing the wearer. The item in it is a separate prop: the container declares where that item sits, and the act takes it. How each kind stands:
 *
 * - a holster hangs with the middle of its belt loop at the origin. Its `socket` is the mouth the pistol is drawn from and returned to, facing up, lowered or raised from the belt line by the `ride` dimension. It marks where the pistol's butt leaves the mouth; a holstered pistol lies muzzle down in the pouch, which the holstering act places, and no frame of `createHandgun` seats coincident on the socket to give that.
 * - a scabbard and a sheath stand on their tip (the chape) at the origin, the mouth straight up along `+Y` at the drawn length, the blade's flats toward `X`. `mouth` is the opening, facing up: a sheathed blade stands point down in it with its shoulder (`createSword`'s origin) on the mouth. `belt` is the hanger on the metal throat below the mouth. A throat held while the blade is drawn waits for a source of the throat's size. Its hanging angle is not modelled: it hangs straight, since no source read gives the angle a hanger sets.
 * - a quiver stands on its bottom at the origin, a tube open upward. `socket` is the mouth, facing up, and `slot1` to `slot<slots>` the places the arrows stand in it, each facing up on the mouth's plane; `belt` hangs it at a hip from its rim, and `strap` slings it across the back at its middle.
 *
 * @param params The kind, the number of slots of a quiver, and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The container.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or a number of slots that is not a whole number from 1 to the kind's capacity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind hangs and stands, what each contact is and where a carried item sits.
 * @evidence contracts/development/implementation.md#principled-implementation A holster as a pouch box under a belt loop box with the socket at the maker's ride offset; a scabbard as one body box and a throat box; a quiver as one tube with its arrows' places spread over the mouth on Vogel's sunflower spiral, the even packing of points in a disc.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the slots, draw the dimensions, then one branch per kind: its parts, then its contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No retention strap, cant, hanging angle, buckle or stitching; a scabbard is straight and does not taper or curve with a sabre's blade. The scabbard's throat's length and lip are the shipped scabbard's construction estimates, which only its belt hanger's offset reads, as it did; a quiver's hangers sit at its rim and its middle.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts, and one contact per slot.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHolster(
  params: createHolster.IParams = {},
  seed?: number | string,
): Archetype<createHolster.Affordance, createHolster.Dimension> {
  const kind: createHolster.Kind = ArchetypeDraw.choice(
    "holster",
    "kind",
    params.kind ?? "holster",
    createHolster.KINDS,
  );

  // The slots a quiver holds, from one to the most its source holds.
  const slotted: createHolster.ISlots | undefined = createHolster.SLOTS[kind];
  const capacity: number | undefined = slotted?.capacity;
  const slots: number =
    slotted === undefined ? 0 : (params.slots ?? slotted.slots);
  if (
    params.slots !== undefined &&
    (capacity === undefined ||
      !Number.isInteger(params.slots) ||
      params.slots < 1 ||
      params.slots > capacity)
  )
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "holster",
      axis: "slots",
      value: params.slots,
      feasible:
        capacity === undefined
          ? { kind: "alternatives", values: ["quiver"] }
          : { kind: "range", minimum: 1, maximum: capacity, unit: "" },
      reason:
        capacity === undefined
          ? `a ${kind} has no slots`
          : `a ${kind} holds 1 to ${capacity}, not ${params.slots}`,
      fix:
        capacity === undefined
          ? "leave slots out, or choose a quiver"
          : "give a whole number of slots",
    });
  const d: Partial<Record<createHolster.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "holster",
      createHolster.BANDS[kind],
      seed,
      params,
      createHolster.BANDS,
    );
  const builder: ArchetypeBuilder<
    createHolster.Affordance,
    createHolster.Dimension
  > = new ArchetypeBuilder({
    archetype: "holster",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const facingWearer = (at: IAutoMovieVector3): IAutoMovieTransform =>
    ArchetypeFrame.facing(at, v(-1, 0, 0), v(0, 0, 1));

  if (kind === "holster") {
    builder.box("loop", v(0.01, 0.06, 0.06), v(0, 0, 0), {
      color: "#2c2f33",
    });
    builder.box(
      "pouch",
      v(0.04, d.depth!, 0.07),
      v(0.025, d.ride! - d.depth! / 2, 0),
      { color: "#2c2f33" },
    );
    builder.affordance({
      id: "socket",
      kind: "socket",
      frame: ArchetypeFrame.upright(v(0.025, d.ride!, 0)),
      extent: null,
    });
    builder.affordance({
      id: "belt",
      kind: "hook",
      frame: facingWearer(v(0, 0, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  if (kind === "scabbard" || kind === "sheath") {
    const length: number = d.length!;
    const throat: number = createHolster.THROAT;
    const thick: number = d.thickness! + createHolster.THROAT_LIP;
    builder.box(
      "body",
      v(d.thickness!, length - throat, d.width!),
      v(0, (length - throat) / 2, 0),
      { color: "#4a3426" },
    );
    builder.box(
      "throat",
      v(thick, throat, d.width! + createHolster.THROAT_LIP),
      v(0, length - throat / 2, 0),
      { color: "#8a8d91" },
    );
    builder.affordance({
      id: "mouth",
      kind: "socket",
      frame: ArchetypeFrame.upright(v(0, length, 0)),
      extent: null,
    });
    builder.affordance({
      id: "belt",
      kind: "hook",
      frame: facingWearer(v(-thick / 2, length - throat / 2, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  // A quiver: a tube standing on its bottom, open at the top.
    const length: number = d.length!;
    const r: number = d.diameter! / 2;
    builder.rod("tube", r, v(0, 0, 0), v(0, length, 0), { color: "#6b4a2b" });
    builder.affordance({
      id: "socket",
      kind: "socket",
      frame: ArchetypeFrame.upright(v(0, length, 0)),
      extent: null,
    });

    // The arrows' places on Vogel's spiral: the k-th at radius r sqrt((k + 1/2) / n) and k golden angles round, so they spread evenly over the mouth.
    const golden: number = Math.PI * (3 - Math.sqrt(5));
    for (let k: number = 0; k < slots; k++) {
      const radius: number = r * Math.sqrt((k + 0.5) / slots);
      builder.affordance({
        id: `slot${k + 1}`,
        kind: "socket",
        frame: ArchetypeFrame.upright(
          v(
            radius * Math.cos(golden * k),
            length,
            radius * Math.sin(golden * k),
          ),
        ),
        extent: null,
      });
    }
    builder.affordance({
      id: "belt",
      kind: "hook",
      frame: facingWearer(v(-r, length, 0)),
      extent: null,
    });
    builder.affordance({
      id: "strap",
      kind: "hook",
      frame: facingWearer(v(-r, length / 2, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createHolster}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the five carriers and one cited band per dimension per kind; a carrier's slots are numbered contacts, so each item's place is a contact an act names.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The opening and the item places a draw reads and the hangers it is worn by (#3374, #3485). A scabbard and a sheath keep the `mouth` and `belt` the shipped scabbard had.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each container is a kind of one producer, not a producer per weapon; the holster is the default kind, so a call without a kind builds the holster as before. Bands a source read gives are cited; the others are provisional with their search, and the throat, the flap and the hangers are named estimates.
 */
export namespace createHolster {
  /** The kinds: a handgun's belt holster, a sword's scabbard, a knife's or a dagger's sheath, and an archer's quiver. */
  export type Kind = "holster" | "scabbard" | "sheath" | "quiver";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "holster",
    "scabbard",
    "sheath",
    "quiver",
  ];

  /** A scabbard's metal throat at the mouth, its length along the scabbard, metres: an estimate. */
  export const THROAT: number = 0.05;

  /** How much wider and thicker the throat is than the body, metres: an estimate. */
  export const THROAT_LIP: number = 0.006;

  /**
   * How many items a kind with slots holds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each member counts.
   * @evidence contracts/development/design.md#principled-representation A kind's whole-number capacity and its count when none is asked, kept together so a kind has both or neither.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `createHolster` to admit and default the `slots` parameter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member, so a kind with slots states both numbers.
   */
  export interface ISlots {
    /** The most it holds. */
    capacity: number;

    /** How many it holds when none are asked. */
    slots: number;
  }

  /** The slots of the kinds that have them: a quiver at most the 50 arrows the largest capacity seen claims, a dozen when none are asked, as #3485 places. */
  export const SLOTS: Readonly<Partial<Record<Kind, ISlots>>> = {
    quiver: { capacity: 50, slots: 12 },
  };

  /**
   * The affordance ids:
   *
   * - `socket`: a holster's or a quiver's mouth, facing up.
   * - `mouth`: a scabbard's or a sheath's opening, facing up.
   * - `belt`: the hanger, facing the wearer on `-X`.
   * - `strap`: a quiver's sling, facing the wearer.
   * - `slot1` to `slot<slots>`: where each arrow stands, facing up.
   */
  export type Affordance =
    | "socket"
    | "mouth"
    | "belt"
    | "strap"
    | `slot${number}`;

  /**
   * The free dimensions, metres unless stated:
   *
   * - `ride`: a holster's mouth above the belt line; negative below it.
   * - `depth`: a holster's pouch from its mouth down.
   * - `length`: a scabbard's or a sheath's from the tip to the mouth; a quiver's from its bottom to its mouth.
   * - `width`: across a scabbard's blade from edge to back, along `Z`.
   * - `thickness`: across a scabbard's flats, along `X`.
   * - `diameter`: a quiver's.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "ride"
    | "depth"
    | "length"
    | "width"
    | "thickness"
    | "diameter"
    | "mass";

  /** The parameters: the kind, the slots, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier; `holster` when absent. */
    kind?: Kind;

    /** How many arrows a quiver holds, 1 to its `SLOTS` capacity, and that table's count when absent. The other kinds have none. */
    slots?: number;

    /** The model's id, unique in a scene; `holster` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    holster: {
      ride: ArchetypeBand.of("m", -0.038, 0.038, RIDE),
      depth: ArchetypeBand.of(
        "m",
        0.12,
        0.16,
        "pouch depth for a 102 to 119 mm barrel, an estimate",
        true,
      ),
      mass: ArchetypeBand.of("kg", 0.15, 0.3, ArchetypeBand.TYPICAL_MASS, true),
    },
    scabbard: {
      length: ArchetypeBand.metres(
        0.7779 + 0.015,
        1.04 + 0.015,
        `${WULFLUND}, on createSword's arming sword to rapier blades of 0.7779 to 1.04 m`,
      ),
      width: ArchetypeBand.metres(
        0.025 + 0.02,
        0.0556 + 0.02,
        `${WULFLUND}, on createSword's rapier to arming sword blades of 25 to 55.6 mm`,
      ),
      thickness: ArchetypeBand.metres(0.015, 0.025, UNREAD, true),
      mass: ArchetypeBand.of("kg", 0.3, 0.6, UNREAD, true),
    },
    sheath: {
      length: ArchetypeBand.metres(
        0.178 + 0.015,
        0.36 + 0.015,
        `${WULFLUND}, on createSword's knife to dagger blades of 0.178 to 0.36 m`,
      ),
      width: ArchetypeBand.metres(
        0.02 + 0.02,
        0.032 + 0.02,
        `${WULFLUND}, on createSword's dagger to knife blades of 20 to 32 mm`,
      ),
      thickness: ArchetypeBand.metres(0.012, 0.02, UNREAD, true),
      mass: ArchetypeBand.of("kg", 0.05, 0.15, UNREAD, true),
    },
    quiver: {
      length: ArchetypeBand.metres(18 * 0.0254, 22.5 * 0.0254, QUIVER, true),
      diameter: ArchetypeBand.metres(3.5 * 0.0254, 3.5 * 0.0254, QUIVER, true),
      mass: ArchetypeBand.of("kg", 0.62, 0.68, QUIVER, true),
    },
  };
}
