import { type AutoMovieArchetype } from "../core/index";
import { createHandgun as createHandgunImplementation } from "./internal/createHandgun";
import { AutoMovieArchetypeUnits, AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand } from "../core";
import { HANDGUN_MODELS } from "./constants/HANDGUN_MODELS";
import { HANDGUN_BANDS } from "./constants/HANDGUN_BANDS";

/** Public operations for Auto Movie Archetype Handgun. */
export namespace AutoMovieArchetypeHandgun {
  /**
   * A handgun as a film prop: a self-loading pistol, a slide over a frame with a
   * grip, a trigger and sights; a revolver, its hammer cocking and its cylinder
   * turning; or a flintlock pistol with the musket's lock (`HandgunActions`). It
   * models no effect.
   *
   * The pistol stands on the base of its grip at the origin with its muzzle
   * toward `+Z` and its backstrap at `z = 0`. The shooting hand takes the `grip`
   * from behind; the `trigger` is a part on its articulation, its face
   * `triggerReach` ahead of the backstrap, as makers measure it; the `slide` runs
   * back on its slider. `sight` and `frontSight` give the line of aim, `muzzle`
   * the end of the barrel and `magazine` the well under the grip.
   *
   * @param params The frame size, the model and a GLOCK's sights, whether it is
   *   loaded and any dimension the author fixes.
   * @param seed The seed that picks the model and the sights left free and draws
   *   every dimension left free inside its band; absent, the first model, the
   *   first sights and the middle of each band.
   * @returns The handgun.
   * @throws {AutoMovieArchetypeRefusal} For a model not of the frame, sights on a
   *   pistol without them, a fixed dimension outside its band, or one the model
   *   or the sights give.
   */
  export function create(params: AutoMovieArchetypeHandgun.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeHandgun.Affordance, AutoMovieArchetypeHandgun.Dimension> {
    return createHandgunImplementation(params, seed);
  }

  /**
   * The frames: a full-size or compact self-loading pistol, a revolver or a
   * flintlock pistol.
   */
  export type Frame = "fullSize" | "compact" | "revolver" | "flintlock";

  /** Every frame, for a caller that reads one at run time. */
  export const FRAMES: readonly Frame[] = [
    "fullSize",
    "compact",
    "revolver",
    "flintlock",
  ];

  /** Each frame's model name. */
  export const NAMES: Readonly<Record<Frame, string>> = {
    fullSize: "full-size handgun",
    compact: "compact handgun",
    revolver: "revolver",
    flintlock: "flintlock pistol",
  };

  /**
   * What a load adds, kilograms: a full magazine, the loaded mass less the mass
   * with an empty magazine, GLOCK G17 Gen5 (945 less 708 g) and G19 Gen5 (855
   * less 670 g); a revolver's five rounds, Gun Tests' Single Action Army loaded
   * at 46.02 oz less its 40.8 oz; a flintlock's ball and charge, the Graz
   * pistol's 14.45 g and 5.00 g, borrowed.
   */
  export const AMMUNITION: Readonly<Record<Frame, number>> = {
    fullSize: 0.237,
    compact: 0.185,
    revolver: (46.02 - 40.8) * AutoMovieArchetypeUnits.OUNCE,
    flintlock: 0.01445 + 0.005,
  };

  /** How far the slide is drawn back, metres: an estimate, not published. */
  export const RACK: number = 0.04;

  /**
   * The affordance ids:
   *
   * - `grip`: the grip, taken from behind.
   * - `trigger`: the trigger's face, pulled back by its travel.
   * - `slide`: the rear of the slide, a slider drawn back.
   * - `sight`, `frontSight`: the tops of the rear and front sights, which ride
   *   the slide.
   * - `muzzle`: the end of the barrel, facing forward.
   * - `magazine`: the magazine well under the grip, a socket facing down.
   * - `hammer`, `cylinder`, `gate`, `chamber1` to `chamber6`: a revolver's
   *   hammer, its cylinder following it, its loading gate and the chambers on
   *   the cylinder's rear face (`HandgunActions.revolver`).
   * - `cock`, `spur`, `frizzen`, `pan`: a flintlock pistol's lock
   *   (`AutoMovieArchetypeFirearm.layFlintlock`), the spur the cock's thumb
   *   piece riding it.
   */
  export type Affordance =
    | "grip"
    | "trigger"
    | "slide"
    | "sight"
    | "frontSight"
    | "muzzle"
    | "magazine"
    | "hammer"
    | "cylinder"
    | "gate"
    | "chamber1"
    | "chamber2"
    | "chamber3"
    | "chamber4"
    | "chamber5"
    | "chamber6"
    | "cock"
    | "spur"
    | "frizzen"
    | "pan";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `height`, `width`: overall length, height with magazine and slide
   *   width.
   * - `sightRadius`: from the rear sight to the front sight.
   * - `triggerReach`: from the backstrap to the trigger's face.
   * - `triggerTravel`: the trigger's pull.
   * - `gripDepth`: the grip from front strap to backstrap.
   * - `barrel`: a revolver's or a flintlock pistol's barrel.
   * - `muzzleVelocity`: the shot's speed leaving the muzzle, metres per second.
   * - `lockTime`: seconds from the trigger's break to the discharge.
   * - `ball`: a flintlock pistol's ball's diameter, the calibre of the projectile
   *   it fires.
   * - `mass`: unloaded, kilograms.
   */
  export type Dimension =
    | "length"
    | "height"
    | "width"
    | "sightRadius"
    | "triggerReach"
    | "triggerTravel"
    | "gripDepth"
    | "barrel"
    | "muzzleVelocity"
    | "lockTime"
    | "ball"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    height: "m",
    width: "m",
    sightRadius: "m",
    triggerReach: "m",
    triggerTravel: "m",
    gripDepth: "m",
    barrel: "m",
    muzzleVelocity: "m/s",
    lockTime: "s",
    ball: "m",
    mass: "kg",
  };

