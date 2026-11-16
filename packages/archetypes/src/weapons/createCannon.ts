import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { CannonPieces } from "./CannonPieces";
import { FIELD_GUN } from "./FIELD_GUN";
import { buildFieldGun } from "./buildFieldGun";
import { cannonLaunch } from "./cannonLaunch";
import { cannonRecoil } from "./cannonRecoil";

/** A hundredweight, kilograms: 112 pounds. */
const CWT: number = 112 * ArchetypeUnits.POUND;

/** Griffiths' table of iron ordnance. */
const GRIFFITHS: string =
  "Griffiths, The Artillerist's Manual (1856), Length, Weight, Calibre, Charge, &c., of Ordnance: the iron 32-pounder of 56 cwt, 9 ft 6 in long, bore 6.41 in; its common garrison carriage 13 cwt 3 qr; trucks for land service, fore 1 ft 7 in and hind 1 ft 4 in (https://www.gutenberg.org/ebooks/73341)";

/** A swivel gun read at its museum record. */
const SWIVEL: string =
  "Royal Museums Greenwich KTP0053, bronze muzzleloading smoothbore swivel gun: calibre 2.25 in, overall 1000 x 170 x 101 mm (https://www.rmg.co.uk/collections/objects/rmgc-object-36835)";

/** Douglas's naval gunnery. */
const DOUGLAS: string =
  "Douglas, A Treatise on Naval Gunnery, 5th ed. (1860), p. 110: a 32-pounder with its carriage of 65 cwt, a 10 lb charge, a shot's initial velocity of 1600 ft/s, and a recoil observed at 9 ft on a platform inclined 2 1/2 degrees (https://archive.org/details/atreatiseonnava00douggoog)";

/**
 * A cannon on its carriage: the 6-pdr bronze field gun, Model 1839-1844, on its M1841 carriage, as the 1862 Ordnance Manual gives them.
 *
 * The gun stands on level ground, its axle across `X` at the origin's `Z`, its muzzle toward `+Z`. `muzzle` is the muzzle's face, `+Y` along the bore; `vent` is the vent's outer orifice on the breech, `+Y` out along the vent, which leans to the rear; both ride `elevation`, a hinge on the trunnions' axis whose positive travel raises the muzzle up to the manual's 12 degrees and whose reverse lowers it its 8 degrees below level.
 *
 * The elevating `screw` is the driver. Turning its handle sinks its head by the pitch times its turns; `screwRise` translates it in its brass box, and `elevation` follows the base ring's reference height through a table at every whole degree. The pitch is borrowed from the mountain howitzer's screw, provisional (`FIELD_GUN.SCREW`). The table models vertical coupling; the ring's breadth and the screw head's full contact geometry remain unread. The elevation coupling is reversible, so an author may name either the screw or the desired elevation in a state, but never both; existing elevation-based launches use the same relation. The handle rides the translated head.
 *
 * `trail` is the top of the trail's end, where the trail handspike bears to traverse the piece; where the pointing rings sit on it is unread. The friction `primer` stands in the vent and the `lanyard`'s toggle 12 ft behind it fires it when drawn by the wire's length; the `handspike`, the `limber`'s pintle seat, the `axle` and each wheel's top (`leftWheel`, `rightWheel`) are the crew's other contacts. `muzzleVelocity`, `recoil` and `ball` are the manual's and Gibbon's. `leftSpin` and `rightSpin` turn the wheels on the axle, a positive turn rolling them forward. The gun rests on its iron tires and its wooden trail, two materials, so its body carries no friction.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The cannon.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the gun stands, each contact and articulation, what is provisional and why it carries no friction.
 * @evidence contracts/development/implementation.md#principled-implementation Every size and weight is the manual's, built by `buildFieldGun`; the dimensions are its single figures, so the gun is the one the manual describes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the gun, and weigh it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None here; the construction's shortcuts are `buildFieldGun`'s.
 * @evidence contracts/development/implementation.md#efficient-algorithms One builder pass.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCannon(
  params: createCannon.IParams,
  seed?: number | string,
): Archetype<createCannon.Affordance, createCannon.Dimension> {
  const draw: ArchetypeDrawSession<createCannon.Dimension> =
    new ArchetypeDrawSession<createCannon.Dimension>(
      "cannon",
      createCannon.UNITS,
      seed,
      params,
    );
  const kind: createCannon.Kind = ArchetypeDraw.choice(
    "cannon",
    "kind",
    params.kind,
    createCannon.KINDS,
  );
  // A mortar is one of the manual's two whole; the guns have one read gun each, their bands.
  draw.model<createCannon.Model>(
    "model",
    params.model,
    createCannon.MODELS[kind],
  );
  draw.dimensions(createCannon.BANDS[kind], createCannon.BANDS);
  const d: Partial<Record<createCannon.Dimension, number>> = { ...draw.values };
  const builder: ArchetypeBuilder<
    createCannon.Affordance,
    createCannon.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: kind,
    draw,
  });
  if (kind === "fieldGun") buildFieldGun(builder, d.recoil!);
  else if (kind === "navalGun") CannonPieces.naval(builder, d);
  else if (kind === "mortar") CannonPieces.mortar(builder, d);
  else CannonPieces.swivel(builder, d);
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createCannon}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind, each a single read figure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The gun's working points, its elevation and its wheels (#3484), and the figures a scene measures it by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The provisional screw and the unread pointing rings are stated, not hidden.
 */
