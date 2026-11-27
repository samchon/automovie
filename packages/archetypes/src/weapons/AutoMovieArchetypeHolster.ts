import {
  AutoMovieArchetype,
  type AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { HOLSTER_BANDS } from "./constants/HOLSTER_BANDS";
import { HOLSTER_BLADES } from "./constants/HOLSTER_BLADES";
import { AutoMovieArchetypeStageBladeCarrier } from "./AutoMovieArchetypeStageBladeCarrier";
import { AutoMovieArchetypeStageHolster } from "./AutoMovieArchetypeStageHolster";
import { AutoMovieArchetypeStagePouch } from "./AutoMovieArchetypeStagePouch";
import { AutoMovieArchetypeStageQuiver } from "./AutoMovieArchetypeStageQuiver";
import type { IArchetypeDispatch } from "../core/internal/IArchetypeDispatch";

/** Constructs the holster archetype from its recipe. */
export namespace AutoMovieArchetypeHolster {
/**
 * A container worn on the body that a weapon or its ammunition is drawn from
 * and returned to: a belt holster for a handgun, a sword's scabbard, a knife's
 * or a dagger's sheath, an archer's quiver, or a soldier's cartridge box.
 *
 * Each hangs with the wearer's body on its `-X` side and its front toward `+Z`;
 * `belt` is the loop or hanger it hangs by, facing the wearer. The item in it
 * is a separate prop: the container declares where that item sits, and the act
 * takes it. How each kind stands:
 *
 * - A holster hangs with the middle of its belt loop at the origin. Its `socket`
 *   is the mouth the pistol is drawn from and returned to, facing up, lowered
 *   or raised from the belt line by the `ride` dimension. It marks where the
 *   pistol's butt leaves the mouth; a holstered pistol lies muzzle down in the
 *   pouch, which the holstering act places, and no frame of `createHandgun`
 *   seats coincident on the socket to give that.
 * - A scabbard and a sheath stand on their tip (the chape) at the origin, the
 *   mouth straight up along `+Y` at the drawn length, the blade's flats toward
 *   `X`. `mouth` is the opening, facing up: a sheathed blade stands point down
 *   in it with its shoulder (`createSword`'s origin) on the mouth. `belt` is
 *   the hanger on the metal throat below the mouth. A throat held while the
 *   blade is drawn waits for a source of the throat's size. Its hanging angle
 *   is not modelled: it hangs straight, since no source read gives the angle a
 *   hanger sets.
 * - A quiver stands on its bottom at the origin, a tube open upward. `socket` is
 *   the mouth, facing up, and `slot1` to `slot<slots>` the places the arrows
 *   stand in it, each facing up on the mouth's plane; `belt` hangs it at a hip
 *   from its rim, and `strap` slings it across the back at its middle.
 * - A cartridge box stands on its bottom at the origin, its back against the
 *   wearer at `x = 0`, its length along `Z`. Its two tins' upper parts hold the
 *   loose cartridges standing: `slot1` to `slot<slots>` are their places,
 *   facing up at the box's top, the 2 x 1.35 in part's 6 in three rows of two
 *   and the 1.35 in square part's 4 in two of two. The `lid`, its flap, turns
 *   up and outward on a hinge along the box's back top edge; `strap` is the
 *   shoulder belt's loops at its back, and `belt` the same loops on a waist
 *   belt.
 *
 * @param params The kind, a holster's ride, the blade a scabbard or a sheath is
 *   made to, the number of slots of a quiver, and any dimension the author
 *   fixes.
 * @param seed The seed that picks the ride and the blade left free and draws
 *   every dimension left free inside its band; absent, the first ride, the
 *   first blade and the middle of each band.
 * @returns The container.
 * @throws {AutoMovieArchetypeRefusal} For a ride or a blade not of the kind, a
 *   fixed dimension outside its band or one the ride gives, or a number of
 *   slots that is not a whole number from 1 to the kind's capacity.
 */
export function create(
  params: AutoMovieArchetypeHolster.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHolster.Affordance, AutoMovieArchetypeHolster.Dimension> {
  const kind: AutoMovieArchetypeHolster.Kind = ArchetypeDraw.choice(
    "holster",
    "kind",
    params.kind ?? "holster",
    AutoMovieArchetypeHolster.KINDS,
  );
  // Each variant admits the saved parameters with its own draw, so the table
  // holds its producers as dispatch methods.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeHolster.Kind,
      IArchetypeDispatch<
        Omit<AutoMovieArchetypeHolster.IParams, "kind">,
        AutoMovieArchetype<AutoMovieArchetypeHolster.Affordance, AutoMovieArchetypeHolster.Dimension>
      >
    >
  > = {
    holster: { build: AutoMovieArchetypeStageHolster.create },
    scabbard: { build: AutoMovieArchetypeStageBladeCarrier.create },
    sheath: { build: AutoMovieArchetypeStageBladeCarrier.create },
    quiver: { build: AutoMovieArchetypeStageQuiver.create },
    pouch: { build: AutoMovieArchetypeStagePouch.create },
  };
  return variants[kind].build(params, seed);
}

  /** The canonical factories for saved kinds, read after the catalogue loads. */
  export const PRODUCERS = {
    get holster(): typeof AutoMovieArchetypeStageHolster.create {
      return AutoMovieArchetypeStageHolster.create;
    },
    get scabbard(): typeof AutoMovieArchetypeStageBladeCarrier.create {
      return AutoMovieArchetypeStageBladeCarrier.create;
    },
    get sheath(): typeof AutoMovieArchetypeStageBladeCarrier.create {
      return AutoMovieArchetypeStageBladeCarrier.create;
    },
    get quiver(): typeof AutoMovieArchetypeStageQuiver.create {
      return AutoMovieArchetypeStageQuiver.create;
    },
    get pouch(): typeof AutoMovieArchetypeStagePouch.create {
      return AutoMovieArchetypeStagePouch.create;
    },
  } satisfies Readonly<Record<Kind, unknown>>;

  /**
   * The kinds: a handgun's belt holster, a sword's scabbard, a knife's or a
   * dagger's sheath, and an archer's quiver.
   */
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
   * A scabbard's metal throat at the mouth, its length along the scabbard,
   * metres: an estimate.
   */
  export const THROAT: number = 0.05;

  /**
   * How much wider and thicker the throat is than the body, metres: an
   * estimate.
   */
  export const THROAT_LIP: number = 0.006;

  /**
   * How many items a kind with slots holds: its whole-number capacity and its
   * count when none is asked, kept together with no optional member so a kind
   * has both or neither; read by `createHolster` to admit and default the
   * `slots` parameter.
   */
  export interface ISlots {
    /** The most it holds. */
    capacity: number;

    /** How many it holds when none are asked. */
    slots: number;
  }

  /**
   * The slots of the kinds that have them: a quiver at most the 50 arrows the
   * largest capacity seen claims, a dozen when none are asked, as #3485
   * places.
   */
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
   * - `slot1` to `slot<slots>`: where each arrow stands in a quiver, or each
   *   loose cartridge in a cartridge box, facing up.
   * - `lid`: a cartridge box's flap, a hinge along its back top edge; a positive
   *   travel lifts it up and outward.
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
   * - `length`: a scabbard's or a sheath's from the tip to the mouth; a quiver's
   *   from its bottom to its mouth.
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
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
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

  /**
   * Each kind's rides whole, the default first: mid-ride puts the pistol's butt
   * level with the belt, low and high ride about 1.5 in lower and higher
   * (Safariland, Holster Ride Options,
   * https://inside.safariland.com/education/holster-ride-options/).
   */
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
      lowRide: { ride: -1.5 * AutoMovieArchetypeUnits.INCH },
      highRide: { ride: 1.5 * AutoMovieArchetypeUnits.INCH },
    },
  };

  /**
   * The blades a scabbard is made to: `createSword`'s read longswords and
   * arming swords, and a sabre, a katana and a rapier.
   */
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

  /** Every blade a scabbard is made to, for a caller that reads them at run time. */
  export const SCABBARD_BLADES: readonly ScabbardBlade[] = [
    "crecy",
    "regent",
    "knight",
    "poitiers",
    "sabre",
    "katana",
    "rapier",
  ];

  /** Every blade a sheath is made to, for a caller that reads them at run time. */
  export const SHEATH_BLADES: readonly SheathBlade[] = ["dagger", "knife"];

  /**
   * A scabbard's or a sheath's two bands made to one blade, both always given:
   * `length` from the tip to the mouth and `width` across the blade from edge
   * to back, each the blade's with the fit.
   */
  export type Fitted = Readonly<
    Record<"length" | "width", IAutoMovieArchetypeBand>
  >;

  /**
   * The blades by kind, the default first, each made with Wulflund's fit: a
   * read sword's figures whole, or a kind's blade bands moved out, provisional
   * where the blade's are.
   */
  export const BLADES: Readonly<{
    scabbard: Readonly<Record<ScabbardBlade, Fitted>>;
    sheath: Readonly<Record<SheathBlade, Fitted>>;
  }> = HOLSTER_BLADES;

  /**
   * The parameters: the kind, a holster's ride, a scabbard's or a sheath's
   * blade, the slots, and any free dimension fixed to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier; `holster` when absent. */
    kind?: Kind;

    /**
     * A holster's ride; picked from the seed when absent. The other kinds have
     * none.
     */
    model?: Ride;

    /**
     * The blade a scabbard or a sheath is made to; picked from the seed when
     * absent. The other kinds have none.
     */
    blade?: Blade;

    /**
     * How many arrows a quiver holds, 1 to its `SLOTS` capacity, and that
     * table's count when absent. The other kinds have none.
     */
    slots?: number;

    /** The model's id, unique in a scene; `holster` when absent. */
    id?: string;
  }

  /** The band of each free dimension a ride or a blade leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = HOLSTER_BANDS;
}
