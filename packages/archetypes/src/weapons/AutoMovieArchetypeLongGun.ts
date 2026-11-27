import { type AutoMovieArchetype } from "../core/index";
import { createLongGun as createLongGunImplementation } from "./internal/createLongGun";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand } from "../core";
import { LONG_GUN_MODELS } from "./LONG_GUN_MODELS";
import { LONG_GUN_BANDS } from "./LONG_GUN_BANDS";

/** Public operations for Auto Movie Archetype Long Gun. */
export namespace AutoMovieArchetypeLongGun {
  /**
   * A long gun as a film prop: a carbine with a sliding stock, a pump shotgun, a
   * flintlock musket, a bolt-action rifle or a lever action. It models no effect;
   * the period and repeating kinds' mechanisms are `LongGunLock`'s.
   *
   * The gun lies along `+Z` from its butt plate at the origin to its muzzle, the
   * barrel's line at `y = 0`. The firing hand takes the `grip` behind the trigger
   * and the other hand the `foreEnd` from below; the `butt` goes to the shoulder.
   * The trigger's face is the length of pull ahead of the butt, as gunmakers
   * measure it. The stock ends behind the grip and a round neck joins it to the
   * receiver: a carbine's fixed buffer tube, a shotgun's wrist. A carbine's
   * `stock` slides back along its tube to lengthen the pull, carrying the butt; a
   * shotgun's `pump` slides back, carrying the fore-end.
   *
   * @param params The kind, a carbine's model and any dimension the author fixes.
   * @param seed The seed that picks the model left free and draws every dimension
   *   left free inside its band; absent, the first model and the middle of each
   *   band.
   * @returns The long gun.
   * @throws {AutoMovieArchetypeRefusal} For a model not of the kind, a fixed
   *   dimension outside its band, or one the model gives.
   */
  export function create(params: AutoMovieArchetypeLongGun.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeLongGun.Affordance, AutoMovieArchetypeLongGun.Dimension> {
    return createLongGunImplementation(params, seed);
  }

  /** The kinds of long gun. */
  export type Kind = "carbine" | "shotgun" | "musket" | "rifle" | "leverAction";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "carbine",
    "shotgun",
    "musket",
    "rifle",
    "leverAction",
  ];

  /** Each kind's model name. */
  export const NAMES: Readonly<Record<Kind, string>> = {
    carbine: "carbine",
    shotgun: "pump shotgun",
    musket: "flintlock musket",
    rifle: "bolt-action rifle",
    leverAction: "lever-action rifle",
  };

  /**
   * The fore-end's diameter where the hand holds it, metres: an estimate inside
   * the 30 to 50 mm power grip range of CCOHS
   * (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html).
   */
  export const FORE_END: number = 0.05;

  /** The trigger's pull, metres: an estimate, not published for either gun. */
  export const TRIGGER: number = 0.006;

  /**
   * The affordance ids:
   *
   * - `grip`: the firing hand's grip behind the trigger, taken from behind.
   * - `trigger`: the trigger's face.
   * - `foreEnd`: the supporting hand's hold under the barrel; on a shotgun it
   *   rides the pump.
   * - `butt`: the butt plate, which goes to the shoulder; on a carbine it rides
   *   the stock.
   * - `muzzle`: the end of the barrel, facing forward.
   * - `sight`: the rear of the sight line, above the barrel's line.
   * - `stock`: a carbine's stock, a slider drawn back to lengthen the pull.
   * - `pump`: a shotgun's fore-end slide, drawn back.
   * - `cock`, `spur`, `frizzen`, `pan`, `ramrod`, `pipe`, `bayonet`: a musket's
   *   lock, the cock's thumb piece riding it, its rod and their sockets
   *   (`LongGunLock.musket`); a musket's `muzzle` is a socket. `bayonetEntry`
   *   shares the `bayonet` socket's attitude ahead of the muzzle, where a
   *   socket bayonet starts its slide on.
   * - `bolt`, `boltSlide`, `magazine`: a bolt action's lift, its draw and its
   *   magazine (`LongGunLock.bolt`).
   * - `lever`, `hammer`: a lever action's lever and the hammer that follows it
   *   (`LongGunLock.lever`).
   */
  export type Affordance =
    | "grip"
    | "trigger"
    | "foreEnd"
    | "butt"
    | "muzzle"
    | "sight"
    | "stock"
    | "pump"
    | "cock"
    | "spur"
    | "frizzen"
    | "pan"
    | "ramrod"
    | "pipe"
    | "bayonet"
    | "bayonetEntry"
    | "bolt"
    | "boltSlide"
    | "magazine"
    | "lever"
    | "hammer";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: overall, a carbine's with its stock in.
   * - `barrel`: the barrel.
   * - `lengthOfPull`: from the butt plate to the trigger's face, a carbine's with
   *   its stock in.
   * - `travel`: how far the carbine's stock or the shotgun's pump slides.
   * - `sightHeight`: the sight line above the barrel's line.
   * - `muzzleVelocity`: the shot's speed leaving the muzzle, metres per second.
   * - `lockTime`: seconds from the trigger's break to the discharge.
   * - `ball`: a musket's ball's diameter, the calibre of the projectile it fires.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "barrel"
    | "lengthOfPull"
    | "travel"
    | "sightHeight"
    | "muzzleVelocity"
    | "lockTime"
    | "ball"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    barrel: "m",
    lengthOfPull: "m",
    travel: "m",
    sightHeight: "m",
    muzzleVelocity: "m/s",
    lockTime: "s",
    ball: "m",
    mass: "kg",
  };

  /**
   * The read models: Colt's carbines R0977HB heavy barrel, R0979 and CR6921;
   * the Short Land musket; the M1903 and the Kar 98k.
   */
  export type Model =
    | "r0977hb"
    | "r0979"
    | "cr6921"
    | "shortLand"
    | "m1903"
    | "kar98k";

  /**
   * Each kind's models whole, the default first: the Colt sheet's weights, 6.9
   * lb (3.13 kg), 6.5 lb (2.95 kg) and 6.4 lb (2.90 kg); the Short Land
   * musket's length and barrel (Museums Victoria ST 21813); the M1903's 43.46
   * in, 8.69 lb and 2,647 ft/s with M1 ball (TM 9-1270, 1944, par. 4, pp.
   * 18-19, https://archive.org/download/1944TM9-1270/1944TM9-1270_djvu.txt),
   * and the Kar 98k's 43.5 in, 23.4 in barrel, about 9 lb and about 2,800 ft/s
   * (War Department, German Infantry Weapons, 1943, p. 23,
   * https://archive.org/download/GermanInfantryWeapons1943/GermanInfantryWeapons1943_djvu.txt,
   * a US assessment, not the maker's). A shotgun and a lever action have one
   * read gun each, their bands.
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
  > = LONG_GUN_MODELS;

  /**
   * The parameters: the kind, a carbine's model, and any free dimension fixed
   * to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which long gun. */
    kind: Kind;

    /**
     * Which of Colt's carbines; picked from the seed when absent. A shotgun has
     * none.
     */
    model?: Model;

    /** The model's id, unique in a scene; `longGun` when absent. */
    id?: string;
  }

  /** The band of each free dimension a model leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = LONG_GUN_BANDS;}
