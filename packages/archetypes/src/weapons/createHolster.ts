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
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeRefusal,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { createSword } from "./createSword";

/** A scabbard maker's rule of fit, read. */
const WULFLUND: string =
  "Wulflund's wood-core scabbard, made to the sword at about 1.5 cm longer and 2 cm wider than the blade (https://www.wulflund.com/weapons/swords/sword-accessories/scabbard-with-a-wooden-core.html)";

/** How much longer and wider than its blade a scabbard or a sheath is made, metres: Wulflund's 1.5 and 2 cm. */
const FIT: Readonly<{ length: number; width: number }> = {
  length: 0.015,
  width: 0.02,
};

/** A scabbard's or a sheath's length and width made to one of `createSword`'s read swords, whole. */
const madeTo = (
  name: string,
  sword: Readonly<Partial<Record<createSword.Dimension, number>>>,
): createHolster.Fitted => ({
  length: ArchetypeBand.metres(
    sword.bladeLength! + FIT.length,
    sword.bladeLength! + FIT.length,
    `${WULFLUND}, on the ${name}'s read ${sword.bladeLength} m blade`,
  ),
  width: ArchetypeBand.metres(
    sword.bladeWidth! + FIT.width,
    sword.bladeWidth! + FIT.width,
    `${WULFLUND}, on the ${name}'s read ${sword.bladeWidth} m blade width`,
  ),
});

/** A scabbard's or a sheath's length and width made to a blade of one of `createSword`'s kinds, its bands moved out by the fit, provisional where the blade's are. */
const madeFor = (kind: createSword.Kind): createHolster.Fitted => {
  const blade: Readonly<
    Partial<Record<createSword.Dimension, IArchetypeBand>>
  > = createSword.BANDS[kind];
  const length: IArchetypeBand = blade.bladeLength!;
  const width: IArchetypeBand = blade.bladeWidth!;
  return {
    length: ArchetypeBand.metres(
      length.minimum + FIT.length,
      length.maximum + FIT.length,
      `${WULFLUND}, on ${length.source}`,
      length.provisional,
    ),
    width: ArchetypeBand.metres(
      width.minimum + FIT.width,
      width.maximum + FIT.width,
      `${WULFLUND}, on ${width.source}`,
      width.provisional,
    ),
  };
};

/** What no scabbard maker read gives. */
const UNREAD: string =
  "no scabbard's thickness or weight was found in the makers' pages read";

/** Back quivers, seen only in search results. */
const QUIVER: string =
  "back quivers 18 to 22.5 in deep (Bear Archery, Martin Flint, Vista Honcho) and 3.5 in across (Dark Knight Armoury), capacities to 50 arrows (TOPARCHERY), and 20 in quivers weighing 0.62 kg (MAYARMS) and 1.5 lb (CH Narchery), seen only in search results";

/** The US infantry cartridge box of 1841, read at the Ordnance Manual's page images. */
const BOX: string =
  "the 1841 Ordnance Manual, the infantry cartridge box: 7.7 in long, 1.6 in wide, 5.8 in deep at the front, its flap 8.5 in wide at the bottom; two tins, each with a lower part 3 x 3.3 in for a bundle of 10 cartridges and two upper parts 2.7 in deep, 2 x 1.35 in for 6 and 1.35 in square for 4, 40 rounds in all, p. 140 (https://archive.org/details/vol1841ordnancem00unit)";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createHolster.Kind, string>> = {
  holster: "belt holster",
  scabbard: "scabbard",
  sheath: "sheath",
  quiver: "quiver",
  pouch: "cartridge box",
};