export namespace createCannon {
  /** The kinds of cannon: the 6-pdr field gun, a 32-pounder naval gun on its truck carriage, a mortar on its bed, and a swivel gun on its yoke. */
  export type Kind = "fieldGun" | "navalGun" | "mortar" | "swivelGun";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "fieldGun",
    "navalGun",
    "mortar",
    "swivelGun",
  ];

  /** The read mortars: the US 10-inch siege mortar and the 24-pounder Coehorn, model 1841. */
  export type Model = "siege10" | "coehorn24";

  /** Each kind's models whole: the 10-inch siege mortar's 10 in bore, 28 in length and 1,852 lb, on its cast-iron bed 51.8 by 40 in of 1,830 lb, and the Coehorn's 5.82 in bore, 16.32 in length and 164 lb, on its oak bed 31 by 15 in of 132 lb (the 1861 Ordnance Manual, p. 21 for the mortars' bores, lengths and weights and p. 77 for their beds, https://archive.org/details/cu31924031187887; each mass the mortar's with its bed's). The guns have none. */
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
    mortar: {
      siege10: {
        bore: 10 * ArchetypeUnits.INCH,
        length: 28 * ArchetypeUnits.INCH,
        bedLength: 51.8 * ArchetypeUnits.INCH,
        bedWidth: 40 * ArchetypeUnits.INCH,
        mass: (1852 + 1830) * ArchetypeUnits.POUND,
      },
      coehorn24: {
        bore: 5.82 * ArchetypeUnits.INCH,
        length: 16.32 * ArchetypeUnits.INCH,
        bedLength: 31 * ArchetypeUnits.INCH,
        bedWidth: 15 * ArchetypeUnits.INCH,
        mass: (164 + 132) * ArchetypeUnits.POUND,
      },
    },
  };

  /**
   * The affordance ids:
   *
   * - `muzzle`: the muzzle's face, a socket the sponge, the cartridge, the ball and the rammer enter, `+Y` out along the bore; it rides `elevation`.
   * - `vent`: the vent's outer orifice, a socket the priming wire and the primer enter, `+Y` out along the vent; it rides `elevation`.
   * - `primer`: the friction primer's wire eye at its long tube's top, standing in the vent, where the lanyard's hook takes it; it rides `elevation`.
   * - `lanyard`: the lanyard's toggle at its read 12 ft straight back from the primer, a slider the firing hand draws back by the friction wire's read length.
   * - `handspike`: the trail handspike where the hands take it behind the trail's end, to traverse the piece.
   * - `limber`: the trail's end from below, where a limber's pintle takes it.
   * - `axle`: the axle's middle, from which the carriage is drawn.
   * - `leftWheel`, `rightWheel`: each wheel's top, where a cannoneer takes the spokes to run the gun up; each rides its wheel's spin.
   * - `traverse`: a swivel gun's pin turning about the vertical in its socket; its `elevation` rides it.
   * - `tiller`: a swivel gun's tiller behind the breech, where the hand pans and tilts it; it rides `elevation`.
   * - `recoil`: a field gun's whole carriage running back along the ground by its `recoil`, a slider every other part and contact rides; `createCannon.recoil` drives it after a shot.
   * - `elevation`: the tube's hinge on the trunnions' axis, raising the muzzle and, in reverse, lowering it.
   * - `screwRise`: the elevating screw rising and sinking in its box with the elevation.
   * - `screw`: the independent elevating screw's handle; its turns drive the elevation and its head's rise by the screw's pitch.
   * - `trail`: the top of the trail's end, where the handspike bears.
   * - `leftSpin`, `rightSpin`: the wheels' turns on the axle.
   */
  export type Affordance =
    | "muzzle"
    | "vent"
    | "elevation"
    | "screwRise"
    | "screw"
    | "trail"
    | "leftSpin"
    | "rightSpin"
    | "primer"
    | "lanyard"
    | "handspike"
    | "limber"
    | "axle"
    | "leftWheel"
    | "rightWheel"
    | "traverse"
    | "tiller"
    | "recoil";

  /**
   * The dimensions, metres unless stated:
   *
   * - `length`: the tube's whole length.
   * - `trunnionHeight`: the trunnions' axis above the ground.
   * - `wheelDiameter`: the wheels' height.
   * - `track`: between the wheels.
   * - `muzzleVelocity`: the shot's speed leaving the muzzle at the service charge, metres per second.
   * - `recoil`: how far the carriage runs back on firing.
   * - `ball`: the shot's diameter, the calibre of the round shot it fires.
   * - `bore`: the bore's diameter.
   * - `frontWheelDiameter`: a naval carriage's fore trucks; `wheelDiameter` is then its hind trucks'.
   * - `bedLength`, `bedWidth`: a mortar bed's length and width over its manoeuvring bolts.
   * - `mass`: the gun and its carriage without implements, kilograms.
   */
  export type Dimension =
    | "length"
    | "trunnionHeight"
    | "wheelDiameter"
    | "track"
    | "muzzleVelocity"
    | "recoil"
    | "ball"
    | "bore"
    | "frontWheelDiameter"
    | "bedLength"
    | "bedWidth"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    trunnionHeight: "m",
    wheelDiameter: "m",
    track: "m",
    muzzleVelocity: "m/s",
    recoil: "m",
    ball: "m",
    bore: "m",
    frontWheelDiameter: "m",
    bedLength: "m",
    bedWidth: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any dimension fixed to its value. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which cannon. */
    kind: Kind;

    /** Which read mortar; drawn from the seed when absent. The guns have none. */
    model?: Model;

    /** The model's id, unique in a scene; `cannon` when absent. */
    id?: string;
  }

  /** The band of each dimension a model leaves, by kind: each a read figure, the provisional ones marked with their reason. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    fieldGun: {
      length: ArchetypeBand.metres(
        FIELD_GUN.TUBE.whole,
        FIELD_GUN.TUBE.whole,
        FIELD_GUN.SOURCE,
      ),
      trunnionHeight: ArchetypeBand.metres(
        FIELD_GUN.CARRIAGE.trunnionHeight,
        FIELD_GUN.CARRIAGE.trunnionHeight,
        FIELD_GUN.SOURCE,
      ),
      wheelDiameter: ArchetypeBand.metres(
        FIELD_GUN.CARRIAGE.wheel,
        FIELD_GUN.CARRIAGE.wheel,
        FIELD_GUN.SOURCE,
      ),
      track: ArchetypeBand.metres(
        FIELD_GUN.CARRIAGE.track,
        FIELD_GUN.CARRIAGE.track,
        FIELD_GUN.SOURCE,
      ),
      mass: ArchetypeBand.of(
        "kg",
        FIELD_GUN.TUBE.mass +
          FIELD_GUN.CARRIAGE.mass +
          2 * FIELD_GUN.CARRIAGE.wheelMass,
        FIELD_GUN.TUBE.mass +
          FIELD_GUN.CARRIAGE.mass +
          2 * FIELD_GUN.CARRIAGE.wheelMass,
        `${FIELD_GUN.SOURCE}: the piece's 884 lb and the gun-carriage complete without implements, 900 lb`,
      ),
      muzzleVelocity: ArchetypeBand.of(
        "m/s",
        FIELD_GUN.SERVICE.velocity,
        FIELD_GUN.SERVICE.velocity,
        "the 1861 Ordnance Manual, p. 393, Initial Velocities of Cannon-Balls, ballistic pendulum at Washington Arsenal: the 6-pdr. field-gun's shot at 1.25 lb, 1439 ft/s (https://archive.org/details/ordnancemanualfo00unitrich)",
      ),
      recoil: ArchetypeBand.metres(
        FIELD_GUN.SERVICE.recoil.least,
        FIELD_GUN.SERVICE.recoil.most,
        'Gibbon, The Artillerist\'s Manual (1860), p. 272: "under some circumstances the 6-pdr. gun will recoil but 1 1/2 or 2 yards"; the run depends on the ground, the elevation and the charge (Roberts, p. 77), so the band is provisional',
        true,
      ),
      ball: ArchetypeBand.metres(
        FIELD_GUN.SERVICE.shot,
        FIELD_GUN.SERVICE.shot,
        "the 1861 Ordnance Manual, p. 34, shot table: the 6-pdr. shot's diameter, 3.58 in",
      ),
      bore: ArchetypeBand.metres(
        FIELD_GUN.TUBE.bore,
        FIELD_GUN.TUBE.bore,
        FIELD_GUN.SOURCE,
      ),
    },
    navalGun: {
      length: ArchetypeBand.metres(
        114 * ArchetypeUnits.INCH,
        114 * ArchetypeUnits.INCH,
        GRIFFITHS,
      ),
      bore: ArchetypeBand.metres(
        6.41 * ArchetypeUnits.INCH,
        6.41 * ArchetypeUnits.INCH,
        GRIFFITHS,
      ),
      frontWheelDiameter: ArchetypeBand.metres(
        19 * ArchetypeUnits.INCH,
        19 * ArchetypeUnits.INCH,
        `${GRIFFITHS}: the land service's fore truck, borrowed for the sea carriage because no sea-service truck size was found (searched: the 1852 and 1866 US Navy instructions, Douglas 1860; records-cannon.md)`,
        true,
      ),
      wheelDiameter: ArchetypeBand.metres(
        16 * ArchetypeUnits.INCH,
        16 * ArchetypeUnits.INCH,
        `${GRIFFITHS}: the land service's hind truck, borrowed for the sea carriage because no sea-service truck size was found`,
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        (56 + 13.75) * CWT,
        (56 + 13.75) * CWT,
        `${GRIFFITHS}: the gun's 56 cwt and the carriage's 13 cwt 3 qr at 112 lb the hundredweight`,
      ),
      muzzleVelocity: ArchetypeBand.of(
        "m/s",
        1600 * ArchetypeUnits.FOOT,
        1600 * ArchetypeUnits.FOOT,
        DOUGLAS,
      ),
      recoil: ArchetypeBand.metres(
        9 * ArchetypeUnits.FOOT,
        9 * ArchetypeUnits.FOOT,
        `${DOUGLAS}; the run depends on the deck's slope and the charge, so the band is provisional`,
        true,
      ),
    },
    mortar: {},
    swivelGun: {
      length: ArchetypeBand.metres(
        1,
        1,
        `${SWIVEL}: its overall 1000 mm taken as the tube's length, provisional because the record does not say what the overall includes`,
        true,
      ),
      bore: ArchetypeBand.metres(
        2.25 * ArchetypeUnits.INCH,
        2.25 * ArchetypeUnits.INCH,
        `${SWIVEL}: calibre 2.25 in`,
      ),
      mass: ArchetypeBand.of(
        "kg",
        30,
        60,
        `${ArchetypeBand.TYPICAL_MASS}: an estimate, no swivel gun's weight being found (searched: Royal Museums Greenwich, the Industry wreck's exhibit, the National Park Service's manual, Griffiths; records-cannon.md)`,
        true,
      ),
    },
  };

  /** Where and how a shot leaves the muzzle: the muzzle's place, the bore's direction, the speed and the shot's diameter. */
  export interface ILaunch {
    /** The muzzle's face, in the gun's space. */
    origin: IAutoMovieVector3;

    /** The bore's direction out of the muzzle, a unit vector. */
    direction: IAutoMovieVector3;

    /** The shot's speed leaving the muzzle, metres per second. */
    speed: number;

    /** The shot's diameter, metres: the gun's `ball`, else its bore. */
    calibre: number;
  }

  /** The launch of a shot from a gun at an articulation state, from the muzzle along the bore at its muzzle velocity: `cannonLaunch`, which refuses a kind that publishes no muzzle velocity. */
  export const launch: typeof cannonLaunch = cannonLaunch;

  /** A field gun's recoil after a shot, run back from rest by its read recoil and slowed evenly to rest: `cannonRecoil`, which refuses a gun without a `recoil` slider. */
  export const recoil: typeof cannonRecoil = cannonRecoil;
}
