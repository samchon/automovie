import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  type AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { BOAT_BANDS } from "./BOAT_BANDS";
import { createCanoe } from "./createCanoe";
import { createPullingBoat } from "./createPullingBoat";
import { createRowboat } from "./createRowboat";

/**
 * An open boat: a fixed-seat rowboat with its oars, a tandem canoe, or a Navy
 * pulling boat for a landing party.
 *
 * The boat floats with its root on still water under the middle of its length,
 * its bow toward `+Z`: its bottom `draft` below the water and its gunwale
 * `depth` above the bottom. People sit on its `thwart<k>` seats, a rowboat's
 * and a launch's facing aft as rowers do, a canoe's facing forward as paddlers
 * do, and a rowboat's `sternSeat` facing forward; they stand on its `floor`,
 * take its `gunwale` boarding, and step over its `bow` and `stern`. A rowboat's
 * two oars each turn in an oarlock about the upright (`leftOarlock`,
 * `rightOarlock`), lift about the oarlock's pin riding that (`leftOar`,
 * `rightOar`), and are held by their `leftHandle` and `rightHandle`; `rowBoat`
 * rows it along a course. A racing shell's sliding seat is out of scope: on a
 * fixed thwart the trunk and arms make the stroke.
 *
 * @param params The kind, its read hull and a canoe's layup, and any dimension
 *   the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The boat.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band or
 *   one the kind lacks.
 */
export function createBoat(
  params: createBoat.IParams,
  seed?: number,
): AutoMovieArchetype<createBoat.Affordance, createBoat.Dimension> {
  const kind: createBoat.Kind = ArchetypeDraw.choice(
    "boat",
    "kind",
    params.kind,
    createBoat.KINDS,
  );
  // The selected producer validates its options from the saved parameter union.
  return createBoat.PRODUCERS[kind](params, seed);
}

/** Companion types, constants and bands of {@link createBoat}. */
export namespace createBoat {
  /** The canonical factories for saved kinds, read after the catalogue loads. */
  export const PRODUCERS = {
    get rowboat(): typeof createRowboat {
      return createRowboat;
    },
    get canoe(): typeof createCanoe {
      return createCanoe;
    },
    get launch(): typeof createPullingBoat {
      return createPullingBoat;
    },
  } satisfies Readonly<Record<Kind, unknown>>;

  /** The kinds of boat. */
  export type Kind = "rowboat" | "canoe" | "launch";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["rowboat", "canoe", "launch"];

  /**
   * The gunwale's rail where a boarding hand takes it, metres across: a
   * construction estimate, read by the grasp as the bar's width. Searched for
   * #3497 without a read figure, with the thwart's width below.
   */
  export const RAIL: number = 0.04;

  /**
   * A thwart's depth fore and aft, metres: a construction estimate. Searched
   * for #3497 without a read figure: traditional skiff and Whitehall thwart
   * widths; the one plan found (a sea skiff's on Scribd) is garbled past
   * confirming, and forum posts are no measurement.
   */
  export const THWART: number = 0.23;

  /**
   * A transom's width as a share of the beam: a construction estimate no act
   * reads beyond the stern seat's width.
   */
  export const TRANSOM: number = 0.6;

