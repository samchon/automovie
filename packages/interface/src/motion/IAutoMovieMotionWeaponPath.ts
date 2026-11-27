import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanLimb } from "./AutoMovieHumanLimb";

/**
 * A weapon's world-space swept point or capsule path over a film-time interval
 * in seconds. Performance contact evaluation reads its radii and trajectories
 * to determine a strike.
 */
export interface IAutoMovieMotionWeaponPath {
  /** Id, unique within the plan. */
  id: string;

  /** The limb that carries it; frozen at its stop while contacts resolve. */
  limb: AutoMovieHumanLimb;

  /** Radius of the striking sphere, metres; a capsule's radius at `path`. */
  radius: number;

  /**
   * A tapered capsule's radius at `tail`, metres: the capsule narrows (or
   * widens) linearly from `radius` at `path` to this, as a limb's girth changes
   * from one joint to the next. Absent for a sphere and for a capsule of one
   * radius.
   */
  tailRadius?: number;

  /** Film second it becomes live. */
  from: number;

  /** Film second it stops being live. */
  to: number;

  /**
   * The surface's centre on its free path, ignoring its own stop.
   *
   * @param seconds Film seconds.
   * @returns World metres.
   */
  path(seconds: number): IAutoMovieVector3;

  /**
   * The other end of a capsule weapon's axis on its free path, when the weapon
   * is a capsule (a forearm, a shin) rather than a sphere: the weapon is every
   * point of the segment from `path` to `tail` within `radius`.
   *
   * @param seconds Film seconds.
   * @returns World metres.
   */
  tail?(seconds: number): IAutoMovieVector3;

  /**
   * The chain of capsules along one limb this weapon is one of, when it is: the
   * chain's axis ends at a film second and this capsule's place among them, so
   * a reader of several capsules of one chain poses the limb once for a second.
   * Absent for a weapon of its own.
   */
  chain?: IAutoMovieMotionWeaponPath.IChain;
}

/** Contracts supporting IAutoMovieMotionWeaponPath. */
export namespace IAutoMovieMotionWeaponPath {
  /** A limb's capsules read together (`IAutoMovieMotionWeaponPath.chain`). */
  export interface IChain {
    /**
     * The capsules' axis ends at a film second on the free path, one more than
     * the capsules: capsule `i` runs from end `i` to end `i + 1`.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     */
    ends(seconds: number): readonly IAutoMovieVector3[];

    /** This capsule's index along the chain. */
    index: number;
  }
}
