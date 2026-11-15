import {
  ArchetypeUnits,
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  type ArchetypeFriction,
  type IArchetypeBand,
} from "../core";
import { CART_BANDS } from "./CART_BANDS";
import { CartCoach } from "./CartCoach";
import { CartDrawn } from "./CartDrawn";
import { CartPushed } from "./CartPushed";

/**
 * A wheeled load carrier, pushed by hand or drawn: a shopping trolley, a wheelbarrow, a horse's two-wheeled cart, a runner's rickshaw, a pair's chariot, an artillery limber, a four-wheeled wagon or a closed carriage.
 *
 * The carrier stands on the floor with its front toward `+Z`. A trolley and a wheelbarrow are pushed from behind at `-Z`: a trolley by the one `handle` bar across its back, a wheelbarrow lifted and pushed by its two handles, `leftHandle` on `+X`; `load` is the floor of the basket or the tray. A drawn kind's (rear) axle runs along `X` under the origin, and its `coupling` is where it is drawn from, ahead along `+Z`: a cart's shafts at the horse's tugs, a rickshaw's shafts at the runner's hands, a chariot's, a limber's, a wagon's or a carriage's pole at its end. A wagon's and a carriage's front axle turns on `frontAxle` about its pivot, `wheelbase` ahead of the rear axle, carrying the pole. `ArchetypeRide.along` moves a pushed kind along a course, and `ArchetypeRide.towed` draws a drawn kind by its `coupling` behind a leader's hitch, a four-wheeler with `front` set to its pivot and `frontAxle`; each road wheel spins on a `knob` the ride turns by the distance covered.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The carrier.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band or one the kind lacks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the carrier stands, where it is pushed or drawn from and where it is loaded.
 * @evidence contracts/development/implementation.md#principled-implementation Draw the dimensions, then build the kind on them: a pushed kind by `CartPushed`, a two-wheeled drawn kind by `CartDrawn`, a four-wheeled one by `CartCoach`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One dispatch per family; each family is its own module.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every unread place a builder uses is a named provisional constant here, stating the source to read.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most about twenty parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCart(
  params: createCart.IParams,
  seed?: number | string,
): Archetype<createCart.Affordance, createCart.Dimension> {
  const kind: createCart.Kind = ArchetypeDraw.choice(
    "cart",
    "kind",
    params.kind,
    createCart.KINDS,
  );
  const d: Partial<Record<createCart.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "cart",
      createCart.BANDS[kind],
      seed,
      params,
      createCart.BANDS,
    );
  const builder: ArchetypeBuilder<createCart.Affordance, createCart.Dimension> =
    new ArchetypeBuilder({
      archetype: "cart",
      id: params.id,
      name: createCart.NAMES[kind],
      dimensions: d,
    });
  if (kind === "trolley") CartPushed.trolley(builder, d);
  else if (kind === "wheelbarrow") CartPushed.wheelbarrow(builder, d);
  else if (kind === "cart") CartDrawn.cart(builder, d);
  else if (kind === "rickshaw") CartDrawn.rickshaw(builder, d);
  else if (kind === "chariot") CartDrawn.chariot(builder, d);
  else if (kind === "limber") CartDrawn.limber(builder, d);
  else if (kind === "wagon") CartCoach.wagon(builder, d);
  else CartCoach.carriage(builder, d);
  return builder.build(d.mass!, createCart.RESTS[kind]);
}

/**
 * Companion types, constants and bands of {@link createCart}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is; each band and constant its source, or that none was read and which to read.
 * @evidence contracts/development/design.md#principled-representation Closed unions, one cited band per dimension per kind, a kind lacking the dimensions of the parts it does not have.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a pushing, driving, riding or towing act reads (#3372, #3351, #3495): the handles, the seats, the floors, the shafts, the pole's end and the wheels' turn.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A horse-drawn kind draws the horse's withers height and girth from `createHorse`'s bands, so the places it takes from the horse fit the horse that draws it; a rickshaw takes its shafts' height from the measured human wrist.
 */
