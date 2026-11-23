import type { IAutoMovieVector3 } from "@automovie/interface";

import { EquineHarness } from "../animals/EquineHarness";
import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  type AutoMovieArchetypeDrawSession,
  type AutoMovieArchetypeFriction,
  type AutoMovieArchetypeRide,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { CART_BANDS } from "./CART_BANDS";
import { CartFit } from "./CartFit";
import { cartTowing } from "./cartTowing";
import { createCarriage } from "./createCarriage";
import { createChariot } from "./createChariot";
import { createHorseCart } from "./createHorseCart";
import { createLimber } from "./createLimber";
import { createRickshaw } from "./createRickshaw";
import { createShoppingTrolley } from "./createShoppingTrolley";
import { createWagon } from "./createWagon";
import { createWheelbarrow } from "./createWheelbarrow";

/**
 * A saved recipe's producer as the dispatcher calls it: the selected producer
 * admits the saved parameter union at run time.
 */
type Producer = (
  params: Omit<createCart.IParams, "kind">,
  seed?: number | string,
) => AutoMovieArchetype<createCart.Affordance, createCart.Dimension>;

/**
 * A wheeled load carrier, pushed by hand or drawn: a shopping trolley, a
 * wheelbarrow, a horse's two-wheeled cart, a runner's rickshaw, a pair's
 * chariot, an artillery limber, a four-wheeled wagon or a closed carriage.
 *
 * The carrier stands on the floor with its front toward `+Z`. A trolley and a
 * wheelbarrow are pushed from behind at `-Z`: a trolley by the one `handle` bar
 * across its back, a wheelbarrow lifted and pushed by its two handles,
 * `leftHandle` on `+X`; `load` is the floor of the basket or the tray. A drawn
 * kind's (rear) axle runs along `X` under the origin, and its `coupling` is
 * where it is drawn from, ahead along `+Z`: a cart's shafts at the horse's
 * tugs, a rickshaw's shafts at the runner's hands, a chariot's, a limber's, a
 * wagon's or a carriage's pole at its end. A wagon's and a carriage's front
 * axle turns on `frontAxle` about its pivot, `wheelbase` ahead of the rear
 * axle, carrying the pole. `AutoMovieArchetypeRide.along` moves a pushed kind
 * along a course, and `AutoMovieArchetypeRide.towed` draws a drawn kind by its
 * `coupling` behind a leader's hitch, a four-wheeler with `front` set to its
 * pivot and `frontAxle`; each road wheel spins on a `knob` the ride turns by
 * the distance covered. A cart drawn by a horse in harness takes its traces and
 * driving lines from `lines`, which the towing ride lays between the two at
 * every second.
 *
 * @param params The kind, its read model and options, and any dimension the
 *   author fixes.
 * @param seed The seed that picks the model and its options and draws every
 *   dimension left free inside its band; absent, the first model and option,
 *   and each dimension the middle of its band.
 * @returns The carrier.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
 *   one the kind lacks or one the model reads, or a model or option the kind
 *   does not offer.
 */
export function createCart(
  params: createCart.IParams,
  seed?: number | string,
): AutoMovieArchetype<createCart.Affordance, createCart.Dimension> {
  const kind: createCart.Kind = ArchetypeDraw.choice(
    "cart",
    "kind",
    params.kind,
    createCart.KINDS,
  );
  // The selected producer validates its options from the saved parameter union.
  const produce: Producer = createCart.PRODUCERS[kind] as Producer;
  return produce(params, seed);
}

/** Companion types, constants and bands of {@link createCart}. */
export namespace createCart {
  /** The canonical factories for saved kinds, read after the catalogue loads. */
  export const PRODUCERS = {
    get trolley(): typeof createShoppingTrolley {
      return createShoppingTrolley;
    },
    get wheelbarrow(): typeof createWheelbarrow {
      return createWheelbarrow;
    },
    get cart(): typeof createHorseCart {
      return createHorseCart;
    },
    get rickshaw(): typeof createRickshaw {
      return createRickshaw;
    },
    get chariot(): typeof createChariot {
      return createChariot;
    },
    get limber(): typeof createLimber {
      return createLimber;
    },
    get wagon(): typeof createWagon {
      return createWagon;
    },
    get carriage(): typeof createCarriage {
      return createCarriage;
    },
  } satisfies Readonly<Record<Kind, unknown>>;

