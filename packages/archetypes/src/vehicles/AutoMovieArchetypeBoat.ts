import { RigidCarrierSample } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
  AutoMovieArchetypeSea,
  type IAutoMovieArchetypeBand,
} from "../core";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { BOAT_BANDS } from "./constants/BOAT_BANDS";
import { AutoMovieArchetypeCanoe } from "./AutoMovieArchetypeCanoe";
import { AutoMovieArchetypePullingBoat } from "./AutoMovieArchetypePullingBoat";
import { AutoMovieArchetypeRowboat } from "./AutoMovieArchetypeRowboat";
import { rowBoat } from "./internal/rowBoat";

/** The canonical producer and authoring contract for boats. */
export namespace AutoMovieArchetypeBoat {
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
   * `rightOar`), and are held by their `leftHandle` and `rightHandle`; `AutoMovieArchetypeBoat.row`
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
  export function create(
    params: AutoMovieArchetypeBoat.IParams,
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeBoat.Affordance,
    AutoMovieArchetypeBoat.Dimension
  > {
    const kind: AutoMovieArchetypeBoat.Kind = ArchetypeDraw.choice(
      "boat",
      "kind",
      params.kind,
      AutoMovieArchetypeBoat.KINDS,
    );
    // The selected producer validates its options from the saved parameter union.
    // The saved input spans every variant, so each variant narrows its own kind
    // and model against the lists it makes before it draws.
    const variants: Readonly<
      Record<
        AutoMovieArchetypeBoat.Kind,
        (
          params: AutoMovieArchetypeBoat.IParams,
          seed?: number,
        ) => AutoMovieArchetype<
          AutoMovieArchetypeBoat.Affordance,
          AutoMovieArchetypeBoat.Dimension
        >
      >
    > = {
      rowboat: (p, s) =>
        AutoMovieArchetypeRowboat.create(
          {
            ...p,
            model: ArchetypeDraw.admit("boat", "model", p.model, [
              "thamesSkiff",
              "whitehallSkiff",
              "whitehall17",
            ] as const),
          },
          s,
        ),
      canoe: (p, s) =>
        AutoMovieArchetypeCanoe.create(
          {
            ...p,
            model: ArchetypeDraw.admit("boat", "model", p.model, [
              "prospector16",
              "discovery169",
              "spiritII",
              "minnesotaII",
            ] as const),
          },
          s,
        ),
      launch: ({ model: _model, ...rest }, s) => AutoMovieArchetypePullingBoat.create(rest, s),
    };
    return variants[kind](params, seed);
  }

  /** The canonical factories for saved kinds, read after the catalogue loads. */
  export const PRODUCERS = {
    get rowboat(): typeof AutoMovieArchetypeRowboat.create {
      return AutoMovieArchetypeRowboat.create;
    },
    get canoe(): typeof AutoMovieArchetypeCanoe.create {
      return AutoMovieArchetypeCanoe.create;
    },
    get launch(): typeof AutoMovieArchetypePullingBoat.create {
      return AutoMovieArchetypePullingBoat.create;
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

  /** Every affordance id, for a caller that reads an id at run time. */
  export const AFFORDANCES: readonly Affordance[] = [
    "thwart0",
    "thwart1",
    "thwart2",
    "thwart3",
    "thwart4",
    "sternSeat",
    "floor",
    "gunwale",
    "bow",
    "stern",
    "leftOarlock",
    "rightOarlock",
    "leftOar",
    "rightOar",
    "leftHandle",
    "rightHandle",
  ];

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
  /**
   * A rowboat rowed along a course: its root on the path, its oars swept through
   * the stroke cycle and lifted out of the water on the recovery, at a stroke
   * rate the speed sets, on still water or a seeded sea.
   *
   * Each stroke is World Rowing's cycle (2015 media guide glossary, p. 12,
   * https://d2cx26qpfwuhvu.cloudfront.net/worldrowing/wp-content/uploads/2020/12/04181521/GlossaryofRowingTerms_Neutral.pdf):
   * the catch puts the blade in the water, the drive pulls it from the catch to
   * the finish in the water, the finish takes it out, and the recovery carries it
   * clear back to the catch. The boat covers `STROKE` metres a stroke, so the
   * stroke rate is the speed over that, and the drive takes Kleshnev's share of
   * the cycle at that rate. The oars sweep the `BoatOars.ARC`, easing in and out
   * of each end; through the drive the blade sinks from the water's surface at
   * the catch to its working depth and rises back to the surface at the finish,
   * and through the recovery it lifts `BoatOars.CLEAR` above the water and comes
   * down again. The ride's instants add `catch<k>` at each stroke's catch, so a
   * rower's hands follow the handles as a cyclist's feet follow the pedals.
   *
   * Use `AutoMovieArchetypeBoat.bind` to give a native ride one film start and pass its paired
   * root and socket readers to the prop adapter. Both hold the initial pose
   * before the start. On still water they also hold the final pose strictly after
   * the course ends.
   *
   * @param boat The rowboat.
   * @param course The course its root follows, or its plan.
   * @param options `sea`, a sea the boat rides on (`AutoMovieArchetypeSea`);
   *   still water when absent.
   * @returns The ride.
   * @throws {AutoMovieArchetypeRefusal} When the boat has no oars, or as
   *   `AutoMovieArchetypeCourse.plan` does for a malformed course.
   */
  export function row(
    boat: AutoMovieArchetype<Affordance, Dimension>,
    course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
    options: AutoMovieArchetypeBoat.IOptions = {},
  ): AutoMovieArchetypeBoat.IRowRide {
    return rowBoat(boat, course, options);
  }

  /** Settings used by the native rowboat operation. */
  export interface IOptions {
    /** The sea the boat rides on; absence selects still water. */
    sea?: AutoMovieArchetypeSea.IOptions;
  }
  /** A rowboat's ride with what `bind` reads of a native rowing course. */
  export interface IRowRide extends AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeBoat.Affordance,
    AutoMovieArchetypeBoat.Dimension
  > {
    /**
     * The full samplers of a native course in course seconds, or undefined for
     * a ride along an external plan, which `bind` refuses.
     */
    readonly rowing: IRowing | undefined;
  }

  /** The full samplers of a native rowing course and its end hold. */
  export interface IRowing {
    /** The boat at rest. */
    readonly boat: AutoMovieArchetype<
      AutoMovieArchetypeBoat.Affordance,
      AutoMovieArchetypeBoat.Dimension
    >;

    /** The floated root placement at a course second. */
    readonly placement: (seconds: number) => IAutoMovieTransform;

    /** A socket's world frame at a course second. */
    readonly frame: AutoMovieArchetypeRide.IRide<
      AutoMovieArchetypeBoat.Affordance,
      AutoMovieArchetypeBoat.Dimension
    >["frame"];

    /** The course's duration, seconds. */
    readonly duration: number;

    /** Whether the boat holds its final pose after the course: still water. */
    readonly stillEnd: boolean;
  }

  /**
   * Bind a native rowing course to the film second it starts. The boat holds
   * its initial pose until then. On still water it also holds its final
   * placement and every socket strictly beyond the course. Pass the two
   * returned callbacks directly to the prop adapter.
   *
   * @param ride The result of rowing a native course with this producer.
   * @param start Film second corresponding to course second zero.
   * @returns The independently callable root and socket readers in film
   *   seconds.
   * @throws {RangeError} For an unbound, external course or a nonfinite start.
   */
  export function bind(
    ride: IRowRide,
    start: number,
  ): RigidCarrierSample.IBinding {
    const source: IRowing | undefined = ride.rowing;
    if (source === undefined)
      throw new RangeError(
        "A bound rowboat needs a native course and a finite film second.",
      );
    const clock = (seconds: number): number => Math.max(0, seconds - start);
    const holds: RigidCarrierSample.IHold[] = [
      {
        from: -Infinity,
        to: start,
        contains: (seconds: number): boolean => clock(seconds) === 0,
      },
    ];
    if (source.stillEnd)
      holds.push({
        from: start + source.duration,
        to: Infinity,
        contains: (seconds: number): boolean =>
          clock(seconds) > source.duration,
      });
    return RigidCarrierSample.bind(
      source.boat,
      (seconds: number): ReturnType<RigidCarrierSample.IBinding["motion"]> => {
        const placement: IAutoMovieTransform = source.placement(clock(seconds));
        return {
          position: placement.translation,
          rotation: placement.rotation,
        };
      },
      (id: string, seconds: number): IAutoMovieTransform => {
        const affordance: AutoMovieArchetypeBoat.Affordance | undefined =
          AutoMovieArchetypeBoat.AFFORDANCES.find(
            (known: AutoMovieArchetypeBoat.Affordance): boolean => known === id,
          );
        if (affordance === undefined)
          throw new RangeError(`A boat has no affordance "${id}".`);
        return source.frame(affordance, clock(seconds));
      },
      holds,
    );
  }

  /**
   * The distance the boat covers each stroke, metres, a provisional value: no
   * source read gives a fixed-seat rowboat's; the source to read is a measured
   * distance per stroke of one, or one boat's speed and stroke rate measured
   * together. Searched for #3497 without a figure: fixed-seat distance per
   * stroke for skiffs, gigs and whalers; Cornish pilot gig stroke rate and
   * speed; Whitehall strokes a minute and knots (only guesses and marketing);
   * Navy whaleboat and cutter pulling drill; Agius et al. 2023, The Kinematics
   * of Fixed-Seat Rowing (Bioengineering 10(7):774), which measures the body
   * only; USNI Proceedings June 1890, Navy Boats, which gives no speed under
   * oars.
   */
  export const STROKE: number = 3;

  /**
   * The stroke rate's range inside which Kleshnev measured the drive's share,
   * strokes a minute (ISBS 1996, p. 321).
   */
  export const RATES: readonly [number, number] = [26, 36.5];

  /**
   * The stroke rate at a speed.
   *
   * @param speed The boat's speed, metres per second.
   * @returns Strokes a minute.
   */
  export function rate(speed: number): number {
    return (60 * speed) / STROKE;
  }

  /**
   * The drive's share of the stroke cycle at a stroke rate: Kleshnev's rhythm,
   * 0.84 r + 25.1 percent, the rate held inside the measured range.
   *
   * @param strokes The stroke rate, strokes a minute.
   * @returns The share, 0 to 1.
   */
  export function drive(strokes: number): number {
    const r: number = Math.min(Math.max(strokes, RATES[0]), RATES[1]);
    return (0.84 * r + 25.1) / 100;
  }
}