  /**
   * The read handguns: the GLOCK G17 Gen5 and the SIG SAUER P320-M17 full-size,
   * the G19 Gen5 and the P320-M18 compact; Colt's Single Action Army with a 7.5
   * in barrel and Ruger's Vaquero 5104; the Light Dragoon and the Sea Service
   * flintlock pistols.
   */
  export type Model =
    | "g17"
    | "p320m17"
    | "g19"
    | "p320m18"
    | "saa75"
    | "vaquero5104"
    | "lightDragoon"
    | "seaService";

  /** A GLOCK's sights, which set its sight radius: polymer, steel or GNS. */
  export type Sights = "polymer" | "steel" | "gns";

  /**
   * Each frame's pistols whole, the default first, each from its own maker's
   * table:
   *
   * - G17 Gen5: 202 mm long, 139 mm high with magazine, slide 25.5 mm wide,
   *   trigger distance 70 mm, 708 g with an empty magazine
   *   (https://eu.glock.com/en/products/pistols/g17-gen5).
   * - P320-M17: 8.5 in (216 mm) long, 5.5 in (139 mm) high, 6.6 in (168 mm) sight
   *   radius, 29.6 oz (839.1 g), the magazine state not stated
   *   (https://www.sigsauer.com/p320-m17.html; the 216 mm of the two 10-round
   *   SKUs, the first SKU's 6.6 in overall length repeating its sight radius).
   * - G19 Gen5: 185 mm long, 128 mm high, slide 25.5 mm wide, trigger distance 70
   *   mm, 670 g with an empty magazine
   *   (https://eu.glock.com/en/products/pistols/g19-gen5).
   * - P320-M18: 7.2 in (183 mm) long, 5.5 in (140 mm) high, 5.8 in (147 mm) sight
   *   radius, 28.1 oz (797 g), the magazine state not stated
   *   (https://www.sigsauer.com/p320-m18.html).
   * - Single Action Army 7.5 in, as Gun Tests measured it: 13.0 in long, 5.5 in
   *   high, 1.6 in wide, sight radius 8.5 in, trigger span 2.8 in, 40.8 oz
   *   unloaded
   *   (https://www.gun-tests.com/handguns/revolvers/colt-single-action-army-7-5-inch-p1870-45-colt/).
   * - Vaquero 5104, Ruger's spec sheet: barrel 5.50 in, 11.12 in overall, 41 oz
   *   (https://ruger.com/products/vaqueroStainless/specSheets/5104.html).
   * - Light Dragoon pistol, Museums Victoria ST 21852: 39.7 cm long, 14 cm high,
   *   5.5 cm wide, a 9 in barrel
   *   (https://collections.museumsvictoria.com.au/items/373561).
   * - Sea Service pistol, third model, Royal Museums Greenwich AAA2441: overall
   *   180 x 500 x 40 mm, a 12 in barrel
   *   (https://rmg.co.uk/collections/objects/rmgc-object-2440).
   */
  export const MODELS: Readonly<
    Record<
      Frame,
      Readonly<
        Partial<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = HANDGUN_MODELS;

  /**
   * A GLOCK's sight radius by its sights, the maker's tables: G17 Gen5 165, 164
   * and 163 mm, G19 Gen5 153, 152 and 151 mm for polymer, steel and GNS. A SIG
   * SAUER's is its model's.
   */
  export const SIGHTS: Readonly<
    Partial<
      Record<
        Model,
        Readonly<Record<Sights, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    g17: {
      polymer: { sightRadius: 0.165 },
      steel: { sightRadius: 0.164 },
      gns: { sightRadius: 0.163 },
    },
    g19: {
      polymer: { sightRadius: 0.153 },
      steel: { sightRadius: 0.152 },
      gns: { sightRadius: 0.151 },
    },
  };

  /**
   * The parameters: the frame, the model and its sights, whether it is loaded,
   * and any free dimension fixed to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which frame size. */
    frame: Frame;

    /** Which of the frame's read pistols; picked from the seed when absent. */
    model?: Model;

    /**
     * A GLOCK's sights; picked from the seed when absent. A SIG SAUER has none
     * to choose.
     */
    sights?: Sights;

    /**
     * Whether the magazine is full, which adds its published mass; empty when
     * absent.
     */
    loaded?: boolean;

    /** The model's id, unique in a scene; `handgun` when absent. */
    id?: string;
  }

  /** The band of each free dimension a model leaves, by frame. */
  export const BANDS: Readonly<
    Record<Frame, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = HANDGUN_BANDS;}
