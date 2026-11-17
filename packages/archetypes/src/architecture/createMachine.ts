import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The vending machines read. */
const MERCHANT: string =
  "Crane Merchant brochure: Merchant 4 1830 mm high, 813 mm deep, 895 mm wide; Merchant 6 1830 mm high, 813 mm deep, 1180 mm wide (https://vendtrade.co.uk/wp-content/uploads/2024/08/Crane_Merchant_Brochure.pdf)";

/** The pay station read. */
const STRADA: string =
  "Parkeon/Flowbird StradaPAL installation manual, p. 11: body 290 mm wide, 328 mm deep, 1488 mm high, on it a 90 mm spacer and a 226 mm top 475 mm wide and 379 mm deep (https://us.support.flowbird.group/hc/en-us/article_attachments/13368519985939)";

/** A pay station's head on its body, metres: the StradaPAL's 90 mm spacer and its 475 x 226 x 379 mm top. */
const HEAD: Readonly<{
  spacer: number;
  width: number;
  height: number;
  depth: number;
}> = { spacer: 0.09, width: 0.475, height: 0.226, depth: 0.379 };

/** The ATM read. */
const NCR: string =
  "NCR SelfServ 32 Site Preparation B006-6585-B000 (https://tranact.com/pdf/NCR-SS32-Site-Prep.pdf): p. 9, fascia 770 mm wide, 1575 mm high, 800 mm deep, shelf 763 mm high protruding 174 mm; pp. 14-15, heights from the base and depths from the shelf's front; pp. 17-18, each item's distance from the No. 5 key, drawn as a straight arrow on the fascia's front elevation, and its clock position, which gives only its side; the keypad on the centre line as drawn, not dimensioned";

/** An ATM's shelf, metres: its top 763 mm up, protruding 174 mm from the fascia (NCR SS32 p. 9). */
const SHELF: Readonly<{ height: number; out: number }> = {
  height: 763 * ArchetypeUnits.MILLIMETRE,
  out: 174 * ArchetypeUnits.MILLIMETRE,
};

/** An ATM's fascia items, from NCR's guide: each one's height from the base and depth from the shelf's front (pp. 14-15), and its distance on the front elevation and clock position from the No. 5 key (pp. 17-18), in millimetres and hours; the key itself is the origin, at no distance. */
const ITEMS: Readonly<
  Record<
    "key5" | "cardReader" | "cash" | "receipt",
    Readonly<{ height: number; depth: number; distance: number; clock: number }>
  >
> = {
  key5: { height: 786, depth: 89, distance: 0, clock: 0 },
  cardReader: { height: 1039, depth: 152, distance: 388, clock: 2 },
  cash: { height: 822, depth: 152, distance: 152, clock: 9 },
  receipt: { height: 1154, depth: 170, distance: 472, clock: 1 },
};

/** An ATM's 15 in touchscreen, from NCR's guide: its height from the base and depth from the shelf's front, millimetres (pp. 14-15), on the keypad's centre line as drawn. */
const SCREEN: Readonly<{ height: number; depth: number; size: number }> = {
  height: 1126,
  depth: 244,
  size: 381,
};

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `shelf`, an ATM shelf's thickness. */
const ESTIMATES: Readonly<{ shelf: number }> = { shelf: 0.03 };

