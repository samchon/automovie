import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeDensity,
  type AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { PROJECTILE_BANDS } from "./PROJECTILE_BANDS";
import { createStageBallProp } from "./createStageBallProp";
import { createStageCartridgeProp } from "./createStageCartridgeProp";
import { createStageGrenadeProp } from "./createStageGrenadeProp";
import { createStageRoundProp } from "./createStageRoundProp";
import { createStageShaftToken } from "./createStageShaftToken";
import { createStageStoneProp } from "./createStageStoneProp";
import { projectileFlight } from "./projectileFlight";

/**
 * Something a weapon launches or a hand throws, or a soldier loads: a musket
 * ball, an arrow, a crossbow bolt, a field gun's round shot, a hand grenade, a
 * throwing stone or a musket's paper cartridge.
 *
 * A ball, a shot and a stone rest on the floor of their own space on their
 * lowest point; `body` is the ball pinched between the fingers, the shot taken
 * in two hands, or the stone closed round in one hand. A stone is a ball of
 * granite whose mass is drawn and whose diameter follows from that mass at its
 * drawn specific gravity, so a heavier stone is bigger; it rests on stone, so
 * its body's friction is granite's on concrete. A grenade rests on its body
 * with its fuze up, its `body` closed round in one hand; its pin and lever wait
 * for a source of their size and pull, and its 4 to 5 s fuze delay is its data
 * sheet's, for the throw that reads it. An arrow or a bolt stands along `+Y`
 * from its butt at the origin to its point: `shaft` is its shaft, held anywhere
 * along it; `nock` is its butt, facing down along it, which sits on a bow's or
 * a crossbow's string; `tip` is its point, `+Y` along it. An arrow's and a
 * bolt's shaft is wood, a bolt's head steel, and a shot and a grenade iron or
 * steel, as their records state; each rests on that material, an arrow and a
 * bolt on the wooden butt of its shaft, so its body's friction is that
 * material's on concrete; a ball's lead has no measured pair, so its body
 * carries no friction. A projectile is an ordinary archetype: it moves only by
 * a grip or a flight, never by itself, and its flight data is its model body's
 * (`flight`): its drag, its restitution where it bounces or rolls and its depth
 * where it sticks, each only where a source read it, with how it is held in
 * flight and how its flight ends (`ATTITUDE`, `OUTCOME`), for the flight #3479
 * runs. A cartridge, the paper tube of a musket's ball and powder, stands along
 * `+Y` from its ball end at the origin to its powder end: `grip` is its paper
 * pinched between the thumb and two fingers, and `end` its powder end, which
 * the teeth bite off to prime and load ("Bring it to the mouth ... and bite off
 * the top of it", Duane, A Military Dictionary, 1810); it is loaded, never
 * launched, so it carries no flight data.
 *
 * @param params The kind, the read object where the kind has several, and any
 *   dimension the author fixes.
 * @param seed The seed that picks the object left free and draws every
 *   dimension left free inside its band; absent, the first object and the
 *   middle of each band.
 * @returns The projectile.
 * @throws {AutoMovieArchetypeRefusal} For an object not of the kind, a fixed
 *   dimension outside its band, or one the object gives.
 */
export function createProjectile(
  params: createProjectile.IParams,
  seed?: number,
): AutoMovieArchetype<createProjectile.Affordance, createProjectile.Dimension> {
  const kind: createProjectile.Kind = ArchetypeDraw.choice(
    "projectile",
    "kind",
    params.kind,
    createProjectile.KINDS,
  );
  return createProjectile.PRODUCERS[kind](params, seed);
}