  /**
   * The read models by kind, picked whole (`CART_MODELS`): a cart's multi-use
   * cart and the Dennett gig; a rickshaw's Edo-Tokyo Museum 89210382 and
   * 90360001 and the Powerhouse 245268; a chariot's six from the tomb of
   * Tutankhamun by Carter's object numbers; a carriage's Brewster, Miner,
   * Stevens and Peters broughams. A trolley, a wheelbarrow, a limber and a
   * wagon have none.
   */
  export type Model =
    | "multiUse"
    | "dennettGig"
    | "edo89210382"
    | "edo90360001"
    | "powerhouse245268"
    | "carter120"
    | "carter121"
    | "carter122"
    | "carter161"
    | "carter332"
    | "carter333"
    | "brewster"
    | "minerStevens"
    | "peters";

  /** A trolley's castors, by their wheels' diameter: 100 or 125 mm. */
  export type Castor = "mm100" | "mm125";

  /**
   * A cart's read shafts, by their length: the multi-use cart's 89.5 or 93.5
   * in.
   */
  export type Shaft = "in89" | "in93";

  /** The kinds of carrier. */
  export type Kind =
    | "trolley"
    | "wheelbarrow"
    | "cart"
    | "rickshaw"
    | "chariot"
    | "limber"
    | "wagon"
    | "carriage";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "trolley",
    "wheelbarrow",
    "cart",
    "rickshaw",
    "chariot",
    "limber",
    "wagon",
    "carriage",
  ];

  /** Each kind's model name. */
  export const NAMES: Readonly<Record<Kind, string>> = {
    trolley: "shopping trolley",
    wheelbarrow: "wheelbarrow",
    cart: "two-wheeled cart",
    rickshaw: "rickshaw",
    chariot: "chariot",
    limber: "limber",
    wagon: "wagon",
    carriage: "brougham",
  };

  /**
   * What each kind rests on and on what ground, for its body's friction
   * (`AutoMovieArchetypeFriction`): a wheelbarrow's pneumatic tyre on concrete,
   * a wagon's iron tyres on stone. The other kinds' tyres no source read names,
   * so their bodies carry no friction until one does: the trolley's castor
   * treads, the cart's and the carriage's tyres (rubber or iron), the
   * rickshaw's (the Hong Kong rules of 1882 give its tyre's width only), the
   * chariot's (rawhide or wood) and the limber's.
   */
  export const RESTS: Readonly<
    Record<
      Kind,
      {
        rests?: AutoMovieArchetypeFriction.Material;
        ground?: AutoMovieArchetypeFriction.Material;
      }
    >
  > = {
    trolley: {},
    wheelbarrow: { rests: "rubber" },
    cart: {},
    rickshaw: {},
    chariot: {},
    limber: {},
    wagon: { rests: "steel", ground: "stone" },
    carriage: {},
  };

  /**
   * A wheelbarrow handgrip's length, metres: the 130 mm of the Matador M-130-L4
   * data sheet.
   */
  export const GRIP: number = 0.13;

  /**
   * A cart's single tree ahead of its axle, metres, a provisional value: not
   * read at a source. It sets how far the coupling stands ahead of the axle, so
   * it is read by a towing ride. The source to read is a carriage builder's
   * draft of a gig or a road cart (The Hub, the Carriage Journal's drafts).
   */
  export const SINGLE_TREE: number = 0.9;

  /**
   * The rest geometry of a cart's driving lines, metres: `elbow`, the height
   * above the seat of the point each line's held run is laid toward, the middle
   * of the women's and men's means of ANSUR II's elbow rest height (232.4 and
   * 245.0 mm), computed from the 1,986 women's and 4,082 men's public records
   * (https://www.openlab.psu.edu/ansur2/). It shapes the lines at rest only; a
   * driver's hands choose where along the held runs they hold.
   */
  export const REST: Readonly<{ elbow: number }> = {
    elbow: (0.2324 + 0.245) / 2,
  };

  /**
   * A single horse's driving lines' length from the bit, metres: IVC Carriage's
   * stock horse lines of 14 ft, "measure the distance from the horse's mouth to
   * your hands, and then add at least an extra two feet"
   * (https://cdn.shopify.com/s/files/1/0046/6819/4886/files/Reins.pdf).
   */
  export const LINES: number = 14 * AutoMovieArchetypeUnits.FOOT;

  /**
   * A single horse's driving line's width, metres: the 3/4 in leather reins IVC
   * Carriage finds most hands, and a larger horse, prefer
   * (https://cdn.shopify.com/s/files/1/0046/6819/4886/files/Reins.pdf).
   */
  export const LINE: number = (3 / 4) * AutoMovieArchetypeUnits.INCH;

  /**
   * A trace's radius, metres: in a single horse's harness a trace is the same
   * leather strap as the rest of the harness, so it takes the harness's strap
   * (`EquineHarness.ESTIMATES.strap`, a construction estimate no act reads, the
   * strap's width unread).
   */
  export const TRACE: number = EquineHarness.ESTIMATES.strap;

  /**
   * A rickshaw's seat above the ground, metres, a provisional value: not read
   * at a source. The source to read is a museum record or a period rule that
   * gives the seat's height (the Hong Kong rules of 1882 give its width and its
   * distance to the footboard only).
   */
  export const RICKSHAW_SEAT: number = 0.9;

  /**
   * A rickshaw's shafts apart at the runner's hands, centre to centre, metres,
   * a provisional value: not read at a source. The source to read is a museum
   * record with the shafts' spacing.
   */
  export const RICKSHAW_SHAFTS: number = 0.55;

  /**
   * A rickshaw seat's width, metres: 21 in, the Hong Kong public rickshaw rules
   * of 1882 (The China Mail, quoted at
   * https://industrialhistoryhk.org/hong-kong-rickshaw-design/).
   */
  export const RICKSHAW_SEAT_WIDTH: number = 21 * AutoMovieArchetypeUnits.INCH;

  /**
   * A rickshaw's footboard ahead of its seat, metres: 23 in from the seat to
   * the front of the footboard, the same rules, taken along the rickshaw.
   */
  export const RICKSHAW_FOOTBOARD: number = 23 * AutoMovieArchetypeUnits.INCH;

  /**
   * A limber's frame, read and derived from The Ordnance Manual (1861), p. 74
   * and p. 77 (https://archive.org/details/cu31924031187887/page/74).
   */
  export const LIMBER: Readonly<{
    /**
     * The frame's rear end behind the axle, metres: the 57 in wheel's 28.5 in
     * radius less the 11.88 in the wheels add to the limber's length (173.08 in
     * with wheels and pole, 161.2 in without wheels), since only the wheels'
     * rims stand behind the frame.
     */
    rear: number;

    /**
     * The ammunition chest's inside length across the limber, width along it
     * and depth, metres: 40, 18 and 14.75 in (p. 77).
     */
    chest: Readonly<{ length: number; width: number; depth: number }>;

    /**
     * The chest's boards, metres: a construction estimate, not read, which sets
     * the chest's outside and so its lid's height, the gunners' seat.
     */
    board: number;

    /**
     * The pintle hook above the ground, metres, a provisional value: taken at
     * the axle's height, not read. The source to read is the Ordnance Manual's
     * limber plate or the Instruction for Field Artillery (1864).
     */
    pintle: number;
  }> = {
    rear: (28.5 - 11.88) * AutoMovieArchetypeUnits.INCH,
    chest: {
      length: 40 * AutoMovieArchetypeUnits.INCH,
      width: 18 * AutoMovieArchetypeUnits.INCH,
      depth: 14.75 * AutoMovieArchetypeUnits.INCH,
    },
    board: 0.025,
    pintle: 28.5 * AutoMovieArchetypeUnits.INCH,
  };

  /**
   * A wagon's places beyond its bands, from the Army's specification
   * (https://archive.org/details/specificationsf02deptgoog/page/n13) where
   * read.
   */
  export const WAGON: Readonly<{
    /**
     * The tongue's front end above the ground at rest, metres: it is "to hang
     * within 2 feet of the ground" (p. 1).
     */
    drop: number;

    /**
     * The body's floor above the hind axle, metres, a provisional value: not
     * read. It rests on the hind bolster, 3.5 in deep (p. 2), over the
     * axle-tree, whose depth the specification gives elsewhere; the source to
     * read is its axle-tree clause.
     */
    bed: number;

    /**
     * The front axle's lock to either side, degrees, a provisional value: not
     * read. The four-horse wagon's specification gives iron plates for the
     * front wheels to strike in turning (pp. 9-16) but no angle; the source to
     * read is a drawing of the running gear.
     */
    lock: number;
  }> = { drop: 24 * AutoMovieArchetypeUnits.INCH, bed: 0.15, lock: 35 };

  /**
   * A carriage's places no museum record read gives, each a provisional value:
   * the source to read is a carriage builder's draft of a brougham (The Hub,
   * the Carriage Journal's drafts) or a museum record with these measurements.
   */
  export const CARRIAGE: Readonly<{
    /**
     * The wheels' track short of the overall width, metres: the hubs'
     * projection, taken from the width because no record gives the track.
     */
    hubs: number;

    /** The body's floor above the ground, metres. */
    floor: number;

    /** The inside seat above the floor, metres. */
    seat: number;

    /** The driver's box seat above the ground, metres. */
    box: number;

    /** A door's width and height, metres, and its widest opening, degrees. */
    door: Readonly<{ width: number; height: number; swing: number }>;

    /** The pole from the front axle to its end, metres. */
    pole: number;

    /** The front axle's lock to either side, degrees. */
    lock: number;
  }> = {
    hubs: 0.25,
    floor: 0.55,
    seat: 0.4,
    box: 1.6,
    door: { width: 0.6, height: 1.2, swing: 90 },
    pole: 2.8,
    lock: 40,
  };

  /**
   * The affordance ids; a kind lacks the ids of the parts it does not have:
   *
   * - `handle`: a trolley's push bar.
   * - `leftHandle`, `rightHandle`: the trolley's hand stations on its bar or the
   *   wheelbarrow's handgrips on `+X` and `-X`.
   * - `load`: the floor of a trolley's basket or a wheelbarrow's tray.
   * - `coupling`: where a drawn kind is drawn from: the middle between a cart's
   *   shafts at the horse's tugs or a rickshaw's at the runner's hands, or a
   *   chariot's or limber's pole end.
   * - `leftShaft`, `rightShaft`: a rickshaw's shafts where the runner's hands
   *   hold them, on `+X` and `-X`.
   * - `seat`: a cart's or rickshaw's seat, or a limber chest's lid the gunners
   *   ride on, facing forward.
   * - `footboard`: where a seated driver's or passenger's feet rest.
   * - `floor`: a chariot's floor, where its crew stands.
   * - `rim`: the top of a chariot's front siding, held by its crew.
   * - `chest`: a limber chest's lid on its hinge at its rear edge; a positive
   *   travel lifts its front.
   * - `pintle`: a limber's hook at its rear, which takes a gun's trail.
   * - `leftSpin`, `rightSpin`: a two-wheeled drawn kind's road wheels' roll about
   *   the axle, a positive travel rolling them forward.
   * - `frontAxle`: a wagon's or carriage's front axle turning about its pivot
   *   over the axle, positive to the left; the front wheels and drawbar pitch
   *   pivot ride it.
   * - `drawbarPitch`: the front-axle hinge of a four-wheeler's fixed-length pole,
   *   about +X, positive lowering the forward end; coupling rides it. Its ±180
   *   degrees are a principal-angle chart, not a measured working limit.
   * - `frontLeftSpin`, `frontRightSpin`, `rearLeftSpin`, `rearRightSpin`: a
   *   four-wheeled kind's road wheels' roll, the front pair riding
   *   `frontAxle`.
   * - `bed`: a wagon body's floor, inside.
   * - `box`: a carriage driver's seat on the box at its front, facing forward.
   * - `leftLine`, `rightLine`: a cart's driving lines' held runs, each line's
   *   length behind its terret, each frame at the run's middle, the run
   *   pointing forward to the horse's terret; the driver's hands hold anywhere
   *   along it.
   * - `leftLineGrip`, `rightLineGrip`: the modeled driver's hand stations: a
   *   cart's between the terrets and the ends of the lines, a carriage's ahead
   *   of the box, where a team's reins are held.
   * - `leftLineEnd`, `rightLineEnd`: the ends behind the modeled hand stations,
   *   at the full line length measured from the terrets after subtracting the
   *   run forward of them.
   * - `leftDoor`, `rightDoor`: a carriage's doors' hinges at their front edges; a
   *   positive travel swings a door outward. `leftAperture`, `rightAperture`:
   *   the openings behind them, passed through into the carriage.
   */
  export type Affordance =
    | "handle"
    | "leftHandle"
    | "rightHandle"
    | "load"
    | "coupling"
    | "leftShaft"
    | "rightShaft"
    | "seat"
    | "footboard"
    | "floor"
    | "rim"
    | "chest"
    | "pintle"
    | "leftSpin"
    | "rightSpin"
    | "frontAxle"
    | "drawbarPitch"
    | "frontLeftSpin"
    | "frontRightSpin"
    | "rearLeftSpin"
    | "rearRightSpin"
    | "bed"
    | "box"
    | "leftDoor"
    | "rightDoor"
    | "leftAperture"
    | "rightAperture"
    | "leftLine"
    | "rightLine"
    | "leftLineGrip"
    | "rightLineGrip"
    | "leftLineEnd"
    | "rightLineEnd";

  /**
   * The free dimensions, metres unless stated; a kind lacks those of the parts
   * it does not have:
   *
   * - `length`, `width`: a pushed kind's overall size along `+Z` and `+X`; a
   *   rickshaw's overall length, wheels and shafts included, and width; a
   *   limber's frame without wheels or pole; a wagon body's inside length at
   *   its floor and width; a carriage's overall length and width.
   * - `height`: a carriage's overall height.
   * - `bedDepth`: a wagon body's inside depth.
   * - `frontWheelDiameter`: a four-wheeled kind's front wheels; `wheelDiameter`
   *   is then its hind wheels'.
   * - `wheelbase`: a four-wheeled kind's front axle's pivot to its rear axle.
   * - `handleHeight`: a pushed kind's handle above the floor, a wheelbarrow's at
   *   rest.
   * - `handleSpacing`: between a wheelbarrow's two handles.
   * - `gripDiameter`: a pushed kind's handle where the hands hold it.
   * - `wheelDiameter`: a castor or a road wheel.
   * - `track`: between a drawn kind's wheels, centre to centre.
   * - `shaftLength`: a cart's shafts from the tip to the single tree.
   * - `clearance`: a cart's single tree behind the horse's point of buttock,
   *   which sets the shafts' length where they are not read.
   * - `seatHeight`: a cart's seat above the ground.
   * - `gripHeight`: a rickshaw's shafts above the ground where the standing
   *   runner's hands hold them, the hanging wrist's height.
   * - `floorWidth`, `floorDepth`: a chariot floor's width across and depth along
   *   it.
   * - `railHeight`: a chariot's siding above its floor.
   * - `poleLength`: a chariot's pole from the axle to the yoke; a limber's pole
   *   beyond its frame; a wagon's tongue.
   * - `withersHeight`, `girth`: the height at the withers of the horse a cart or
   *   a chariot is sized for, as `createHorse` draws it, and that horse's heart
   *   girth (`createHorse.PROFILE.girth`).
   * - `mass`: the empty carrier, kilograms.
   */
  export type Dimension =
    | "length"
    | "width"
    | "handleHeight"
    | "handleSpacing"
    | "gripDiameter"
    | "wheelDiameter"
    | "track"
    | "shaftLength"
    | "clearance"
    | "seatHeight"
    | "gripHeight"
    | "floorWidth"
    | "floorDepth"
    | "railHeight"
    | "poleLength"
    | "withersHeight"
    | "girth"
    | "height"
    | "bedDepth"
    | "frontWheelDiameter"
    | "wheelbase"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    handleHeight: "m",
    handleSpacing: "m",
    gripDiameter: "m",
    wheelDiameter: "m",
    track: "m",
    shaftLength: "m",
    clearance: "m",
    seatHeight: "m",
    gripHeight: "m",
    floorWidth: "m",
    floorDepth: "m",
    railHeight: "m",
    poleLength: "m",
    withersHeight: "m",
    girth: "m",
    height: "m",
    bedDepth: "m",
    frontWheelDiameter: "m",
    wheelbase: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, its read model and options, and any free
   * dimension the kind has fixed to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier. */
    kind: Kind;

    /**
     * Which read model of the kind; drawn from the seed when absent, a cart's
     * among those made for a fixed withers height.
     */
    model?: Model;

    /** Which castors, for a trolley; drawn from the seed when absent. */
    castor?: Castor;

    /**
     * Which read shafts, for a cart whose model offers more than one; drawn
     * from the seed when absent.
     */
    shaft?: Shaft;

    /** The model's id, unique in a scene; `cart` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = CART_BANDS;

  /**
   * Wheel/pivot support for generic towing; cartTowing owns admission.
   *
   * @param cart CreateCart output in its neutral steering/drawbar pose.
   * @returns Independent model-space metre support: one freely pitching wheel
   *   axle, or grounded front/rear axles with the declared drawbar hinge.
   * @throws {RangeError} For another producer, invalid wheel-axis geometry or a
   *   front steering pivot outside its axle.
   * @throws {AutoMovieArchetypeRefusal} If the selected variant lacks a
   *   required wheel/steering affordance, including a pushed carrier without
   *   towing roles.
   */
  export const towing: typeof cartTowing = cartTowing;

  /**
   * The traces and the driving lines between a cart and the horse in harness
   * that draws it, for `AutoMovieArchetypeRide.towed`'s `lines`: a trace from
   * each point of draft at the breast collar's end to its end of the cart's
   * single tree, and a driving line from each bit ring through the neck strap's
   * ring and the saddle's terret to the driver's held run (Harness Stuff: the
   * reins pass from the bit through the rings on the breastplate's neck strap,
   * then the saddle's terrets, to the driver).
   *
   * @param cart A `cart` kind, built for the horse that draws it.
   * @param held Optional reader of the driver's displayed palm on each side at
   *   a film second; each driving line's held run then ends at that palm
   *   instead of its fixed material end.
   * @returns The four lines, the traces first, left before right.
   * @throws {AutoMovieArchetypeRefusal} When the cart is not a horse's
   *   two-wheeled cart.
   */
  export function lines(
    cart: AutoMovieArchetype<Affordance, Dimension>,
    held?: Held,
  ): AutoMovieArchetypeRide.ILine[] {
    return CartFit.lines(cart, held);
  }

  /** A driver's hand side. */
  export type Side = "left" | "right";

  /**
   * A reader of the driver's displayed palm on a side at a film second, world
   * metres, which a driving line's held run ends at.
   */
  export type Held = (side: Side, seconds: number) => IAutoMovieVector3;
}
