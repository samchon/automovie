import { type AutoMovieArchetype } from "../core/index";
import { createSword as createSwordImplementation } from "./internal/createSword";
import { createSwordShapes as parts } from "./internal/createSwordShapes";
import { AutoMovieArchetypeDrawSession } from "../core";
import { SWORD_MODELS } from "./constants/SWORD_MODELS";
import { SWORD_BANDS } from "./constants/SWORD_BANDS";

/** Public operations for Auto Movie Archetype Sword. */
export namespace AutoMovieArchetypeSword {
  /**
   * A blade held by its hilt: a longsword, an arming sword, a sabre, a katana, a
   * rapier, a dagger or a knife.
   *
   * The weapon stands along `+Y` with its point up and the blade's shoulder,
   * where the guard sits, at the origin; the hilt hangs below. The true edge
   * faces `+Z` and the flats face `+X` and `-X`. A sabre's and a katana's blade
   * curves back toward `-Z`, so the edge is the outside of the curve, and
   * `bladeLength` is the straight line from the shoulder to the point. The blade
   * is `SEGMENTS` flat boxes, each a declared part `blade-<k>` from the guard
   * out, so a contact names the part of the blade that met: the low numbers are
   * the strong, the high the weak.
   *
   * Mass and balance are cited, not derived: the parts carry mass shares that put
   * the centre of mass at the drawn `balance` above the guard, the hilt's parts
   * taking what the blade's taper leaves. `properties` gives the centre and the
   * inertia, and `moment` the inertia about the grip that a cut works against.
   *
   * @param params The kind, the model where the kind has read models, and any
   *   dimension the author fixes.
   * @param seed The seed that picks the model left free and draws every dimension
   *   left free inside its band; absent, the first model and the middle of each
   *   band.
   * @returns The weapon.
   * @throws {AutoMovieArchetypeRefusal} For a model not of the kind, a fixed
   *   dimension outside its band, or one the model gives.
   */
  export function create(params: AutoMovieArchetypeSword.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeSword.Affordance, AutoMovieArchetypeSword.Dimension> {
    return createSwordImplementation(params, seed);
  }

  /** The moved type {@link createSwordShapes.Kind}. */
  export type Kind = parts.Kind;
  /** The moved constant {@link createSwordShapes.KINDS}. */
  export const KINDS: typeof parts.KINDS = parts.KINDS;
  /** The moved constant {@link createSwordShapes.NAMES}. */
  export const NAMES: typeof parts.NAMES = parts.NAMES;
  /** The moved type {@link createSwordShapes.IShape}. */
  export type IShape = parts.IShape;
  /** The moved constant {@link createSwordShapes.SHAPES}. */
  export const SHAPES: typeof parts.SHAPES = parts.SHAPES;

  /** How many boxes a blade is laid as. */
  export const SEGMENTS: number = 6;

  /**
   * A blade's thickness at the guard, metres: an estimate, not read at a
   * source.
   */
  export const THICKNESS: number = 0.005;

  /**
   * A blade's width and thickness at the point as a fraction of those at the
   * guard: an estimate that stands for profile and distal taper, not read at a
   * source.
   */
  export const TAPER: number = 0.4;

  /**
   * A guard's thickness along the blade, metres: an estimate, not read at a
   * source.
   */
  export const GUARD: number = 0.012;

  /**
   * A grip's diameter, metres, which is its `aperture`: an estimate, not read
   * at a source.
   */
  export const GRIP: number = 0.03;

  /**
   * The affordance ids:
   *
   * - `grip`: the hand or hands on the grip, taken from the `-Z` side, the
   *   frame's `+X` toward the blade; its `length` is the grip between guard and
   *   pommel, so a site along it places one hand under the guard and the other
   *   at the pommel.
   * - `reverseGrip`: the same grip held point down, the frame's `+X` toward the
   *   pommel; a dagger and a knife.
   * - `edge`: the true edge, a `ledge` at the blade's middle facing `+Z`, the way
   *   it cuts, its `length` the blade's.
   * - `falseEdge`: the back edge of a double-edged blade, facing `-Z`.
   * - `flat`: the blade's `+X` flat, which takes a parry or lies against a
   *   target; its width runs along the blade.
   * - `point`: the point, its `+Y` along the blade, the way a thrust goes.
   */
  export type Affordance =
    | "grip"
    | "reverseGrip"
    | "edge"
    | "falseEdge"
    | "flat"
    | "point";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `bladeLength`: from the guard to the point, in a straight line.
   * - `bladeWidth`: the blade's width at the guard.
   * - `hiltLength`: from the guard's blade side to the pommel's end.
   * - `balance`: the point of balance above the guard.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "bladeLength"
    | "bladeWidth"
    | "hiltLength"
    | "balance"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    bladeLength: "m",
    bladeWidth: "m",
    hiltLength: "m",
    balance: "m",
    mass: "kg",
  };

  /**
   * The read models: Albion's Crecy and Regent longswords and Knight and
   * Poitiers arming swords, and the 1796 sabre's officer's and trooper's
   * patterns.
   */
  export type Model =
    | "crecy"
    | "regent"
    | "knight"
    | "poitiers"
    | "officer"
    | "trooper";

  /**
   * The parameters: the kind, the model, and any free dimension fixed to a
   * value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which blade. */
    kind: Kind;

    /**
     * Which of the kind's read models; picked from the seed when absent. A
     * katana, a rapier, a dagger and a knife have none.
     */
    model?: Model;

    /** The model's id, unique in a scene; `sword` when absent. */
    id?: string;
  }

  /** Each kind's read models whole, the default first. */
  export const MODELS: typeof SWORD_MODELS = SWORD_MODELS;

  /** The band of each free dimension a model leaves, by kind. */
  export const BANDS: typeof SWORD_BANDS = SWORD_BANDS;}
