import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { CannonPieces } from "./internal/CannonPieces";
import { FIELD_GUN } from "./constants/FIELD_GUN";
import { buildFieldGun } from "./internal/buildFieldGun";
import { cannonLaunch } from "./internal/cannonLaunch";
import { cannonRecoil } from "./internal/cannonRecoil";
import { cannonTowing } from "./internal/cannonTowing";

/** A hundredweight, kilograms: 112 pounds. */
const CWT: number = 112 * AutoMovieArchetypeUnits.POUND;

/** Griffiths' table of iron ordnance. */
const GRIFFITHS: string =
  "Griffiths, The Artillerist's Manual (1856), Length, Weight, Calibre, Charge, &c., of Ordnance: the iron 32-pounder of 56 cwt, 9 ft 6 in long, bore 6.41 in; its common garrison carriage 13 cwt 3 qr; trucks for land service, fore 1 ft 7 in and hind 1 ft 4 in (https://www.gutenberg.org/ebooks/73341)";

/** A swivel gun read at its museum record. */
const SWIVEL: string =
  "Royal Museums Greenwich KTP0053, bronze muzzleloading smoothbore swivel gun: calibre 2.25 in, overall 1000 x 170 x 101 mm (https://www.rmg.co.uk/collections/objects/rmgc-object-36835)";

/** Douglas's naval gunnery. */
const DOUGLAS: string =
  "Douglas, A Treatise on Naval Gunnery, 5th ed. (1860), p. 110: a 32-pounder with its carriage of 65 cwt, a 10 lb charge, a shot's initial velocity of 1600 ft/s, and a recoil observed at 9 ft on a platform inclined 2 1/2 degrees (https://archive.org/details/atreatiseonnava00douggoog)";