  /**
   * The hull's other construction estimates, which no plan read gives (searched
   * for #3497 with `THWART` and `RAIL`) and which the picture shows; `floor`
   * and `seats` also size the surface people stand on and the seats they sit
   * on, so those are provisional:
   *
   * - `bottom`: the bottom board's share of the beam and of the length, and its
   *   thickness in metres.
   * - `floor`: the floorboards' share of the beam and of the length, and their
   *   thickness in metres, laid on the bottom board.
   * - `post`: the stem's and a canoe's sternpost's square section, metres.
   * - `plank`, `transom`: the side panels' and the transom's thickness, metres.
   * - `seat`: a thwart board's thickness, metres.
   * - `ledge`: the bow's and the stern's step along the boat, metres, centred
   *   half of it inside the end.
   * - `seats`: each seat's width as a share of the beam where it stands: a
   *   rowboat's rowing and forward thwarts, a canoe's bow and stern seats, and
   *   a launch's thwarts.
   */
  export const ESTIMATES: Readonly<{
    bottom: Readonly<{ beam: number; length: number; thickness: number }>;
    floor: Readonly<{ beam: number; length: number; thickness: number }>;
    post: number;
    plank: number;
    transom: number;
    seat: number;
    ledge: number;
    seats: Readonly<{
      rowing: number;
      forward: number;
      canoeBow: number;
      canoeStern: number;
      launch: number;
    }>;
  }> = {
    bottom: { beam: 0.6, length: 0.85, thickness: 0.03 },
    floor: { beam: 0.5, length: 0.6, thickness: 0.02 },
    post: 0.04,
    plank: 0.025,
    transom: 0.03,
    seat: 0.03,
    ledge: 0.1,
    seats: {
      rowing: 0.95,
      forward: 0.8,
      canoeBow: 0.6,
      canoeStern: 0.7,
      launch: 0.9,
    },
  };

  /**
   * The oar's pivot above the gunwale, metres, a provisional value: the
   * oarlock's own height, not read; WoodenBoat's oar geometry table measures
   * the freeboard to the lock's bottom only. Searched for #3497 without a
   * figure: Angus's fixed-seat rowing geometry (Small Craft Advisor, 6 February
   * 2023) says only that mounting blocks can raise the oarlocks "a couple of
   * inches" above the gunwales; oarlock makers' listings (Sawyer, NRS, Sea-Dog,
   * Perko) give the shank's length, the horns' opening and the socket's size,
   * not the throat's height above the socket.
   */
  export const LOCK: number = 0.05;

  /**
   * A canoe's and a launch's draft, metres, a provisional value each: no source
   * read gives a canoe's (searched for #3497: makers' and dealers'
   * specification pages of Nova Craft, Wenonah, Old Town, Swift and Northstar
   * canoes state length, beam, depth and capacity, not draft; Paddling
   * Magazine's sizing guide gives freeboard under load, not draft); the launch
   * takes the Royal Navy 32 ft cutter's 18 in
   * (https://bmpt.org.uk/pnbpt_historic_boats/32-Ft-Naval-Cutter/index.htm), a
   * boat of its size, since the Peake boat's is not given. A rowboat draws its
   * own band.
   */
  export const DRAFT: Readonly<Record<Kind, number>> = {
    rowboat: 0.15,
    canoe: 0.1,
    launch: 18 * AutoMovieArchetypeUnits.INCH,
  };

  /**
   * A rowboat's places no source read gives, each provisional: the forward
   * thwart's distance ahead of the rowing thwart, taken as the 32 in a
   * single-banked Navy boat's thwarts stand apart (USNI Proceedings, June
   * 1890), and the stern seat's front edge ahead of the transom. The oarlocks
   * stand amidships. The source to read is a rowboat's plan sheet. Searched for
   * #3497 without a figure: Whitehall plans' stern sheets and thwarts; the plan
   * sellers' pages (Glen-L, Bear Mountain's Ontario Whitehall, Mystic Seaport's
   * Llynholm and livery Whitehalls, Selway-Fisher) list the sheets and the
   * hull's dimensions only.
   */
  export const ROWBOAT: Readonly<{ forward: number; stern: number }> = {
    forward: 32 * AutoMovieArchetypeUnits.INCH,
    stern: 0.6,
  };

  /**
   * A canoe's seats' front edges from its middle, metres, each provisional: the
   * bow seat's 40 in ahead and the stern seat's 50 in astern, the middle of 48
   * to 52 in, as a builder quotes a 16 ft Chestnut Prospector's plans
   * (https://forums.wcha.org/threads/chestnut-prospector-stripper-seats.2027);
   * the source to read is the plans. Searched for #3497 without a maker's
   * figure: the Nova Craft Prospector 16's seat stations; owners' forums give
   * solo seats only, and the tandem rule they quote (the stern seat's front
   * edge as far aft as the bow seat's is forward) is no measurement.
   */
  export const CANOE: Readonly<{ bow: number; stern: number }> = {
    bow: 40 * AutoMovieArchetypeUnits.INCH,
    stern: 50 * AutoMovieArchetypeUnits.INCH,
  };

