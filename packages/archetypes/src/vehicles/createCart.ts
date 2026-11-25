import type { IAutoMovieVector3 } from "@automovie/interface";
import { ArchetypeDraw, type AutoMovieArchetype, type AutoMovieArchetypeDrawSession, type AutoMovieArchetypeFriction, type AutoMovieArchetypeRide, type IAutoMovieArchetypeBand } from "../core";
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
import * as parts from "./createCartParts";
import * as measures from "./createCartMeasures";

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
  seed?: number,
): AutoMovieArchetype<createCart.Affordance, createCart.Dimension> {
  const kind: createCart.Kind = ArchetypeDraw.choice(
    "cart",
    "kind",
    params.kind,
    createCart.KINDS,
  );
  // The selected producer validates its options from the saved parameter union.
  // The saved input spans every variant; the selected producer admits its own
  // parameters with its own draw.
  const produce = createCart.PRODUCERS[kind] as (
    params: createCart.IParams,
    seed?: number,
  ) => AutoMovieArchetype<createCart.Affordance, createCart.Dimension>;
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

  /** The moved constant {@link createCartMeasures.GRIP}. */
  export const GRIP: typeof measures.GRIP = measures.GRIP;
  /** The moved constant {@link createCartMeasures.SINGLE_TREE}. */
  export const SINGLE_TREE: typeof measures.SINGLE_TREE = measures.SINGLE_TREE;
  /** The moved constant {@link createCartMeasures.REST}. */
  export const REST: typeof measures.REST = measures.REST;
  /** The moved constant {@link createCartMeasures.LINES}. */
  export const LINES: typeof measures.LINES = measures.LINES;
  /** The moved constant {@link createCartMeasures.LINE}. */
  export const LINE: typeof measures.LINE = measures.LINE;
  /** The moved constant {@link createCartMeasures.TRACE}. */
  export const TRACE: typeof measures.TRACE = measures.TRACE;
  /** The moved constant {@link createCartMeasures.RICKSHAW_SEAT}. */
  export const RICKSHAW_SEAT: typeof measures.RICKSHAW_SEAT = measures.RICKSHAW_SEAT;
  /** The moved constant {@link createCartMeasures.RICKSHAW_SHAFTS}. */
  export const RICKSHAW_SHAFTS: typeof measures.RICKSHAW_SHAFTS = measures.RICKSHAW_SHAFTS;
  /** The moved constant {@link createCartMeasures.RICKSHAW_SEAT_WIDTH}. */
  export const RICKSHAW_SEAT_WIDTH: typeof measures.RICKSHAW_SEAT_WIDTH = measures.RICKSHAW_SEAT_WIDTH;
  /** The moved constant {@link createCartMeasures.RICKSHAW_FOOTBOARD}. */
  export const RICKSHAW_FOOTBOARD: typeof measures.RICKSHAW_FOOTBOARD = measures.RICKSHAW_FOOTBOARD;

  /** The moved constant {@link createCartParts.LIMBER}. */
  export const LIMBER: typeof parts.LIMBER = parts.LIMBER;
  /** The moved constant {@link createCartParts.WAGON}. */
  export const WAGON: typeof parts.WAGON = parts.WAGON;
  /** The moved constant {@link createCartParts.CARRIAGE}. */
  export const CARRIAGE: typeof parts.CARRIAGE = parts.CARRIAGE;

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
   *   about +X, positive lowering the forward end; coupling rides it. Its 짹180
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