/** Companion types, constants and bands of {@link createProjectile}. */
export namespace createProjectile {
  /** The canonical factories for saved kinds, read after the catalogue loads. */
  export const PRODUCERS = {
    get ball(): typeof createStageBallProp {
      return createStageBallProp;
    },
    get arrow(): typeof createStageShaftToken {
      return createStageShaftToken;
    },
    get bolt(): typeof createStageShaftToken {
      return createStageShaftToken;
    },
    get roundShot(): typeof createStageRoundProp {
      return createStageRoundProp;
    },
    get grenade(): typeof createStageGrenadeProp {
      return createStageGrenadeProp;
    },
    get cartridge(): typeof createStageCartridgeProp {
      return createStageCartridgeProp;
    },
    get stone(): typeof createStageStoneProp {
      return createStageStoneProp;
    },
  } satisfies Readonly<Record<Kind, unknown>>;

  /**
   * The kinds: a musket ball, an arrow, a crossbow bolt, a field gun's round
   * shot, a hand grenade, a musket's paper cartridge and a hand-thrown stone.
   */
  export type Kind =
    | "ball"
    | "arrow"
    | "bolt"
    | "roundShot"
    | "grenade"
    | "cartridge"
    | "stone";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "ball",
    "arrow",
    "bolt",
    "roundShot",
    "grenade",
    "cartridge",
    "stone",
  ];

  /**
   * A grenade fuze's radius as a share of the body's diameter: a construction
   * estimate that no act reads and no band declares; the fuze's height is the
   * data sheet's length less the body.
   */
  export const FUZE: number = 0.25;

  /**
   * European ash's density at 12 % moisture, kilograms per cubic metre (The
   * Wood Database, https://www.wood-database.com/european-ash/), the Met's
   * bolts being steel on oak and ash.
   */
  export const ASH: number = 680;

  /**
   * A bolt's steel head's density (`AutoMovieArchetypeDensity.STEEL`) over its
   * ash shaft's, which places the bolt's balance toward its head.
   */
  export const STEEL_OVER_ASH: number = AutoMovieArchetypeDensity.STEEL / ASH;

  /**
   * How each launched kind is held in flight: `velocity`, its axis along its
   * velocity, point first, as an arrow and a bolt fly; `free`, turning as it
   * will, as a sphere does (#3482). A cartridge is loaded, not launched, so it
   * has none.
   */
  export const ATTITUDE: Readonly<
    Record<Exclude<Kind, "cartridge">, "velocity" | "free">
  > = {
    ball: "free",
    arrow: "velocity",
    bolt: "velocity",
    roundShot: "free",
    grenade: "free",
    stone: "free",
  };

  /**
   * How each launched kind's flight ends (#3482): `stick`, it embeds where it
   * strikes; `bounce`, it rebounds and then rolls, as a round shot and a stone
   * do; `roll`, it rolls where it lands. A cartridge is loaded, not launched,
   * so it has none.
   */
  export const OUTCOME: Readonly<
    Record<Exclude<Kind, "cartridge">, "stick" | "bounce" | "roll">
  > = {
    ball: "stick",
    arrow: "stick",
    bolt: "stick",
    roundShot: "bounce",
    grenade: "roll",
    stone: "bounce",
  };

  /**
   * The flight data read, each with its source, metres and dimensionless
   * coefficients:
   *
   * - `sphere`: a sphere's drag coefficient, 0.47, "spheres exhibit a roughly
   *   constant drag with a CD value ~0.47" against the cross-sectional area (A.
   *   R. Collins, Cannonball Aerodynamic Drag,
   *   https://arc.id.au/CannonballDrag.html, on Miller and Bailey, J. Fluid
   *   Mech. 1979), inside NASA Glenn's ".07 to .5" on the projected frontal
   *   area
   *   (https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/shape-effects-on-drag/);
   *   provisional for a musket ball, whose supersonic flight Collins puts near
   *   1, for a grenade, whose fuze and lever are not counted, and for a stone,
   *   a rough spheroid rather than a smooth sphere.
   * - `arrow`: an arrow's drag coefficient, "about 1.5 for Re > 1.0 × 10^4" with
   *   a laminar boundary layer (Miyazaki et al., Aerodynamic properties of an
   *   archery arrow, Sports Engineering 16(1):43-54, 2013, abstract,
   *   https://www.bisp-surf.de/Record/PU201304002489); its reference area,
   *   which the abstract does not state, taken as the shaft's cross-section,
   *   provisional.
   * - `ballEmbed`: a musket ball's depth in wood, ".626-inch ball embedded ¾ inch
   *   in a dry loblolly pine post" (Scott et al., Colonial Era Firearm Bullet
   *   Performance, American Society of Arms Collectors, 2017, rev. 2024, p. 72,
   *   https://americansocietyofarmscollectors.org/wp-content/uploads/2024/07/I-Roundball-Shooting-Phase-1-Report-Revised-3-20-24.pdf).
   * - `arrowEmbed`: an arrow's depth in wood, a target arrow from a 65 lb bow at
   *   7 yards through an oak board 1 in thick, "a total depth of 2 inches"
   *   (Pope, A Study of Bows and Arrows, 1923, p. 357,
   *   https://digitalassets.lib.berkeley.edu/anthpubs/ucb/text/ucp013-011.pdf).
   * - `shotEmbed`: a round shot's least depth in earth, "a 6-pounder from 3½ feet
   *   to 4½ feet; ... 12-pounder from 8½ feet to 10 feet" in "common earth, dug
   *   up and well rammed" (Griffiths, The Artillerist's Manual, 1856, p. 199,
   *   https://www.gutenberg.org/ebooks/73341), the least of each range.
   * - `ground`: a restitution for a sphere striking soil, 0.30, the rockfall
   *   default for soil (Benoît et al., Evaluation of coefficients of
   *   restitution for rockfall modeling, 20th ICSMGE, 2022, p. 2381, Table 2,
   *   https://www.issmge.org/uploads/publications/1/120/ICSMGE_2022-408.pdf),
   *   measured on rock blocks, so read for a stone and provisional for iron
   *   shot and a grenade.
   *
   * Searched for #3482 without a figure, so left absent: a Mary Rose
   * arrowhead's size and mass, which would place an arrow's balance ahead of
   * its middle (Weapons of Warre's arrowhead chapter is not online; the
   * Fletchers' Company's Mary Rose page gives none, its heads having corroded
   * away); a crossbow bolt's drag (Mukaiyama et al. 2011's wind-tunnel study
   * was seen only in search results) and its depth in a target; a sphere's
   * rolling resistance on grass or ground; an iron, lead or grenade body's
   * restitution on ground measured as such; the M67 safety pin's pull and
   * travel (TM 43-0001-29 and FM 3-23.30 give the fuze's 4 to 5 s and the pin's
   * spread end, not its size; MIL-F-63446B's 1 to 8 lb is for the M230 and M231
   * practice fuzes).
   */
  export const FLIGHT: Readonly<{
    sphere: number;
    arrow: number;
    ballEmbed: number;
    arrowEmbed: number;
    shotEmbed: Readonly<Partial<Record<Model, number>>>;
    ground: number;
  }> = {
    sphere: 0.47,
    arrow: 1.5,
    ballEmbed: 0.75 * AutoMovieArchetypeUnits.INCH,
    arrowEmbed: 2 * AutoMovieArchetypeUnits.INCH,
    shotEmbed: {
      sixPounder: 3.5 * AutoMovieArchetypeUnits.FOOT,
      twelvePounder: 8.5 * AutoMovieArchetypeUnits.FOOT,
    },
    ground: 0.3,
  };

  /**
   * A launched kind's flight data for its body, from its read object and its
   * radius in metres: `projectileFlight`.
   */
  export const flight: typeof projectileFlight = projectileFlight;

  /**
   * The read objects: the Westminster Abbey arrow and Mary Rose arrow AZ472/19;
   * the bolts NMM 11461 and Met 33754; the 6-pdr. and 12-pdr. field guns'
   * shot.
   */
  export type Model =
    | "westminster"
    | "az472"
    | "nmm11461"
    | "met33754"
    | "sixPounder"
    | "twelvePounder";

  /**
   * Each kind's read objects whole, the default first:
   *
   * - Arrows (Aston and Spencer, pp. 27-29): the Westminster Abbey arrow, 11 mm
   *   across at the shoulder and 50 g; AZ472/19, 62.5 g.
   * - Bolts: NMM 11461, 360 mm, its head 77 mm and its shaft 13.6 mm across
   *   (https://collectie.nmm.nl/nl/collectie/detail/227252/), its head as wide
   *   as the shaft its socket takes and its mass derived as the projectile's
   *   documentation states; Met 33754, 43.7 cm, its head 6.6 by 1.9 cm, 74 g
   *   (https://collectionapi.metmuseum.org/public/collection/v1/objects/33754).
   * - Round shot, "a solid sphere of cast-iron" (Roberts, Hand-book of Artillery,
   *   1863, https://gutenberg.org/cache/epub/71575/pg71575.txt): the 6-pdr.'s
   *   3.58 in and 6.1 lb, the 12-pdr.'s 4.52 in and 12.3 lb.
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
    arrow: {
      westminster: { diameter: 0.011, mass: 0.05 },
      az472: { mass: 0.0625 },
    },
    bolt: {
      nmm11461: {
        length: 0.36,
        head: 0.077,
        diameter: 0.0136,
        headWidth: 0.0136,
        mass:
          Math.PI * (0.0136 / 2) ** 2 * (0.36 - 0.077) * ASH +
          ((0.0136 ** 2 * 0.077) / 3) * AutoMovieArchetypeDensity.STEEL,
      },
      met33754: { length: 0.437, head: 0.066, headWidth: 0.019, mass: 0.074 },
    },
    roundShot: {
      sixPounder: {
        diameter: 3.58 * AutoMovieArchetypeUnits.INCH,
        mass: 6.1 * AutoMovieArchetypeUnits.POUND,
      },
      twelvePounder: {
        diameter: 4.52 * AutoMovieArchetypeUnits.INCH,
        mass: 12.3 * AutoMovieArchetypeUnits.POUND,
      },
    },
  };

  /**
   * The affordance ids:
   *
   * - `body`: a ball, a shot, a grenade's body or a stone, taken from `-X`.
   * - `shaft`: an arrow's or a bolt's shaft, taken from `-Z` anywhere along it.
   * - `nock`: an arrow's or a bolt's butt, facing down along it.
   * - `nockGrip`: an arrow's or a bolt's shaft just ahead of its nock, pinched
   *   there to set the nock on a string.
   * - `tip`: an arrow's or a bolt's point, `+Y` along it.
   * - `grip`: a cartridge's paper, pinched between the thumb and two fingers.
   * - `end`: a cartridge's powder end, `+Y` out along it, which the teeth tear
   *   open.
   */
  export type Affordance =
    | "body"
    | "shaft"
    | "nock"
    | "nockGrip"
    | "tip"
    | "grip"
    | "end";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: a ball's, a shot's or a grenade's body across, an arrow's or a
   *   bolt's shaft across; a stone's, derived from its mass and specific
   *   gravity.
   * - `length`: an arrow's or a bolt's, butt to point; a grenade's, base to fuze
   *   top; a cartridge's, ball end to powder end.
   * - `head`: a bolt's head along it.
   * - `headWidth`: a bolt's head across, drawn round.
   * - `gravity`: a stone's specific gravity, its density over water's.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "diameter"
    | "length"
    | "head"
    | "headWidth"
    | "gravity"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    length: "m",
    head: "m",
    headWidth: "m",
    gravity: "",
    mass: "kg",
  };

  /**
   * The parameters: the kind, the read object, and any free dimension fixed to
   * a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which projectile. */
    kind: Kind;

    /**
     * Which of an arrow's, a bolt's or a round shot's read objects; picked from
     * the seed when absent.
     */
    model?: Model;

    /** The model's id, unique in a scene; `projectile` when absent. */
    id?: string;
  }

  /**
   * The band of each free dimension an object leaves, by kind: an arrow's and a
   * bolt's provisional bands are drawn only for the object that does not give
   * the figure.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = PROJECTILE_BANDS;
}