/** Constructs the cannon archetype from its recipe. */
export namespace AutoMovieArchetypeCannon {
/**
 * A cannon on its carriage: the 6-pdr bronze field gun, Model 1839-1844, on its
 * M1841 carriage, as the 1862 Ordnance Manual gives them.
 *
 * The gun stands on level ground, its axle across `X` at the origin's `Z`, its
 * muzzle toward `+Z`. `muzzle` is the muzzle's face, `+Y` along the bore;
 * `vent` is the vent's outer orifice on the breech, `+Y` out along the vent,
 * which leans to the rear; both ride `elevation`, a hinge on the trunnions'
 * axis whose positive travel raises the muzzle up to the manual's 12 degrees
 * and whose reverse lowers it its 8 degrees below level.
 *
 * The elevating `screw` is the driver. Turning its handle sinks its head by the
 * pitch times its turns; `screwRise` translates it in its brass box, and
 * `elevation` follows the base ring's reference height through a table at every
 * whole degree. The pitch is borrowed from the mountain howitzer's screw,
 * provisional (`FIELD_GUN.SCREW`). The table models vertical coupling; the
 * ring's breadth and the screw head's full contact geometry remain unread. The
 * elevation coupling is reversible, so an author may name either the screw or
 * the desired elevation in a state, but never both; existing elevation-based
 * launches use the same relation. The handle rides the translated head.
 *
 * `trail` is the top of the trail's end, where the trail handspike bears to
 * traverse the piece; where the pointing rings sit on it is unread. The
 * friction `primer` stands in the vent and the `lanyard`'s toggle 12 ft behind
 * it fires it when drawn by the wire's length; the `handspike`, the `limber`'s
 * pintle seat, the `axle` and each wheel's top (`leftWheel`, `rightWheel`) are
 * the crew's other contacts. `muzzleVelocity`, `recoil` and `ball` are the
 * manual's and Gibbon's. `leftSpin` and `rightSpin` turn the wheels on the
 * axle, a positive turn rolling them forward. The gun rests on its iron tires
 * and its wooden trail, two materials, so its body carries no friction.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The cannon.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeCannon.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCannon.Affordance, AutoMovieArchetypeCannon.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeCannon.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeCannon.Dimension>(
      "cannon",
      AutoMovieArchetypeCannon.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeCannon.Kind = ArchetypeDraw.choice(
    "cannon",
    "kind",
    params.kind,
    AutoMovieArchetypeCannon.KINDS,
  );
  // A mortar is one of the manual's two whole; the guns have one read gun each, their bands.
  draw.model<AutoMovieArchetypeCannon.Model>(
    "model",
    params.model,
    AutoMovieArchetypeCannon.MODELS[kind],
  );
  draw.dimensions(AutoMovieArchetypeCannon.BANDS[kind], AutoMovieArchetypeCannon.BANDS);
  const d: Partial<Record<AutoMovieArchetypeCannon.Dimension, number>> = { ...draw.values };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeCannon.Affordance,
    AutoMovieArchetypeCannon.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
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
   * The kinds of cannon: the 6-pdr field gun, a 32-pounder naval gun on its
   * truck carriage, a mortar on its bed, and a swivel gun on its yoke.
   */
  export type Kind = "fieldGun" | "navalGun" | "mortar" | "swivelGun";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "fieldGun",
    "navalGun",
    "mortar",
    "swivelGun",
  ];

  /**
   * The read mortars: the US 10-inch siege mortar and the 24-pounder Coehorn,
   * model 1841.
   */
  export type Model = "siege10" | "coehorn24";

  /**
   * Each kind's models whole: the 10-inch siege mortar's 10 in bore, 28 in
   * length and 1,852 lb, on its cast-iron bed 51.8 by 40 in of 1,830 lb, and
   * the Coehorn's 5.82 in bore, 16.32 in length and 164 lb, on its oak bed 31
   * by 15 in of 132 lb (the 1861 Ordnance Manual, p. 21 for the mortars' bores,
   * lengths and weights and p. 77 for their beds,
   * https://archive.org/details/cu31924031187887; each mass the mortar's with
   * its bed's). The guns have none.
   */
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
        bore: 10 * AutoMovieArchetypeUnits.INCH,
        length: 28 * AutoMovieArchetypeUnits.INCH,
        bedLength: 51.8 * AutoMovieArchetypeUnits.INCH,
        bedWidth: 40 * AutoMovieArchetypeUnits.INCH,
        mass: (1852 + 1830) * AutoMovieArchetypeUnits.POUND,
      },
      coehorn24: {
        bore: 5.82 * AutoMovieArchetypeUnits.INCH,
        length: 16.32 * AutoMovieArchetypeUnits.INCH,
        bedLength: 31 * AutoMovieArchetypeUnits.INCH,
        bedWidth: 15 * AutoMovieArchetypeUnits.INCH,
        mass: (164 + 132) * AutoMovieArchetypeUnits.POUND,
      },
    },
  };

  /**
   * The affordance ids:
   *
   * - `muzzle`: the muzzle's face, a socket the sponge, the cartridge, the ball
   *   and the rammer enter, `+Y` out along the bore, its `depth` the bore's
   *   length on the field gun; it rides `elevation`.
   * - `vent`: the vent's outer orifice, a socket the priming wire and the primer
   *   enter, `+Y` out along the vent; it rides `elevation`.
   * - `primer`: the friction primer's wire eye at its long tube's top, standing
   *   in the vent, where the lanyard's hook takes it; it rides `elevation`.
   * - `lanyard`: the lanyard's toggle at its read 12 ft straight back from the
   *   primer, a slider the firing hand draws back by the friction wire's read
   *   length.
   * - `handspike`: the trail handspike where the hands take it behind the trail's
   *   end, to traverse the piece.
   * - `limber`: the trail's end from below, where a limber's pintle takes it.
   * - `axle`: the axle's middle, from which the carriage is drawn.
   * - `leftWheel`, `rightWheel`: each wheel's top, where a cannoneer takes the
   *   spokes to run the gun up; each rides its wheel's spin.
   * - `traverse`: a swivel gun's pin turning about the vertical in its socket;
   *   its `elevation` rides it.
   * - `tiller`: a swivel gun's tiller behind the breech, where the hand pans and
   *   tilts it; it rides `elevation`.
   * - `recoil`: a field gun's whole carriage running back along the ground by its
   *   `recoil`, a slider every other part and contact rides;
   *   `createCannon.recoil` drives it after a shot.
   * - `elevation`: the tube's hinge on the trunnions' axis, raising the muzzle
   *   and, in reverse, lowering it.
   * - `screwRise`: the elevating screw rising and sinking in its box with the
   *   elevation.
   * - `screw`: the independent elevating screw's handle; its turns drive the
   *   elevation and its head's rise by the screw's pitch.
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
   * - `muzzleVelocity`: the shot's speed leaving the muzzle at the service
   *   charge, metres per second.
   * - `recoil`: how far the carriage runs back on firing.
   * - `ball`: the shot's diameter, the calibre of the round shot it fires.
   * - `bore`: the bore's diameter.
   * - `frontWheelDiameter`: a naval carriage's fore trucks; `wheelDiameter` is
   *   then its hind trucks'.
   * - `bedLength`, `bedWidth`: a mortar bed's length and width over its
   *   manoeuvring bolts.
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
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
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

  /**
   * The band of each dimension a model leaves, by kind: each a read figure, the
   * provisional ones marked with their reason.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    fieldGun: {
      length: AutoMovieArchetypeBand.metres(
        FIELD_GUN.TUBE.whole,
        FIELD_GUN.TUBE.whole,
        FIELD_GUN.SOURCE,
      ),
      trunnionHeight: AutoMovieArchetypeBand.metres(
        FIELD_GUN.CARRIAGE.trunnionHeight,
        FIELD_GUN.CARRIAGE.trunnionHeight,
        FIELD_GUN.SOURCE,
      ),
      wheelDiameter: AutoMovieArchetypeBand.metres(
        FIELD_GUN.CARRIAGE.wheel,
        FIELD_GUN.CARRIAGE.wheel,
        FIELD_GUN.SOURCE,
      ),
      track: AutoMovieArchetypeBand.metres(
        FIELD_GUN.CARRIAGE.track,
        FIELD_GUN.CARRIAGE.track,
        FIELD_GUN.SOURCE,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        FIELD_GUN.TUBE.mass +
          FIELD_GUN.CARRIAGE.mass +
          2 * FIELD_GUN.CARRIAGE.wheelMass,
        FIELD_GUN.TUBE.mass +
          FIELD_GUN.CARRIAGE.mass +
          2 * FIELD_GUN.CARRIAGE.wheelMass,
        `${FIELD_GUN.SOURCE}: the piece's 884 lb and the gun-carriage complete without implements, 900 lb`,
      ),
      muzzleVelocity: AutoMovieArchetypeBand.of(
        "m/s",
        FIELD_GUN.SERVICE.velocity,
        FIELD_GUN.SERVICE.velocity,
        "the 1861 Ordnance Manual, p. 393, Initial Velocities of Cannon-Balls, ballistic pendulum at Washington Arsenal: the 6-pdr. field-gun's shot at 1.25 lb, 1439 ft/s (https://archive.org/details/ordnancemanualfo00unitrich)",
      ),
      recoil: AutoMovieArchetypeBand.metres(
        FIELD_GUN.SERVICE.recoil.least,
        FIELD_GUN.SERVICE.recoil.most,
        'Gibbon, The Artillerist\'s Manual (1860), p. 272: "under some circumstances the 6-pdr. gun will recoil but 1 1/2 or 2 yards"; the run depends on the ground, the elevation and the charge (Roberts, p. 77), so the band is provisional',
        true,
      ),
      ball: AutoMovieArchetypeBand.metres(
        FIELD_GUN.SERVICE.shot,
        FIELD_GUN.SERVICE.shot,
        "the 1861 Ordnance Manual, p. 34, shot table: the 6-pdr. shot's diameter, 3.58 in",
      ),
      bore: AutoMovieArchetypeBand.metres(
        FIELD_GUN.TUBE.bore,
        FIELD_GUN.TUBE.bore,
        FIELD_GUN.SOURCE,
      ),
    },
    navalGun: {
      length: AutoMovieArchetypeBand.metres(
        114 * AutoMovieArchetypeUnits.INCH,
        114 * AutoMovieArchetypeUnits.INCH,
        GRIFFITHS,
      ),
      bore: AutoMovieArchetypeBand.metres(
        6.41 * AutoMovieArchetypeUnits.INCH,
        6.41 * AutoMovieArchetypeUnits.INCH,
        GRIFFITHS,
      ),
      ball: AutoMovieArchetypeBand.metres(
        6.14 * AutoMovieArchetypeUnits.INCH,
        6.2 * AutoMovieArchetypeUnits.INCH,
        `${GRIFFITHS}, p. 59: the 32-pounder's shot low and high gauges, 6.14 and 6.20 in, distinct from its 6.41 in bore`,
      ),
      frontWheelDiameter: AutoMovieArchetypeBand.metres(
        19 * AutoMovieArchetypeUnits.INCH,
        19 * AutoMovieArchetypeUnits.INCH,
        `${GRIFFITHS}: the land service's fore truck, borrowed for the sea carriage because no sea-service truck size was found (searched: the 1852 and 1866 US Navy instructions, Douglas 1860; records-cannon.md)`,
        true,
      ),
      wheelDiameter: AutoMovieArchetypeBand.metres(
        16 * AutoMovieArchetypeUnits.INCH,
        16 * AutoMovieArchetypeUnits.INCH,
        `${GRIFFITHS}: the land service's hind truck, borrowed for the sea carriage because no sea-service truck size was found`,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        (56 + 13.75) * CWT,
        (56 + 13.75) * CWT,
        `${GRIFFITHS}: the gun's 56 cwt and the carriage's 13 cwt 3 qr at 112 lb the hundredweight`,
      ),
      muzzleVelocity: AutoMovieArchetypeBand.of(
        "m/s",
        1600 * AutoMovieArchetypeUnits.FOOT,
        1600 * AutoMovieArchetypeUnits.FOOT,
        DOUGLAS,
      ),
      recoil: AutoMovieArchetypeBand.metres(
        9 * AutoMovieArchetypeUnits.FOOT,
        9 * AutoMovieArchetypeUnits.FOOT,
        `${DOUGLAS}; the run depends on the deck's slope and the charge, so the band is provisional`,
        true,
      ),
    },
    mortar: {},
    swivelGun: {
      length: AutoMovieArchetypeBand.metres(
        1,
        1,
        `${SWIVEL}: its overall 1000 mm taken as the tube's length, provisional because the record does not say what the overall includes`,
        true,
      ),
      bore: AutoMovieArchetypeBand.metres(
        2.25 * AutoMovieArchetypeUnits.INCH,
        2.25 * AutoMovieArchetypeUnits.INCH,
        `${SWIVEL}: calibre 2.25 in`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        30,
        60,
        `${AutoMovieArchetypeBand.TYPICAL_MASS}: an estimate, no swivel gun's weight being found (searched: Royal Museums Greenwich, the Industry wreck's exhibit, the National Park Service's manual, Griffiths; records-cannon.md)`,
        true,
      ),
    },
  };

  /**
   * Where and how a shot leaves the muzzle: the muzzle's place, the bore's
   * direction, the speed and the shot's diameter.
   */
  export interface ILaunch {
    /** The muzzle's face, in the gun's space. */
    origin: IAutoMovieVector3;

    /** The bore's direction out of the muzzle, a unit vector. */
    direction: IAutoMovieVector3;

    /** The shot's speed leaving the muzzle, metres per second. */
    speed: number;

    /**
     * The known shot diameter, metres, from the gun's `ball`; a bore is not a
     * substitute for the shot.
     */
    calibre: number;
  }

  /**
   * The launch of a shot from a gun at an articulation state, from the muzzle
   * along the bore at its muzzle velocity: `cannonLaunch`, which refuses a kind
   * that publishes no muzzle velocity.
   */
  export const launch: typeof cannonLaunch = cannonLaunch;

  /**
   * A field gun's recoil after a shot, run back from rest by its read recoil
   * and slowed evenly to rest: `cannonRecoil`, which refuses a gun without a
   * `recoil` slider.
   */
  export const recoil: typeof cannonRecoil = cannonRecoil;

  /**
   * Field-gun axle support for generic towing; cannonTowing admits its kind.
   *
   * @param gun Neutral fieldGun output; its trail coupling lies behind its own
   *   +Z direction.
   * @returns An independent model-space metre axle supporting rigid body pitch
   *   with both wheels grounded; generic towing derives the reverse trail-first
   *   orientation.
   * @throws {RangeError} For another producer/kind or invalid wheel-axis
   *   geometry.
   * @throws {AutoMovieArchetypeRefusal} If a required wheel-spin affordance is
   *   absent.
   */
  export const towing: typeof cannonTowing = cannonTowing;
}