/**
 * A container worn on the body that a weapon or its ammunition is drawn from and returned to: a belt holster for a handgun, a sword's scabbard, a knife's or a dagger's sheath, an archer's quiver, or a soldier's cartridge box.
 *
 * Each hangs with the wearer's body on its `-X` side and its front toward `+Z`; `belt` is the loop or hanger it hangs by, facing the wearer. The item in it is a separate prop: the container declares where that item sits, and the act takes it. How each kind stands:
 *
 * - a holster hangs with the middle of its belt loop at the origin. Its `socket` is the mouth the pistol is drawn from and returned to, facing up, lowered or raised from the belt line by the `ride` dimension. It marks where the pistol's butt leaves the mouth; a holstered pistol lies muzzle down in the pouch, which the holstering act places, and no frame of `createHandgun` seats coincident on the socket to give that.
 * - a scabbard and a sheath stand on their tip (the chape) at the origin, the mouth straight up along `+Y` at the drawn length, the blade's flats toward `X`. `mouth` is the opening, facing up: a sheathed blade stands point down in it with its shoulder (`createSword`'s origin) on the mouth. `belt` is the hanger on the metal throat below the mouth. A throat held while the blade is drawn waits for a source of the throat's size. Its hanging angle is not modelled: it hangs straight, since no source read gives the angle a hanger sets.
 * - a quiver stands on its bottom at the origin, a tube open upward. `socket` is the mouth, facing up, and `slot1` to `slot<slots>` the places the arrows stand in it, each facing up on the mouth's plane; `belt` hangs it at a hip from its rim, and `strap` slings it across the back at its middle.
 * - a cartridge box stands on its bottom at the origin, its back against the wearer at `x = 0`, its length along `Z`. Its two tins' upper parts hold the loose cartridges standing: `slot1` to `slot<slots>` are their places, facing up at the box's top, the 2 x 1.35 in part's 6 in three rows of two and the 1.35 in square part's 4 in two of two. The `lid`, its flap, turns up and outward on a hinge along the box's back top edge; `strap` is the shoulder belt's loops at its back, and `belt` the same loops on a waist belt.
 *
 * @param params The kind, a holster's ride, the blade a scabbard or a sheath is made to, the number of slots of a quiver, and any dimension the author fixes.
 * @param seed The seed that picks the ride and the blade left free and draws every dimension left free inside its band; absent, the first ride, the first blade and the middle of each band.
 * @returns The container.
 * @throws {ArchetypeRefusal} For a ride or a blade not of the kind, a fixed dimension outside its band or one the ride gives, or a number of slots that is not a whole number from 1 to the kind's capacity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind hangs and stands, what each contact is and where a carried item sits.
 * @evidence contracts/development/implementation.md#principled-implementation A holster as a pouch box under a belt loop box with the socket at one of the maker's ride offsets; a scabbard as one body box and a throat box, as long and as wide as the blade it is made to with the maker's fit; a quiver as one tube with its arrows' places spread over the mouth on Vogel's sunflower spiral, the even packing of points in a disc.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the slots, pick the ride or the blade, draw the other dimensions, then one branch per kind: its parts, then its contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No retention strap, cant, hanging angle, buckle or stitching; a scabbard is straight and does not taper or curve with a sabre's blade. The scabbard's throat's length and lip are the shipped scabbard's construction estimates, which only its belt hanger's offset reads, as it did; a quiver's hangers sit at its rim and its middle.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts, and one contact per slot.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHolster(
  params: createHolster.IParams = {},
  seed?: number | string,
): Archetype<createHolster.Affordance, createHolster.Dimension> {
  const draw: ArchetypeDrawSession<createHolster.Dimension> =
    new ArchetypeDrawSession<createHolster.Dimension>(
      "holster",
      createHolster.UNITS,
      seed,
      params,
    );
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
  // A holster rides at one of the maker's three heights; a scabbard or a sheath is made to one blade, its length and width that blade's with the maker's fit.
  const ride: {
    figures: Readonly<Partial<Record<createHolster.Dimension, number>>>;
  } = draw.model<createHolster.Ride>(
    "model",
    params.model,
    createHolster.MODELS[kind],
  );
  const blades:
    | Readonly<Partial<Record<createHolster.Blade, createHolster.Fitted>>>
    | undefined =
    kind === "scabbard"
      ? createHolster.BLADES.scabbard
      : kind === "sheath"
        ? createHolster.BLADES.sheath
        : undefined;
  // The blade is picked by name; its fitted bands are what it gives, so it carries no figures.
  const blade: createHolster.Blade | undefined =
    draw.model<createHolster.Blade>(
      "blade",
      params.blade,
      blades === undefined
        ? undefined
        : (Object.fromEntries(
            Object.keys(blades).map(
              (name: string): [string, Readonly<Record<never, number>>] => [
                name,
                {},
              ],
            ),
          ) as Readonly<
            Record<
              createHolster.Blade,
              Readonly<Partial<Record<createHolster.Dimension, number>>>
            >
          >),
    ).name;
  const fitted: Readonly<
    Partial<Record<createHolster.Dimension, IArchetypeBand>>
  > = blade === undefined || blades === undefined ? {} : blades[blade]!;
  const d: Partial<Record<createHolster.Dimension, number>> = {
    ...draw.dimensions(
      { ...createHolster.BANDS[kind], ...fitted },
      {
        ...createHolster.BANDS,
        ...createHolster.BLADES.scabbard,
        ...createHolster.BLADES.sheath,
      },
    ),
    ...ride.figures,
  };
  const builder: ArchetypeBuilder<
    createHolster.Affordance,
    createHolster.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: NAMES[kind],
    draw,
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

  if (kind === "pouch") {
    // A cartridge box: the box on its bottom, its back to the wearer, the flap on a hinge along its back top edge.
    const length: number = d.length!;
    const deep: number = d.depth!;
    const thick: number = d.thickness!;
    builder.box("box", v(thick, deep, length), v(thick / 2, deep / 2, 0), { color: "#1f1a17" });
    builder.box("lid", v(thick, createHolster.FLAP.thickness, d.width!), v(thick / 2, deep + createHolster.FLAP.thickness / 2, 0), { color: "#1f1a17" });
    builder.affordance({
      id: "lid",
      kind: "hinge",
      frame: ArchetypeFrame.facing(v(0, deep, 0), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      travel: createHolster.FLAP.open,
      parts: ["lid"],
    });
    // The cartridges' places: each tin's upper parts side by side along the box, the two tins with the box's spare length shared at both ends, each part's cells filled in rows along the box and columns across it.
    const tin: number = createHolster.TINS.parts.reduce((sum: number, part: { length: number }): number => sum + part.length, 0);
    const spare: number = (length - createHolster.TINS.count * tin) / 2;
    const places: IAutoMovieVector3[] = [];
    for (let t: number = 0; t < createHolster.TINS.count; t++) {
      let start: number = -length / 2 + spare + t * tin;
      for (const part of createHolster.TINS.parts) {
        for (let row: number = 0; row < part.rows; row++)
          for (let column: number = 0; column < part.columns; column++)
            places.push(
              v(
                (thick - part.across) / 2 + ((column + 0.5) * part.across) / part.columns,
                deep,
                start + ((row + 0.5) * part.length) / part.rows,
              ),
            );
        start += part.length;
      }
    }
    places.slice(0, slots).forEach((at: IAutoMovieVector3, k: number): void => {
      builder.affordance({
        id: `slot${k + 1}`,
        kind: "socket",
        frame: ArchetypeFrame.upright(at),
        extent: null,
      });
    });
    builder.affordance({ id: "strap", kind: "hook", frame: facingWearer(v(0, deep / 2, 0)), extent: null });
    builder.affordance({ id: "belt", kind: "hook", frame: facingWearer(v(0, deep / 2, 0)), extent: null });
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
        v(radius * Math.cos(golden * k), length, radius * Math.sin(golden * k)),
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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each container is a kind of one producer, not a producer per weapon; the holster is the default kind, so a call without a kind builds the holster as before. Bands a source read gives are cited; the others are provisional with their search, and the throat, the flap and the hangers are named estimates. A ride is one of the maker's three, and a scabbard is made to one blade, a read sword whole or a kind whose source states a range, never to a length between two swords.
 */