/**
 * A public machine standing against a wall: a snack vending machine, a parking pay station or an ATM; an ATM carries its shelf and declares its keypad's No. 5 key, its slots and its screen at NCR's read places (see `atm`).
 *
 * The cabinet stands on the floor at the origin with its front toward `+Z`; a pay station's body carries its spacer and its wider head on top. `front` is the front, the face a person stands at, looks through, leans on or rocks; `side` is the `+X` side face, where it is pushed. Its keypad, coin slot and delivery bin are not declared, since no source read places them on the front; keying a selection is a keyed sequence with no motion law yet (#3446). A pay station's screen and payment slot are not declared either: the manual gives their heights, 1336 and 1210 mm to their tops, but not their sizes or places across the front.
 *
 * @param params The kind, a vending machine's model and any dimension the author fixes.
 * @param seed The seed that draws a vending machine's model when it is not given and every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The machine.
 * @throws {ArchetypeRefusal} For a model the brochure does not list or one named for another kind, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the machine stands, its contacts, and what is left out for want of a source with its missing law.
 * @evidence contracts/development/implementation.md#principled-implementation One cabinet of the maker's height and depth, a vending machine one of Crane's two Merchant models whole with its width, the two face frames on its faces.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick a vending machine's model, draw the dimensions, then the cabinet and the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The glass front and the spirals behind it are not modelled.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createMachine(
  params: createMachine.IParams,
  seed?: number | string,
): Archetype<createMachine.Affordance, createMachine.Dimension> {
  const draw: ArchetypeDrawSession<createMachine.Dimension> =
    new ArchetypeDrawSession<createMachine.Dimension>(
      "machine",
      createMachine.UNITS,
      seed,
      params,
    );
  const kind: createMachine.Kind = ArchetypeDraw.choice(
    "machine",
    "kind",
    params.kind,
    createMachine.KINDS,
  );
  const model: {
    name: createMachine.Model | undefined;
    figures: Readonly<Partial<Record<createMachine.Dimension, number>>>;
  } = draw.model<createMachine.Model>(
    "model",
    params.model,
    createMachine.MODELS[kind],
  );
  const d: Partial<Record<createMachine.Dimension, number>> = {
    ...draw.dimensions(createMachine.BANDS[kind], createMachine.BANDS),
    ...model.figures,
  };
  const builder: ArchetypeBuilder<
    createMachine.Affordance,
    createMachine.Dimension
  > = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name:
      kind === "payStation"
        ? "pay station"
        : kind === "atm"
          ? "cash machine"
          : `vending machine ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const width: number = d.width!;
  const height: number = d.height!;
  const depth: number = d.depth!;
  builder.box("cabinet", v(width, height, depth), v(0, height / 2, 0), {
    color: kind === "payStation" ? "#2b5797" : "#b3202a",
    density: 0.4,
  });
  if (kind === "atm") atm(builder, width, depth);
  if (kind === "payStation") {
    builder.box(
      "spacer",
      v(width, HEAD.spacer, depth),
      v(0, height + HEAD.spacer / 2, 0),
      { color: "#2b5797" },
    );
    builder.box(
      "head",
      v(HEAD.width, HEAD.height, HEAD.depth),
      v(0, height + HEAD.spacer + HEAD.height / 2, 0),
      { color: "#2b5797" },
    );
  }
  builder.affordance({
    id: "front",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(0, height / 2, depth / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width,
    depth: height,
  });
  builder.affordance({
    id: "side",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(width / 2, height / 2, 0),
      v(1, 0, 0),
      v(0, 0, -1),
    ),
    extent: null,
    width: depth,
    depth: height,
  });
  return builder.build(d.mass!);
}

/**
 * Build an ATM's shelf and its fascia items' contacts: the shelf across the fascia's foot, and each item at its read height and depth, across the fascia from the No. 5 key by the remaining leg of its elevation distance after its height above the key, to the side its clock position names, the key on the centre line. `key5` is the No. 5 key, a button pressed along `-Z`; `cardReader`, `cash` and `receipt` are the slots, sockets whose `+Y` points out of the fascia; `screen` the touchscreen, a surface.
 *
 * @param builder The builder to fill.
 * @param width The fascia's width, metres.
 * @param depth The cabinet's depth, metres.
 */