export namespace createCart {
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
   * What each kind rests on and on what ground, for its body's friction (`ArchetypeFriction`): a wheelbarrow's pneumatic tyre on concrete, a wagon's iron tyres on stone. The other kinds' tyres no source read names, so they keep the builder's placeholder until one does: the trolley's castor treads, the cart's and the carriage's tyres (rubber or iron), the rickshaw's (the Hong Kong rules of 1882 give its tyre's width only), the chariot's (rawhide or wood) and the limber's.
   */
  export const RESTS: Readonly<
    Record<
      Kind,
      {
        rests?: ArchetypeFriction.Material;
        ground?: ArchetypeFriction.Material;
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

  /** A wheelbarrow handgrip's length, metres: the 130 mm of the Matador M-130-L4 data sheet. */
  export const GRIP: number = 0.13;

  /** A cart's single tree ahead of its axle, metres, a provisional value: not read at a source. It sets how far the coupling stands ahead of the axle, so it is read by a towing ride. The source to read is a carriage builder's draft of a gig or a road cart (The Hub, the Carriage Journal's drafts). */
  export const SINGLE_TREE: number = 0.9;

  /** A rickshaw's seat above the ground, metres, a provisional value: not read at a source. The source to read is a museum record or a period rule that gives the seat's height (the Hong Kong rules of 1882 give its width and its distance to the footboard only). */
  export const RICKSHAW_SEAT: number = 0.9;

  /** A rickshaw's shafts apart at the runner's hands, centre to centre, metres, a provisional value: not read at a source. The source to read is a museum record with the shafts' spacing. */
  export const RICKSHAW_SHAFTS: number = 0.55;

  /** A rickshaw seat's width, metres: 21 in, the Hong Kong public rickshaw rules of 1882 (The China Mail, quoted at https://industrialhistoryhk.org/hong-kong-rickshaw-design/). */
  export const RICKSHAW_SEAT_WIDTH: number = 21 * ArchetypeUnits.INCH;

  /** A rickshaw's footboard ahead of its seat, metres: 23 in from the seat to the front of the footboard, the same rules, taken along the rickshaw. */
  export const RICKSHAW_FOOTBOARD: number = 23 * ArchetypeUnits.INCH;

  /** A limber's frame, read and derived from The Ordnance Manual (1861), p. 74 and p. 77 (https://archive.org/details/cu31924031187887/page/74). */
  export const LIMBER: Readonly<{
    /** The frame's rear end behind the axle, metres: the 57 in wheel's 28.5 in radius less the 11.88 in the wheels add to the limber's length (173.08 in with wheels and pole, 161.2 in without wheels), since only the wheels' rims stand behind the frame. */
    rear: number;

    /** The ammunition chest's inside length across the limber, width along it and depth, metres: 40, 18 and 14.75 in (p. 77). */
    chest: Readonly<{ length: number; width: number; depth: number }>;

    /** The chest's boards, metres: a construction estimate, not read, which sets the chest's outside and so its lid's height, the gunners' seat. */
    board: number;

    /** The pintle hook above the ground, metres, a provisional value: taken at the axle's height, not read. The source to read is the Ordnance Manual's limber plate or the Instruction for Field Artillery (1864). */
    pintle: number;
  }> = {
    rear: (28.5 - 11.88) * ArchetypeUnits.INCH,
    chest: { length: 40 * ArchetypeUnits.INCH, width: 18 * ArchetypeUnits.INCH, depth: 14.75 * ArchetypeUnits.INCH },
    board: 0.025,
    pintle: 28.5 * ArchetypeUnits.INCH,
  };

  /** A wagon's places beyond its bands, from the Army's specification (https://archive.org/details/specificationsf02deptgoog/page/n13) where read. */
  export const WAGON: Readonly<{
    /** The tongue's front end above the ground at rest, metres: it is "to hang within 2 feet of the ground" (p. 1). */
    drop: number;

    /** The body's floor above the hind axle, metres, a provisional value: not read. It rests on the hind bolster, 3.5 in deep (p. 2), over the axle-tree, whose depth the specification gives elsewhere; the source to read is its axle-tree clause. */
    bed: number;

    /** The front axle's lock to either side, degrees, a provisional value: not read. The four-horse wagon's specification gives iron plates for the front wheels to strike in turning (pp. 9-16) but no angle; the source to read is a drawing of the running gear. */
    lock: number;
  }> = { drop: 24 * ArchetypeUnits.INCH, bed: 0.15, lock: 35 };

  /** A carriage's places no museum record read gives, each a provisional value: the source to read is a carriage builder's draft of a brougham (The Hub, the Carriage Journal's drafts) or a museum record with these measurements. */
  export const CARRIAGE: Readonly<{
    /** The wheels' track short of the overall width, metres: the hubs' projection, taken from the width because no record gives the track. */
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
   * - `leftHandle`, `rightHandle`: a wheelbarrow's handgrips on `+X` and `-X`.
   * - `load`: the floor of a trolley's basket or a wheelbarrow's tray.
   * - `coupling`: where a drawn kind is drawn from: the middle between a cart's shafts at the horse's tugs or a rickshaw's at the runner's hands, or a chariot's or limber's pole end.
   * - `leftShaft`, `rightShaft`: a rickshaw's shafts where the runner's hands hold them, on `+X` and `-X`.
   * - `seat`: a cart's or rickshaw's seat, or a limber chest's lid the gunners ride on, facing forward.
   * - `footboard`: where a seated driver's or passenger's feet rest.
   * - `floor`: a chariot's floor, where its crew stands.
   * - `rim`: the top of a chariot's front siding, held by its crew.
   * - `chest`: a limber chest's lid on its hinge at its rear edge; a positive travel lifts its front.
   * - `pintle`: a limber's hook at its rear, which takes a gun's trail.
   * - `leftSpin`, `rightSpin`: a two-wheeled drawn kind's road wheels' roll about the axle, a positive travel rolling them forward.
   * - `frontAxle`: a wagon's or carriage's front axle turning about its pivot over the axle, positive to the left; the pole, the front wheels and the `coupling` ride it.
   * - `frontLeftSpin`, `frontRightSpin`, `rearLeftSpin`, `rearRightSpin`: a four-wheeled kind's road wheels' roll, the front pair riding `frontAxle`.
   * - `bed`: a wagon body's floor, inside.
   * - `box`: a carriage driver's seat on the box at its front, facing forward.
   * - `leftDoor`, `rightDoor`: a carriage's doors' hinges at their front edges; a positive travel swings a door outward. `leftAperture`, `rightAperture`: the openings behind them, passed through into the carriage.
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
    | "frontLeftSpin"
    | "frontRightSpin"
    | "rearLeftSpin"
    | "rearRightSpin"
    | "bed"
    | "box"
    | "leftDoor"
    | "rightDoor"
    | "leftAperture"
    | "rightAperture";

  /**
   * The free dimensions, metres unless stated; a kind lacks those of the parts it does not have:
   *
   * - `length`, `width`: a pushed kind's overall size along `+Z` and `+X`; a rickshaw's overall length, wheels and shafts included, and width; a limber's frame without wheels or pole; a wagon body's inside length at its floor and width; a carriage's overall length and width.
   * - `height`: a carriage's overall height.
   * - `bedDepth`: a wagon body's inside depth.
   * - `frontWheelDiameter`: a four-wheeled kind's front wheels; `wheelDiameter` is then its hind wheels'.
   * - `wheelbase`: a four-wheeled kind's front axle's pivot to its rear axle.
   * - `handleHeight`: a pushed kind's handle above the floor, a wheelbarrow's at rest.
   * - `handleSpacing`: between a wheelbarrow's two handles.
   * - `gripDiameter`: a pushed kind's handle where the hands hold it.
   * - `wheelDiameter`: a castor or a road wheel.
   * - `track`: between a drawn kind's wheels, centre to centre.
   * - `shaftLength`: a cart's shafts from the tip to the single tree.
   * - `seatHeight`: a cart's seat above the ground.
   * - `gripHeight`: a rickshaw's shafts above the ground where the standing runner's hands hold them, the hanging wrist's height.
   * - `floorWidth`, `floorDepth`: a chariot floor's width across and depth along it.
   * - `railHeight`: a chariot's siding above its floor.
   * - `poleLength`: a chariot's pole from the axle to the yoke; a limber's pole beyond its frame; a wagon's tongue.
   * - `withersHeight`, `girth`: the height at the withers and the heart girth of the horse a cart or a chariot is sized for, as `createHorse` draws them.
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

  /** The parameters: the kind, and any free dimension the kind has fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier. */
    kind: Kind;

    /** The model's id, unique in a scene; `cart` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = CART_BANDS;
}