export namespace createHolster {
  /** The kinds: a handgun's belt holster, a sword's scabbard, a knife's or a dagger's sheath, and an archer's quiver. */
  export type Kind = "holster" | "scabbard" | "sheath" | "quiver" | "pouch";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "holster",
    "scabbard",
    "sheath",
    "quiver",
    "pouch",
  ];

  /**
   * A cartridge box's tins' upper parts, read at the 1841 Ordnance Manual: each tin has two, 2.7 in deep, one 2 x 1.35 in for 6 cartridges and one 1.35 in square for 4, and the box holds two tins. `cells` gives each part's cartridges as rows along the box's length by columns across it, the arrangement that fills each part's read size with its read count.
   */
  export const TINS: Readonly<{
    count: number;
    parts: readonly Readonly<{ length: number; across: number; rows: number; columns: number }>[];
  }> = {
    count: 2,
    parts: [
      { length: 2 * ArchetypeUnits.INCH, across: 1.35 * ArchetypeUnits.INCH, rows: 3, columns: 2 },
      { length: 1.35 * ArchetypeUnits.INCH, across: 1.35 * ArchetypeUnits.INCH, rows: 2, columns: 2 },
    ],
  };

  /** A cartridge box's flap's opening, degrees, and its thickness, metres: estimates, the manual giving the flap's width only (searched: the 1841 and 1850 Ordnance Manuals; records-cartridge-pouch.md). */
  export const FLAP: Readonly<{ open: number; thickness: number }> = { open: 150, thickness: 0.004 };

  /** A scabbard's metal throat at the mouth, its length along the scabbard, metres: an estimate. */
  export const THROAT: number = 0.05;

  /** How much wider and thicker the throat is than the body, metres: an estimate. */
  export const THROAT_LIP: number = 0.006;

  /**
   * How many items a kind with slots holds: its whole-number capacity and its count when none is asked, kept together with no optional member so a kind has both or neither; read by `createHolster` to admit and default the `slots` parameter.
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
    pouch: { capacity: 20, slots: 20 },
  };

  /**
   * The affordance ids:
   *
   * - `socket`: a holster's or a quiver's mouth, facing up.
   * - `mouth`: a scabbard's or a sheath's opening, facing up.
   * - `belt`: the hanger, facing the wearer on `-X`.
   * - `strap`: a quiver's sling, facing the wearer.
   * - `slot1` to `slot<slots>`: where each arrow stands in a quiver, or each loose cartridge in a cartridge box, facing up.
   * - `lid`: a cartridge box's flap, a hinge along its back top edge; a positive travel lifts it up and outward.
   */
  export type Affordance =
    | "socket"
    | "mouth"
    | "belt"
    | "strap"
    | "lid"
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

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    ride: "m",
    depth: "m",
    length: "m",
    width: "m",
    thickness: "m",
    diameter: "m",
    mass: "kg",
  };

  /** A holster's ride heights: Safariland's low, mid and high ride. */
  export type Ride = "midRide" | "lowRide" | "highRide";

  /** Each kind's rides whole, the default first: mid-ride puts the pistol's butt level with the belt, low and high ride about 1.5 in lower and higher (Safariland, Holster Ride Options, https://inside.safariland.com/education/holster-ride-options/). */
  export const MODELS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Ride, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    holster: {
      midRide: { ride: 0 },
      lowRide: { ride: -1.5 * ArchetypeUnits.INCH },
      highRide: { ride: 1.5 * ArchetypeUnits.INCH },
    },
  };

  /** The blades a scabbard is made to: `createSword`'s read longswords and arming swords, and a sabre, a katana and a rapier. */
  export type ScabbardBlade =
    | "crecy"
    | "regent"
    | "knight"
    | "poitiers"
    | "sabre"
    | "katana"
    | "rapier";

  /** The blades a sheath is made to: `createSword`'s dagger and knife. */
  export type SheathBlade = "dagger" | "knife";

  /** A blade a scabbard or a sheath is made to. */
  export type Blade = ScabbardBlade | SheathBlade;

  /** A scabbard's or a sheath's two bands made to one blade, both always given: `length` from the tip to the mouth and `width` across the blade from edge to back, each the blade's with the fit. */
  export type Fitted = Readonly<Record<"length" | "width", IArchetypeBand>>;

  /** The blades by kind, the default first, each made with Wulflund's fit: a read sword's figures whole, or a kind's blade bands moved out, provisional where the blade's are. */
  export const BLADES: Readonly<{
    scabbard: Readonly<Record<ScabbardBlade, Fitted>>;
    sheath: Readonly<Record<SheathBlade, Fitted>>;
  }> = {
    scabbard: {
      crecy: madeTo("Crecy", createSword.MODELS.longsword!.crecy!),
      regent: madeTo("Regent", createSword.MODELS.longsword!.regent!),
      knight: madeTo("Knight", createSword.MODELS.armingSword!.knight!),
      poitiers: madeTo("Poitiers", createSword.MODELS.armingSword!.poitiers!),
      sabre: madeFor("sabre"),
      katana: madeFor("katana"),
      rapier: madeFor("rapier"),
    },
    sheath: {
      dagger: madeFor("dagger"),
      knife: madeFor("knife"),
    },
  };

  /** The parameters: the kind, a holster's ride, a scabbard's or a sheath's blade, the slots, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier; `holster` when absent. */
    kind?: Kind;

    /** A holster's ride; picked from the seed when absent. The other kinds have none. */
    model?: Ride;

    /** The blade a scabbard or a sheath is made to; picked from the seed when absent. The other kinds have none. */
    blade?: Blade;

    /** How many arrows a quiver holds, 1 to its `SLOTS` capacity, and that table's count when absent. The other kinds have none. */
    slots?: number;

    /** The model's id, unique in a scene; `holster` when absent. */
    id?: string;
  }

  /** The band of each free dimension a ride or a blade leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    holster: {
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
      thickness: ArchetypeBand.metres(0.015, 0.025, UNREAD, true),
      mass: ArchetypeBand.of("kg", 0.3, 0.6, UNREAD, true),
    },
    sheath: {
      thickness: ArchetypeBand.metres(0.012, 0.02, UNREAD, true),
      mass: ArchetypeBand.of("kg", 0.05, 0.15, UNREAD, true),
    },
    quiver: {
      length: ArchetypeBand.metres(
        18 * ArchetypeUnits.INCH,
        22.5 * ArchetypeUnits.INCH,
        QUIVER,
        true,
      ),
      diameter: ArchetypeBand.metres(
        3.5 * ArchetypeUnits.INCH,
        3.5 * ArchetypeUnits.INCH,
        QUIVER,
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.62,
        1.5 * ArchetypeUnits.POUND,
        QUIVER,
        true,
      ),
    },
    pouch: {
      length: ArchetypeBand.metres(7.7 * ArchetypeUnits.INCH, 7.7 * ArchetypeUnits.INCH, BOX),
      thickness: ArchetypeBand.metres(1.6 * ArchetypeUnits.INCH, 1.6 * ArchetypeUnits.INCH, BOX),
      depth: ArchetypeBand.metres(5.8 * ArchetypeUnits.INCH, 5.8 * ArchetypeUnits.INCH, BOX),
      width: ArchetypeBand.metres(8.5 * ArchetypeUnits.INCH, 8.5 * ArchetypeUnits.INCH, `${BOX}: the flap's width at its bottom`),
      mass: ArchetypeBand.of(
        "kg",
        0.3,
        0.6,
        `${ArchetypeBand.TYPICAL_MASS}: an empty leather box with its two tins, an estimate; no empty weight is given (searched: the 1841, 1850 and 1861 Ordnance Manuals, Colonial Williamsburg; records-cartridge-pouch.md)`,
        true,
      ),
    },
  };
}
