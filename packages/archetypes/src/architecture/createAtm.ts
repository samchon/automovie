import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core";
import { ServiceCabinet } from "./ServiceCabinet";
import type { createMachine } from "./createMachine";

/** The shape of {@link SHELF}. */
interface IShelf {
  /** The `height` entry. */
  height: number;

  /** The `out` entry. */
  out: number;
}

/**
 * An ATM's shelf, metres: its top 763 mm up, protruding 174 mm from the fascia
 * (NCR SS32 p. 9).
 */
const SHELF: Readonly<IShelf> = {
  height: 763 * AutoMovieArchetypeUnits.MILLIMETRE,
  out: 174 * AutoMovieArchetypeUnits.MILLIMETRE,
};

/** The fascia items NCR's guide places. */
type AtmItem = "key5" | "cardReader" | "cash" | "receipt";

/** One fascia item's placement, in millimetres and clock hours. */
interface IAtmItem {
  /** Height above the base. */
  height: number;

  /** Depth from the shelf's front. */
  depth: number;

  /** Distance from the No. 5 key on the front elevation. */
  distance: number;

  /** Clock position from the No. 5 key. */
  clock: number;
}

/**
 * An ATM's fascia items, from NCR's guide: each one's height from the base and
 * depth from the shelf's front (pp. 14-15), and its distance on the front
 * elevation and clock position from the No. 5 key (pp. 17-18), in millimetres
 * and hours; the key itself is the origin, at no distance.
 */
const ITEMS: Readonly<Record<AtmItem, Readonly<IAtmItem>>> = {
  key5: { height: 786, depth: 89, distance: 0, clock: 0 },
  cardReader: { height: 1039, depth: 152, distance: 388, clock: 2 },
  cash: { height: 822, depth: 152, distance: 152, clock: 9 },
  receipt: { height: 1154, depth: 170, distance: 472, clock: 1 },
};

/** The shape of {@link SCREEN}. */
interface IScreen {
  /** The `height` entry. */
  height: number;

  /** The `depth` entry. */
  depth: number;

  /** The `size` entry. */
  size: number;
}

/**
 * An ATM's 15 in touchscreen, from NCR's guide: its height from the base and
 * depth from the shelf's front, millimetres (pp. 14-15), on the keypad's centre
 * line as drawn, and its 381 mm diagonal. The depth is the source value of the
 * screen's recess; the model draws the screen on the cabinet's front face
 * instead.
 */
const SCREEN: Readonly<IScreen> = {
  height: 1126,
  depth: 244,
  size: 381,
};

/** The shape of {@link ESTIMATES}. */
interface IEstimates {
  /** The `shelf` entry. */
  shelf: number;

  /** The `aspect` entry. */
  aspect: number;
}

/**
 * The construction values no source read gives, each an estimate no act reads
 * and no band declares: `shelf`, an ATM shelf's thickness in metres; `aspect`,
 * the screen's width over its height, 4:3, the shape of a 1024 × 768 panel,
 * since NCR's guide gives the diagonal and no aspect.
 */
const ESTIMATES: Readonly<IEstimates> = { shelf: 0.03, aspect: 4 / 3 };

/**
 * A cash machine with a shelf, keypad button, card, cash and receipt sockets
 * and an exposed touchscreen.
 *
 * The shelf and fascia controls retain their measured NCR installation
 * locations. The cabinet rests on the floor at the origin and faces +Z. The
 * touchscreen keeps its read height and lies on the cabinet's front face, read
 * with model `+Y` up: the real screen sits recessed behind the fascia, and the
 * coarse cabinet box has no recess, so the recess is dropped.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createAtm(
  params: createAtm.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createAtm.Affordance, createAtm.Dimension> {
  const cabinet: ServiceCabinet.ICabinet<createAtm.Affordance> =
    ServiceCabinet.begin("atm", "cash machine", "#b3202a", params, seed);
  fascia(cabinet.builder, cabinet.width, cabinet.depth);
  ServiceCabinet.faces(cabinet);
  return cabinet.builder.build(cabinet.mass);
}

/**
 * Build an ATM's shelf and its fascia items' contacts: the shelf across the
 * fascia's foot, and each item at its read height and depth, across the fascia
 * from the No. 5 key by the remaining leg of its elevation distance after its
 * height above the key, to the side its clock position names, the key on the
 * centre line. `key5` is the No. 5 key, a button pressed along `-Z`;
 * `cardReader`, `cash` and `receipt` are the slots, sockets whose `+Y` points
 * out of the fascia; `screen` the touchscreen, a surface on the cabinet's front
 * face sized from its diagonal and {@link ESTIMATES}' aspect.
 *
 * @param builder The builder to fill.
 * @param width The fascia's width, metres.
 * @param depth The cabinet's depth, metres.
 */
function fascia(
  builder: AutoMovieArchetypeBuilder<
    createAtm.Affordance,
    createMachine.Dimension
  >,
  width: number,
  depth: number,
): void {
  const v: typeof Vector3.create = Vector3.create;
  const mm: number = AutoMovieArchetypeUnits.MILLIMETRE;
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
            frame: AutoMovieArchetypeFrame.facing(at, v(0, 0, 1), v(1, 0, 0)),
            extent: null,
          }
        : {
            id,
            kind: "socket",
            frame: AutoMovieArchetypeFrame.facing(at, v(0, 0, 1), v(1, 0, 0)),
            extent: null,
          },
    );
  }
  // The diagonal splits by the aspect: width = d·a/√(1+a²), height = d/√(1+a²).
  const diagonal: number = Math.hypot(ESTIMATES.aspect, 1);
  builder.affordance({
    id: "screen",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, SCREEN.height * mm, depth / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: ((SCREEN.size * ESTIMATES.aspect) / diagonal) * mm,
    depth: (SCREEN.size / diagonal) * mm,
  });
}

/** Inputs, dimensions and contacts for {@link createAtm}. */
export namespace createAtm {
  /** The named contacts built by this producer. */
  export type Affordance =
    | "cardReader"
    | "cash"
    | "front"
    | "key5"
    | "receipt"
    | "screen"
    | "side";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }
}