  /**
   * The launch's thwarts: five, 28 in apart and 7 in below the gunwale, the
   * Peake boat's (USNI Proceedings, June 1890).
   */
  export const LAUNCH: Readonly<{
    thwarts: number;
    room: number;
    below: number;
  }> = {
    thwarts: 5,
    room: 28 * AutoMovieArchetypeUnits.INCH,
    below: 7 * AutoMovieArchetypeUnits.INCH,
  };

  /**
   * The affordance ids; a kind lacks the ids of the parts it does not have:
   *
   * - `thwart0` to `thwart4`: the seats across the boat, a rowboat's rowing
   *   thwart first.
   * - `sternSeat`: a rowboat's seat at its stern, facing forward.
   * - `floor`: the floorboards, where people stand.
   * - `gunwale`: the left gunwale amidships, taken while boarding.
   * - `bow`, `stern`: the stem's and the stern's top edges, a canoe's at its
   *   `endHeight`.
   * - `leftOarlock`, `rightOarlock`: a rowboat's oars' turn about the upright
   *   through the oarlock, a positive travel swinging the blade toward the
   *   bow.
   * - `leftOar`, `rightOar`: each oar's lift about the oarlock's pin, riding its
   *   oarlock; a positive travel raises the blade out of the water from its
   *   working depth.
   * - `leftHandle`, `rightHandle`: each oar's handle, riding its oar.
   */
  export type Affordance =
    | "thwart0"
    | "thwart1"
    | "thwart2"
    | "thwart3"
    | "thwart4"
    | "sternSeat"
    | "floor"
    | "gunwale"
    | "bow"
    | "stern"
    | "leftOarlock"
    | "rightOarlock"
    | "leftOar"
    | "rightOar"
    | "leftHandle"
    | "rightHandle";

  /**
   * The free dimensions, metres unless stated; a kind lacks those of the parts
   * it does not have:
   *
   * - `length`, `beam`: overall.
   * - `depth`: the hull amidships, bottom to gunwale.
   * - `draft`: a rowboat's bottom below the water.
   * - `endHeight`: a canoe's bow and stern above its bottom.
   * - `seatHeight`: a canoe's seats above its bottom.
   * - `bladeLength`, `bladeWidth`: a rowboat's oar blades.
   * - `mass`: the empty hull, kilograms.
   */
  export type Dimension =
    | "length"
    | "beam"
    | "depth"
    | "draft"
    | "endHeight"
    | "seatHeight"
    | "bladeLength"
    | "bladeWidth"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    beam: "m",
    depth: "m",
    draft: "m",
    endHeight: "m",
    seatHeight: "m",
    bladeLength: "m",
    bladeWidth: "m",
    mass: "kg",
  };

  /**
   * The read hulls: the rowboats' Thames skiff, Whitehall skiff and Glen-L 17
   * ft Whitehall, and the canoes' Prospector 16, Discovery 169, Spirit II and
   * Minnesota II (`BOAT_MODELS`).
   */
  export type Model =
    | "thamesSkiff"
    | "whitehallSkiff"
    | "whitehall17"
    | "prospector16"
    | "discovery169"
    | "spiritII"
    | "minnesotaII";

  /** A canoe's layups, each with its own read mass (`BOAT_MODELS.layups`). */
  export type Layup =
    | "fiberglass"
    | "tuffStuff"
    | "tuffStuffExpedition"
    | "aramidLite"
    | "blueSteel"
    | "polyethylene"
    | "flexCore"
    | "aramidUltraLight"
    | "superLite"
    | "intekPolyester"
    | "intekCarbon"
    | "intek";

  /**
   * The parameters: the kind, its read hull and a canoe's layup, and any free
   * dimension the kind has fixed to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which read hull of the kind; drawn from the seed when absent. */
    model?: Model;

    /** Which of the canoe's layups; drawn from the seed when absent. */
    layup?: Layup;

    /** Which boat. */
    kind: Kind;

    /** The model's id, unique in a scene; `boat` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = BOAT_BANDS;
}