function atm(
  builder: ArchetypeBuilder<createMachine.Affordance, createMachine.Dimension>,
  width: number,
  depth: number,
): void {
  const v: typeof Vector3.create = Vector3.create;
  const mm: number = ArchetypeUnits.MILLIMETRE;
  const front: number = depth / 2 + SHELF.out;
  builder.box(
    "shelf",
    v(width, ESTIMATES.shelf, SHELF.out),
    v(0, SHELF.height - ESTIMATES.shelf / 2, depth / 2 + SHELF.out / 2),
    { color: "#55595f" },
  );
  for (const [id, item] of Object.entries(ITEMS) as [
    keyof typeof ITEMS,
    (typeof ITEMS)[keyof typeof ITEMS],
  ][]) {
    // The elevation's straight distance is the hypotenuse over the read height difference; the clock position names only the side, 1 to 5 o'clock right (+X) as the fascia is faced and 7 to 11 left.
    const rise: number = item.height - ITEMS.key5.height;
    const side: number =
      item.clock >= 1 && item.clock <= 5
        ? 1
        : item.clock >= 7 && item.clock <= 11
          ? -1
          : 0;
    const at: ReturnType<typeof v> = v(
      side * Math.sqrt(Math.max(0, item.distance ** 2 - rise ** 2)) * mm,
      item.height * mm,
      front - item.depth * mm,
    );
    builder.affordance(
      id === "key5"
        ? {
            id,
            kind: "button",
            frame: ArchetypeFrame.facing(at, v(0, 0, 1), v(1, 0, 0)),
            extent: null,
          }
        : {
            id,
            kind: "socket",
            frame: ArchetypeFrame.facing(at, v(0, 0, 1), v(1, 0, 0)),
            extent: null,
          },
    );
  }
  builder.affordance({
    id: "screen",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(0, SCREEN.height * mm, front - SCREEN.depth * mm),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: SCREEN.size * mm,
  });
}

/**
 * Companion types and bands of {@link createMachine}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation A closed union of kinds and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The faces a person stands at and pushes (#3468 N3).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keys and slots no source places are left out rather than placed by guess.
 */
export namespace createMachine {
  /** The kinds of machine. */
  export type Kind = "vendingMachine" | "payStation" | "atm";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["vendingMachine", "payStation", "atm"];

  /**
   * The affordance ids:
   *
   * - `front`: the front face, `+Z`.
   * - `side`: the `+X` side face.
   * - `key5`, `cardReader`, `cash`, `receipt`, `screen`: an ATM's No. 5 key (a button), card reader, cash slot and receipt slot (sockets) and touchscreen (a surface), each at NCR's read place.
   */
  export type Affordance =
    | "front"
    | "side"
    | "key5"
    | "cardReader"
    | "cash"
    | "receipt"
    | "screen";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: the cabinet along `X`, `Y` and `Z`; a pay station's body, under its spacer and head; a vending machine's width is its model's.
   * - `mass`: the empty machine, kilograms.
   */
  export type Dimension = "width" | "height" | "depth" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    height: "m",
    depth: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which machine. */
    kind: Kind;

    /** A vending machine's model; drawn from the seed when absent. Other kinds have none. */
    model?: Model;

    /** The model's id, unique in a scene; `machine` when absent. */
    id?: string;
  }

  /** The vending machines read: Crane's Merchant 4 and Merchant 6, 895 and 1180 mm wide. */
  export type Model = "Merchant 4" | "Merchant 6";

  /** Each kind's models with the width each gives, metres, the default first: a vending machine's Merchant 4 and Merchant 6; the other kinds have one read model. */
  export const MODELS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<
          Partial<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
        >
      >
    >
  > = {
    vendingMachine: {
      "Merchant 4": { width: 0.895 },
      "Merchant 6": { width: 1.18 },
    },
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    vendingMachine: {
      height: ArchetypeBand.metres(1.83, 1.83, MERCHANT),
      depth: ArchetypeBand.metres(0.813, 0.813, MERCHANT),
      mass: ArchetypeBand.of("kg", 250, 350, ArchetypeBand.TYPICAL_MASS, true),
    },
    atm: {
      width: ArchetypeBand.metres(0.77, 0.77, `${NCR}: the fascia`),
      height: ArchetypeBand.metres(1.575, 1.575, NCR),
      depth: ArchetypeBand.metres(0.8, 0.8, NCR),
      mass: ArchetypeBand.of("kg", 250, 400, ArchetypeBand.TYPICAL_MASS, true),
    },
    payStation: {
      width: ArchetypeBand.metres(0.29, 0.29, `${STRADA}: the body`),
      height: ArchetypeBand.metres(1.488, 1.488, `${STRADA}: the body`),
      depth: ArchetypeBand.metres(0.328, 0.328, `${STRADA}: the body`),
      mass: ArchetypeBand.of("kg", 60, 90, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
